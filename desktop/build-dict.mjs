#!/usr/bin/env node
/**
 * @file desktop/build-dict.mjs
 * 文件职责：从 CC-CEDICT 构建精简的离线词典，仅保留常用词汇。
 * 主要内容：解析 CEDICT 格式，过滤常用单词，输出 JSON 格式供 Electron 应用使用。
 * 模块边界：构建时工具，不在运行时使用。
 */

import { readFileSync, writeFileSync } from 'fs';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

console.log('Building offline dictionary from CC-CEDICT...');

const dict = {
  // Chinese to English
  zh2en: {},
  // English to Chinese (for common English words found in definitions)
  en2zh: {},
  meta: {
    source: 'CC-CEDICT',
    license: 'CC-BY-SA-4.0',
    url: 'https://cc-cedict.org',
    version: '2026-10-31',
    entries: 0
  }
};

// Common English words we want reverse lookup for (basic vocabulary)
const commonEnglishWords = new Set([
  'hello', 'hi', 'thank', 'thanks', 'please', 'sorry', 'yes', 'no',
  'good', 'bad', 'nice', 'great', 'ok', 'okay', 'bye', 'goodbye',
  'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year',
  'today', 'tomorrow', 'yesterday', 'now', 'time', 'hour', 'minute',
  'love', 'like', 'want', 'need', 'have', 'do', 'go', 'come', 'make', 'get',
  'know', 'think', 'see', 'look', 'use', 'find', 'give', 'tell', 'ask',
  'work', 'play', 'eat', 'drink', 'sleep', 'walk', 'run', 'sit', 'stand',
  'read', 'write', 'speak', 'listen', 'talk', 'say', 'call', 'help',
  'man', 'woman', 'people', 'person', 'child', 'friend', 'family',
  'house', 'home', 'room', 'door', 'window', 'table', 'chair', 'bed',
  'water', 'food', 'rice', 'bread', 'meat', 'fish', 'egg', 'milk',
  'tea', 'coffee', 'hot', 'cold', 'warm', 'cool',
  'big', 'small', 'long', 'short', 'high', 'low', 'new', 'old',
  'good', 'bad', 'happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'hundred', 'thousand', 'million', 'first', 'second', 'last',
  'red', 'blue', 'green', 'yellow', 'black', 'white',
  'book', 'pen', 'paper', 'phone', 'computer', 'car', 'bus', 'train',
  'school', 'hospital', 'bank', 'store', 'restaurant', 'hotel',
  'country', 'city', 'street', 'road', 'river', 'mountain', 'sea',
  'english', 'chinese', 'language', 'word', 'name', 'number'
]);

/**
 * Parse a CEDICT line
 * Format: Traditional Simplified [pinyin] /definition1/definition2/
 */
function parseCedictLine(line) {
  if (line.startsWith('#') || !line.trim()) {
    return null;
  }

  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
  if (!match) {
    return null;
  }

  const [, traditional, simplified, pinyin, definitions] = match;
  const defs = definitions.split('/').filter(d => d.trim());

  return {
    traditional,
    simplified,
    pinyin,
    definitions: defs
  };
}

/**
 * Check if entry should be included (keep it compact)
 */
function shouldIncludeEntry(entry) {
  // Only include single characters (most common)
  if (entry.simplified.length === 1) {
    return true;
  }
  
  // Include common 2-character words
  if (entry.simplified.length === 2) {
    // Check if it has common English words in definitions
    const defText = entry.definitions.join(' ').toLowerCase();
    for (const word of commonEnglishWords) {
      if (defText.includes(` ${word} `) || defText.startsWith(`${word} `)) {
        return true;
      }
    }
    return false;
  }
  
  // For 3-4 character words, be very selective
  if (entry.simplified.length <= 4) {
    const defText = entry.definitions.join(' ').toLowerCase();
    // Only if it's a very common word
    const veryCommon = ['hello', 'thank', 'please', 'sorry', 'goodbye', 'morning', 'afternoon', 'evening'];
    for (const word of veryCommon) {
      if (defText.includes(word)) {
        return true;
      }
    }
    return false;
  }
  
  return false;
}

/**
 * Extract English words from definitions for reverse lookup
 */
function extractEnglishWords(entry) {
  const words = new Set();
  
  for (const def of entry.definitions) {
    // Extract individual words (lowercase, alphabetic only)
    const matches = def.toLowerCase().match(/\b[a-z]+\b/g);
    if (matches) {
      for (const word of matches) {
        if (commonEnglishWords.has(word) && word.length > 2) {
          words.add(word);
        }
      }
    }
  }
  
  return Array.from(words);
}

// Parse CEDICT
const rl = createInterface({
  input: createReadStream('/tmp/cedict.txt.gz').pipe(createGunzip()),
  crlfDelay: Infinity
});

let count = 0;
let included = 0;

rl.on('line', (line) => {
  count++;
  
  const entry = parseCedictLine(line);
  if (!entry) {
    return;
  }
  
  // Include entry if it meets our criteria
  if (!shouldIncludeEntry(entry)) {
    return;
  }
  
  included++;
  
  // Add to Chinese -> English dictionary
  const zhEntry = {
    t: entry.traditional,
    s: entry.simplified,
    p: entry.pinyin,
    d: entry.definitions
  };
  
  // Index by both traditional and simplified
  dict.zh2en[entry.traditional] = zhEntry;
  if (entry.traditional !== entry.simplified) {
    dict.zh2en[entry.simplified] = zhEntry;
  }
  
  // Add English -> Chinese reverse lookup for common words
  const englishWords = extractEnglishWords(entry);
  for (const word of englishWords) {
    if (!dict.en2zh[word]) {
      dict.en2zh[word] = [];
    }
    // Add if not duplicate
    const existing = dict.en2zh[word].find(e => 
      e.s === entry.simplified && e.t === entry.traditional
    );
    if (!existing) {
      dict.en2zh[word].push({
        s: entry.simplified,
        t: entry.traditional,
        p: entry.pinyin,
        d: entry.definitions.slice(0, 3) // Keep top 3 definitions
      });
    }
  }
});

rl.on('close', () => {
  dict.meta.entries = included;
  
  console.log(`Parsed ${count} lines, included ${included} entries`);
  console.log(`Chinese entries: ${Object.keys(dict.zh2en).length}`);
  console.log(`English words: ${Object.keys(dict.en2zh).length}`);
  
  // Write dictionary
  const output = JSON.stringify(dict, null, 0); // No pretty-print to save space
  writeFileSync('/workspace/desktop/src/shared/offline-dict.json', output);
  
  const sizeMB = (output.length / 1024 / 1024).toFixed(2);
  console.log(`Dictionary written: ${sizeMB} MB`);
  console.log('Done!');
});
