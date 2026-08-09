# FFBypasser — Direct Link Extractor (FuckingFast)

A **Violentmonkey** userscript that extracts **FuckingFast** share links from **FitGirl** game pages and converts them into direct download URLs.

It sends the required POST request for each shared file, extracts the `hx-redirect` response header, and saves all direct links into `Out_Direct_Links.txt`.

## Features

- Extracts FuckingFast links from FitGirl pages automatically
- Links are **saved between pages** (no copy/paste of arrays needed)
- Converts links to direct download URLs via `POST /f/{id}/go`
- Page-scan fallback when the fast path fails
- Concurrent processing (3 at a time) with delay between requests
- Progress logging in the browser console
- Automatically downloads results as `Out_Direct_Links.txt`
- Floating panel, Violentmonkey menu commands and `Ctrl+Shift+F` shortcut
- No external dependencies

## Installation

1. Install the [Violentmonkey](https://violentmonkey.github.io/) extension.
2. Open `FFBypasser.user.js` from this repository and click **Install** (or add a new script in Violentmonkey and paste the contents).
3. Done — the script activates on FitGirl and FuckingFast pages.

## Usage

### Step 1 — Extract the FuckingFast links (FitGirl page)

1. Open the desired **FitGirl** game page.
2. Click **"Extract FF links (FitGirl)"** on the floating panel (or use the Violentmonkey menu command **"🎯 Extract FF links from this page"**).
3. All FuckingFast links are saved automatically.

### Step 2 — Convert to direct links (FuckingFast page)

1. Open any **fuckingfast.co** page (e.g. the first link you want to convert).
2. Click **"Convert → direct"** on the floating panel (or use the menu command **"🔗 Convert saved links → direct"**).
3. The script processes every link and automatically downloads the results as:

```
Out_Direct_Links.txt
```

> **Tip:** If you already have a list of links, use **"Paste links manually"** instead of extracting from FitGirl.

## How It Works

For every link, the script:

1. Extracts the file ID from the URL.
2. Sends a `POST` request to `/f/{id}/go` with HX headers.
3. Reads the `hx-redirect` response header.
4. Stores the direct download URL.
5. Repeats until every link has been processed.

## Example Output

```
https://cdn1.example.com/file1.rar
https://cdn2.example.com/file2.rar
https://cdn3.example.com/file3.rar
```

## Notes

- The script must run on a FuckingFast page to convert links.
- A delay is included between requests to avoid rate-limiting.
- Failed requests are reported in the browser console without stopping the extraction.
- If the fast path fails, the script falls back to scanning the page for a direct download link.

## Credits

Inspired by [cdxud/FFBypasser](https://github.com/cdxud/FFBypasser) — adapted into a full Violentmonkey userscript with cross-page link storage.

## License

MIT
