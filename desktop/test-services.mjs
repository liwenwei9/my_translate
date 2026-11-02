/**
 * @file desktop/test-services.mjs
 * 文件职责：桌面应用服务层冒烟测试，验证翻译和 OCR 基础功能可用。
 * 主要内容：Node.js 环境下测试翻译和 OCR 服务的基本调用路径。
 * 模块边界：仅测试共享服务层，不依赖 Electron 运行时。
 */

import { translateText } from './src/shared/translation.ts';
import { recognizeText } from './src/shared/ocr.ts';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 简单的测试框架
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

console.log('\n=== Desktop Services Smoke Tests ===\n');

// 测试翻译服务
await test('Translation service is importable', async () => {
  if (typeof translateText !== 'function') {
    throw new Error('translateText is not a function');
  }
});

await test('Translation service can handle English to Chinese', async () => {
  const result = await translateText({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'zh-Hans'
  });
  
  if (!result || typeof result.text !== 'string') {
    throw new Error('Invalid translation result structure');
  }
  
  if (result.text === 'Hello') {
    throw new Error('Translation did not produce different output');
  }
  
  console.log(`  Input: "Hello" → Output: "${result.text}"`);
});

// 测试 OCR 服务
await test('OCR service is importable', async () => {
  if (typeof recognizeText !== 'function') {
    throw new Error('recognizeText is not a function');
  }
});

await test('OCR service rejects invalid image data', async () => {
  try {
    await recognizeText({ imageData: 'invalid' });
    throw new Error('Should have rejected invalid image data');
  } catch (error) {
    if (!error.message.includes('无效')) {
      throw error;
    }
    // Expected error
  }
});

// 测试 Tesseract.js 是否正确安装
await test('Tesseract.js is installed and importable', async () => {
  const tesseract = await import('tesseract.js');
  if (!tesseract.createWorker) {
    throw new Error('tesseract.js createWorker not found');
  }
  console.log('  Tesseract.js is available');
});

// 摘要
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

process.exit(failed > 0 ? 1 : 0);
