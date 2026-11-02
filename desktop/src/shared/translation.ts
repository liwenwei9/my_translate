/**
 * @file desktop/src/shared/translation.ts
 * 文件职责：桌面应用翻译服务适配层，复用浏览器扩展的免费翻译引擎。
 * 主要内容：翻译请求封装、语言检测、结果处理；使用 Microsoft Edge、Google Free 等免费服务。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；严格按扩展实现的协议端点。
 */

import type { TranslationRequest, TranslationResult } from './types';

/**
 * HTML 转义（Microsoft 需要）
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTML 解码（Microsoft 响应）
 */
function decodeHtml(text: string): string {
  return text
    .replace(/&#(?:0*39);|&#x0*27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&');
}

/**
 * 规范化中文语言代码
 */
function normalizeLanguageCode(code: string): string {
  const normalized: Record<string, string> = {
    'zh-Hans': 'zh-Hans',
    'zh-Hant': 'zh-Hant',
    'zh-CN': 'zh-Hans',
    'zh-TW': 'zh-Hant',
  };
  return normalized[code] || code;
}

/**
 * Microsoft Edge Translator 免费接口
 * 端点: https://edge.microsoft.com/translate/translatetext
 * 协议: 从 src/providers/translation/microsoftTransport.ts 移植
 */
async function translateWithMicrosoft(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const fromLang = normalizeLanguageCode(source);
  const toLang = normalizeLanguageCode(target);
  
  const url = new URL('https://edge.microsoft.com/translate/translatetext');
  url.searchParams.set('from', fromLang === 'auto' ? '' : fromLang);
  url.searchParams.set('to', toLang);
  url.searchParams.set('isEnterpriseClient', 'false');

  // HTML-escape the text before sending
  const escapedText = escapeHtml(text);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify([escapedText])
  });

  if (!response.ok) {
    throw new Error(`Microsoft API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Response format: [{translations: [{text: "..."}]}]
  if (!Array.isArray(data) || !data[0]?.translations?.[0]?.text) {
    throw new Error('Invalid Microsoft API response');
  }

  // HTML-decode the response
  const translatedText = data[0].translations[0].text;
  return decodeHtml(translatedText);
}

/**
 * Google Translate 免费接口
 * 端点: https://translate.googleapis.com/translate_a/t
 * 协议: 从 src/providers/translation/google.ts 移植 (translateGoogleList)
 */
async function translateWithGoogle(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const fromLang = normalizeLanguageCode(source);
  const toLang = normalizeLanguageCode(target);
  
  // Map language codes for Google
  const googleLang = (code: string) => {
    const aliases: Record<string, string> = {
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW',
      'nb': 'no',
      'fil': 'tl'
    };
    return aliases[code] || code;
  };

  const url = new URL('https://translate.googleapis.com/translate_a/t');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', fromLang === 'auto' ? 'auto' : googleLang(fromLang));
  url.searchParams.set('tl', googleLang(toLang));
  url.searchParams.set('dt', 't');

  // Use URLSearchParams for proper form encoding
  const body = new URLSearchParams();
  body.append('q', text);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Response format: [[translation]]
  if (!Array.isArray(data) || !Array.isArray(data[0]) || !data[0][0]) {
    throw new Error('Invalid Google API response');
  }

  return data[0][0];
}

/**
 * 简化的翻译函数，使用可靠的免费引擎
 * 优先使用 Microsoft Edge，失败时降级到 Google
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

  // Try Microsoft Edge first (most reliable)
  try {
    console.log('[Translation] Using Microsoft Edge Translator...');
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
