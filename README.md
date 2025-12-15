# 🎵 Traxsource to YouTube

[![CI](https://github.com/NicoLiendro14/trax2youtube/actions/workflows/ci.yml/badge.svg)](https://github.com/NicoLiendro14/trax2youtube/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)

Ever spent hours manually searching for tracks on YouTube after discovering a sick house chart on Traxsource? Yeah, me too. That's why I built this.

**Trax2YouTube** is a Chrome extension that grabs all the tracks from any Traxsource chart and creates a YouTube playlist in seconds. No more copy-pasting track names one by one.

---

## ✨ Features

- 🔍 **Auto-detects tracks** on any Traxsource chart page
- ⚡ **One-click conversion** to YouTube playlist
- 📋 **Copy playlist URL** to share with friends
- 🎨 **Clean, minimal UI** that doesn't get in your way

## 📸 How it works

1. Go to any Traxsource chart (Top 100, Genre charts, DJ charts, etc.)
2. Click the extension icon
3. Hit "Convert to Playlist"
4. Done! Open your new YouTube playlist 🎉

## 🚀 Installation

### From source (Developer mode)

```bash
# Clone the repo
git clone https://github.com/NicoLiendro14/trax2youtube.git
cd trax2youtube

# Install dependencies (for development)
npm install
```

Then load it in Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `trax2youtube` folder

That's it! Navigate to [Traxsource](https://www.traxsource.com) and try it out.

## 🛠️ Development

This project uses modern tooling to keep the code clean:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests with Playwright
npm run test:e2e

# Lint the code
npm run lint

# Format with Prettier
npm run format

# Run full CI pipeline locally
npm run ci
```

### Project structure

```
trax2youtube/
├── manifest.json      # Extension manifest (v3)
├── background.js      # Service worker for YouTube search
├── content.js         # Parses tracks from Traxsource pages
├── popup/             # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── src/
│   └── utils.js       # Shared utilities
├── tests/
│   ├── unit/          # Vitest unit tests
│   └── e2e/           # Playwright E2E tests
└── icons/             # Extension icons
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
