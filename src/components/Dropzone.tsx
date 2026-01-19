'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, Clipboard } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { toast } from 'sonner';

/**
 * Dropzone 拖拽上传组件
 * 特性：Glassmorphism 毛玻璃效果、Glow 光晕悬停、支持拖拽/点击/粘贴
 */
export function Dropzone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = useImageStore((state) => state.addFiles);

  /**
   * 处理文件添加
   */
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((file) => file.type.startsWith('image/'));
      const invalidCount = fileArray.length - imageFiles.length;

      if (invalidCount > 0) {
        toast.error(`已过滤 ${invalidCount} 个非图片文件`);
      }

      if (imageFiles.length > 0) {
        addFiles(imageFiles);
        toast.success(`成功添加 ${imageFiles.length} 张图片`);
      }
    },
    [addFiles]
  );

  /**
   * 拖拽事件处理
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  /**
   * 点击上传
   */
  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  /**
   * Ctrl+V 粘贴上传
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        handleFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles]);

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow 光晕效果 */}
      <AnimatePresence>
        {(isDragOver || isHovered) && (
          <motion.div
            className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Dropzone 主体 */}
      <motion.div
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed
          p-12 transition-all duration-300
          ${isDragOver 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-border bg-card/50 hover:border-indigo-400'
          }
        `}
        style={{
          // Glassmorphism 毛玻璃效果
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center gap-6 text-center">
          {/* 图标 */}
          <motion.div
            className={`
              rounded-full p-6 transition-colors duration-300
              ${isDragOver ? 'bg-indigo-500/20' : 'bg-muted'}
            `}
            animate={isDragOver ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {isDragOver ? (
              <ImagePlus className="h-12 w-12 text-indigo-500" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
          </motion.div>

          {/* 文字说明 */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragOver ? '释放以添加图片' : '拖拽图片到这里'}
            </h3>
            <p className="text-sm text-muted-foreground">
              或点击选择文件 • 支持 JPG, PNG, WEBP, GIF, AVIF
            </p>
          </div>

          {/* 快捷键提示 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clipboard className="h-3.5 w-3.5" />
            <span>按 Ctrl+V 粘贴图片</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
