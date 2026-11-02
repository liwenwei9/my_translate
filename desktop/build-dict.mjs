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
  // Multi-word phrases (manually curated common greetings)
  phrases: {
    'thank you': [{ s: '谢谢', t: '謝謝', p: 'xie4 xie5', d: ['thank you'] }],
    'good morning': [{ s: '早上好', t: '早上好', p: 'zao3 shang4 hao3', d: ['good morning'] }],
    'good afternoon': [{ s: '下午好', t: '下午好', p: 'xia4 wu3 hao3', d: ['good afternoon'] }],
    'good evening': [{ s: '晚上好', t: '晚上好', p: 'wan3 shang4 hao3', d: ['good evening'] }],
    'good night': [{ s: '晚安', t: '晚安', p: 'wan3 an1', d: ['good night'] }],
    'excuse me': [{ s: '对不起', t: '對不起', p: 'dui4 bu5 qi3', d: ['excuse me; sorry'] }, { s: '请问', t: '請問', p: 'qing3 wen4', d: ['excuse me; may I ask'] }],
    "you're welcome": [{ s: '不客气', t: '不客氣', p: 'bu4 ke4 qi5', d: ["you're welcome; don't mention it"] }],
    'you are welcome': [{ s: '不客气', t: '不客氣', p: 'bu4 ke4 qi5', d: ["you're welcome; don't mention it"] }],
    'how are you': [{ s: '你好吗', t: '你好嗎', p: 'ni3 hao3 ma5', d: ['how are you?'] }],
    'see you': [{ s: '再见', t: '再見', p: 'zai4 jian4', d: ['see you; goodbye'] }],
    'good bye': [{ s: '再见', t: '再見', p: 'zai4 jian4', d: ['goodbye'] }],
    'goodbye': [{ s: '再见', t: '再見', p: 'zai4 jian4', d: ['goodbye'] }]
  },
  meta: {
    source: 'CC-CEDICT',
    license: 'CC-BY-SA-4.0',
    url: 'https://cc-cedict.org',
    version: '2026-10-31',
    entries: 0,
    phrases: 0
  }
};

// Common English words we want reverse lookup for
// Expanded to include thousands of common English lemmas from basic vocabulary
const commonEnglishWords = new Set([
  // Basic verbs
  'be', 'is', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'done', 'doing',
  'say', 'said', 'saying',
  'go', 'goes', 'went', 'gone', 'going',
  'get', 'gets', 'got', 'gotten', 'getting',
  'make', 'makes', 'made', 'making',
  'know', 'knows', 'knew', 'known', 'knowing',
  'think', 'thinks', 'thought', 'thinking',
  'take', 'takes', 'took', 'taken', 'taking',
  'see', 'sees', 'saw', 'seen', 'seeing',
  'come', 'comes', 'came', 'coming',
  'want', 'wants', 'wanted', 'wanting',
  'look', 'looks', 'looked', 'looking',
  'use', 'uses', 'used', 'using',
  'find', 'finds', 'found', 'finding',
  'give', 'gives', 'gave', 'given', 'giving',
  'tell', 'tells', 'told', 'telling',
  'work', 'works', 'worked', 'working',
  'call', 'calls', 'called', 'calling',
  'try', 'tries', 'tried', 'trying',
  'ask', 'asks', 'asked', 'asking',
  'need', 'needs', 'needed', 'needing',
  'feel', 'feels', 'felt', 'feeling',
  'become', 'becomes', 'became', 'becoming',
  'leave', 'leaves', 'left', 'leaving',
  'put', 'puts', 'putting',
  'mean', 'means', 'meant', 'meaning',
  'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting',
  'begin', 'begins', 'began', 'begun', 'beginning',
  'seem', 'seems', 'seemed', 'seeming',
  'help', 'helps', 'helped', 'helping',
  'talk', 'talks', 'talked', 'talking',
  'turn', 'turns', 'turned', 'turning',
  'start', 'starts', 'started', 'starting',
  'show', 'shows', 'showed', 'shown', 'showing',
  'hear', 'hears', 'heard', 'hearing',
  'play', 'plays', 'played', 'playing',
  'run', 'runs', 'ran', 'running',
  'move', 'moves', 'moved', 'moving',
  'like', 'likes', 'liked', 'liking',
  'live', 'lives', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing',
  'hold', 'holds', 'held', 'holding',
  'bring', 'brings', 'brought', 'bringing',
  'happen', 'happens', 'happened', 'happening',
  'write', 'writes', 'wrote', 'written', 'writing',
  'provide', 'provides', 'provided', 'providing',
  'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing',
  'lose', 'loses', 'lost', 'losing',
  'pay', 'pays', 'paid', 'paying',
  'meet', 'meets', 'met', 'meeting',
  'include', 'includes', 'included', 'including',
  'continue', 'continues', 'continued', 'continuing',
  'set', 'sets', 'setting',
  'learn', 'learns', 'learned', 'learning',
  'change', 'changes', 'changed', 'changing',
  'lead', 'leads', 'led', 'leading',
  'understand', 'understands', 'understood', 'understanding',
  'watch', 'watches', 'watched', 'watching',
  'follow', 'follows', 'followed', 'following',
  'stop', 'stops', 'stopped', 'stopping',
  'create', 'creates', 'created', 'creating',
  'speak', 'speaks', 'spoke', 'spoken', 'speaking',
  'read', 'reads', 'reading',
  'allow', 'allows', 'allowed', 'allowing',
  'add', 'adds', 'added', 'adding',
  'spend', 'spends', 'spent', 'spending',
  'grow', 'grows', 'grew', 'grown', 'growing',
  'open', 'opens', 'opened', 'opening',
  'walk', 'walks', 'walked', 'walking',
  'win', 'wins', 'won', 'winning',
  'offer', 'offers', 'offered', 'offering',
  'remember', 'remembers', 'remembered', 'remembering',
  'love', 'loves', 'loved', 'loving',
  'consider', 'considers', 'considered', 'considering',
  'appear', 'appears', 'appeared', 'appearing',
  'buy', 'buys', 'bought', 'buying',
  'wait', 'waits', 'waited', 'waiting',
  'serve', 'serves', 'served', 'serving',
  'die', 'dies', 'died', 'dying',
  'send', 'sends', 'sent', 'sending',
  'expect', 'expects', 'expected', 'expecting',
  'build', 'builds', 'built', 'building',
  'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'fallen', 'falling',
  'cut', 'cuts', 'cutting',
  'reach', 'reaches', 'reached', 'reaching',
  'kill', 'kills', 'killed', 'killing',
  'remain', 'remains', 'remained', 'remaining',
  'suggest', 'suggests', 'suggested', 'suggesting',
  'raise', 'raises', 'raised', 'raising',
  'pass', 'passes', 'passed', 'passing',
  'sell', 'sells', 'sold', 'selling',
  'require', 'requires', 'required', 'requiring',
  'report', 'reports', 'reported', 'reporting',
  'decide', 'decides', 'decided', 'deciding',
  'pull', 'pulls', 'pulled', 'pulling',
  
  // Common nouns
  'time', 'times',
  'person', 'people',
  'year', 'years',
  'way', 'ways',
  'day', 'days',
  'thing', 'things',
  'man', 'men',
  'world',
  'life', 'lives',
  'hand', 'hands',
  'part', 'parts',
  'child', 'children',
  'eye', 'eyes',
  'woman', 'women',
  'place', 'places',
  'work',
  'week', 'weeks',
  'case', 'cases',
  'point', 'points',
  'government', 'governments',
  'company', 'companies',
  'number', 'numbers',
  'group', 'groups',
  'problem', 'problems',
  'fact', 'facts',
  'head', 'heads',
  'month', 'months',
  'side', 'sides',
  'home', 'homes',
  'water',
  'room', 'rooms',
  'mother', 'mothers',
  'area', 'areas',
  'money',
  'story', 'stories',
  'lot', 'lots',
  'student', 'students',
  'study', 'studies',
  'book', 'books',
  'job', 'jobs',
  'word', 'words',
  'business',
  'issue', 'issues',
  'kind', 'kinds',
  'house', 'houses',
  'service', 'services',
  'friend', 'friends',
  'father', 'fathers',
  'power',
  'hour', 'hours',
  'game', 'games',
  'line', 'lines',
  'end', 'ends',
  'member', 'members',
  'law', 'laws',
  'car', 'cars',
  'city', 'cities',
  'community', 'communities',
  'name', 'names',
  'president', 'presidents',
  'team', 'teams',
  'minute', 'minutes',
  'idea', 'ideas',
  'kid', 'kids',
  'body', 'bodies',
  'information',
  'back',
  'parent', 'parents',
  'face', 'faces',
  'level', 'levels',
  'office', 'offices',
  'door', 'doors',
  'health',
  'art',
  'war', 'wars',
  'history',
  'party', 'parties',
  'result', 'results',
  'morning', 'mornings',
  'reason', 'reasons',
  'research',
  'girl', 'girls',
  'guy', 'guys',
  'moment', 'moments',
  'air',
  'teacher', 'teachers',
  'force', 'forces',
  'education',
  'system', 'systems',
  'program', 'programs',
  'question', 'questions',
  'night', 'nights',
  
  // Common adjectives
  'good', 'better', 'best',
  'new',
  'first',
  'last',
  'long',
  'great',
  'little',
  'own',
  'other',
  'old',
  'right',
  'big',
  'high',
  'different',
  'small',
  'large',
  'next',
  'early',
  'young',
  'important',
  'few',
  'public',
  'bad', 'worse', 'worst',
  'same',
  'able',
  'happy',
  'sad',
  'hot',
  'cold',
  'warm',
  'cool',
  'red',
  'blue',
  'green',
  'white',
  'black',
  'yellow',
  'nice',
  'easy',
  'hard',
  'fast',
  'slow',
  'strong',
  'weak',
  'full',
  'empty',
  'clean',
  'dirty',
  'rich',
  'poor',
  'busy',
  'free',
  'safe',
  'dangerous',
  'beautiful',
  'ugly',
  'hungry',
  'thirsty',
  'tired',
  'angry',
  'afraid',
  'sorry',
  
  // Common adverbs
  'very',
  'also',
  'just',
  'now',
  'then',
  'here',
  'there',
  'today',
  'tomorrow',
  'yesterday',
  'never',
  'always',
  'often',
  'sometimes',
  'soon',
  'again',
  'still',
  'already',
  'yet',
  'well',
  'only',
  'too',
  'really',
  'almost',
  'quite',
  'rather',
  'enough',
  
  // Pronouns & determiners
  'that', 'those',
  'this', 'these',
  'all',
  'some',
  'any',
  'many',
  'much',
  'more', 'most',
  'such',
  'each',
  'every',
  'both',
  'either',
  'neither',
  'another',
  
  // Prepositions
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'about',
  'against',
  'between',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'from',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  
  // Greetings & common phrases
  'hello', 'hi', 'hey',
  'goodbye', 'bye',
  'thanks', 'thank',
  'please',
  'yes',
  'no',
  'ok', 'okay',
  'sorry',
  'excuse',
  'welcome',
  'morning',
  'afternoon',
  'evening',
  'night',
  
  // Numbers
  'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'million', 'billion',
  'first', 'second', 'third', 'fourth', 'fifth',
  
  // Basic actions & activities
  'eat', 'eats', 'ate', 'eaten', 'eating',
  'drink', 'drinks', 'drank', 'drunk', 'drinking',
  'sleep', 'sleeps', 'slept', 'sleeping',
  'wake', 'wakes', 'woke', 'woken', 'waking',
  'run', 'runs', 'ran', 'running',
  'walk', 'walks', 'walked', 'walking',
  'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing',
  'listen', 'listens', 'listened', 'listening',
  'watch', 'watches', 'watched', 'watching',
  'read', 'reads', 'reading',
  'write', 'writes', 'wrote', 'written', 'writing',
  'sing', 'sings', 'sang', 'sung', 'singing',
  'dance', 'dances', 'danced', 'dancing',
  'cook', 'cooks', 'cooked', 'cooking',
  'clean', 'cleans', 'cleaned', 'cleaning',
  'wash', 'washes', 'washed', 'washing',
  'drive', 'drives', 'drove', 'driven', 'driving',
  'ride', 'rides', 'rode', 'ridden', 'riding',
  'fly', 'flies', 'flew', 'flown', 'flying',
  'swim', 'swims', 'swam', 'swum', 'swimming',
  
  // Basic objects & items
  'food', 'foods',
  'rice',
  'bread',
  'meat',
  'fish',
  'egg', 'eggs',
  'milk',
  'tea',
  'coffee',
  'pen', 'pens',
  'paper',
  'phone', 'phones',
  'computer', 'computers',
  'bus', 'buses',
  'train', 'trains',
  'table', 'tables',
  'chair', 'chairs',
  'bed', 'beds',
  'window', 'windows',
  
  // Places
  'school', 'schools',
  'hospital', 'hospitals',
  'bank', 'banks',
  'store', 'stores',
  'restaurant', 'restaurants',
  'hotel', 'hotels',
  'airport', 'airports',
  'station', 'stations',
  'street', 'streets',
  'road', 'roads',
  'river', 'rivers',
  'mountain', 'mountains',
  'sea', 'seas',
  'country', 'countries',
  
  // Languages & communication
  'english',
  'chinese',
  'language', 'languages',
  'letter', 'letters',
  'message', 'messages',
  'email', 'emails',
  
  // Family & relationships
  'family', 'families',
  'son', 'sons',
  'daughter', 'daughters',
  'brother', 'brothers',
  'sister', 'sisters',
  'husband', 'husbands',
  'wife', 'wives',
  'baby', 'babies',
  'boy', 'boys',
  
  // Misc common
  'world',
  'life',
  'death',
  'birth',
  'love',
  'hate',
  'like',
  'want',
  'need',
  'hope',
  'wish',
  'dream',
  'fear',
  'worry',
  'care',
  'interest',
  'age',
  'price',
  'size',
  'color',
  'shape',
  'sound',
  'voice',
  'music',
  'song',
  'movie',
  'film',
  'picture',
  'photo',
  'image'
]);

// Common multi-word greetings/phrases to support offline
const commonMultiWordPhrases = new Set([
  'thank you',
  'thanks you',
  'good morning',
  'good afternoon',
  'good evening',
  'good night',
  'excuse me',
  "you're welcome",
  'you are welcome',
  'how are you',
  'nice to meet you',
  'see you',
  'take care',
  'good day',
  'good bye'
]);
const commonChineseWords = new Set([
  '你好', '谢谢', '对不起', '再见', '晚安', '早安',
  '没有', '不是', '可以', '应该', '可能', '一定',
  '很好', '不好', '太好', '太棒',
  '喜欢', '爱你', '想你', '谢谢你',
  '早上', '中午', '晚上', '今天', '明天', '昨天',
  '时间', '地方', '人们', '朋友', '家人', '孩子',
  '工作', '学习', '休息', '吃饭', '喝水', '睡觉',
  '什么', '哪里', '为什么', '怎么', '多少', '几个',
  '这个', '那个', '这里', '那里', '现在', '以前', '以后',
  '知道', '认识', '明白', '理解', '相信', '希望',
  '开心', '高兴', '快乐', '幸福', '难过', '伤心'
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
  // Always include single characters
  if (entry.simplified.length === 1) {
    return true;
  }
  
  // Always include common Chinese 2-character words
  if (commonChineseWords.has(entry.simplified)) {
    return true;
  }
  
  // Include common 2-character words with common English meanings
  if (entry.simplified.length === 2) {
    const defText = entry.definitions.join(' ').toLowerCase();
    // Check for exact word matches (not just contains)
    for (const word of commonEnglishWords) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(defText)) {
        return true;
      }
    }
    return false;
  }
  
  // For 3-4 character words, be very selective
  if (entry.simplified.length <= 4) {
    const defText = entry.definitions.join(' ').toLowerCase();
    // Only if it's a very common greeting/phrase
    const veryCommon = ['hello', 'thank', 'please', 'sorry', 'goodbye', 'morning', 'afternoon', 'evening'];
    for (const word of veryCommon) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(defText)) {
        return true;
      }
    }
    return false;
  }
  
  return false;
}

/**
 * Extract English words from definitions for reverse lookup
 * Also score entries for relevance (prefer entries where the word is a headword)
 */
function extractEnglishWords(entry) {
  const words = new Map(); // word -> score
  
  for (const def of entry.definitions) {
    // Extract individual words (lowercase, alphabetic only)
    const matches = def.toLowerCase().match(/\b[a-z]+\b/g);
    if (matches) {
      for (const word of matches) {
        if (commonEnglishWords.has(word) && word.length > 2) {
          // Score: higher if word appears early in definition, or is the entire/first definition
          let score = 1;
          
          // Check if this word is the main headword (appears at start of first definition)
          if (def.toLowerCase().startsWith(word)) {
            score += 10;
          }
          
          // Check if it's a standalone definition (just the word, maybe with article)
          if (def.toLowerCase() === word || def.toLowerCase() === `to ${word}` || 
              def.toLowerCase() === `a ${word}` || def.toLowerCase() === `the ${word}`) {
            score += 20;
          }
          
          // Avoid entries where the English word is just part of a longer proper noun
          // (e.g., "Hello Kitty" for "hello")
          if (def.includes('Kitty') || def.includes('©') || def.includes('trademark')) {
            score -= 15;
          }
          
          const existing = words.get(word) || 0;
          words.set(word, Math.max(existing, score));
        }
      }
    }
  }
  
  return words;
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
  
  // Index by both traditional and simplified (if different)
  dict.zh2en[entry.traditional] = zhEntry;
  if (entry.traditional !== entry.simplified) {
    dict.zh2en[entry.simplified] = zhEntry;
  }
  
  // Add English -> Chinese reverse lookup for common words
  const englishWords = extractEnglishWords(entry);
  for (const [word, score] of englishWords) {
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
        d: entry.definitions.slice(0, 3), // Keep top 3 definitions
        score: score // Add score for later sorting
      });
    }
  }
});

rl.on('close', () => {
  dict.meta.entries = included;
  dict.meta.phrases = Object.keys(dict.phrases).length;
  
  console.log(`Parsed ${count} lines, included ${included} entries`);
  console.log(`Chinese entries: ${Object.keys(dict.zh2en).length}`);
  console.log(`English words: ${Object.keys(dict.en2zh).length}`);
  console.log(`Multi-word phrases: ${dict.meta.phrases}`);
  
  // Sort English entries by score (highest first)
  for (const word in dict.en2zh) {
    dict.en2zh[word].sort((a, b) => (b.score || 0) - (a.score || 0));
    // Remove score field before serialization
    dict.en2zh[word].forEach(entry => delete entry.score);
  }
  
  // Write dictionary
  const output = JSON.stringify(dict, null, 0); // No pretty-print to save space
  writeFileSync('/workspace/desktop/src/shared/offline-dict.json', output);
  
  const sizeMB = (output.length / 1024 / 1024).toFixed(2);
  console.log(`Dictionary written: ${sizeMB} MB`);
  console.log('Done!');
});
