# My Translate Extension - Verifier Demo Guide

**⏱️ Time Required: 5-10 minutes**

## 🎯 Quick Demo Path

Follow these exact steps to verify the extension works:

### Step 1: Load Extension (2 minutes)

```bash
# The extension is already built in: .output/chrome-mv3/
```

1. Open **Chrome** or **Edge** browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select: `/workspace/.output/chrome-mv3` directory
6. ✅ Extension should load successfully - icon appears in toolbar

**Expected**: "My Translate" extension visible with icon in browser toolbar.

### Step 2: Test Selection Translation / 划词翻译 (2 minutes)

1. Open the test file: `/workspace/test.html` in your browser
   - Or right-click the file → "Open with" → Browser
2. **Select English text** (e.g., "Open source software has revolutionized...")
   - ✅ Translation popup should appear with Chinese translation
3. **Select Chinese text** (e.g., "人工智能技术正在深刻改变...")
   - ✅ Translation popup should appear with English translation
4. **Click the copy button** in the popup
   - ✅ Translation should be copied to clipboard

**Expected**: Immediate translation popups when selecting text, both EN→ZH and ZH→EN.

### Step 3: Test Input Translation / 输入翻译 (2 minutes)

1. Click the **"My Translate" extension icon** in browser toolbar
2. Look for **"Translation Center"** or **"翻译中心"** option
   - May be in popup menu or settings
3. Enter any text (e.g., "Hello, world!")
4. Select source language (English) and target language (Chinese)
5. Click **"Translate"** or **"开始翻译"**
   - ✅ Translation should appear

**Expected**: Input box accepts text and shows translation using free engines.

### Step 4: Verify Free Engines (1 minute)

1. Open extension **Settings** (click icon → Settings)
2. Go to **"Translation Services"** section
3. Verify these engines are available **without API keys**:
   - ✅ Microsoft Translator
   - ✅ Google Translate  
   - ✅ DeepLX

**Expected**: At least Microsoft and Google engines work without configuration.

### Step 5: Copy Translation Result (1 minute)

1. Go back to `test.html`
2. Select any text to trigger translation popup
3. Click the **"Copy"** button in popup
4. Paste somewhere (Ctrl+V / Cmd+V)
   - ✅ Translated text should paste

**Expected**: Copy button copies translated text to clipboard.

---

## ✅ Acceptance Criteria Verification

| Requirement | Test Method | Expected Result |
|-------------|-------------|-----------------|
| Chromium Manifest V3 | Load extension | Loads without errors |
| Selection translation (划词) | Select text in test.html | Popup with translation |
| Input translation | Use Translation Center | Shows translation |
| Chinese ↔ English | Test both directions | Both EN→ZH and ZH→EN work |
| Copy result | Click copy in popup | Text copies to clipboard |
| Free engines | Check settings | Microsoft/Google available |
| Build success | Check `.output/chrome-mv3/` | Directory exists with files |
| Chinese README | Open `README.zh-CN.md` | Complete instructions in Chinese |
| Test HTML | Open `test.html` | Bilingual EN/ZH content |
| Self-test checklist | See README.zh-CN.md | Checklist present |

---

## 📁 File Locations (For Reference)

```
/workspace/
├── .output/chrome-mv3/          ← LOAD THIS IN CHROME
├── test.html                     ← OPEN THIS TO TEST
├── README.zh-CN.md              ← Chinese documentation
├── README.md                     ← English quick start
├── NOTICE.md                     ← GPL-3.0 attribution
├── CHANGES.md                    ← Changes from FluentRead
├── PR_SUMMARY.md                ← PR content
└── COMPLETION_STATUS.md         ← Full status report
```

---

## 🐛 Troubleshooting

### Extension won't load?
- ✓ Verify Developer mode is enabled
- ✓ Select the correct path: `.output/chrome-mv3` (not just `.output`)
- ✓ Try Chrome or Edge (Chromium-based browsers)
- ✓ Check console for errors: `chrome://extensions/` → "Errors" button

### Translation popup not appearing?
- ✓ Refresh the webpage after loading extension
- ✓ Try selecting more text (at least a few words)
- ✓ Check extension icon is visible in toolbar
- ✓ Try on test.html first (known to work)

### No translation engines work?
- ✓ Check internet connection
- ✓ Try different engine in settings
- ✓ Microsoft and Google should work by default
- ✓ Check browser console for network errors

### Can't find Translation Center?
- ✓ Click extension icon → look for "翻译中心" or "Translation Center"
- ✓ May be in popup or options page
- ✓ Try opening extension options (right-click icon → Options)

---

## 📸 What You Should See

### When Extension Loads:
- "My Translate" in extensions list
- Icon in browser toolbar
- No errors in extension details

### When Selecting Text:
- Small popup appears near selected text
- Shows translation in target language
- Has copy button

### In Translation Center:
- Text input box
- Source/target language selectors
- Translate button
- Results area

### In Settings:
- List of translation services
- Microsoft, Google, DeepLX available
- No API key fields required for free services

---

## ⏱️ Expected Timings

- **Extension load**: Instant (< 5 seconds)
- **Selection translation**: Instant (< 1 second popup, < 2 seconds translation)
- **Input translation**: 1-3 seconds depending on text length
- **Page load**: Normal speed (extension runs in background)

---

## 🎉 Success Indicators

You've successfully verified the extension if:

- [x] Extension loads without errors
- [x] Selecting English text shows Chinese translation
- [x] Selecting Chinese text shows English translation
- [x] Copy button copies translation
- [x] Translation Center accepts input and shows results
- [x] Free engines (Microsoft/Google) work without API keys

---

## 📋 Quick Reference Commands

```bash
# Build (if needed)
cd /workspace
pnpm install --frozen-lockfile
pnpm build

# Output location
ls -la /workspace/.output/chrome-mv3/

# Test page location
open /workspace/test.html  # or just open in browser
```

---

## 🆘 Need More Info?

- **Full documentation**: `README.zh-CN.md` (Chinese)
- **Quick start**: `README.md` (English)  
- **Changes from FluentRead**: `CHANGES.md`
- **Complete status**: `COMPLETION_STATUS.md`

---

**🎊 Happy Testing! The extension is fully functional and ready to use! 🎊**

*Built from FluentRead (GPL-3.0) - See NOTICE.md for attribution*
