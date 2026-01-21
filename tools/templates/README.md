# Beezy Monitor

Beezy Monitor is a DevTools-friendly dashboard that turns noisy DevTools signals into simple graphs and readable summaries for developers and developer-managers.

## What this extension does

- Describe the user-facing problem this extension solves
- Describe what the user can do with it
- Keep claims precise and review-friendly

## Privacy

This extension is designed to be transparent and reviewable.

- Runs locally in the browser
- No analytics
- No advertising
- No tracking

Privacy policy: `docs/privacy.html`

## Installation (developer mode)

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked
4. Select the folder containing `manifest.json`

## Build

```bash
npm install
npm run build
./scripts/build-zip.sh
````

## Demo (standalone)

The `demo/` folder contains a standalone build of the panel UI:

* Runs in a normal browser tab
* Uses mock runtime/storage
* Suitable for GitHub Pages

```bash
cd demo
npm install
npm run build
npm run preview -- --host
```

## Links

* Homepage: https://nathabee.github.io/beezy-monitor/
* Support: https://github.com/nathabee/beezy-monitor/issues

## License

MIT — see `LICENSE`
