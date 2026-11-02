/**
 * @file desktop/src/shared/ocr.ts
 * 文件职责：桌面应用 OCR 服务，支持截图文字识别。
 * 主要内容：Tesseract.js 集成，离线识别中英文文字，配置 Electron 环境下的 worker 路径。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；使用本地 Tesseract WASM 引擎。
 */

import type { OCRRequest, OCRResult } from './types';
import { createWorker } from 'tesseract.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
let initializationPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

/**
 * Get the path to tesseract.js node_modules
 * Works in both development and production Electron
 */
function getTesseractPaths() {
  try {
    // In Electron, __dirname is available
    // Find tesseract.js in node_modules
    // require.resolve('tesseract.js') gives us /path/to/node_modules/tesseract.js/src/index.js
    const tesseractPath = require.resolve('tesseract.js');
    
    // Go up from /node_modules/tesseract.js/src/index.js to /node_modules/tesseract.js
    const tesseractDir = dirname(dirname(tesseractPath));
    
    // Worker script path for Node.js environment
    const workerPath = join(tesseractDir, 'src', 'worker-script', 'node', 'index.js');
    
    console.log('[OCR] Tesseract paths:');
    console.log(`  Base: ${tesseractDir}`);
    console.log(`  Worker: ${workerPath}`);
    
    return {
      workerPath,
      // Let Tesseract.js use default CDN for core and lang files
      // They will be cached after first download
    };
  } catch (error) {
    console.error('[OCR] Failed to resolve tesseract paths:', error);
    // Return undefined to use defaults
    return {};
  }
}

/**
 * 初始化 OCR Worker
 * 使用本地训练数据，支持中英文识别
 * 配置 Electron 环境的正确 worker 和语言包路径
 */
async function initOCRWorker() {
  if (ocrWorker) {
    return ocrWorker;
  }

  // 如果正在初始化，等待已有的初始化完成
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[OCR] Initializing Tesseract worker...');
      
      const paths = getTesseractPaths();
      
      // 创建 Tesseract worker with explicit paths for Electron
      const workerOptions: any = {
        logger: (m: any) => {
          if (m.status === 'loading tesseract core' || 
              m.status === 'initializing tesseract' || 
              m.status === 'loading language traineddata') {
            console.log(`[OCR] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`);
          }
          if (m.status === 'initialized api') {
            console.log('[OCR] Tesseract API initialized');
          }
        },
        errorHandler: (err: any) => {
          console.error('[OCR] Tesseract error:', err);
        }
      };
      
      // Add explicit workerPath for Electron Node.js environment
      if (paths.workerPath) {
        workerOptions.workerPath = paths.workerPath;
      }
      
      console.log('[OCR] Creating worker with options:', workerOptions);
      
      const worker = await createWorker(['eng', 'chi_sim'], 1, workerOptions);

      console.log('[OCR] Worker initialized successfully');
      ocrWorker = worker;
      return worker;
    } catch (error) {
      console.error('[OCR] Failed to initialize worker:', error);
      initializationPromise = null;
      ocrWorker = null;
      throw error;
    }
  })();

  return initializationPromise;
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
    
    // 初始化 worker（如果尚未初始化）
    const worker = await initOCRWorker();
    
    console.log('[OCR] Worker ready, recognizing image...');
    
    // 执行 OCR 识别，设置超时
    const recognitionPromise = worker.recognize(imageData);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OCR 识别超时（60秒）')), 60000);
    });
    
    const { data } = await Promise.race([recognitionPromise, timeoutPromise]);
    
    // 提取识别的文本
    const text = data.text.trim();
    
    console.log(`[OCR] Recognition complete. Confidence: ${data.confidence}%`);
    console.log(`[OCR] Detected text (${text.length} chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
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
    
    // If initialization failed, reset so we can try again
    if (error instanceof Error && (
      error.message.includes('Failed to initialize') ||
      error.message.includes('timeout') ||
      error.message.includes('loading') ||
      error.message.includes('Cannot find module')
    )) {
      ocrWorker = null;
      initializationPromise = null;
    }
    
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
      initializationPromise = null;
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
