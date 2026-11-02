/**
 * @file desktop/src/main/index.ts
 * 文件职责：Electron 主进程入口，管理窗口、全局快捷键、系统集成。
 * 主要内容：应用生命周期、窗口创建、IPC 通信、快捷键注册、剪贴板操作。
 * 模块边界：仅在主进程运行，通过 IPC 与渲染进程通信。
 */

import { app, BrowserWindow, globalShortcut, clipboard, ipcMain, screen, Menu, Tray } from 'electron';
import { join } from 'path';
import { translateText, autoSwitchLanguages } from '../shared/translation';
import { recognizeText } from '../shared/ocr';
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
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png')
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
function createTranslationWindow(text: string, x?: number, y?: number) {
  // 如果窗口已存在，关闭旧窗口
  if (translationWindow && !translationWindow.isDestroyed()) {
    translationWindow.close();
  }

  // 计算窗口位置（在鼠标附近）
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  
  const windowX = x ?? cursor.x + 10;
  const windowY = y ?? cursor.y + 10;
  
  // 确保窗口不超出屏幕边界
  const finalX = Math.min(windowX, display.bounds.x + display.bounds.width - 400);
  const finalY = Math.min(windowY, display.bounds.y + display.bounds.height - 300);

  translationWindow = new BrowserWindow({
    width: 400,
    height: 300,
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
    translationWindow?.webContents.send('translation-text', text);
  });

  translationWindow.on('closed', () => {
    translationWindow = null;
  });

  // 失去焦点时自动关闭
  translationWindow.on('blur', () => {
    if (translationWindow && !translationWindow.isDestroyed()) {
      translationWindow.close();
    }
  });
}

/**
 * 创建 OCR 截图窗口
 */
function createOCRWindow() {
  if (ocrWindow && !ocrWindow.isDestroyed()) {
    ocrWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  ocrWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
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

  ocrWindow.on('closed', () => {
    ocrWindow = null;
  });
}

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
  // 划词翻译快捷键
  globalShortcut.register(DEFAULT_SELECTION_HOTKEY, async () => {
    try {
      // 模拟 Ctrl+C 复制选中文本
      // Windows 上使用 robotjs 或 node-key-sender
      // 简化版本：直接读取剪贴板
      
      // 先清空剪贴板
      const previousClipboard = clipboard.readText();
      clipboard.writeText('');
      
      // 等待一小段时间让用户的选择生效
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟 Ctrl+C (这里需要额外的库，MVP 阶段提示用户手动复制)
      // 实际应用中需要使用 robotjs 或类似库
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const text = clipboard.readText();
      
      if (text && text.trim() && text !== previousClipboard) {
        createTranslationWindow(text);
      } else {
        // 恢复原剪贴板内容
        clipboard.writeText(previousClipboard);
        
        // 如果没有新文本，提示用户
        console.log('未检测到选中文本，请先选中文本后按快捷键');
      }
    } catch (error) {
      console.error('Selection translation failed:', error);
    }
  });

  // 截图 OCR 快捷键
  globalShortcut.register(DEFAULT_SCREENSHOT_HOTKEY, () => {
    createOCRWindow();
  });

  console.log('Global shortcuts registered:');
  console.log(`  Selection translation: ${DEFAULT_SELECTION_HOTKEY}`);
  console.log(`  Screenshot OCR: ${DEFAULT_SCREENSHOT_HOTKEY}`);
}

/**
 * 注销全局快捷键
 */
function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
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
app.on('will-quit', () => {
  unregisterGlobalShortcuts();
});

/**
 * IPC 通信处理
 */

// 翻译请求
ipcMain.handle('translate', async (_event, request: TranslationRequest) => {
  try {
    return await translateText(request);
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
});

// OCR 识别请求
ipcMain.handle('ocr', async (_event, request: OCRRequest) => {
  try {
    return await recognizeText(request);
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
});

// 复制到剪贴板
ipcMain.handle('copy-to-clipboard', (_event, text: string) => {
  clipboard.writeText(text);
  return true;
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

// 获取屏幕截图
ipcMain.handle('capture-screen', async () => {
  // TODO: 实现屏幕截图功能
  // 可以使用 desktopCapturer API
  return null;
});

// 自动切换语言
ipcMain.handle('auto-switch-languages', (_event, text: string) => {
  return autoSwitchLanguages(text);
});
