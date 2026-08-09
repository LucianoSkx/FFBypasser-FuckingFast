// ==UserScript==
// @name         FFBypasser — Direct Link Extractor (FuckingFast)
// @namespace    github.com/LucianoSkx/FFBypasser-FuckingFast
// @version      2.5
// @description  Extracts FuckingFast share links from FitGirl pages and converts them into direct download URLs. Two-step flow, with links saved automatically between pages.
// @author       cdxud (adapted for Violentmonkey)
// @icon         data:image/png;base64,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
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
        GM_notification({ text: `${links.length} links extracted and copied. Paste/convert them on fuckingfast.co.`, timeout: 6000 });
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
