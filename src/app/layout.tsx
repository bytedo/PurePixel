import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

// 配置 Inter 字体（根据设计规范）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 网站基础 URL 配置（部署时通过环境变量 NEXT_PUBLIC_SITE_URL 设置）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

export const metadata: Metadata = {
  // 基础 Meta
  title: {
    default: "PurePixel - 在线图片格式转换与压缩工具",
    template: "%s | PurePixel",
  },
  description:
    "纯前端、高性能的图片格式转换与无损压缩应用。支持 JPG、PNG、WEBP、AVIF 等格式互转，所有处理在浏览器本地完成，保护您的隐私安全，无需上传服务器。",
  keywords: [
    "图片转换",
    "图片压缩",
    "图片格式转换",
    "WEBP转换",
    "AVIF转换",
    "PNG转JPG",
    "在线图片压缩",
    "图片无损压缩",
    "隐私安全",
    "在线工具",
    "前端图片处理",
    "image converter",
    "image compressor",
  ],
  authors: [{ name: "PurePixel Team" }],
  creator: "PurePixel",
  publisher: "PurePixel",

  // Canonical URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },

  // 搜索引擎爬虫配置
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn 等)
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "PurePixel",
    title: "PurePixel - 在线图片格式转换与压缩工具",
    description:
      "纯前端、高性能的图片格式转换与无损压缩应用。支持 JPG、PNG、WEBP、AVIF 等格式，保护您的隐私安全。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PurePixel - 在线图片格式转换与压缩工具",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "PurePixel - 在线图片格式转换与压缩工具",
    description:
      "纯前端、高性能的图片格式转换与无损压缩应用。支持 JPG、PNG、WEBP、AVIF 等格式，保护您的隐私安全。",
    images: ["/og-image.png"],
    creator: "@purepixel",
  },

  // 图标配置
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // PWA Manifest
  manifest: "/manifest.json",

  // 其他 Meta
  category: "technology",
  classification: "Image Processing Tool",
};

// Viewport 配置（移动端优化）
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <JsonLd />
        {children}
        <Toaster 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            className: 'backdrop-blur-sm',
          }}
        />
      </body>
    </html>
  );
}
