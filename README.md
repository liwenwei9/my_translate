# My Translate

A browser translation extension based on [FluentRead](https://github.com/Bistutu/FluentRead) (GPL-3.0)

**[中文文档 / Chinese Documentation](./README.zh-CN.md)** ← 点击查看完整中文说明

## Quick Start

### Install Dependencies

Requires Node.js 20+ and pnpm 9.

```bash
pnpm install --frozen-lockfile
```

### Build Extension

```bash
pnpm build
```

Build output: `.output/chrome-mv3`

### Load Extension

1. Open `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` directory

### Test Translation

Open `test.html` in your browser and select any text to see the translation popup.

## Features

- 📄 **Web Page Translation**: Bilingual page display
- ✏️ **Selection Translation**: Translate selected text (划词翻译)
- 🔤 **Input Translation**: Type or paste text to translate
- 🌐 **Chinese ↔ English**: Bidirectional translation
- 🆓 **Free Engines**: Microsoft, Google, DeepLX (no API key required)

## License & Attribution

Based on **FluentRead** (https://github.com/Bistutu/FluentRead)

- License: GNU General Public License v3.0 (GPL-3.0)
- See: [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md)

This project maintains GPL-3.0 compliance and properly attributes the original FluentRead project.

## Acknowledgments

Thanks to the FluentRead project and its contributors for creating this excellent open-source translation extension.

---

**Complete documentation in Chinese**: [README.zh-CN.md](./README.zh-CN.md)
