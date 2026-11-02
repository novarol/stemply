# Stemply Scan

Client-only QR and barcode scanner **PWA prototype**. Compare three browser engines side by side, keep a short local history, and install to the home screen — no accounts, no backend.

## Stack

- **Nuxt 4** (SPA / `ssr: false`)
- **Tailwind CSS** (`@nuxtjs/tailwindcss`, class dark mode)
- **pnpm**
- **Engines**
  - [html5-qrcode](https://github.com/mebjas/html5-qrcode)
  - [@zxing/browser](https://github.com/zxing-js/browser) (`BrowserMultiFormatReader`)
  - Native [BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) with ZXing fallback

## Setup

```bash
pnpm install
```

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Local Nuxt dev server (camera works on `localhost`) |
| `pnpm build` | Production build |
| `pnpm generate` | Static generate, then **PWA precache** (`pwa:precache`) |
| `pnpm run pwa:precache` | Inject Workbox precache manifest into `.output/public/sw.js` |
| `pnpm preview` | Preview a production build |

```bash
pnpm install
pnpm dev
```

Static / PWA handoff:

```bash
pnpm generate
pnpm preview
```

## Camera: HTTPS / localhost

`getUserMedia` (and service workers) require a **secure context**:

- `https://…`, or
- `http://localhost` / `http://127.0.0.1`

Plain HTTP on a LAN IP (e.g. `http://192.168.x.x`) will not get a camera stream or register the service worker. Use localhost, a tunnel with HTTPS, or deploy over HTTPS.

Guided errors cover permission denied and insecure context when Start fails.

## iOS Safari notes

- **Add to Home Screen (A2HS):** Share → Add to Home Screen. There is no Chrome-style install prompt on iOS Safari.
- **Torch:** Flash/torch via `MediaTrackConstraints` is limited or unavailable on many iOS cameras; the Torch control only appears when the track reports support.
- **Install UX:** Chromium may show an install / app banner from the web manifest; Safari relies on manual A2HS. Both use the same icons and `manifest.webmanifest`.

## Offline expectations

After `pnpm generate` (with precache) and a visit while online:

| Works offline | Does not work offline |
| --- | --- |
| App shell (HTML/JS/CSS), routes, history UI | Live camera / `getUserMedia` |
| localStorage scan history + theme | Fresh network-dependent assets not yet cached |

Reload the shell offline to confirm navigation and history still load. Starting the camera still needs a device camera and a secure context (online or not).

## Manual test checklist

### Engines (html5-qrcode, ZXing, BarcodeDetector)

- [ ] **Start** live camera on each engine page
- [ ] **Stop** ends the preview / releases the camera
- [ ] **Live scan** of a QR or barcode saves a result
- [ ] **Upload image** decodes a still and saves a result

### Scan behavior

- [ ] Live scan **stops after a successful decode**
- [ ] Scans **persist** across reload (`localStorage`)
- [ ] History is capped at **50**; oldest dropped on overflow
- [ ] Duplicate values **always append** (no dedup)

### History

- [ ] **Copy** value (toast confirms)
- [ ] **Open URL** when the value is a URL
- [ ] **Delete** a single scan
- [ ] **Edit note** and save
- [ ] **Clear all** (confirm dialog)

### Theme & PWA

- [ ] **Dark mode** toggles and **persists** across reload
- [ ] **Offline shell reload** after generate + first online visit
- [ ] **Install / A2HS** (Chrome install or iOS Add to Home Screen)

### Errors (smoke)

- [ ] **Permission denied** shows a guided message (deny camera, then Start)
- [ ] **Insecure context** messaging when not on HTTPS/localhost (if you can reproduce)

## Routes

| Path | Page |
| --- | --- |
| `/` | Engine picker + recent scans |
| `/scan/html5` | html5-qrcode |
| `/scan/zxing` | ZXing |
| `/scan/native` | BarcodeDetector (+ ZXing fallback) |
| `/history` | Full history |

## Out of scope (prototype)

Export/import, accounts, i18n, analytics, production hardening, E2E suite, CSP audit.
