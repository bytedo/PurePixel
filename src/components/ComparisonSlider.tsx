'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';

interface ComparisonSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSize?: number;
  afterSize?: number;
}

/**
 * Before/After 对比滑块组件
 * 支持鼠标和触摸拖动
 */
export function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = '原图',
  afterLabel = '处理后',
  beforeSize,
  afterSize,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 计算滑块位置
   */
  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  /**
   * 鼠标事件处理
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.clientX);
    },
    [isDragging, updateSliderPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * 触摸事件处理
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.touches[0].clientX);
    },
    [isDragging, updateSliderPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * 全局事件监听
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  /**
   * 格式化文件大小
   */
  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * 压缩比例
   */
  const compressionRatio = beforeSize && afterSize 
    ? ((1 - afterSize / beforeSize) * 100).toFixed(0)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full select-none overflow-hidden rounded-xl bg-muted"
    >
      <div
        ref={containerRef}
        className="relative aspect-video cursor-ew-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After 图片 (底层) */}
        <div className="absolute inset-0">
          <img
            src={afterSrc}
            alt={afterLabel}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        {/* Before 图片 (裁切层) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        {/* 滑块手柄 */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* 竖线 */}
          <div className="h-full w-0.5 bg-white shadow-lg" />

          {/* 手柄按钮 */}
          <motion.div
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              flex h-10 w-10 items-center justify-center
              rounded-full bg-white shadow-xl
              transition-transform
              ${isDragging ? 'scale-110' : ''}
            `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeftRight className="h-5 w-5 text-gray-700" />
          </motion.div>
        </div>

        {/* 标签 */}
        <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {beforeLabel}
          {beforeSize && <span className="ml-1.5 opacity-75">{formatSize(beforeSize)}</span>}
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {afterLabel}
          {afterSize && <span className="ml-1.5 opacity-75">{formatSize(afterSize)}</span>}
        </div>

        {/* 压缩比例标签 */}
        {compressionRatio && Number(compressionRatio) > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
            ⬇️ 节省 {compressionRatio}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
