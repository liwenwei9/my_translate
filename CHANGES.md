# Changes from FluentRead Upstream

## Overview

This repository (`my_translate`) is adapted from [FluentRead](https://github.com/Bistutu/FluentRead) (commit: latest as of Oct 29, 2026) while maintaining GPL-3.0 compliance and proper attribution.

## Changes Made

### 1. Branding Updates

**Changed from "FluentRead" / "流畅阅读" to "My Translate":**

- `package.json`: Updated name and description
- `src/core/i18n/messages/*.ts`: Changed `common.brand` from "FluentRead" to "My Translate" in all language files (en-US, es-ES, fr-FR, ja-JP, ko-KR, ru-RU, zh-CN)
- Built extension displays "My Translate" in all supported languages

**Note:** Internal UI text still references "FluentRead" in descriptive contexts (e.g., file restore hints, welcome messages). These provide context for users but do not affect the product name.

### 2. Documentation

**Added:**
- `NOTICE.md`: GPL-3.0 attribution and acknowledgment of FluentRead
- `README.md`: English quick start guide with links to Chinese documentation
- `README.zh-CN.md`: Comprehensive Chinese documentation including:
  - Installation instructions (加载已解压的扩展程序)
  - Testing instructions (测试页面路径)
  - Feature checklist (功能测试清单)
  - Troubleshooting (常见问题)
- `test.html`: Bilingual test page with Chinese and English sample text
- `CHANGES.md` (this file): Documentation of changes from upstream

**Preserved:**
- `LICENSE`: Original GPL-3.0 license (unchanged)
- All upstream source code and functionality

### 3. No Functional Changes

**Preserved all FluentRead features:**
- ✅ Chromium Manifest V3 support (WXT framework)
- ✅ Selection translation (划词翻译)
- ✅ Input translation (翻译中心)
- ✅ Web page translation (网页翻译)
- ✅ Chinese ↔ English bidirectional translation
- ✅ Free translation engines:
  - Microsoft Translator (no API key required)
  - Google Translate (no API key required)
  - DeepLX (no API key required)
- ✅ All other FluentRead features (AI reading, document translation, video subtitles, etc.)

## Build Verification

### Build Output

```
.output/chrome-mv3/
├── manifest.json       # Manifest V3, name: "__MSG_extensionName__"
├── _locales/
│   ├── en/messages.json      # "My Translate"
│   ├── zh_CN/messages.json   # "My Translate"
│   └── [other locales]
├── background.js
├── content-scripts/
└── [other extension files]
```

### Verified Working

- ✅ Build completes successfully (`pnpm build`)
- ✅ Extension name displays as "My Translate" in all locales
- ✅ Manifest V3 structure intact
- ✅ All translation providers included
- ✅ Test HTML page created with bilingual content

## Testing Instructions

### Load Extension (Chrome/Edge)

1. Open `chrome://extensions/` (或 `edge://extensions/`)
2. Enable "Developer mode" (开启"开发者模式")
3. Click "Load unpacked" (点击"加载已解压的扩展程序")
4. Select `.output/chrome-mv3` directory

### Test Translation

1. **Using test page**:
   - Open `test.html` in browser
   - Select any Chinese or English text
   - Verify translation popup appears

2. **On any webpage**:
   - Select text on any webpage
   - Verify translation popup appears
   - Click extension icon → "Translation Center"
   - Input text and verify translation works

3. **Free engines** (no API key needed):
   - Microsoft Translator should work by default
   - Google Translate should work by default
   - DeepLX should work by default

## Upstream Sync

To sync with FluentRead upstream in the future:

1. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Bistutu/FluentRead.git
   ```

2. Fetch and merge:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

3. Resolve conflicts, especially in:
   - `package.json`
   - `src/core/i18n/messages/*.ts` (common.brand)
   - Documentation files

4. Rebuild and test:
   ```bash
   pnpm install
   pnpm build
   ```

## License Compliance

- ✅ GPL-3.0 license preserved (unchanged)
- ✅ Attribution provided in NOTICE.md
- ✅ Source code available in this repository
- ✅ Changes documented in this file
- ✅ Build instructions in README.zh-CN.md

## Summary

This adaptation maintains full GPL-3.0 compliance while rebranding FluentRead as "My Translate" for demonstration purposes. All original functionality is preserved, including the free translation engines that work without API keys. The repository includes comprehensive Chinese documentation and a test HTML page for easy verification.
