'use client';

import { motion } from 'framer-motion';
import { Settings2, Wand2, FileType, ArrowDownUp, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImageStore } from '@/store/useImageStore';
import type { ImageFormat, ProcessMode } from '@/types';

/**
 * 控制面板组件
 * 包含格式选择、压缩开关、处理模式选择等控件
 */
export function ControlPanel() {
  const globalSettings = useImageStore((state) => state.globalSettings);
  const updateGlobalSettings = useImageStore((state) => state.updateGlobalSettings);
  const applyGlobalSettings = useImageStore((state) => state.applyGlobalSettings);
  const processImages = useImageStore((state) => state.processImages);
  const exportImages = useImageStore((state) => state.exportImages);
  const images = useImageStore((state) => state.images);
  const isProcessing = useImageStore((state) => state.isProcessing);

  const hasImages = images.length > 0;
  const hasDoneImages = images.some((img) => img.status === 'done');

  /**
   * 格式选项
   */
  const formatOptions: { value: ImageFormat; label: string; desc: string }[] = [
    { value: 'image/webp', label: 'WEBP', desc: '推荐，体积小兼容好' },
    { value: 'image/avif', label: 'AVIF', desc: '最新格式，压缩率最高' },
    { value: 'image/jpeg', label: 'JPEG', desc: '通用格式，兼容性最佳' },
    { value: 'image/png', label: 'PNG', desc: '无损格式，支持透明' },
    { value: 'image/gif', label: 'GIF', desc: '支持动画' },
  ];

  /**
   * 处理模式选项
   */
  const modeOptions: { value: ProcessMode; label: string; icon: React.ReactNode }[] = [
    { value: 'convert', label: '仅转换格式', icon: <FileType className="h-4 w-4" /> },
    { value: 'compress', label: '仅压缩', icon: <Minimize2 className="h-4 w-4" /> },
    { value: 'both', label: '转换 + 压缩', icon: <Wand2 className="h-4 w-4" /> },
  ];

  /**
   * 缩放比例选项
   */
  const scaleOptions = [0.25, 0.5, 0.75, 1, 1.5, 2];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full lg:w-80 lg:flex-shrink-0"
    >
      <Card className="lg:sticky lg:top-6 border-0 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-indigo-500" />
            处理设置
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 处理模式 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">处理模式</label>
            <div className="grid gap-2">
              {modeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={globalSettings.mode === option.value ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start gap-2 ${
                    globalSettings.mode === option.value
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : ''
                  }`}
                  onClick={() => updateGlobalSettings({ mode: option.value })}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 目标格式 - 仅在非"仅压缩"模式显示 */}
          {globalSettings.mode !== 'compress' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">目标格式</label>
              <Select
                value={globalSettings.format}
                onValueChange={(value) => updateGlobalSettings({ format: value as ImageFormat })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 无损压缩开关 - 仅在"转换 + 压缩"模式显示 */}
          {globalSettings.mode === 'both' && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">无损压缩</label>
                <p className="text-xs text-muted-foreground">保持图片质量不变</p>
              </div>
              <Button
                variant={globalSettings.enableCompression ? 'default' : 'outline'}
                size="sm"
                className={globalSettings.enableCompression ? 'bg-indigo-600' : ''}
                onClick={() =>
                  updateGlobalSettings({ enableCompression: !globalSettings.enableCompression })
                }
              >
                {globalSettings.enableCompression ? '已开启' : '已关闭'}
              </Button>
            </div>
          )}

          {/* 缩放比例 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">缩放比例</label>
              <span className="text-sm font-mono text-indigo-500">
                {globalSettings.scale}x
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {scaleOptions.map((scale) => (
                <Button
                  key={scale}
                  variant={globalSettings.scale === scale ? 'default' : 'outline'}
                  size="sm"
                  className={`min-w-0 ${
                    globalSettings.scale === scale ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  }`}
                  onClick={() => updateGlobalSettings({ scale })}
                >
                  {scale}x
                </Button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
              disabled={!hasImages || isProcessing}
              onClick={() => {
                applyGlobalSettings();
                processImages();
              }}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isProcessing ? '处理中...' : '开始处理'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              disabled={!hasDoneImages}
              onClick={exportImages}
            >
              <ArrowDownUp className="mr-2 h-4 w-4" />
              导出图片
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
