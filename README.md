# FFBypasser — FuckingFast Link Extractor

A **Violentmonkey** userscript that collects **FuckingFast** share links from any page (FitGirl, forums, etc.) and resolves them into direct download URLs — walking the file pages on `fuckingfast.co` (either in this tab or in background tabs) and bringing the results back.

## Features

- **Collects links from any page** — anchors + deep HTML scan, or paste links by hand (persistent history, restorable later)
- **Silent fast path first** — `GM_xmlhttpRequest` POST to `/f/{id}/go` with HX headers; most links resolve with no visible tab
- **Redirect mode (default)** — walks the file pages in the current tab (real browser session bypasses Cloudflare), resolves each file, then brings you back to the page you started on
- **Background tab relay** — optional mode that opens background tabs that resolve themselves and report back via shared storage
- **Cloudflare/CAPTCHA handling** — waits for Turnstile / reCAPTCHA / hCaptcha tokens and re-sends the request with the real token; falls back to clicking the real download control and capturing the `hx-redirect` header
- **Modern dark-blue UI** — draggable, resizable, filter/search, status stats, progress bar, toast messages, per-link retry/copy/open
- **Copy / export** — copy all direct links, copy source links as JSON, save `Out_Direct_Links.txt`
- **Settings** — redirect vs background tabs, concurrency, delays, timeouts
- `Alt+F` opens the panel, `Ctrl+Enter` resolves, `Esc` minimizes

## Installation

1. Install the [Violentmonkey](https://violentmonkey.github.io/) extension.
2. Install the script from this URL (or open `FFBypasser.user.js` and click **Install**):
   ```
   https://raw.githubusercontent.com/LucianoSkx/FFBypasser-FuckingFast/main/FFBypasser.user.js
   ```
3. Done — the script activates on every page and shows its FAB when it finds FuckingFast links.

> **Note:** when the version adds new `@grant` permissions (like `GM_xmlhttpRequest`), **reinstall the script** (remove + install) and reload open pages, otherwise Violentmonkey keeps the old permissions.

## Usage

1. Open the page that has FuckingFast links (e.g. a FitGirl game page). The script picks the links up automatically.
2. Click **Resolve** (or `Ctrl+Enter`).
3. **Redirect mode:** the tab walks each file page on fuckingfast.co — if a CAPTCHA appears, complete it and the script continues. When done, you are returned to the page you started on, with the results in the panel (and on the clipboard).
4. **Background tabs mode:** turn off "Redirect this tab" in Settings to resolve via background tabs instead.
5. Click **Copy links**, save as `.txt`, or open individual links from the list.

## How It Works

Per link, in cascade:

1. **Fast path** — cross-origin `POST /f/{id}/go` via `GM_xmlhttpRequest` with `HX-Request` and the file page as Referer/Origin. This resolves most links silently.
2. **Same-origin iframe** (when already on fuckingfast.co) — loads the file page in an invisible iframe, waits for the challenge token (Turnstile / reCAPTCHA / hCaptcha), and re-sends the request with the real form/hx-vals parameters.
3. **Real click** — clicks the download control and captures the `hx-redirect` / `hx-location` header (intercepting `fetch` and `XMLHttpRequest`).
4. **Redirect / relay walk** — if challenges keep blocking, the script walks the file pages in this tab (hop mode) or in background tabs (relay mode), where the real browser session can solve the challenge with your help.

Results are persisted in Violentmonkey storage, so the list survives reloads and can be restored later.

## Example Output

```
https://cdn1.example.com/file1.rar
https://cdn2.example.com/file2.rar
https://cdn3.example.com/file3.rar
```

## Notes

- First run after updating: **reinstall** the script (remove + install) so the new `@grant` permissions take effect.
- A delay is included between requests to avoid rate-limiting (adjustable in Settings).
- The script runs on every page (`@match *://*/*`) but only shows its button when it finds FuckingFast links — or press `Alt+F`.

## Credits

Inspired by [cdxud/FFBypasser](https://github.com/cdxud/FFBypasser) and its [GUI variant](https://github.com/INMENR/FFBypasser-GUI) — adapted into a full Violentmonkey userscript.

## License

MIT
