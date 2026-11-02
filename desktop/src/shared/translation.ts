/**
 * @file desktop/src/shared/translation.ts
 * 文件职责：桌面应用翻译服务适配层，复用浏览器扩展的免费翻译引擎和离线词典。
 * 主要内容：翻译请求封装、语言检测、在线翻译（Microsoft Edge、Google）、离线词典查询。
 * 模块边界：不依赖浏览器 API，纯 Node.js 环境下可执行；离线词典使用 CC-CEDICT (CC-BY-SA 4.0)。
 */

import type { TranslationRequest, TranslationResult } from './types';
import offlineDict from './offline-dict.json';

/**
 * 离线词典缓存
 */
const dictCache = {
  zh2en: new Map<string, any>(),
  en2zh: new Map<string, any[]>(),
  phrases: new Map<string, any[]>(),
  loaded: false
};

/**
 * 加载离线词典到内存
 */
function loadOfflineDict() {
  if (dictCache.loaded) {
    return;
  }
  
  console.log('[Dict] Loading offline dictionary...');
  
  // Load Chinese to English
  for (const [key, value] of Object.entries(offlineDict.zh2en)) {
    dictCache.zh2en.set(key, value);
  }
  
  // Load English to Chinese
  for (const [key, value] of Object.entries(offlineDict.en2zh)) {
    dictCache.en2zh.set(key, value as any[]);
  }
  
  // Load multi-word phrases
  if (offlineDict.phrases) {
    for (const [key, value] of Object.entries(offlineDict.phrases)) {
      dictCache.phrases.set(key.toLowerCase(), value as any[]);
    }
  }
  
  dictCache.loaded = true;
  console.log(`[Dict] Loaded ${dictCache.zh2en.size} Chinese entries, ${dictCache.en2zh.size} English words, ${dictCache.phrases.size} phrases`);
}

/**
 * 检测文本是否为单个词或常见短语（适合词典查询）
 */
function isSingleWord(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  
  // Check multi-word phrases first
  const commonPhrases = [
    'thank you', 'good morning', 'good afternoon', 'good evening', 'good night',
    'excuse me', "you're welcome", 'you are welcome', 'how are you',
    'see you', 'good bye', 'goodbye'
  ];
  
  if (commonPhrases.includes(trimmed)) {
    return true;
  }
  
  // English: single word (no spaces, only letters/hyphens)
  if (/^[a-zA-Z][-a-zA-Z]*$/.test(trimmed)) {
    return true;
  }
  
  // Chinese: 1-4 characters (most dictionary headwords)
  if (/^[\u4e00-\u9fa5]{1,4}$/.test(trimmed)) {
    return true;
  }
  
  return false;
}

/**
 * 离线词典查询
 */
function offlineLookup(text: string, targetLang: string): string | null {
  loadOfflineDict();
  
  const trimmed = text.trim();
  const lowerText = trimmed.toLowerCase();
  
  // Check multi-word phrases first
  if (dictCache.phrases.has(lowerText)) {
    const entries = dictCache.phrases.get(lowerText);
    if (entries && entries.length > 0) {
      const result: string[] = [];
      result.push(`${trimmed}:`);
      result.push('');
      
      entries.forEach((entry: any, idx: number) => {
        if (entry.t === entry.s) {
          result.push(`${idx + 1}. ${entry.s} [${entry.p}]`);
        } else {
          result.push(`${idx + 1}. ${entry.t} (${entry.s}) [${entry.p}]`);
        }
        if (entry.d && entry.d.length > 0) {
          result.push(`   ${entry.d[0]}`);
        }
        if (entries.length > 1) {
          result.push('');
        }
      });
      
      console.log('[Dict] Found multi-word phrase:', lowerText);
      return result.join('\n').trim();
    }
  }
  
  // Try Chinese lookup
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    const entry = dictCache.zh2en.get(trimmed);
    if (entry) {
      const result: string[] = [];
      
      // Format: traditional (simplified) [pinyin]
      if (entry.t === entry.s) {
        result.push(`${entry.t} [${entry.p}]`);
      } else {
        result.push(`${entry.t} (${entry.s}) [${entry.p}]`);
      }
      
      // Definitions
      result.push('');
      entry.d.forEach((def: string, idx: number) => {
        result.push(`${idx + 1}. ${def}`);
      });
      
      console.log('[Dict] Found Chinese entry:', trimmed);
      return result.join('\n');
    }
  }
  
  // Try English lookup
  if (/^[a-zA-Z]/.test(trimmed)) {
    const entries = dictCache.en2zh.get(lowerText);
    if (entries && entries.length > 0) {
      const result: string[] = [];
      result.push(`${trimmed}:`);
      result.push('');
      
      // Show top 3 matches
      entries.slice(0, 3).forEach((entry: any, idx: number) => {
        if (entry.t === entry.s) {
          result.push(`${idx + 1}. ${entry.s} [${entry.p}]`);
        } else {
          result.push(`${idx + 1}. ${entry.t} (${entry.s}) [${entry.p}]`);
        }
        // Show first definition
        if (entry.d && entry.d.length > 0) {
          result.push(`   ${entry.d[0]}`);
        }
        result.push('');
      });
      
      console.log('[Dict] Found English entry:', lowerText);
      return result.join('\n').trim();
    }
  }
  
  return null;
}


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
 * 简化的翻译函数，优先使用离线词典（单词），否则使用在线翻译
 * 在线翻译优先使用 Microsoft Edge，失败时降级到 Google
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

  // Try offline dictionary first for single words
  if (isSingleWord(text)) {
    console.log('[Translation] Trying offline dictionary for single word...');
    const offlineResult = offlineLookup(text, targetLanguage);
    if (offlineResult) {
      console.log('[Translation] Offline dictionary hit');
      return {
        text: offlineResult,
        sourceLanguage: sourceLanguage === 'auto' ? detectLanguage(text) : sourceLanguage,
        targetLanguage,
        source: '离线词库'
      };
    }
    console.log('[Translation] No offline match, falling back to online...');
  }

  // Try Microsoft Edge first (most reliable)
  try {
    console.log('[Translation] Using Microsoft Edge Translator...');
    const result = await translateWithMicrosoft(text, sourceLanguage, targetLanguage);
    console.log('[Translation] Microsoft success');
    return {
      text: result,
      sourceLanguage,
      targetLanguage,
      source: 'Microsoft Edge'
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
        targetLanguage,
        source: 'Google Translate'
      };
    } catch (googleError) {
      console.error('[Translation] Google failed:', googleError);
      
      // Last resort: try offline dictionary even for non-single-word text
      console.log('[Translation] All online services failed, trying offline as last resort...');
      const offlineResult = offlineLookup(text, targetLanguage);
      if (offlineResult) {
        console.log('[Translation] Offline fallback successful');
        return {
          text: offlineResult + '\n\n(离线模式)',
          sourceLanguage: sourceLanguage === 'auto' ? detectLanguage(text) : sourceLanguage,
          targetLanguage,
          source: '离线词库'
        };
      }
      
      // If it's not a single word and offline failed, show user-friendly message
      if (!isSingleWord(text)) {
        throw new Error('整句翻译需要联网。当前离线词典仅支持单词查询。\n\n请检查网络连接后重试。');
      }
      
      throw new Error('翻译失败：无法连接在线翻译服务，且离线词典未找到该词条。\n\n请检查网络连接或尝试其他词汇。');
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
