// ==UserScript==
// @name         FFBypasser — Direct Link Extractor (FuckingFast)
// @namespace    github.com/LucianoSkx/FFBypasser-FuckingFast
// @version      2.1
// @description  Extracts FuckingFast share links from FitGirl pages and converts them into direct download URLs. Two-step flow, with links saved automatically between pages.
// @author       cdxud (adapted for Violentmonkey)
// @icon         data:image/png;base64,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
// @match        *://fitgirl-releases.com/*
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
       FITGIRL FLOW: extract links and save them
    ============================================================ */
    function extractFromFitGirl() {
        const links = extractFFLinks();
        if (!links.length) {
            GM_notification({ text: 'No FuckingFast links found on this page.', timeout: 4000 });
            return;
        }
        saveLinks(links);
        GM_notification({ text: `${links.length} FuckingFast links extracted and saved. Open a fuckingfast.co page and use "Convert".`, timeout: 6000 });
        console.log(`%c🎉 ${links.length} links extracted and saved:`, green, links);
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
            <div id="ffb-status" style="color:#888;margin-top:4px;word-break:break-all;"></div>
            <button id="ffb-close" style="padding:4px;border:none;border-radius:4px;cursor:pointer;background:none;color:#888;">✕ Close</button>
        `;
        document.body.appendChild(panel);
        return panel;
    }

    function wirePanel(panel) {
        const status = panel.querySelector('#ffb-status');
        const setStatus = t => { status.textContent = t; };

        panel.querySelector('#ffb-extract').addEventListener('click', () => {
            extractFromFitGirl();
            panel.remove();
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
