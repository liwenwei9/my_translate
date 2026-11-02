/**
 * @file desktop/src/shared/translation.ts
 * 文件职责：桌面应用翻译服务适配层，复用浏览器扩展的免费翻译引擎。
 * 主要内容：翻译请求封装、语言检测、结果处理；使用 Bilibili Free、Google、Microsoft 等免费服务。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；上层按接口调用，不关心具体 provider 实现。
 */

import type { TranslationRequest, TranslationResult } from './types';

/**
 * 简化的翻译函数，复用扩展的免费翻译逻辑
 * 桌面版使用 Node.js fetch，不依赖浏览器运行时
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

  try {
    // 尝试使用 Bilibili Free API (最稳定的免费服务之一)
    const result = await translateWithBilibili(text, sourceLanguage, targetLanguage);
    return {
      text: result,
      sourceLanguage,
      targetLanguage
    };
  } catch (error) {
    console.error('Bilibili translation failed:', error);
    
    // 降级到 Google Free API
    try {
      const result = await translateWithGoogleFree(text, sourceLanguage, targetLanguage);
      return {
        text: result,
        sourceLanguage,
        targetLanguage
      };
    } catch (googleError) {
      console.error('Google translation failed:', googleError);
      throw new Error('所有翻译服务均不可用');
    }
  }
}

/**
 * Bilibili Free Translation API
 * 复用扩展中的实现逻辑
 */
async function translateWithBilibili(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const BILIBILI_API = 'https://api.bilibili.com/x/v2/dm/translate';
  
  const sourceName = source === 'auto' ? '' : getLanguageName(source);
  const targetName = getLanguageName(target);
  
  const response = await fetch('https://api.bilibili.tv/intl/gateway/web/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      text,
      source: source === 'auto' ? '' : source,
      target
    })
  });

  if (!response.ok) {
    throw new Error(`Bilibili API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.code !== 0 || !data.data?.translated) {
    throw new Error('Bilibili translation failed');
  }

  return data.data.translated;
}

/**
 * Google Free Translation API  
 * 使用公共端点，无需 API key
 */
async function translateWithGoogleFree(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', source === 'auto' ? 'auto' : source);
  url.searchParams.set('tl', target);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Invalid Google API response');
  }

  // Google API 返回格式: [[[translated, original, null, null, position]]]
  const translations = data[0]
    .filter((item: any) => Array.isArray(item) && item[0])
    .map((item: any) => item[0]);

  return translations.join('');
}

/**
 * 获取语言显示名称
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'ru': 'Русский'
  };
  return names[code] || code;
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
