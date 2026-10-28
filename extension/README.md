# RepoMind AI Chrome Extension

The Manifest V3 extension detects repository pages on GitHub and sends analysis requests to the existing FastAPI backend. The backend keeps transferred analysis results in memory for up to 10 minutes (up to 8 pending results per process); the extension's `chrome.storage.session` copy excludes source file contents and security evidence snippets. Backend restart clears pending transfers.

## Build

From this directory, install the extension dependencies and create the production bundle:

```sh
npm install
npm run build
```

The unpacked extension is generated in `dist/`.

The development backend defaults to `http://127.0.0.1:8000`. To use another backend, set `VITE_BACKEND_URL` in an extension-local `.env.local` file before building. Use an HTTPS origin, or HTTP only for a loopback host; the URL must not include credentials, a path, query, or fragment. The build writes a `host_permissions` entry for only that origin to `dist/manifest.json`.

The dashboard defaults to `http://localhost:8443`, matching the configured frontend Vite port. Override it with `VITE_DASHBOARD_URL` in `.env.local` if needed. Dashboard transfer references expire after 10 minutes.

## Run and configure the backend

From the `backend/` directory, configure `GITHUB_TOKEN` in `backend/.env`, then run:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The extension origin must also be explicitly allowed by the backend. After loading the unpacked extension, copy its ID from `chrome://extensions`, then start the backend with the exact extension origin:

```powershell
$env:REPOMIND_CORS_ORIGINS = "chrome-extension://<32-character-extension-id>"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

`REPOMIND_CORS_ORIGINS` accepts a comma-separated list of exact HTTPS origins, loopback HTTP origins, or Chrome extension origins. Existing local frontend origins remain allowed. Credentials are not enabled for CORS.

The frontend Vite server proxies `/api/*` to this backend. The default proxy target is also `http://127.0.0.1:8000`; override it with `REPOMIND_BACKEND_URL` if the backend runs elsewhere.

## Run the dashboard

In another PowerShell terminal, from the `frontend/` directory:

```powershell
npm ci
npm run dev
```

The current Vite configuration serves the dashboard at `http://localhost:8443`. Its proxy forwards dashboard API requests to the same FastAPI backend on port 8000 by default.

## Load in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project's `extension/dist` folder.
5. Open a GitHub repository page, such as `https://github.com/owner/repository`, or one of its files or folders.
6. Select the RepoMind AI extension icon and choose **Analyze Repository**. The popup shows progress, then a success or actionable error message.
7. Choose **Open Dashboard** to view the same analysis. The result reference is temporary and does not rerun repository analysis.

The extension requests `activeTab` to read the current tab and `storage` for a temporary transfer reference. Its content script only matches `https://github.com/*`. The backend request is `POST /analyze` with a `repository_url` JSON field.
