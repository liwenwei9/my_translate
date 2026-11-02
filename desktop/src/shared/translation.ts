/**
 * @file desktop/src/shared/translation.ts
 * 文件职责：桌面应用翻译服务适配层，复用浏览器扩展的免费翻译引擎。
 * 主要内容：翻译请求封装、语言检测、结果处理；使用 Microsoft、Google Free 等免费服务。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；上层按接口调用，不关心具体 provider 实现。
 */

import type { TranslationRequest, TranslationResult } from './types';

/**
 * Microsoft Translator 免费接口
 * 使用 Edge 网页接口，无需 API key
 */
async function translateWithMicrosoft(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const fromLang = source === 'auto' ? '' : source;
  const toLang = target;
  
  const url = 'https://api-edge.cognitive.microsofttranslator.com/translate';
  const params = new URLSearchParams({
    'api-version': '3.0',
    'from': fromLang,
    'to': toLang
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify([{ Text: text }])
  });

  if (!response.ok) {
    throw new Error(`Microsoft API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!Array.isArray(data) || !data[0]?.translations?.[0]?.text) {
    throw new Error('Invalid Microsoft API response');
  }

  return data[0].translations[0].text;
}

/**
 * Google Translate 免费接口
 * 使用公共 API 端点
 */
async function translateWithGoogle(
  text: string,
  source: string,
  target: string
): Promise<string> {
  // Use the translate_a/t endpoint that the extension uses
  const url = 'https://translate.googleapis.com/translate_a/t';
  const params = new URLSearchParams({
    client: 'te_lib',
    sl: source === 'auto' ? 'auto' : source,
    tl: target,
    q: text
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Google translate_a/t returns array of translations
  if (!Array.isArray(data) || !data[0]) {
    throw new Error('Invalid Google API response');
  }

  return Array.isArray(data[0]) ? data[0].join('') : String(data[0]);
}

/**
 * 简化的翻译函数，使用可靠的免费引擎
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResult> {
  const { text, sourceLanguage = 'auto', targetLanguage = 'zh-Hans' } = request;
  
  if (!text.trim()) {
    return {
      text: text,
      sourceLanguage,
      targetLanguage
    };
  }

  // Try Microsoft first (most reliable for desktop)
  try {
    console.log('[Translation] Using Microsoft Translator...');
    const result = await translateWithMicrosoft(text, sourceLanguage, targetLanguage);
    console.log('[Translation] Microsoft success');
    return {
      text: result,
      sourceLanguage,
      targetLanguage
    };
  } catch (error) {
    console.error('[Translation] Microsoft failed:', error);
    
    // Fallback to Google
    try {
      console.log('[Translation] Falling back to Google Translate...');
      const result = await translateWithGoogle(text, sourceLanguage, targetLanguage);
      console.log('[Translation] Google success');
      return {
        text: result,
        sourceLanguage,
        targetLanguage
      };
    } catch (googleError) {
      console.error('[Translation] Google failed:', googleError);
      throw new Error('所有翻译服务均不可用。请检查网络连接。');
    }
  }
}

/**
 * 检测文本语言
 * 简化版本，基于字符特征判断
 */
export function detectLanguage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'auto';

  // 中文字符
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return 'zh-Hans';
  }

  // 日文字符
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(trimmed)) {
    return 'ja';
  }

  // 韩文字符
  if (/[\uac00-\ud7af]/.test(trimmed)) {
    return 'ko';
  }

  // 俄文字符
  if (/[\u0400-\u04ff]/.test(trimmed)) {
    return 'ru';
  }

  // 默认英文
  return 'en';
}

/**
 * 自动切换源语言和目标语言
 * 中文 -> 英文，其他 -> 中文
 */
export function autoSwitchLanguages(text: string): { source: string; target: string } {
  const detected = detectLanguage(text);
  
  if (detected === 'zh-Hans' || detected === 'zh-Hant') {
    return { source: detected, target: 'en' };
  }
  
  return { source: detected, target: 'zh-Hans' };
}
