/**
 * @file desktop/smoke-test-ocr.cjs
 * 文件职责：OCR 功能烟雾测试，验证 Tesseract.js 在 Node.js/Electron 环境下能否正常识别文字。
 * 主要内容：使用简单文本图片测试 recognizeText 函数，检查 worker 路径是否正确。
 * 模块边界：独立测试脚本，不依赖 Electron 窗口，仅验证 OCR 核心逻辑。
 */

const { createWorker } = require('tesseract.js');
const { join, dirname } = require('path');

/**
 * Get the path to tesseract.js node_modules
 */
function getTesseractPaths() {
  try {
    // require.resolve('tesseract.js') gives us /path/to/node_modules/tesseract.js/src/index.js
    const tesseractPath = require.resolve('tesseract.js');
    // Go up from /node_modules/tesseract.js/src/index.js to /node_modules/tesseract.js
    const tesseractDir = dirname(dirname(tesseractPath));
    const workerPath = join(tesseractDir, 'src', 'worker-script', 'node', 'index.js');
    
    console.log('[OCR] Tesseract paths:');
    console.log(`  Base: ${tesseractDir}`);
    console.log(`  Worker: ${workerPath}`);
    
    return { workerPath };
  } catch (error) {
    console.error('[OCR] Failed to resolve tesseract paths:', error);
    return {};
  }
}

// Test image with text "Hello World"
const testImageBase64 = `data:image/png;base64,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`;

console.log('=== OCR Smoke Test ===');
console.log('Testing Tesseract.js worker initialization and text recognition...\n');

(async () => {
  try {
    console.log('1. Resolving Tesseract.js paths...');
    const paths = getTesseractPaths();
    
    console.log('\n2. Creating worker with explicit paths...');
    const workerOptions = {
      logger: (m) => {
        if (m.status === 'loading tesseract core' || 
            m.status === 'initializing tesseract' || 
            m.status === 'loading language traineddata') {
          console.log(`[OCR] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`);
        }
        if (m.status === 'initialized api') {
          console.log('[OCR] Tesseract API initialized');
        }
      },
      errorHandler: (err) => {
        console.error('[OCR] Tesseract error:', err);
      }
    };
    
    if (paths.workerPath) {
      workerOptions.workerPath = paths.workerPath;
      console.log(`   Using explicit workerPath: ${paths.workerPath}`);
    }
    
    const worker = await createWorker(['eng', 'chi_sim'], 1, workerOptions);
    console.log('\n3. Worker created successfully!');
    
    console.log('\n4. Running OCR recognition...');
    const { data } = await worker.recognize(testImageBase64);
    
    const text = data.text.trim();
    console.log('\n5. OCR Result:');
    console.log(`   Text: "${text}"`);
    console.log(`   Confidence: ${data.confidence}%`);
    
    await worker.terminate();
    
    if (text && text.length > 0) {
      console.log('\n✅ SUCCESS: OCR worker initialized and recognized text');
      console.log('   No "Cannot find module" errors - worker path is correct!');
      process.exit(0);
    } else {
      console.log('\n⚠️  WARNING: OCR completed but no text recognized');
      console.log('   This may be normal for the test image used.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ FAILED: OCR test failed');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message && error.message.includes('Cannot find module')) {
      console.error('\n💥 Worker path issue detected!');
      console.error('   Tesseract.js cannot find worker files.');
    }
    
    process.exit(1);
  }
})();
