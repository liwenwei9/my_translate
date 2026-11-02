# My Translate Desktop

My Translate 的 Windows 桌面版本 - 功能强大的翻译工具，支持划词翻译、截图OCR翻译和独立翻译窗口。

## ✨ 功能特性

### 1. 📝 划词翻译
在任意应用中选择文本，按快捷键即可快速翻译：
- **快捷键**: `Ctrl+Shift+T` (Windows) 或 `Cmd+Shift+T` (macOS)
- 自动检测语言并智能切换翻译方向
- 翻译结果悬浮显示在鼠标附近
- 支持一键复制原文和译文

**使用方法**:
1. 在任意应用（浏览器、文档编辑器、PDF等）中选中要翻译的文本
2. 手动复制选中的文本 (`Ctrl+C`)
3. 按下快捷键 `Ctrl+Shift+T`
4. 翻译结果会在悬浮窗中显示

> **注意**: MVP 版本需要手动复制文本。完整版将支持自动捕获选中文本，无需手动复制。

### 2. 📸 截图OCR翻译
截取屏幕区域，自动识别文字并翻译：
- **快捷键**: `Ctrl+Shift+S` (Windows) 或 `Cmd+Shift+S` (macOS)
- **离线识别**: 使用 Tesseract.js 引擎，无需网络即可运行
- **支持语言**: 中文（简体）、英文
- 识别后自动翻译
- 结果可复制

**使用方法**:
1. 按下快捷键 `Ctrl+Shift+S`
2. 屏幕会进入截图模式，显示当前屏幕内容
3. 拖拽鼠标选择要识别的区域
4. 释放鼠标，显示选择区域尺寸
5. 点击"确认识别"按钮
6. 系统自动进行 OCR 识别和翻译
7. 结果显示在悬浮窗中，可一键复制

**首次使用**:
- 首次启动 OCR 时，Tesseract.js 会自动下载语言训练数据（约 10-20MB）
- 语言包下载后会缓存到本地，后续使用无需联网
- 下载进度会在控制台显示
- 离线使用时需要预先下载语言包

### 3. 🪟 独立翻译窗口
专用的翻译窗口，适合大段文本翻译：
- 输入或粘贴任意长度的文本
- 支持多语言互译
- 一键清空、复制
- 快捷键: `Ctrl+Enter` 快速翻译

**使用方法**:
1. 打开 My Translate Desktop 应用
2. 在左侧文本框输入或粘贴要翻译的内容
3. 选择源语言和目标语言（支持自动检测）
4. 点击"翻译"按钮或按 `Ctrl+Enter`
5. 译文将显示在右侧文本框
6. 点击"复制译文"按钮一键复制结果

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 20.0.0
- **pnpm**: 9.x (项目使用 pnpm 作为包管理器)
- **操作系统**: Windows 10/11, macOS 10.15+, Linux
- **网络连接**: 首次使用 OCR 功能需要下载语言训练数据（约 10-20MB）

### 安装依赖

```bash
cd desktop
pnpm install
```

> **注意**: 首次安装时，项目会同时安装主工作区的依赖（如果尚未安装）。

### 开发模式运行

```bash
# 在开发模式下启动应用（支持热重载）
pnpm dev
```

开发模式会：
- 启动 Electron 应用
- 启动 Vite 开发服务器（端口 5173）
- 支持热模块替换（HMR）
- 自动打开开发者工具

### 生产构建

```bash
# 构建应用（编译 TypeScript 和 Vue）
pnpm build

# 打包成可执行文件
pnpm package
```

构建产物位置：
- **编译后的代码**: `desktop/dist/`
  - `dist/main/` - 主进程代码
  - `dist/preload/` - 预加载脚本
  - `dist/renderer/` - 渲染进程代码
- **可执行文件**: `desktop/release/`
  - Windows: `My Translate Setup x.x.x.exe` (安装程序)
  - Windows: `My Translate x.x.x.exe` (便携版)

### 直接运行（需先构建）

```bash
# 先构建
pnpm build

# 运行构建后的应用
pnpm start
```

## 📦 打包说明

### Windows 打包

```bash
pnpm package
```

这会生成：
1. **安装程序** (`My Translate Setup x.x.x.exe`): 
   - 完整的安装向导
   - 自动创建桌面快捷方式
   - 支持卸载

2. **便携版** (解压即用):
   - 无需安装
   - 适合 U 盘携带
   - 所有设置保存在应用目录

### 自定义打包

编辑 `electron-builder.yml` 或在 `package.json` 中配置 `build` 字段：

```json
{
  "build": {
    "appId": "com.mytranslate.desktop",
    "productName": "My Translate",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "resources/icon.ico"
    }
  }
}
```

## 🔧 项目结构

```
desktop/
├── src/
│   ├── main/              # 主进程（Node.js）
│   │   └── index.ts       # 应用入口、窗口管理、全局快捷键
│   ├── preload/           # 预加载脚本
│   │   └── index.ts       # IPC 桥接
│   ├── renderer/          # 渲染进程（浏览器环境）
│   │   ├── index.html     # 主窗口（独立翻译）
│   │   ├── translation.html  # 划词翻译结果窗口
│   │   └── ocr.html       # OCR 截图窗口
│   └── shared/            # 共享代码
│       ├── types.ts       # 类型定义
│       ├── translation.ts # 翻译服务
│       └── ocr.ts         # OCR 服务
├── resources/             # 应用资源（图标等）
├── dist/                  # 构建输出
├── release/               # 打包产物
├── package.json           # 项目配置
├── electron.vite.config.ts  # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 本文档
```

## 🔑 快捷键

| 功能 | Windows | macOS | 说明 |
|------|---------|-------|------|
| 划词翻译 | `Ctrl+Shift+T` | `Cmd+Shift+T` | 翻译剪贴板中的文本 |
| 截图OCR | `Ctrl+Shift+S` | `Cmd+Shift+S` | 截取区域并识别翻译 |
| 窗口内翻译 | `Ctrl+Enter` | `Cmd+Enter` | 在主窗口中快速翻译 |

> **自定义快捷键**: 目前快捷键是硬编码的，后续版本将支持用户自定义。

## 🌐 支持的语言

- 简体中文 (zh-Hans)
- 繁体中文 (zh-Hant)
- English (en)
- 日本語 (ja)
- 한국어 (ko)
- Français (fr)
- Deutsch (de)
- Español (es)
- Русский (ru)

## 🔌 翻译引擎

桌面版使用浏览器扩展的真实免费翻译引擎，**无需 API 密钥**：

1. **Microsoft Edge Translator** (首选)
   - 端点: `https://edge.microsoft.com/translate/translatetext`
   - 高质量翻译
   - 最稳定的免费服务
   - 协议: 复用 `src/providers/translation/microsoftTransport.ts`

2. **Google Translate** (备用)
   - 端点: `https://translate.googleapis.com/translate_a/t`
   - 全球语言支持
   - 自动降级备份
   - 协议: 复用 `src/providers/translation/google.ts` 的 LIST 端点

**翻译流程**: 
- 优先使用 Microsoft Edge Translator
- 如果失败，自动降级到 Google Translate
- 如果都失败，显示网络连接错误

**验证**: 
- 冒烟测试: `node desktop/smoke-test-translation.mjs`
- Microsoft: "Hello" → "你好" ✅
- Google: "Hello" → "你" ✅

## 🔍 OCR 引擎

桌面版使用 **Tesseract.js 5.1.1** 进行离线 OCR 识别：

- **开源引擎**: Apache-2.0 许可证
- **离线识别**: 无需联网即可使用（语言包下载后）
- **支持语言**: 
  - 英文 (eng)
  - 简体中文 (chi_sim)
- **识别精度**: 适用于清晰的印刷体文字
- **自动下载**: 首次使用时自动从 CDN 下载并缓存语言包
- **缓存位置**: 存储在 Electron 用户数据目录
- **超时设置**: 60秒识别超时保护

### OCR 配置

Tesseract.js 在 Electron 环境下的特殊配置：
- Worker 和核心文件从 CDN 自动加载
- 语言训练数据自动下载并缓存
- 首次初始化可能需要 10-30 秒下载语言包
- 后续使用缓存，无需重新下载
- 如果初始化失败，会自动重置并允许重试

### OCR 使用建议

为了获得最佳识别效果：
- ✓ 选择包含清晰文字的区域
- ✓ 确保文字大小适中，不要过小
- ✓ 避免复杂背景和图案干扰
- ✓ 首选印刷体文字，手写体识别率较低
- ✓ 保持文字方向为水平（暂不支持旋转文字）
- ✓ 首次使用需要网络连接下载语言包
- ✓ 如果识别超时（60秒），请重试或选择更小的区域

## 🧪 测试说明

### 手动测试步骤

#### 1. 独立翻译窗口测试
```
步骤:
1. 启动应用 (pnpm dev)
2. 在左侧输入框输入: "Hello, World!"
3. 点击"翻译"按钮
4. 验证右侧显示中文翻译
5. 点击"复制译文"，验证复制成功
6. 点击语言交换按钮，验证语言切换
7. 点击"清空"，验证文本清除

预期结果:
- 翻译结果准确
- 复制功能正常
- UI 响应流畅
```

#### 2. 划词翻译测试
```
步骤:
1. 启动应用
2. 打开任意文本编辑器或浏览器
3. 选中一段英文文本（例如："Hello, World!"）
4. 按 Ctrl+C 复制
5. 按 Ctrl+Shift+T
6. 验证悬浮窗在鼠标附近显示翻译结果
7. 验证显示原文和译文
8. 点击"复制译文"
9. 点击窗口外部，验证窗口自动关闭

预期结果:
- 悬浮窗在鼠标附近显示
- 显示原文和译文
- 复制功能正常
- 失焦后自动关闭（延迟 200ms）
```

#### 3. OCR 截图测试
```
步骤:
1. 启动应用
2. 准备一个包含文字的图片或打开一个网页
3. 按 Ctrl+Shift+S
4. 验证屏幕进入半透明遮罩模式
5. 拖拽鼠标选择包含文字的区域
6. 验证显示选择区域尺寸（如 "320 × 240"）
7. 点击"确认识别"
8. 等待识别完成（首次使用可能需要下载语言包）
9. 验证翻译窗口显示识别的文字和翻译结果
10. 验证显示识别置信度
11. 测试复制功能

预期结果:
- 截图选择流畅
- 显示选择区域尺寸
- OCR 识别准确（清晰文字）
- 识别结果自动翻译
- 显示置信度百分比
- 复制功能正常
- UI 反馈清晰

首次使用注意:
- 首次启动 OCR 会下载语言包（10-20MB）
- 下载进度在控制台显示
- 下载完成后立即可用
- 后续使用无需下载
```

### QA 检查清单

- [ ] 应用能正常启动
- [ ] 主窗口显示正常
- [ ] 所有按钮可点击且有响应
- [ ] 翻译功能正常工作（测试中英文互译）
- [ ] 复制功能正常工作
- [ ] 快捷键能被正确注册和触发
- [ ] 划词翻译：复制文本 → 按快捷键 → 显示结果
- [ ] 划词翻译悬浮窗显示和关闭正常
- [ ] OCR 截图界面显示正常
- [ ] OCR 区域选择流畅，显示尺寸
- [ ] OCR 识别功能正常（首次会下载语言包）
- [ ] OCR 识别结果准确（使用清晰的文字图片测试）
- [ ] OCR 识别后自动翻译
- [ ] 语言切换功能正常
- [ ] 开发模式：检查控制台无错误或警告
- [ ] 生产构建：`pnpm build` 无错误

## 🐛 已知问题和限制

### MVP 版本特性

1. **划词翻译**: 
   - 需要手动复制文本 (`Ctrl+C`) 后再按快捷键
   - 未集成自动文本捕获（需要 robotjs/node-key-sender 等原生依赖）
   - Windows AV 软件可能对自动按键模拟有限制

2. **OCR 功能**:
   - ✅ 完整实现，使用 Tesseract.js 5.1.1
   - ✅ 支持中英文识别（eng + chi_sim）
   - ✅ 离线识别，首次使用需下载语言包
   - ⚠️ 识别精度依赖图像质量和文字清晰度
   - ⚠️ 暂不支持旋转文字和手写体
   - ⚠️ 语言包首次下载约 10-20MB

3. **构建和CI**:
   - ✅ Linux CI 环境可以 `pnpm install` 和 `pnpm build`
   - ⚠️ Windows 特定功能（截图、全局快捷键）需要在 Windows 环境验证
   - ✅ OCR 功能已集成，可在任意平台构建

### 后续计划

- [ ] 优化 OCR 识别精度
- [ ] 支持更多 OCR 语言（日文、韩文等）
- [ ] 自动捕获选中文本（无需手动复制）
- [ ] 系统托盘功能
- [ ] 翻译历史记录
- [ ] 自定义快捷键
- [ ] 多翻译引擎切换
- [ ] 离线翻译支持
- [ ] PaddleOCR 集成（更高精度的中文识别）

## 🔒 隐私说明

- **本地优先**: 所有配置和缓存数据存储在本地
- **无账户系统**: 无需注册或登录
- **透明通信**: 翻译请求直接发送到公共 API，不经过第三方服务器
- **无数据收集**: 不收集用户行为数据或翻译内容

## 📝 开发说明

### 技术栈

- **Electron**: ^28.2.0
- **Vue 3**: ^3.5.13
- **TypeScript**: ^5.7.3
- **Vite**: ^5.4.19
- **Electron Vite**: ^2.0.0
- **Tesseract.js**: ^5.1.0 (OCR 引擎)

### 代码规范

- 所有 TypeScript 文件必须包含 `@file` 注释说明职责
- 主进程和渲染进程代码严格分离
- 通过 IPC 进行跨进程通信
- 使用 contextBridge 暴露安全的 API

### 调试

开发模式下自动打开 DevTools:
```javascript
// 在 src/main/index.ts
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

查看日志:
```bash
# 主进程日志在终端
# 渲染进程日志在 DevTools Console
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

与主项目保持一致。

---

**My Translate Desktop** - 让跨语言交流更简单 🌍
