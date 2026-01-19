'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Sparkles, Trash2, Shield, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/Dropzone';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ControlPanel } from '@/components/ControlPanel';
import { ImageGrid } from '@/components/ImageGrid';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { useImageStore } from '@/store/useImageStore';

/**
 * PurePixel 主页面
 */
export default function Home() {
  const images = useImageStore((state) => state.images);
  const clearAll = useImageStore((state) => state.clearAll);

  const hasImages = images.length > 0;

  // 找到第一张已处理的图片用于展示对比滑块
  const firstDoneImage = useMemo(
    () => images.find((img) => img.status === 'done' && img.result),
    [images]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-[1000px] w-[1000px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 h-[1000px] w-[1000px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-pink-500/5 to-transparent blur-3xl" />
      </div>

      {/* 导航栏 */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              PurePixel
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasImages && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                清除全部
              </Button>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!hasImages ? (
            /* Hero 区域 - 无图片时显示 */
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12 py-8"
            >
              {/* 标题区域 */}
              <div className="text-center space-y-4 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-500"
                >
                  <Sparkles className="h-4 w-4" />
                  纯前端处理，隐私安全
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold text-foreground"
                >
                  高性能图片
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    格式转换
                  </span>
                  与
                  <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                    无损压缩
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-muted-foreground"
                >
                  支持 JPG、PNG、WEBP、AVIF 等格式转换。
                  所有处理都在浏览器本地完成，无需上传服务器。
                </motion.p>
              </div>

              {/* Dropzone */}
              <Dropzone />

              {/* 特性卡片 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
              >
                <FeatureCard
                  icon={<Shield className="h-6 w-6" />}
                  title="隐私安全"
                  description="图片不会上传到任何服务器，完全在本地处理"
                />
                <FeatureCard
                  icon={<Zap className="h-6 w-6" />}
                  title="极致性能"
                  description="使用 Canvas 和 Web Worker 多线程处理"
                />
                <FeatureCard
                  icon={<Lock className="h-6 w-6" />}
                  title="无损压缩"
                  description="智能压缩算法，保持图片质量不变"
                />
              </motion.div>
            </motion.div>
          ) : (
            /* 工作区 - 有图片时显示 */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 继续添加图片区域 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    图片列表
                  </h2>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-500">
                    {images.length} 张
                  </span>
                </div>
                <Dropzone />
              </div>

              {/* 主工作区：Split View 布局 */}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* 左侧：图片列表 */}
                <div className="flex-1 space-y-6">
                  {/* 对比滑块 - 显示第一张已处理的图片 */}
                  {firstDoneImage && firstDoneImage.result && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">效果对比</h3>
                      <ComparisonSlider
                        beforeSrc={firstDoneImage.previewUrl}
                        afterSrc={firstDoneImage.result.url}
                        beforeSize={firstDoneImage.result.originalSize}
                        afterSize={firstDoneImage.result.size}
                      />
                    </div>
                  )}

                  {/* 图片网格 */}
                  <ImageGrid />
                </div>

                {/* 右侧：控制面板 */}
                <ControlPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>PurePixel - 纯前端图片处理工具 | 所有处理都在浏览器本地完成</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * 特性卡片组件
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl bg-card/50 p-6 backdrop-blur-sm border border-border/50 transition-all hover:border-indigo-500/50 hover:shadow-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
