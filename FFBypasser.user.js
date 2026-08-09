// ==UserScript==
// @name         FFBypasser — Direct Link Extractor (FuckingFast)
// @namespace    github.com/LucianoSkx/FFBypasser-FuckingFast
// @version      4.2
// @description  Extracts FuckingFast share links from FitGirl pages and resolves them into direct download URLs in a dedicated worker tab, bypassing Cloudflare. Job state is shared between tabs.
// @author       cdxud (adapted for Violentmonkey)
// @icon         https://raw.githubusercontent.com/LucianoSkx/FFBypasser-FuckingFast/main/ffbypasser-icon.png
// @match        *://fitgirl-repacks.site/*
// @match        *://*.fuckingfast.co/*
// @match        *://fuckingfast.co/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
       CONFIG
    ============================================================ */
    const CONFIG = {
        concurrency: 2,
        delayMs: 800,
        timeoutMs: 30000,
        tokenWaitMs: 12000,
        captureTimeoutMs: 20000,
        challengeWaitMs: 90000,
        leaseTtlMs: 15000,
    };

    const STORAGE_KEYS = {
        job: 'ffbypasser.job.v2',
        lease: 'ffbypasser.lease.v2',
        links: 'ff_links',
    };

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const clone = value => JSON.parse(JSON.stringify(value));

    /* ============================================================
       HELPERS
    ============================================================ */
    function isFitGirlPage() {
        return location.hostname.includes('fitgirl');
    }

    function isFFPage() {
        return /(^|\.)fuckingfast\.co$/i.test(location.hostname);
    }

    function extractFFLinks() {
        return [...new Set(Array.from(document.querySelectorAll('a[href*="fuckingfast.co"]'), a => a.href))];
    }

    function copyText(text) {
        try {
            GM_setClipboard(text);
            return true;
        } catch { }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            return true;
        } catch { }
        return false;
    }

    function fileIdOf(link) {
        try {
            return new URL(link, location.origin).pathname.split('/').filter(Boolean).pop();
        } catch {
            return null;
        }
    }

    function absolutize(u, origin) {
        try { return new URL(u, origin).href; } catch { return u; }
    }

    function readRedirect(headers) {
        if (!headers) return null;
        const get = typeof headers.get === 'function'
            ? name => headers.get(name)
            : name => headers[name] || headers[name.toLowerCase()] || null;
        return get('hx-redirect') || get('HX-Redirect') || get('hx-location') || get('location');
    }

    function summarizeJob(job) {
        const s = { total: 0, queued: 0, processing: 0, succeeded: 0, failed: 0, done: false };
        if (!job) return s;
        s.total = job.items.length;
        for (const item of job.items) {
            if (Object.hasOwn(s, item.state)) s[item.state] += 1;
        }
        s.done = s.total > 0 && s.queued === 0 && s.processing === 0;
        return s;
    }

    function formatSuccessfulResults(job) {
        if (!job) return '';
        return job.items
            .filter(item => item.state === 'succeeded' && item.directUrl)
            .map(item => item.directUrl)
            .join('\n');
    }

    /* ============================================================
       SHARED STORE (GM storage is shared across tabs)
    ============================================================ */
    const store = {
        loadJob: () => GM_getValue(STORAGE_KEYS.job, null),
        saveJob: job => GM_setValue(STORAGE_KEYS.job, job),
        loadLease: () => GM_getValue(STORAGE_KEYS.lease, null),
        saveLease: lease => lease ? GM_setValue(STORAGE_KEYS.lease, lease) : GM_deleteValue(STORAGE_KEYS.lease),
        watchJob: callback => GM_addValueChangeListener(STORAGE_KEYS.job, (_key, _oldValue, newValue) => callback(newValue)),
    };

    /* ============================================================
       JOB HELPERS
    ============================================================ */
    function createJob(links) {
        return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            sourceUrl: location.href,
            createdAt: Date.now(),
            items: links.map(link => ({ link, state: 'queued', directUrl: null, error: null })),
        };
    }

    function transitionItem(job, index, patch) {
        const next = clone(job);
        next.items[index] = { ...next.items[index], ...patch };
        return next;
    }

    function recoverJob(job) {
        if (!job) return null;
        const next = clone(job);
        next.items = next.items.map(item => item.state === 'processing'
            ? { ...item, state: 'queued', error: null }
            : item);
        return next;
    }

    function retryFailed(job) {
        const next = clone(job);
        next.items = next.items.map(item => item.state === 'failed'
            ? { ...item, state: 'queued', directUrl: null, error: null }
            : item);
        return next;
    }

    /* ============================================================
       WORKER LEASE (prevents two workers on the same job)
    ============================================================ */
    function createLease(owner) {
        return { owner, expiresAt: Date.now() + CONFIG.leaseTtlMs };
    }

    function canAcquireLease(lease, owner) {
        return !lease || lease.owner === owner || lease.expiresAt < Date.now();
    }

    /* ============================================================
       STRATEGY 1: direct POST /f/{id}/go (fast path)
    ============================================================ */
    async function strategyFast(id) {
        const res = await fetch(`/f/${id}/go`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'HX-Request': 'true',
                'HX-Current-URL': location.href,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: '',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const url = readRedirect(res.headers);
        if (!url) throw new Error('no hx-redirect header');
        return absolutize(url, location.origin);
    }

    /* ============================================================
       TOKEN HELPERS (Cloudflare / reCAPTCHA / hCaptcha)
    ============================================================ */
    function tokenWidgetPresent(win) {
        return Boolean(win.document.querySelector(
            '.cf-turnstile, [data-sitekey], input[name="cf-turnstile-response"]'
        ));
    }

    function grabToken(win) {
        const input = win.document.querySelector(
            'input[name="cf-turnstile-response"], input[name="g-recaptcha-response"], input[name="h-captcha-response"]'
        );
        if (input && input.value) return { name: input.name, value: input.value };
        try {
            const value = win.turnstile && win.turnstile.getResponse && win.turnstile.getResponse();
            if (value) return { name: 'cf-turnstile-response', value };
        } catch { }
        return null;
    }

    async function waitForToken(win) {
        if (!tokenWidgetPresent(win)) return null;
        const deadline = Date.now() + CONFIG.tokenWaitMs;
        while (Date.now() < deadline) {
            const token = grabToken(win);
            if (token) return token;
            await sleep(250);
        }
        return grabToken(win);
    }

    /* ============================================================
       CLOUDFLARE CHALLENGE HANDLING
    ============================================================ */
    let challengeNotified = false;

    function notifyChallenge() {
        if (challengeNotified) return;
        challengeNotified = true;
        GM_notification({ text: 'Cloudflare check pending — complete it in the worker tab', timeout: 6000 });
        console.log('%c⏳ Complete the Cloudflare check in the worker tab (it stays open until you do)', 'color:#eab308');
    }

    function isCloudflareChallengePage(win) {
        const doc = win.document;
        if (doc.querySelector('#challenge-running, #cf-chl-running, [id^="challenge-"]')) return true;
        const text = (doc.body && (doc.body.innerText || doc.body.textContent) || '').slice(0, 600);
        return /just a moment|checking your browser|verifying you are human|verificando se voc/i.test(text);
    }

    async function waitForChallengeResolved(win, onWaiting) {
        if (!isCloudflareChallengePage(win)) return true;
        if (onWaiting) onWaiting();
        const deadline = Date.now() + CONFIG.challengeWaitMs;
        while (Date.now() < deadline) {
            await sleep(1000);
            if (!isCloudflareChallengePage(win)) return true;
        }
        return !isCloudflareChallengePage(win);
    }

    async function waitForTrigger(win, id) {
        const deadline = Date.now() + CONFIG.challengeWaitMs;
        let trigger = null;
        while (Date.now() < deadline) {
            trigger = findTrigger(win, id);
            if (trigger) return trigger;
            await sleep(1000);
        }
        return trigger;
    }

    /* ============================================================
       TRIGGER + REQUEST DESCRIPTOR (htmx controls)
    ============================================================ */
    function findTrigger(win, id) {
        return win.document.querySelector(`[hx-post*="/${CSS.escape(id)}/"], [hx-post], [data-hx-post]`)
            || Array.from(win.document.querySelectorAll('a,button')).find(node => /download/i.test(node.textContent || ''))
            || null;
    }

    function buildRequestDescriptor(win, id, token) {
        const triggerNode = findTrigger(win, id);
        const valuesText = triggerNode ? (triggerNode.getAttribute('hx-vals') || triggerNode.getAttribute('data-hx-vals')) : null;
        let values = {};
        if (valuesText) {
            try { values = JSON.parse(valuesText); } catch { }
        }
        const form = triggerNode ? triggerNode.closest('form') : win.document.querySelector('form');
        const formEntries = form
            ? Array.from(new win.FormData(form).entries()).filter(([, value]) => typeof value === 'string')
            : [];
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(values)) params.set(key, String(value));
        for (const [key, value] of formEntries) params.set(key, String(value));
        if (token && token.name && token.value) params.set(token.name, token.value);
        const headers = {
            'HX-Request': 'true',
            'HX-Current-URL': win.location.href,
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const target = triggerNode && (triggerNode.getAttribute('hx-target') || triggerNode.getAttribute('data-hx-target'));
        if (target) headers['HX-Target'] = target.replace(/^#/, '');
        return {
            path: (triggerNode && (triggerNode.getAttribute('hx-post') || triggerNode.getAttribute('data-hx-post'))) || `/f/${id}/go`,
            params,
            headers,
        };
    }

    /* ============================================================
       STRATEGY 2: fetch from the file page (same-origin iframe)
    ============================================================ */
    async function strategyPageFetch(win, id) {
        await waitForChallengeResolved(win, notifyChallenge);
        const token = await waitForToken(win);
        const { path, params, headers } = buildRequestDescriptor(win, id, token);
        const response = await win.fetch(path, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: params.toString(),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const redirect = readRedirect(response.headers);
        if (redirect) return absolutize(redirect, win.location.origin);
        const body = await response.text();
        const match = body.match(/https?:\/\/[^\s"'<>\\]+/);
        if (!match) throw new Error('missing redirect');
        return match[0];
    }

    /* ============================================================
       CAPTURE: intercept htmx redirect headers
    ============================================================ */
    function armCapture(win) {
        let resolveCapture;
        const promise = new Promise(resolve => { resolveCapture = resolve; });
        const cleanups = [];
        try {
            const originalFetch = win.fetch;
            win.fetch = (...args) => originalFetch(...args).then(response => {
                const redirect = readRedirect(response.headers);
                if (redirect) resolveCapture(redirect);
                return response;
            });
            cleanups.push(() => { win.fetch = originalFetch; });
        } catch { }
        try {
            const originalOpen = win.XMLHttpRequest.prototype.open;
            win.XMLHttpRequest.prototype.open = function (...args) {
                this.addEventListener('readystatechange', () => {
                    if (this.readyState !== 4) return;
                    const redirect = this.getResponseHeader('hx-redirect') || this.getResponseHeader('hx-location');
                    if (redirect) resolveCapture(redirect);
                });
                return originalOpen.apply(this, args);
            };
            cleanups.push(() => { win.XMLHttpRequest.prototype.open = originalOpen; });
        } catch { }
        return { promise, cleanup: () => cleanups.forEach(fn => fn()) };
    }

    /* ============================================================
       STRATEGY 3: click the download control, capture the redirect
    ============================================================ */
    async function strategyClick(win, id) {
        try { win.open = () => null; } catch { }
        await waitForChallengeResolved(win, notifyChallenge);
        const trigger = await waitForTrigger(win, id);
        if (!trigger) throw new Error('download control not found');
        const capture = armCapture(win);
        try {
            trigger.click();
            await sleep(700);
            trigger.click();
            const redirect = await Promise.race([
                capture.promise,
                sleep(CONFIG.captureTimeoutMs).then(() => null),
            ]);
            if (!redirect) throw new Error('click redirect timeout');
            return absolutize(redirect, win.location.origin);
        } finally {
            capture.cleanup();
        }
    }

    /* ============================================================
       INVISIBLE FRAME LOADER
    ============================================================ */
    function loadFrame(link) {
        return new Promise((resolve, reject) => {
            const frame = document.createElement('iframe');
            frame.style.cssText = 'position:fixed;left:-500px;top:0;width:420px;height:280px;opacity:0;pointer-events:none;border:0';
            let done = false;
            const timer = setTimeout(() => {
                if (done) return;
                done = true;
                frame.remove();
                reject(new Error('page load timeout'));
            }, CONFIG.timeoutMs);
            frame.onload = () => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(frame);
            };
            frame.onerror = () => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                frame.remove();
                reject(new Error('frame load error'));
            };
            frame.src = link;
            document.body.appendChild(frame);
        });
    }

    function readableFrameWindow(frame) {
        try {
            const win = frame.contentWindow;
            void win.location.href;
            return win.document.body ? win : null;
        } catch {
            return null;
        }
    }

    /* ============================================================
       RESOLVE ONE LINK (strategies in cascade)
    ============================================================ */
    async function resolveLink(link) {
        const id = fileIdOf(link);
        const errors = [];

        try {
            return { directUrl: await strategyFast(id), error: null };
        } catch (error) {
            errors.push(`fast: ${error.message}`);
        }

        let frame = null;
        try {
            frame = await loadFrame(link);
            const win = readableFrameWindow(frame);
            if (!win || isCloudflareChallengePage(win)) throw new Error('frame blocked');
            try {
                return { directUrl: await strategyPageFetch(win, id), error: null };
            } catch (error) {
                errors.push(`page: ${error.message}`);
            }
            try {
                return { directUrl: await strategyClick(win, id), error: null };
            } catch (error) {
                errors.push(`click: ${error.message}`);
            }
        } catch (error) {
            errors.push(`load: ${error.message}`);
        } finally {
            if (frame) frame.remove();
        }

        if (new URL(location.href).pathname !== new URL(link).pathname) {
            location.href = link;
            return { directUrl: null, error: 'worker navigating to file page', navigating: true };
        }

        try {
            return { directUrl: await strategyPageFetch(window, id), error: null };
        } catch (error) {
            errors.push(`current page: ${error.message}`);
        }
        try {
            return { directUrl: await strategyClick(window, id), error: null };
        } catch (error) {
            errors.push(`current click: ${error.message}`);
        }
        return { directUrl: null, error: errors.join(' | ') };
    }

    /* ============================================================
       CONCURRENCY POOL
    ============================================================ */
    async function runPool(indices, worker, size) {
        const laneCount = Math.min(indices.length, Math.max(1, size));
        const lanes = Array.from({ length: laneCount }, async () => {
            while (true) {
                const index = indices.shift();
                if (index === undefined) return;
                await worker(index);
                await sleep(CONFIG.delayMs);
            }
        });
        await Promise.all(lanes);
    }

    /* ============================================================
       WORKER RUNNER (runs on the FuckingFast tab)
    ============================================================ */
    async function runWorker(owner, onUpdate) {
        const lease = store.loadLease();
        if (!canAcquireLease(lease, owner)) return false;
        store.saveLease(createLease(owner));
        challengeNotified = false;
        const renewal = setInterval(() => {
            try { store.saveLease(createLease(owner)); } catch { }
        }, 5000);
        try {
            let job = recoverJob(store.loadJob());
            if (!job) return false;
            store.saveJob(job);
            const indices = job.items.map((item, index) => item.state === 'queued' ? index : -1).filter(index => index >= 0);
            await runPool(indices, async index => {
                let current = store.loadJob();
                if (!current || current.id !== job.id || current.items[index].state !== 'queued') return;
                current = transitionItem(current, index, { state: 'processing', error: null });
                store.saveJob(current);
                onUpdate(current);
                const result = await resolveLink(current.items[index].link);
                if (result.navigating) return;
                current = store.loadJob();
                if (!current || current.id !== job.id) return;
                current = transitionItem(current, index, result.directUrl
                    ? { state: 'succeeded', directUrl: result.directUrl, error: null }
                    : { state: 'failed', directUrl: null, error: result.error });
                store.saveJob(current);
                onUpdate(current);
            }, CONFIG.concurrency);
            return true;
        } finally {
            clearInterval(renewal);
            const latest = store.loadLease();
            if (latest && latest.owner === owner) store.saveLease(null);
        }
    }

    /* ============================================================
       POPUP: shows the resolved links for copying
    ============================================================ */
    function showLinksPopup(links) {
        const existing = document.getElementById('ffb-popup');
        if (existing) existing.remove();

        const text = links.join('\n');
        const overlay = document.createElement('div');
        overlay.id = 'ffb-popup';
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:rgba(0,0,0,.6)',
            'display:flex', 'align-items:center', 'justify-content:center',
        ].join(';');
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

        const box = document.createElement('div');
        box.style.cssText = [
            'width:min(560px,90vw)',
            'display:flex', 'flex-direction:column',
            'padding:20px', 'border-radius:12px',
            'background:#141414', 'color:#e5e5e5',
            'border:1px solid #2a2a2a',
            'font-family:-apple-system,Segoe UI,Roboto,sans-serif', 'font-size:13px',
            'box-shadow:0 8px 40px rgba(0,0,0,.6)',
        ].join(';');

        const header = document.createElement('div');
        header.style.cssText = 'font-weight:600;font-size:14px;margin-bottom:12px;color:#fff;';
        header.textContent = links.length === 1
            ? '1 link direto'
            : `${links.length} links diretos`;

        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.value = text;
        textarea.style.cssText = [
            'flex:1', 'min-height:180px', 'resize:vertical',
            'border:1px solid #333', 'border-radius:8px',
            'padding:10px', 'background:#0d0d0d', 'color:#ccc',
            'font-family:ui-monospace,Consolas,monospace', 'font-size:12px',
            'line-height:1.5',
        ].join(';');
        textarea.addEventListener('click', () => { textarea.select(); });

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.cssText = btnStyle('background:#fff;color:#111;');
        copyBtn.addEventListener('mouseenter', () => { copyBtn.style.background = '#ddd'; });
        copyBtn.addEventListener('mouseleave', () => { copyBtn.style.background = '#fff'; });
        copyBtn.addEventListener('click', () => {
            textarea.select();
            copyText(text);
            textarea.focus();
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = btnStyle('background:#e5484d;color:#fff;');
        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = '#d13438'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = '#e5484d'; });
        closeBtn.addEventListener('click', () => overlay.remove());

        function btnStyle(extra) {
            return [
                'padding:8px 18px', 'border:none', 'border-radius:6px',
                'cursor:pointer', 'font-size:13px', 'font-family:inherit',
                'transition:background .15s,color .15s',
            ].join(';') + extra;
        }

        footer.append(copyBtn, closeBtn);
        box.append(header, textarea, footer);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    /* ============================================================
       FLOATING PANEL
    ============================================================ */
    function setStatus(panel, text) {
        const el = panel.querySelector('#ffb-status');
        if (el) el.textContent = text;
    }

    function createPanel(role) {
        const panel = document.createElement('div');
        panel.id = 'ffbypasser-panel';
        panel.style.cssText = [
            'position:fixed', 'right:12px', 'bottom:12px', 'z-index:2147483647',
            'display:flex', 'flex-direction:column', 'gap:4px',
            'padding:12px', 'border-radius:10px', 'width:200px',
            'background:rgba(20,20,20,.95)', 'box-shadow:0 8px 32px rgba(0,0,0,.5)',
            'border:1px solid #2a2a2a', 'color:#e5e5e5',
            'font-family:-apple-system,Segoe UI,Roboto,sans-serif', 'font-size:12px',
        ].join(';');
        panel.innerHTML = `
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;">FFBypasser</div>
            <div id="ffb-status" style="font-size:11px;color:#888;min-height:14px;"></div>
            ${role === 'collector'
                ? '<button id="ffb-extract" style="padding:7px;border:none;border-radius:6px;cursor:pointer;background:#fff;color:#111;">Extract FF links (FitGirl)</button><button id="ffb-show" style="display:none;padding:7px;border:none;border-radius:6px;cursor:pointer;background:#fff;color:#111;">Show links</button>'
                : '<button id="ffb-retry" style="display:none;padding:7px;border:none;border-radius:6px;cursor:pointer;background:#e5484d;color:#fff;">Retry failed</button>'}
            <button id="ffb-close" style="padding:5px;border:none;border-radius:6px;cursor:pointer;background:transparent;color:#888;">Close</button>
        `;
        document.body.appendChild(panel);
        return panel;
    }

    function showPanel(role) {
        const existing = document.getElementById('ffbypasser-panel');
        if (existing) {
            if (existing.dataset.role !== role) {
                existing.remove();
            } else {
                return existing;
            }
        }
        const panel = createPanel(role);
        panel.dataset.role = role;
        panel.querySelector('#ffb-close').addEventListener('click', () => panel.remove());
        return panel;
    }

    /* ============================================================
       COLLECTOR FLOW (FitGirl page)
    ============================================================ */
    function startExtract(panel) {
        const links = extractFFLinks();
        if (!links.length) {
            GM_notification({ text: 'No FuckingFast links found on this page.', timeout: 4000 });
            return;
        }
        localStorage.removeItem('ffbypasser.shownPopup');
        const job = createJob(links);
        store.saveJob(job);
        GM_setValue(STORAGE_KEYS.links, links);
        setStatus(panel, `Opening worker tab — ${links.length} links...`);
        GM_openInTab(links[0], { active: true, insert: true, setParent: true });
        console.log(`%c🎯 Job ${job.id}: ${links.length} links queued`, 'color:#38bdf8', links);
    }

    function watchCollectorJob(panel) {
        const showBtn = panel.querySelector('#ffb-show');
        const renderStatus = job => {
            const s = summarizeJob(job);
            setStatus(panel, s.done
                ? `${s.succeeded}/${s.total} converted — ${s.failed} failed`
                : `Working... ${s.succeeded}/${s.total} converted — ${s.failed} failed`);
            if (showBtn) showBtn.style.display = s.done && s.succeeded > 0 ? 'block' : 'none';
        };
        store.watchJob(raw => {
            const job = recoverJob(raw);
            if (!job) return;
            const s = summarizeJob(job);
            renderStatus(job);
            if (s.done && s.succeeded > 0 && localStorage.getItem('ffbypasser.shownPopup') !== job.id) {
                localStorage.setItem('ffbypasser.shownPopup', job.id);
                const text = formatSuccessfulResults(job);
                showLinksPopup(text.split('\n'));
                copyText(text);
            }
            if (s.done && s.failed > 0 && s.succeeded === 0) {
                GM_notification({ text: `All ${s.total} links failed. Check the worker tab.`, timeout: 5000 });
            }
        });
        return renderStatus;
    }

    /* ============================================================
       WORKER FLOW (FuckingFast page)
    ============================================================ */
    function startWorkerSession(panel) {
        const owner = sessionStorage.getItem('ffbypasser.owner')
            || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('ffbypasser.owner', owner);
        let running = false;

        const render = job => {
            if (!job) {
                setStatus(panel, 'Waiting for a saved job...');
                const retryBtn = panel.querySelector('#ffb-retry');
                if (retryBtn) retryBtn.style.display = 'none';
                return;
            }
            const s = summarizeJob(job);
            setStatus(panel, `${s.succeeded}/${s.total} converted — ${s.failed} failed`);
            const retryBtn = panel.querySelector('#ffb-retry');
            if (retryBtn) retryBtn.style.display = s.done && s.failed > 0 ? 'block' : 'none';
        };

        const start = async () => {
            if (running) return;
            running = true;
            try {
                await runWorker(owner, render);
                const job = recoverJob(store.loadJob());
                const s = summarizeJob(job);
                render(job);
                if (s.done && s.failed === 0) {
                    const text = formatSuccessfulResults(job);
                    setStatus(panel, `Done — ${s.succeeded} links ready`);
                    if (text) {
                        showLinksPopup(text.split('\n'));
                        copyText(text);
                        GM_notification({ text: `${s.succeeded} direct links copied to clipboard`, timeout: 6000 });
                    }
                    setTimeout(() => {
                        try {
                            if (job && job.sourceUrl) {
                                location.href = job.sourceUrl;
                            } else if (window.opener) {
                                window.opener.focus();
                                window.close();
                            }
                        } catch { }
                    }, 5000);
                } else if (s.done && s.succeeded === 0) {
                    GM_notification({ text: `All ${s.total} links failed. Click Retry failed.`, timeout: 6000 });
                }
            } catch (error) {
                setStatus(panel, `Error: ${error.message}`);
                console.error('[FFBypasser]', error);
            } finally {
                running = false;
            }
        };

        const retryBtn = panel.querySelector('#ffb-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                const job = retryFailed(store.loadJob());
                if (!job) return;
                store.saveJob(job);
                render(job);
                start();
            });
        }

        const job = recoverJob(store.loadJob());
        render(job);
        if (job && summarizeJob(job).queued) start();
    }

    /* ============================================================
       VIOLENTMONKEY MENU
    ============================================================ */
    GM_registerMenuCommand('🎯 Extract FF links from this page', () => {
        if (!isFitGirlPage()) {
            GM_notification({ text: 'Run this on a FitGirl game page.', timeout: 4000 });
            return;
        }
        startExtract(showPanel('collector'));
    });

    GM_registerMenuCommand('🔗 Convert saved links → direct', () => {
        const saved = GM_getValue(STORAGE_KEYS.links, []);
        if (!saved.length) {
            GM_notification({ text: 'No saved links yet.', timeout: 4000 });
            return;
        }
        localStorage.removeItem('ffbypasser.shownPopup');
        store.saveJob(createJob(saved));
        if (isFFPage()) {
            startWorkerSession(showPanel('worker'));
        } else {
            GM_openInTab(saved[0], { active: true, insert: true, setParent: true });
        }
    });

    GM_registerMenuCommand('📋 Paste links manually', () => {
        const raw = prompt('Paste the FuckingFast links (one per line):');
        if (!raw) return;
        const links = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (!links.length) return;
        GM_setValue(STORAGE_KEYS.links, links);
        GM_notification({ text: `${links.length} links saved.`, timeout: 4000 });
    });

    /* ============================================================
       INITIALIZATION
    ============================================================ */
    function init() {
        if (isFitGirlPage()) {
            const panel = showPanel('collector');
            panel.querySelector('#ffb-extract').addEventListener('click', () => startExtract(panel));
            const renderStatus = watchCollectorJob(panel);
            const showBtn = panel.querySelector('#ffb-show');
            if (showBtn) {
                showBtn.addEventListener('click', () => {
                    const job = recoverJob(store.loadJob());
                    const text = job ? formatSuccessfulResults(job) : '';
                    if (text) showLinksPopup(text.split('\n'));
                });
            }
            const job = recoverJob(store.loadJob());
            if (job) {
                renderStatus(job);
                const s = summarizeJob(job);
                if (s.done && s.succeeded > 0 && localStorage.getItem('ffbypasser.shownPopup') !== job.id) {
                    localStorage.setItem('ffbypasser.shownPopup', job.id);
                    const text = formatSuccessfulResults(job);
                    showLinksPopup(text.split('\n'));
                }
            }
        } else if (isFFPage()) {
            startWorkerSession(showPanel('worker'));
        }
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
            e.preventDefault();
            showPanel(isFFPage() ? 'worker' : 'collector');
        }
    });

    init();
})();
