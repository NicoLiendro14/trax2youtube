# 🎵 Traxsource to YouTube

[![CI](https://github.com/NicoLiendro14/trax2youtube/actions/workflows/ci.yml/badge.svg)](https://github.com/NicoLiendro14/trax2youtube/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefox&logoColor=white)](https://addons.mozilla.org)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)

Ever spent hours manually searching for tracks on YouTube after discovering a sick house chart on Traxsource? Yeah, me too. That's why I built this.

**Trax2YouTube** is a browser extension for Chrome and Firefox that grabs all the tracks from any Traxsource chart and creates a YouTube playlist in seconds. No more copy-pasting track names one by one.

---

## ✨ Features

- 🔍 **Auto-detects tracks** on any Traxsource chart page
- ⚡ **One-click conversion** to YouTube playlist
- 📋 **Copy playlist URL** to share with friends
- 🎨 **Clean, minimal UI** that doesn't get in your way

## 📍 Supported Pages

Works on all major Traxsource page types:

| Page Type            | Example URL                |
| -------------------- | -------------------------- |
| Top Charts           | `/top/tracks`              |
| Genre Charts         | `/genre/11/tech-house/top` |
| DJ Charts & Releases | `/title/*`                 |
| Label Pages          | `/label/325/nervous/top`   |
| Artist Pages         | `/artist/1377/louie-vega`  |
| Search Results       | `/search?term=fisher`      |

## 📸 How it works

1. Go to any Traxsource chart (Top 100, Genre charts, DJ charts, etc.)
2. Click the extension icon
3. Hit "Convert to Playlist"
4. Done! Open your new YouTube playlist 🎉

## 🚀 Installation

### From source (Developer mode)

```bash
git clone https://github.com/NicoLiendro14/trax2youtube.git
cd trax2youtube
npm install
npm run build
```

#### Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/chrome` folder

#### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `dist/firefox/manifest.json`

That's it! Navigate to [Traxsource](https://www.traxsource.com) and try it out.

## 🛠️ Development

```bash
# Build for both browsers
npm run build

# Build for specific browser
npm run build:chrome
npm run build:firefox

# Run unit tests
npm test

# Run E2E tests (builds Chrome first)
npm run test:e2e

# Lint & format
npm run lint
npm run format

# Full CI pipeline
npm run ci
```

### Project structure

```
trax2youtube/
├── src/                    # Source code
│   ├── background.js       # Service worker / background script
│   ├── content.js          # Traxsource page parser
│   ├── utils.js            # Shared utilities
│   ├── popup/              # Extension popup UI
│   └── icons/              # Extension icons
├── manifests/              # Browser-specific manifests
│   ├── base.json           # Shared manifest
│   ├── chrome.json         # Chrome overrides
│   └── firefox.json        # Firefox overrides
├── scripts/
│   └── build.js            # Build script
├── dist/                   # Built extensions (gitignored)
│   ├── chrome/
│   └── firefox/
└── tests/
    ├── unit/               # Vitest unit tests
    └── e2e/                # Playwright E2E tests
```

## 🧪 Testing

The extension is tested with:

- **Vitest** for unit tests
- **Playwright** for E2E testing

Run `npm run ci` to execute the full test suite (lint + format check + tests).

## 🤝 Contributing

Found a bug? Have an idea? PRs are welcome!

1. Fork it
2. Create your feature branch (`git checkout -b feature/cool-thing`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT — do whatever you want with it.

---

**Made for DJs who are tired of manual playlist creation** 🎧
