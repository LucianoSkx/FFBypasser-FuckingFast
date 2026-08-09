// ==UserScript==
// @name         FFBypasser — Direct Link Extractor (FuckingFast)
// @namespace    github.com/LucianoSkx/FFBypasser-FuckingFast
// @version      2.7
// @description  Extracts FuckingFast share links from FitGirl pages and converts them into direct download URLs. Two-step flow, with links saved automatically between pages.
// @author       cdxud (adapted for Violentmonkey)
// @icon         https://raw.githubusercontent.com/LucianoSkx/FFBypasser-FuckingFast/main/ffbypasser-icon.png
// @match        *://fitgirl-repacks.site/*
// @match        *://*.fuckingfast.co/*
// @match        *://fuckingfast.co/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
       CONFIG
    ============================================================ */
    const CONFIG = {
        concurrency: 3,
        delayMs: 800,
        timeoutMs: 30000,
        linksStorageKey: 'ff_links',
    };

    const STORAGE_KEY = CONFIG.linksStorageKey;

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const green = 'color: #00ff00';
    const red = 'color: #ff5555';
    const blue = 'color: #38bdf8';
    const grey = 'color: #888';

    /* ============================================================
       HELPERS
    ============================================================ */
    function isFitGirlPage() {
        return location.hostname.includes('fitgirl');
    }

    function isFFPage() {
        return location.hostname.includes('fuckingfast');
    }

    function extractFFLinks() {
        const anchors = document.querySelectorAll('a[href*="fuckingfast.co"]');
        return [...new Set(Array.from(anchors).map(a => a.href))];
    }

    function saveLinks(links) {
        GM_setValue(STORAGE_KEY, links);
    }

    function loadLinks() {
        return GM_getValue(STORAGE_KEY, []);
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
        return headers.get('hx-redirect') || headers.get('HX-Redirect')
            || headers.get('hx-location') || headers.get('location');
    }

    /* ============================================================
       MAIN STRATEGY: POST /f/{id}/go (fast path)
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
       FALLBACK: scan the page for a direct download link
    ============================================================ */
    function strategyPageScan(link, id) {
        const selectors = [
            'a[download]',
            'a[href*="/download"]',
            'a[href*="cdn"]',
            'a[href*="/dl/"]',
        ];
        for (const sel of selectors) {
            for (const el of document.querySelectorAll(sel)) {
                const href = el.href || el.getAttribute('href') || '';
                if (href && href !== link && !href.includes('/f/')) {
                    return absolutize(href, location.origin);
                }
            }
        }
        return null;
    }

    /* ============================================================
       CONCURRENCY POOL
    ============================================================ */
    async function resolveLink(link, index, total, progress) {
        const id = fileIdOf(link);
        const label = `[${index + 1}/${total}]`;
        const errors = [];

        try {
            const url = await strategyFast(id);
            console.log(`%c${label} ✅ ${url}`, green);
            return url;
        } catch (e) {
            errors.push(`fast: ${e.message}`);
        }

        const scanned = strategyPageScan(link, id);
        if (scanned) {
            console.log(`%c${label} ✅ ${scanned} %c(page scan)`, green, grey);
            return scanned;
        }
        errors.push('scan: nothing found');

        console.log(`%c${label} ❌ ${link}\n     ${errors.join(' | ')}`, red);
        return null;
    }

    async function runPool(items, worker, size, progress) {
        const out = new Array(items.length);
        let cursor = 0;
        const lanes = Array.from({ length: Math.max(1, size) }, async () => {
            while (true) {
                const i = cursor++;
                if (i >= items.length) break;
                out[i] = await worker(items[i], i, items.length, progress);
                progress(i + 1, items.length);
                await sleep(CONFIG.delayMs);
            }
        });
        await Promise.all(lanes);
        return out;
    }

    /* ============================================================
       FULL CONVERSION
    ============================================================ */
    async function convertLinks(links, panel) {
        if (!isFFPage()) {
            GM_notification({ text: 'Open a FuckingFast page first (fuckingfast.co)', timeout: 4000 });
            console.log('%c⚠ This script must run on a FuckingFast page.', red);
            return [];
        }

        console.log(`%c🚀 Converting ${links.length} FuckingFast links → direct URLs`, 'color:#00ff00;font-size:14px;font-weight:bold');

        const results = (await runPool(links, resolveLink, CONFIG.concurrency)).filter(Boolean);

        console.log(`%c\n🎉 Done: ${results.length}/${links.length}\n`, 'color:#00ff00;font-size:14px;font-weight:bold');

        if (!results.length) {
            GM_notification({ text: 'No links converted. Check the console (F12).', timeout: 4000 });
            return [];
        }

        const text = results.join('\n');
        console.log(text);
        try { copy(text); console.log('%c(copied to clipboard)', grey); } catch { }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Out_Direct_Links.txt';
        a.click();
        URL.revokeObjectURL(url);

        GM_notification({ text: `${results.length} direct links saved to Out_Direct_Links.txt`, timeout: 4000 });
        return results;
    }

    /* ============================================================
       POPUP: shows the extracted links for copying
    ============================================================ */
    function showLinksPopup(links) {
        const existing = document.getElementById('ffb-popup');
        if (existing) existing.remove();

        const text = links.join('\n');
        const overlay = document.createElement('div');
        overlay.id = 'ffb-popup';
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:rgba(0,0,0,.65)',
            'display:flex', 'align-items:center', 'justify-content:center',
        ].join(';');

        const box = document.createElement('div');
        box.style.cssText = [
            'width:min(640px,92vw)', 'max-height:85vh',
            'display:flex', 'flex-direction:column', 'gap:10px',
            'padding:16px', 'border-radius:10px',
            'background:#111', 'border:1px solid #333',
            'color:#e5e5e5', 'font-family:monospace', 'font-size:12px',
            'box-shadow:0 0 24px rgba(0,0,0,.8)',
        ].join(';');

        const header = document.createElement('div');
        header.textContent = `${links.length} FuckingFast links extracted:`;
        header.style.cssText = 'font-weight:bold;color:#00ff00;';

        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.value = text;
        textarea.style.cssText = [
            'flex:1', 'min-height:200px', 'resize:vertical',
            'background:#000', 'color:#7CFC98', 'border:1px solid #333',
            'border-radius:6px', 'padding:8px', 'font-family:monospace', 'font-size:12px',
        ].join(';');
        textarea.addEventListener('click', () => { textarea.select(); });

        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.cssText = btnStyle('background:#00ff00;color:#000;');
        copyBtn.addEventListener('click', () => {
            textarea.select();
            try { copy(text); } catch { }
            textarea.focus();
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = btnStyle('background:none;color:#aaa;');
        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

        function btnStyle(extra) {
            return [
                'padding:8px 14px', 'border:none', 'border-radius:6px',
                'cursor:pointer', 'font-family:monospace', 'font-size:12px',
            ].join(';') + extra;
        }

        buttons.append(copyBtn, closeBtn);
        box.append(header, textarea, buttons);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    /* ============================================================
       FITGIRL FLOW: extract links, show them and save them
    ============================================================ */
    function extractFromFitGirl() {
        const links = extractFFLinks();
        if (!links.length) {
            GM_notification({ text: 'No FuckingFast links found on this page.', timeout: 4000 });
            return null;
        }
        saveLinks(links);
        const text = links.join('\n');
        try { copy(text); console.log('%c(copied to clipboard)', grey); } catch { }
        console.log(`%c🎉 ${links.length} links extracted and saved:`, green, links);
        showLinksPopup(links);
        GM_notification({ text: `${links.length} links extracted.`, timeout: 4000 });
        return links;
    }

    /* ============================================================
       FLOATING PANEL
    ============================================================ */
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'ffbypasser-panel';
        panel.style.cssText = [
            'position:fixed', 'right:12px', 'bottom:12px', 'z-index:2147483647',
            'display:flex', 'flex-direction:column', 'gap:6px',
            'padding:10px', 'border-radius:8px', 'width:220px',
            'background:rgba(10,10,10,.92)', 'box-shadow:0 0 12px rgba(0,0,0,.6)',
            'border:1px solid #333', 'color:#e5e5e5', 'font-family:monospace',
            'font-size:12px',
        ].join(';');
        panel.innerHTML = `
            <div style="font-weight:bold;color:#00ff00;">FFBypasser</div>
            <button id="ffb-extract" style="padding:6px;border:none;border-radius:4px;cursor:pointer;background:#38bdf8;color:#000;">Extract FF links (FitGirl)</button>
            <button id="ffb-convert" style="padding:6px;border:none;border-radius:4px;cursor:pointer;background:#00ff00;color:#000;">Convert → direct</button>
            <button id="ffb-paste" style="padding:6px;border:none;border-radius:4px;cursor:pointer;background:#f59e0b;color:#000;">Paste links manually</button>
            <div id="ffb-links" style="max-height:160px;overflow-y:auto;background:#000;border:1px solid #333;border-radius:4px;padding:6px;font-size:11px;word-break:break-all;display:none;"></div>
            <div id="ffb-status" style="color:#888;margin-top:4px;word-break:break-all;"></div>
            <button id="ffb-close" style="padding:4px;border:none;border-radius:4px;cursor:pointer;background:none;color:#888;">✕ Close</button>
        `;
        document.body.appendChild(panel);
        return panel;
    }

    function wirePanel(panel) {
        const status = panel.querySelector('#ffb-status');
        const linksBox = panel.querySelector('#ffb-links');
        const setStatus = t => { status.textContent = t; };

        const showLinks = links => {
            if (!links || !links.length) return;
            linksBox.innerHTML = '';
            links.forEach(l => {
                const row = document.createElement('div');
                row.style.cssText = 'padding:2px 0;border-bottom:1px solid #222;';
                row.textContent = l;
                linksBox.appendChild(row);
            });
            linksBox.style.display = 'block';
        };

        panel.querySelector('#ffb-extract').addEventListener('click', () => {
            const links = extractFromFitGirl();
            showLinks(links);
        });

        panel.querySelector('#ffb-convert').addEventListener('click', async () => {
            const saved = loadLinks();
            if (!saved.length) {
                GM_notification({ text: 'No saved links. Extract on FitGirl or paste manually.', timeout: 4000 });
                return;
            }
            panel.remove();
            await convertLinks(saved);
        });

        panel.querySelector('#ffb-paste').addEventListener('click', () => {
            panel.remove();
            const raw = prompt('Paste the FuckingFast links (one per line or comma-separated):');
            if (!raw) return;
            const links = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            if (!links.length) return;
            saveLinks(links);
            GM_notification({ text: `${links.length} links saved. Open fuckingfast.co and use "Convert".`, timeout: 5000 });
        });

        panel.querySelector('#ffb-close').addEventListener('click', () => panel.remove());
    }

    function showPanel() {
        if (document.getElementById('ffbypasser-panel')) return;
        const panel = createPanel();
        wirePanel(panel);
    }

    /* ============================================================
       AUTO FLOW (optional): if there are saved links and we are on
       FuckingFast, convert automatically after 2s.
    ============================================================ */
    function autoConvertIfReady() {
        if (!isFFPage()) return;
        const saved = loadLinks();
        if (!saved.length) return;
        setTimeout(() => convertLinks(saved), 2000);
    }

    /* ============================================================
       VIOLENTMONKEY MENU
    ============================================================ */
    GM_registerMenuCommand('🎯 Extract FF links from this page', () => {
        if (!isFitGirlPage()) {
            GM_notification({ text: 'Run this on a FitGirl game page.', timeout: 4000 });
            return;
        }
        extractFromFitGirl();
    });

    GM_registerMenuCommand('🔗 Convert saved links → direct', () => {
        const saved = loadLinks();
        if (!saved.length) {
            GM_notification({ text: 'No saved links yet.', timeout: 4000 });
            return;
        }
        if (!isFFPage()) {
            GM_notification({ text: 'Open a FuckingFast page first.', timeout: 4000 });
            return;
        }
        convertLinks(saved);
    });

    GM_registerMenuCommand('📋 Paste links manually', () => {
        const raw = prompt('Paste the FuckingFast links (one per line):');
        if (!raw) return;
        const links = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (!links.length) return;
        saveLinks(links);
        GM_notification({ text: `${links.length} links saved.`, timeout: 4000 });
    });

    /* ============================================================
       INITIALIZATION
    ============================================================ */
    function init() {
        if (isFitGirlPage() || isFFPage()) {
            showPanel();
            autoConvertIfReady();
        }
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
            e.preventDefault();
            showPanel();
        }
    });

    init();
})();
