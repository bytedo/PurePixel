// 严格遵循类型定义

/**
 * 支持的图片格式类型
 */
export type ImageFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "image/gif";

/**
 * 处理状态
 */
export type ProcessStatus = "idle" | "processing" | "done" | "error";

/**
 * 处理模式
 */
export type ProcessMode = "convert" | "compress" | "both";

/**
 * 图片配置接口
 */
export interface ImageConfig {
  id: string;
  file: File;
  previewUrl: string; // ObjectURL
  status: ProcessStatus;
  errorMessage?: string;
  settings: {
    // 格式转换设置
    format: ImageFormat;
    // 无损压缩开关（独立于格式转换）
    enableCompression: boolean;
    // 处理模式：仅转换、仅压缩、两者都做
    mode: ProcessMode;
    // 尺寸设置
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
    scale?: number; // 0.5x, 1x, 2x 等
  };
  result?: {
    blob: Blob;
    url: string;
    size: number;
    originalSize: number;
    compressionRatio: number; // e.g., 0.65 表示压缩了 65%
  };
}

/**
 * 尺寸调整模式
 */
export type ResizeMode = 'none' | 'scale' | 'custom';

/**
 * 全局设置，应用于所有新添加的图片
 */
export interface GlobalSettings {
  format: ImageFormat;
  enableCompression: boolean;
  mode: ProcessMode;
  maintainAspectRatio: boolean;
  resizeMode: ResizeMode;
  scale?: number;
  width?: number;
  height?: number;
}

/**
 * 应用状态接口
 */
export interface AppState {
  images: ImageConfig[];
  globalSettings: GlobalSettings;
  isProcessing: boolean;
}

/**
 * 应用操作接口
 */
export interface AppActions {
  addFiles: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  updateSettings: (
    id: string,
    settings: Partial<ImageConfig["settings"]>,
  ) => void;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  applyGlobalSettings: () => void;
  processImages: () => Promise<void>;
  processSingleImage: (id: string) => Promise<void>;
  exportImages: () => Promise<void>;
  clearAll: () => void;
}
