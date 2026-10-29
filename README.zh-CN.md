# My Translate

基于 [FluentRead](https://github.com/Bistutu/FluentRead) 的浏览器翻译扩展（GPL-3.0）

## 功能特性

- 📄 网页翻译：双语对照显示
- ✏️ 划词翻译：选中文本即时翻译
- 🔤 输入翻译：在翻译中心输入文本进行翻译
- 🌐 中英互译：支持中文↔英文翻译
- 🆓 免费引擎：支持 Microsoft、Google、DeepLX 等免费翻译服务

## 安装和使用

### 1. 安装依赖

需要 Node.js 20 或更高版本和 pnpm 9。

```bash
pnpm install --frozen-lockfile
```

### 2. 构建扩展

```bash
pnpm build
```

构建完成后，产物位于 `.output/chrome-mv3` 目录。

### 3. 加载到浏览器

#### Chrome / Edge / 其他 Chromium 浏览器

1. 打开浏览器，访问 `chrome://extensions/`（Edge 访问 `edge://extensions/`）
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `.output/chrome-mv3` 目录
5. 扩展加载成功后，图标会出现在浏览器工具栏

### 4. 测试翻译功能

#### 方法一：使用测试页面

1. 在浏览器中打开项目中的 `test.html` 文件
2. 选中页面中的中文或英文文本
3. 会自动弹出翻译浮窗，显示译文

#### 方法二：翻译任意网页

1. 访问任意包含英文或中文内容的网页
2. 点击扩展图标打开设置面板
3. 选择目标语言（中文或英文）
4. 点击"翻译页面"进行双语翻译
5. 或直接选中文本进行划词翻译

#### 方法三：翻译中心

1. 点击扩展图标
2. 选择"翻译中心"选项
3. 在输入框中输入或粘贴要翻译的文本
4. 选择源语言和目标语言
5. 点击"开始翻译"查看结果

## 功能测试清单

测试前请确保：
- ✅ 扩展已成功加载到浏览器
- ✅ 扩展图标显示在工具栏中
- ✅ 已打开测试页面或任意网页

### 核心功能验证

- [ ] **划词翻译**：选中英文文本 → 显示中文译文
- [ ] **划词翻译**：选中中文文本 → 显示英文译文
- [ ] **复制译文**：点击翻译浮窗中的复制按钮 → 译文已复制到剪贴板
- [ ] **输入翻译**：在翻译中心输入文本 → 显示译文
- [ ] **网页翻译**：点击"翻译页面" → 页面显示双语对照

### 免费引擎验证

确认以下至少一个引擎可正常工作（无需 API Key）：
- [ ] Microsoft Translator
- [ ] Google Translate
- [ ] DeepLX

## 开发说明

### 开发模式

```bash
pnpm dev
```

在开发模式下，修改代码后会自动重新构建。

### 项目结构

```
.
├── src/                    # 源代码
│   ├── app/               # 应用逻辑
│   ├── core/              # 核心功能
│   ├── features/          # 功能模块
│   ├── providers/         # 翻译服务提供商
│   └── ui/                # 用户界面
├── entrypoints/           # 扩展入口点
├── public/                # 静态资源
├── .output/               # 构建产物
└── test.html              # 测试页面
```

### 翻译引擎

本项目使用 FluentRead 的免费翻译引擎：

- **Microsoft Translator**：`src/providers/translation/microsoft.ts`
- **Google Translate**：`src/providers/translation/google.ts`
- **DeepLX**：`src/providers/translation/deeplx.ts`

这些引擎无需配置 API Key 即可使用。

## 许可证

本项目基于 [FluentRead](https://github.com/Bistutu/FluentRead) 开发，遵循 GPL-3.0 许可证。

- 原项目：FluentRead (https://github.com/Bistutu/FluentRead)
- 许可证：GNU General Public License v3.0
- 详见：[LICENSE](./LICENSE) 和 [NOTICE.md](./NOTICE.md)

## 致谢

感谢 FluentRead 项目及其贡献者创建并维护这个优秀的开源翻译扩展。My Translate 的所有功能都基于 FluentRead 的出色工作。

## 常见问题

### Q: 翻译功能无法使用怎么办？

A: 请检查：
1. 扩展是否正确加载（在 chrome://extensions/ 中查看）
2. 网络连接是否正常
3. 尝试刷新页面后再次使用

### Q: 支持哪些浏览器？

A: 支持所有基于 Chromium 的浏览器：
- Google Chrome
- Microsoft Edge
- Brave
- Vivaldi
- 其他 Chromium 内核浏览器

### Q: 如何切换翻译引擎？

A: 点击扩展图标 → 设置 → 翻译服务，选择想要使用的翻译引擎。

### Q: 是否需要 API Key？

A: 不需要。本项目配置的 Microsoft、Google 等引擎都是免费的，无需申请 API Key。

## 问题反馈

如有问题或建议，请在 GitHub Issues 中提交。
