# PurePixel

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<p align="center">
  🖼️ 纯前端、高性能的图片格式转换与无损压缩工具
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#演示">演示</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#部署">部署</a> •
  <a href="#技术栈">技术栈</a>
</p>

---

## 特性

- 🔒 **隐私安全** - 所有处理在浏览器本地完成，无需上传服务器
- ⚡ **极致性能** - 使用 Canvas API 和 Web Worker 多线程处理
- 🎨 **格式转换** - 支持 JPG、PNG、WEBP、AVIF、GIF 互转
- 📦 **无损压缩** - 智能压缩算法，保持图片质量
- 📐 **尺寸调整** - 支持缩放比例和自定义宽高（保持宽高比）
- 🎭 **对比预览** - Before/After 滑块实时对比效果
- 🌓 **深色模式** - 支持 Dark/Light 主题切换
- 📱 **响应式** - 完美适配桌面端、平板和移动端
- 📥 **批量导出** - 单张直接下载，多张 ZIP 打包

## 演示

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bytedo/PurePixel)

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) / npm / yarn

### 安装

```bash
# 克隆项目
git clone https://github.com/bytedo/PurePixel.git
cd PurePixel

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 构建

```bash
# 生产环境构建
pnpm build

# 启动生产服务器
pnpm start
```

## 部署

### Vercel (推荐)

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bytedo/PurePixel)

或手动部署：

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 使用默认配置，点击 Deploy 即可

### 其他平台

本项目是标准的 Next.js 应用，支持部署到：

- **Netlify** - 导入 Git 仓库即可
- **Cloudflare Pages** - 使用 `pnpm build` 输出
- **Docker** - 使用官方 Next.js Dockerfile
- **自托管** - `pnpm build && pnpm start`

## 技术栈

| 技术                                            | 说明                    |
| ----------------------------------------------- | ----------------------- |
| [Next.js 16](https://nextjs.org/)               | React 框架 (App Router) |
| [TypeScript](https://www.typescriptlang.org/)   | 类型安全                |
| [Tailwind CSS v4](https://tailwindcss.com/)     | 样式引擎                |
| [Shadcn UI](https://ui.shadcn.com/)             | UI 组件库               |
| [Framer Motion](https://www.framer.com/motion/) | 动画库                  |
| [Zustand](https://zustand-demo.pmnd.rs/)        | 状态管理                |
| [JSZip](https://stuk.github.io/jszip/)          | ZIP 打包                |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── components/             # React 组件
│   ├── ui/                 # Shadcn UI 组件
│   ├── Dropzone.tsx        # 拖拽上传
│   ├── ControlPanel.tsx    # 控制面板
│   ├── ImageGrid.tsx       # 图片网格
│   ├── ComparisonSlider.tsx # 对比滑块
│   └── ThemeToggle.tsx     # 主题切换
├── store/                  # Zustand 状态管理
├── hooks/                  # 自定义 Hooks
├── workers/                # Web Worker
└── types/                  # TypeScript 类型
```

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/bytedo">bytedo</a>
</p>
