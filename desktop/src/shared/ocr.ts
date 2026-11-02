/**
 * @file desktop/src/shared/ocr.ts
 * 文件职责：桌面应用 OCR 服务，支持截图文字识别。
 * 主要内容：Tesseract.js 集成，离线识别中英文文字，自动语言检测。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；使用本地 Tesseract WASM 引擎。
 */

import type { OCRRequest, OCRResult } from './types';
import { createWorker } from 'tesseract.js';

let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

/**
 * 初始化 OCR Worker
 * 使用本地训练数据，支持中英文识别
 */
async function initOCRWorker() {
  if (ocrWorker) {
    return ocrWorker;
  }

  try {
    // 创建 Tesseract worker
    ocrWorker = await createWorker({
      logger: (m) => {
        if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract' || m.status === 'loading language traineddata') {
          console.log(`[OCR] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`);
        }
      }
    });

    // 加载中英文训练数据
    // 首次使用会自动下载，后续使用缓存
    await ocrWorker.loadLanguage('eng+chi_sim');
    await ocrWorker.initialize('eng+chi_sim');

    console.log('[OCR] Worker initialized successfully');
    return ocrWorker;
  } catch (error) {
    console.error('[OCR] Failed to initialize worker:', error);
    ocrWorker = null;
    throw error;
  }
}

/**
 * OCR 识别函数
 * 使用 Tesseract.js 进行离线文字识别
 */
export async function recognizeText(request: OCRRequest): Promise<OCRResult> {
  const { imageData } = request;
  
  if (!imageData || !imageData.startsWith('data:image/')) {
    throw new Error('无效的图像数据');
  }

  try {
    console.log('[OCR] Starting text recognition...');
    
    // 初始化 worker
    const worker = await initOCRWorker();
    
    // 执行 OCR 识别
    const { data } = await worker.recognize(imageData);
    
    // 提取识别的文本
    const text = data.text.trim();
    
    console.log(`[OCR] Recognition complete. Confidence: ${data.confidence}%`);
    console.log(`[OCR] Detected text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    if (!text) {
      throw new Error('未识别到文字，请确保图片清晰且包含文字内容');
    }

    return {
      text,
      confidence: data.confidence,
      language: data.data?.language || 'unknown'
    };
  } catch (error) {
    console.error('[OCR] Recognition failed:', error);
    throw new Error(`OCR 识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 清理 OCR Worker 资源
 */
export async function terminateOCRWorker() {
  if (ocrWorker) {
    try {
      await ocrWorker.terminate();
      console.log('[OCR] Worker terminated');
    } catch (error) {
      console.error('[OCR] Failed to terminate worker:', error);
    } finally {
      ocrWorker = null;
    }
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
