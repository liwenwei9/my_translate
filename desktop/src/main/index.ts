/**
 * @file desktop/src/main/index.ts
 * 文件职责：Electron 主进程入口，管理窗口、全局快捷键、系统集成。
 * 主要内容：应用生命周期、窗口创建、IPC 通信、快捷键注册、剪贴板操作、屏幕截图。
 * 模块边界：仅在主进程运行，通过 IPC 与渲染进程通信。
 */

import { app, BrowserWindow, globalShortcut, clipboard, ipcMain, screen, desktopCapturer, nativeImage } from 'electron';
import { join } from 'path';
import { translateText, autoSwitchLanguages } from '../shared/translation';
import { recognizeText, terminateOCRWorker } from '../shared/ocr';
import type { TranslationRequest, OCRRequest, WindowConfig } from '../shared/types';

// 窗口实例
let mainWindow: BrowserWindow | null = null;
let translationWindow: BrowserWindow | null = null;
let ocrWindow: BrowserWindow | null = null;

// 配置
const DEFAULT_SELECTION_HOTKEY = 'CommandOrControl+Shift+T';
const DEFAULT_SCREENSHOT_HOTKEY = 'CommandOrControl+Shift+S';

/**
 * 创建主窗口（独立翻译窗口）
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'My Translate',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });

  // 开发环境加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 创建划词翻译结果窗口
 */
function createTranslationWindow(text: string, mode: 'selection' | 'ocr', x?: number, y?: number) {
  // 如果窗口已存在，关闭旧窗口
  if (translationWindow && !translationWindow.isDestroyed()) {
    translationWindow.close();
  }

  // 计算窗口位置（在鼠标附近）
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  
  const windowWidth = 450;
  const windowHeight = mode === 'ocr' ? 400 : 320;
  const windowX = x ?? cursor.x + 10;
  const windowY = y ?? cursor.y + 10;
  
  // 确保窗口不超出屏幕边界
  const finalX = Math.min(windowX, display.bounds.x + display.bounds.width - windowWidth);
  const finalY = Math.min(windowY, display.bounds.y + display.bounds.height - windowHeight);

  translationWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: finalX,
    y: finalY,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载翻译窗口页面
  if (process.env.NODE_ENV === 'development') {
    translationWindow.loadURL('http://localhost:5173/translation.html');
  } else {
    translationWindow.loadFile(join(__dirname, '../renderer/translation.html'));
  }

  // 窗口加载完成后发送文本
  translationWindow.webContents.once('did-finish-load', () => {
    translationWindow?.webContents.send('translation-text', { text, mode });
  });

  translationWindow.on('closed', () => {
    translationWindow = null;
  });

  // 失去焦点时自动关闭（可选）
  if (mode === 'selection') {
    translationWindow.on('blur', () => {
      // 延迟关闭，避免点击复制按钮时立即关闭
      setTimeout(() => {
        if (translationWindow && !translationWindow.isDestroyed() && !translationWindow.isFocused()) {
          translationWindow.close();
        }
      }, 200);
    });
  }
}

/**
 * 创建 OCR 截图窗口
 */
async function createOCRWindow() {
  if (ocrWindow && !ocrWindow.isDestroyed()) {
    ocrWindow.focus();
    return;
  }

  try {
    // 获取屏幕截图
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: screen.getPrimaryDisplay().size
    });

    if (sources.length === 0) {
      console.error('No screen source available');
      return;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    ocrWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      fullscreen: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    if (process.env.NODE_ENV === 'development') {
      ocrWindow.loadURL('http://localhost:5173/ocr.html');
    } else {
      ocrWindow.loadFile(join(__dirname, '../renderer/ocr.html'));
    }

    // 发送屏幕截图到渲染进程
    ocrWindow.webContents.once('did-finish-load', () => {
      const screenshot = sources[0].thumbnail.toDataURL();
      ocrWindow?.webContents.send('screen-captured', screenshot);
    });

    ocrWindow.on('closed', () => {
      ocrWindow = null;
    });
  } catch (error) {
    console.error('Failed to create OCR window:', error);
  }
}

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
  // 划词翻译快捷键
  const selectionResult = globalShortcut.register(DEFAULT_SELECTION_HOTKEY, async () => {
    try {
      // 等待一小段时间确保剪贴板更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const text = clipboard.readText();
      
      if (text && text.trim()) {
        console.log(`[Selection] Translating: ${text.substring(0, 50)}...`);
        createTranslationWindow(text, 'selection');
      } else {
        console.log('[Selection] No text in clipboard');
      }
    } catch (error) {
      console.error('[Selection] Translation failed:', error);
    }
  });

  // 截图 OCR 快捷键
  const screenshotResult = globalShortcut.register(DEFAULT_SCREENSHOT_HOTKEY, async () => {
    try {
      console.log('[OCR] Starting screenshot mode...');
      await createOCRWindow();
    } catch (error) {
      console.error('[OCR] Failed to start screenshot mode:', error);
    }
  });

  if (selectionResult && screenshotResult) {
    console.log('✓ Global shortcuts registered:');
    console.log(`  Selection translation: ${DEFAULT_SELECTION_HOTKEY}`);
    console.log(`  Screenshot OCR: ${DEFAULT_SCREENSHOT_HOTKEY}`);
  } else {
    console.error('✗ Failed to register some shortcuts');
    if (!selectionResult) console.error(`  Failed: ${DEFAULT_SELECTION_HOTKEY}`);
    if (!screenshotResult) console.error(`  Failed: ${DEFAULT_SCREENSHOT_HOTKEY}`);
  }
}

/**
 * 注销全局快捷键
 */
function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
  console.log('Global shortcuts unregistered');
}

/**
 * 应用启动
 */
app.whenReady().then(() => {
  createMainWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * 所有窗口关闭时退出应用 (macOS 除外)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 应用退出前清理
 */
app.on('will-quit', async () => {
  unregisterGlobalShortcuts();
  await terminateOCRWorker();
});

/**
 * IPC 通信处理
 */

// 翻译请求
ipcMain.handle('translate', async (_event, request: TranslationRequest) => {
  try {
    console.log(`[Translate] ${request.sourceLanguage || 'auto'} -> ${request.targetLanguage || 'zh-Hans'}`);
    return await translateText(request);
  } catch (error) {
    console.error('[Translate] Error:', error);
    throw error;
  }
});

// OCR 识别请求
ipcMain.handle('ocr', async (_event, request: OCRRequest) => {
  try {
    console.log('[OCR] Processing image...');
    const result = await recognizeText(request);
    console.log(`[OCR] Success. Confidence: ${result.confidence}%`);
    return result;
  } catch (error) {
    console.error('[OCR] Error:', error);
    throw error;
  }
});

// 处理 OCR 区域选择完成
ipcMain.handle('ocr-region-selected', async (_event, { imageData, region }) => {
  try {
    console.log(`[OCR] Region selected: ${region.width}x${region.height}`);
    
    // 执行 OCR 识别
    const ocrResult = await recognizeText({ imageData });
    
    if (!ocrResult.text || !ocrResult.text.trim()) {
      throw new Error('未识别到文字');
    }

    console.log(`[OCR] Recognized text: ${ocrResult.text.substring(0, 100)}...`);
    
    // 显示翻译结果窗口
    createTranslationWindow(ocrResult.text, 'ocr');
    
    return ocrResult;
  } catch (error) {
    console.error('[OCR] Region processing failed:', error);
    throw error;
  }
});

// 复制到剪贴板
ipcMain.handle('copy-to-clipboard', (_event, text: string) => {
  try {
    clipboard.writeText(text);
    console.log('[Clipboard] Text copied');
    return true;
  } catch (error) {
    console.error('[Clipboard] Copy failed:', error);
    return false;
  }
});

// 关闭窗口
ipcMain.handle('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

// 最小化窗口
ipcMain.handle('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

// 自动切换语言
ipcMain.handle('auto-switch-languages', (_event, text: string) => {
  return autoSwitchLanguages(text);
});
