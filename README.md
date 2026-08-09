# FFBypasser — Direct Link Extractor (FuckingFast)

A **Violentmonkey** userscript that extracts **FuckingFast** share links from **FitGirl** game pages and resolves them into direct download URLs in a **dedicated worker tab**.

It opens a worker tab on `fuckingfast.co` that processes the queue using the real browser session — which bypasses the Cloudflare challenge that blocks direct requests. Results come back to the FitGirl page automatically.

## Features

- Extracts FuckingFast links from FitGirl pages with one click
- **Worker tab flow**: extraction opens a worker tab on fuckingfast.co that resolves every link automatically
- **Cloudflare bypass**: strategies run inside the real browser session (direct POST, same-origin iframe fetch with token, real click with redirect capture, in-tab processing) — no more `ERR_BLOCKED_BY_RESPONSE`
- **Persistent job state**: the job queue is shared across tabs; the worker resumes after reloads and page navigations
- **Live progress**: the panel updates in real time (converted / failed / total)
- **Popup with Copy button** showing the resolved direct links (copied to the clipboard automatically)
- **Retry failed** button on the worker tab when some links fail
- Worker lease prevents two workers from processing the same queue
- The worker tab closes itself and returns to FitGirl when everything succeeds
- Floating panel, Violentmonkey menu commands and `Ctrl+Shift+F` shortcut
- No external dependencies

## Installation

1. Install the [Violentmonkey](https://violentmonkey.github.io/) extension.
2. Install the script from this URL (or open `FFBypasser.user.js` and click **Install**):
   ```
   https://raw.githubusercontent.com/LucianoSkx/FFBypasser-FuckingFast/main/FFBypasser.user.js
   ```
3. Done — the script activates on FitGirl and FuckingFast pages.

> **Note:** when the version adds new `@grant` permissions (like `GM_openInTab`), **reinstall the script** (remove + install) and reload open pages, otherwise Violentmonkey keeps the old permissions.

## Usage

1. Open the desired **FitGirl** game page (e.g. `fitgirl-repacks.site`).
2. Click **"Extract FF links (FitGirl)"** on the floating panel (or use the Violentmonkey menu command).
3. A worker tab opens on `fuckingfast.co` and processes every link in the background.
4. Watch the progress on the FitGirl panel (`converted / failed / total`).
5. When the worker finishes, the popup shows all direct links — click **Copy** (they are also copied automatically).
6. If the host shows a Cloudflare or CAPTCHA challenge in the worker tab, complete it manually and the worker continues.
7. If some links failed, click **Retry failed** on the worker tab panel.

> **Tip:** If you already have a list of links, use **"Paste links manually"** instead of extracting from FitGirl.

## How It Works

The script plays two roles, detected by the page hostname:

### Collector (FitGirl page)

1. Collects every `fuckingfast.co` link on the page.
2. Saves a persistent job (shared via GM storage) and opens the first link in a worker tab (`GM_openInTab` with `setParent`).
3. Watches the job storage; when the job completes it shows the popup with the direct URLs.

### Worker (FuckingFast page)

For every queued link, in cascade:

1. **Fast path** — `POST /f/{id}/go` with HX headers and `credentials: include`.
2. **Same-origin iframe** — loads the file page in an invisible iframe, waits for the challenge token (Turnstile / reCAPTCHA / hCaptcha), and re-sends the request with the real form/hx-vals parameters.
3. **Real click** — clicks the download control inside the frame and captures the `hx-redirect` / `hx-location` header (intercepting `fetch` and `XMLHttpRequest`).
4. **In-tab navigation** — navigates the worker tab itself to the file page and processes it there (you can complete a visible Cloudflare challenge manually and the worker resumes).

A worker lease (renewed every 5 s) guarantees a single active worker. When every link succeeds, the tab closes and returns the focus to FitGirl.

## Example Output

```
https://cdn1.example.com/file1.rar
https://cdn2.example.com/file2.rar
https://cdn3.example.com/file3.rar
```

## Notes

- The worker tab must stay open while the queue is processed; failed items keep it open so you can retry them.
- A delay is included between requests to avoid rate-limiting.
- Failed requests are reported in the worker tab console without stopping the queue.
- The script matches `fitgirl-repacks.site` and `*.fuckingfast.co` domains only.

## Credits

Inspired by [cdxud/FFBypasser](https://github.com/cdxud/FFBypasser) and its [GUI variant](https://github.com/INMENR/FFBypasser-GUI) — adapted into a full Violentmonkey userscript with a worker-tab architecture.

## License

MIT
