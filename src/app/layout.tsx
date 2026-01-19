import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 配置 Inter 字体（根据设计规范）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PurePixel - 在线图片格式转换与压缩工具",
  description: "纯前端、高性能的图片格式转换与无损压缩应用。支持 JPG、PNG、WEBP、AVIF 等格式，保护您的隐私，无需上传服务器。",
  keywords: ["图片转换", "图片压缩", "WEBP", "AVIF", "在线工具", "隐私安全"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
