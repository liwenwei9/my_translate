/**
 * Desktop Translation Smoke Test
 */

console.log('\n=== Desktop Translation Smoke Test ===\n');

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtml(text) {
  return text
    .replace(/&#(?:0*39);|&#x0*27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&');
}

async function testMicrosoft(text, from, to) {
  console.log('Testing Microsoft Edge Translator...');
  console.log(`  Input: "${text}" (${from} -> ${to})`);
  
  const url = new URL('https://edge.microsoft.com/translate/translatetext');
  url.searchParams.set('from', from === 'auto' ? '' : from);
  url.searchParams.set('to', to);
  url.searchParams.set('isEnterpriseClient', 'false');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify([escapeHtml(text)])
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = decodeHtml(data[0].translations[0].text);
  console.log(`  Output: "${result}"`);
  console.log('  ✓ Microsoft PASSED\n');
  return result;
}

async function testGoogle(text, from, to) {
  console.log('Testing Google Translate...');
  console.log(`  Input: "${text}" (${from} -> ${to})`);
  
  const url = new URL('https://translate.googleapis.com/translate_a/t');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', from === 'auto' ? 'auto' : (from === 'zh-Hans' ? 'zh-CN' : from));
  url.searchParams.set('tl', to === 'zh-Hans' ? 'zh-CN' : to);
  url.searchParams.set('dt', 't');

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
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data[0][0];
  console.log(`  Output: "${result}"`);
  console.log('  ✓ Google PASSED\n');
  return result;
}

let passed = 0;
let failed = 0;

try {
  await testMicrosoft('Hello', 'en', 'zh-Hans');
  passed++;
} catch (error) {
  console.error(`  ✗ Microsoft FAILED: ${error.message}\n`);
  failed++;
}

try {
  await testGoogle('Hello', 'en', 'zh-Hans');
  passed++;
} catch (error) {
  console.error(`  ✗ Google FAILED: ${error.message}\n`);
  failed++;
}

console.log('=== Summary ===');
console.log(`Passed: ${passed}, Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
