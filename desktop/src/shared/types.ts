/**
 * @file desktop/src/shared/types.ts
 * 文件职责：桌面应用共享类型定义，主进程和渲染进程都可使用。
 * 主要内容：翻译请求、OCR 请求、窗口配置等类型定义。
 * 模块边界：纯类型定义，无运行时逻辑。
 */

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationResult {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface OCRRequest {
  imageData: string; // base64 encoded image
}

export interface OCRResult {
  text: string;
}

export interface WindowConfig {
  width: number;
  height: number;
  x?: number;
  y?: number;
  show?: boolean;
}

export type TranslationMode = 'selection' | 'ocr' | 'standalone';

export interface AppConfig {
  selectionHotkey: string;
  screenshotHotkey: string;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
}
