/**
 * @file desktop/src/preload/index.ts
 * 文件职责：Electron 预加载脚本，为渲染进程提供安全的 IPC 通信接口。
 * 主要内容：暴露翻译、OCR、剪贴板等 API 到渲染进程。
 * 模块边界：运行在隔离上下文中，连接主进程和渲染进程。
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { TranslationRequest, TranslationResult, OCRRequest, OCRResult } from '../shared/types';

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 翻译
  translate: (request: TranslationRequest): Promise<TranslationResult> => {
    return ipcRenderer.invoke('translate', request);
  },

  // OCR 识别
  ocr: (request: OCRRequest): Promise<OCRResult> => {
    return ipcRenderer.invoke('ocr', request);
  },

  // 复制到剪贴板
  copyToClipboard: (text: string): Promise<boolean> => {
    return ipcRenderer.invoke('copy-to-clipboard', text);
  },

  // 关闭窗口
  closeWindow: (): Promise<void> => {
    return ipcRenderer.invoke('close-window');
  },

  // 最小化窗口
  minimizeWindow: (): Promise<void> => {
    return ipcRenderer.invoke('minimize-window');
  },

  // 截图
  captureScreen: (): Promise<string | null> => {
    return ipcRenderer.invoke('capture-screen');
  },

  // 自动切换语言
  autoSwitchLanguages: (text: string): Promise<{ source: string; target: string }> => {
    return ipcRenderer.invoke('auto-switch-languages', text);
  },

  // 接收翻译文本（用于划词翻译窗口）
  onTranslationText: (callback: (text: string) => void) => {
    ipcRenderer.on('translation-text', (_event, text) => callback(text));
  },

  // 移除监听器
  removeTranslationTextListener: () => {
    ipcRenderer.removeAllListeners('translation-text');
  }
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      translate: (request: TranslationRequest) => Promise<TranslationResult>;
      ocr: (request: OCRRequest) => Promise<OCRResult>;
      copyToClipboard: (text: string) => Promise<boolean>;
      closeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      captureScreen: () => Promise<string | null>;
      autoSwitchLanguages: (text: string) => Promise<{ source: string; target: string }>;
      onTranslationText: (callback: (text: string) => void) => void;
      removeTranslationTextListener: () => void;
    };
  }
}
