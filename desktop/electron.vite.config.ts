/**
 * @file desktop/electron.vite.config.ts
 * 文件职责：Electron Vite 构建配置，分别打包主进程、预加载脚本和渲染进程。
 * 主要内容：主进程和预加载脚本使用 Node 模式，渲染进程使用 Vue 插件和浏览器模式。
 * 模块边界：独立于浏览器扩展构建系统，仅服务桌面应用。
 */
import { defineConfig } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@desktop': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, '../src')
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          translation: resolve(__dirname, 'src/renderer/translation.html'),
          ocr: resolve(__dirname, 'src/renderer/ocr.html')
        }
      }
    },
    resolve: {
      alias: {
        '@desktop': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, '../src')
      }
    },
    plugins: [vue()]
  }
});
