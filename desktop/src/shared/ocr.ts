/**
 * @file desktop/src/shared/ocr.ts
 * 文件职责：桌面应用 OCR 服务，支持截图文字识别。
 * 主要内容：Tesseract.js 集成，图像预处理，文字识别；考虑后续集成 PaddleOCR。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行。
 */

import type { OCRRequest, OCRResult } from './types';

/**
 * OCR 识别函数
 * MVP 版本使用简化实现，实际应集成 Tesseract.js 或 PaddleOCR
 */
export async function recognizeText(request: OCRRequest): Promise<OCRResult> {
  const { imageData } = request;
  
  try {
    // TODO: 集成真实 OCR 引擎
    // 由于 Tesseract.js 和 PaddleOCR 都需要较大的模型文件
    // MVP 阶段先返回提示信息，待后续集成
    
    // 模拟 OCR 处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回提示信息
    return {
      text: '[OCR 功能正在开发中]\n\n当前 MVP 版本暂未集成完整的 OCR 引擎。\n完整版本将支持:\n- Tesseract.js (开源)\n- PaddleOCR (高精度中英文)\n\n请先使用划词翻译或独立翻译窗口功能。'
    };
  } catch (error) {
    console.error('OCR recognition failed:', error);
    throw new Error('OCR 识别失败');
  }
}

/**
 * 预处理图像以提高 OCR 准确率
 * 包括灰度化、二值化、降噪等
 */
function preprocessImage(imageData: string): string {
  // TODO: 图像预处理逻辑
  return imageData;
}

/**
 * 后处理识别结果
 * 包括去除多余空格、修正常见错误等
 */
function postprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * 检测图像中的语言
 * 用于优化 OCR 识别
 */
export function detectImageLanguage(imageData: string): string[] {
  // TODO: 基于图像内容检测语言
  // 默认返回中英文
  return ['chi_sim', 'eng'];
}
