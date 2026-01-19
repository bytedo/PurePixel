'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2, AlertCircle, FileImage, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useImageStore } from '@/store/useImageStore';
import type { ImageConfig } from '@/types';

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * 图片卡片组件
 */
function ImageCard({ image }: { image: ImageConfig }) {
  const removeImage = useImageStore((state) => state.removeImage);
  const processSingleImage = useImageStore((state) => state.processSingleImage);

  /**
   * 状态标签渲染
   */
  const statusBadge = useMemo(() => {
    switch (image.status) {
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            处理中
          </span>
        );
      case 'done':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
            <Check className="h-3 w-3" />
            完成
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-500">
            <AlertCircle className="h-3 w-3" />
            失败
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <FileImage className="h-3 w-3" />
            待处理
          </span>
        );
    }
  }, [image.status]);

  /**
   * 压缩信息显示
   */
  const compressionInfo = useMemo(() => {
    if (!image.result) return null;

    const savedPercent = Math.abs(image.result.compressionRatio * 100).toFixed(0);
    const isSmaller = image.result.compressionRatio > 0;

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {formatFileSize(image.result.originalSize)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={isSmaller ? 'text-emerald-500' : 'text-amber-500'}>
          {formatFileSize(image.result.size)}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 font-medium ${
            isSmaller ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
          }`}
        >
          {isSmaller ? '↓' : '↑'} {savedPercent}%
        </span>
      </div>
    );
  }, [image.result]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
        {/* 删除按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 bg-background/80 backdrop-blur-sm"
          onClick={() => removeImage(image.id)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 图片预览 */}
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {/* 原图 */}
          <img
            src={image.previewUrl}
            alt={image.file.name}
            loading="eager"
            decoding="async"
            onError={(e) => {
              // 图片加载失败时显示占位符
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239CA3AF" font-size="12">加载失败</text></svg>';
            }}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              image.result ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {/* 处理后的图 */}
          {image.result && (
            <img
              src={image.result.url}
              alt={`${image.file.name} - 已处理`}
              loading="eager"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239CA3AF" font-size="12">加载失败</text></svg>';
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* 处理中遮罩 */}
          {image.status === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}
        </div>

        {/* 信息区域 */}
        <div className="p-3 space-y-2">
          {/* 文件名和状态 */}
          <div className="flex items-start justify-between gap-2">
            <p className="flex-1 truncate text-sm font-medium text-foreground" title={image.file.name}>
              {image.file.name}
            </p>
            {statusBadge}
          </div>

          {/* 压缩结果 */}
          {compressionInfo}

          {/* 错误信息 */}
          {image.status === 'error' && image.errorMessage && (
            <p className="text-xs text-rose-500">{image.errorMessage}</p>
          )}

          {/* 重新处理按钮 */}
          {(image.status === 'idle' || image.status === 'error') && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => processSingleImage(image.id)}
            >
              {image.status === 'error' ? '重试' : '处理'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 图片网格列表组件
 */
export function ImageGrid() {
  const images = useImageStore((state) => state.images);

  if (images.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </motion.div>
  );
}
