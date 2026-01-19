import { create } from 'zustand';
import type { ImageConfig, GlobalSettings, AppState, AppActions, ProcessStatus } from '@/types';
import JSZip from 'jszip';

/**
 * 生成唯一 ID
 */
const generateId = () => `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * 清理文件名中的特殊字符
 */
const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
};

/**
 * 获取格式对应的文件扩展名
 */
const getExtension = (format: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };
  return map[format] || 'png';
};

/**
 * 默认全局设置
 */
const defaultGlobalSettings: GlobalSettings = {
  format: 'image/webp',
  enableCompression: true,
  mode: 'convert',
  maintainAspectRatio: true,
  scale: 1,
};

/**
 * 使用 Canvas 进行图片格式转换
 */
const convertImage = async (
  file: File,
  format: string,
  enableCompression: boolean
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      // 对于无损压缩：
      // - PNG: 使用最高质量 (1.0)
      // - JPEG/WEBP: 使用 0.92 质量（接近无损）
      // - AVIF: 使用 0.9 质量
      let quality = 1.0;
      if (enableCompression) {
        if (format === 'image/jpeg' || format === 'image/webp') {
          quality = 0.92;
        } else if (format === 'image/avif') {
          quality = 0.9;
        }
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('转换失败'));
          }
        },
        format,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    
    img.src = url;
  });
};

/**
 * 使用 browser-image-compression 进行无损压缩
 */
const compressImage = async (file: File | Blob): Promise<Blob> => {
  // 动态导入避免 SSR 问题
  const imageCompression = (await import('browser-image-compression')).default;
  
  const options = {
    maxSizeMB: 10, // 最大文件大小
    maxWidthOrHeight: 4096, // 最大宽高
    useWebWorker: true,
    preserveExif: true,
    // 无损压缩：使用较高的质量值
    initialQuality: 0.95,
  };
  
  const fileToCompress = file instanceof File ? file : new File([file], 'image.png', { type: file.type });
  return await imageCompression(fileToCompress, options);
};

/**
 * Zustand 图片状态管理
 */
export const useImageStore = create<AppState & AppActions>((set, get) => ({
  images: [],
  globalSettings: defaultGlobalSettings,
  isProcessing: false,

  /**
   * 添加图片文件
   */
  addFiles: (files: File[]) => {
    const { globalSettings } = get();
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    
    const newImages: ImageConfig[] = validFiles.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle' as ProcessStatus,
      settings: {
        format: globalSettings.format,
        enableCompression: globalSettings.enableCompression,
        mode: globalSettings.mode,
        maintainAspectRatio: globalSettings.maintainAspectRatio,
        scale: globalSettings.scale,
      },
    }));
    
    set((state) => ({
      images: [...state.images, ...newImages],
    }));
  },

  /**
   * 移除图片
   */
  removeImage: (id: string) => {
    set((state) => {
      const image = state.images.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
        if (image.result?.url) {
          URL.revokeObjectURL(image.result.url);
        }
      }
      return {
        images: state.images.filter((img) => img.id !== id),
      };
    });
  },

  /**
   * 更新单张图片设置
   */
  updateSettings: (id: string, settings: Partial<ImageConfig['settings']>) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? { ...img, settings: { ...img.settings, ...settings }, status: 'idle' as ProcessStatus, result: undefined }
          : img
      ),
    }));
  },

  /**
   * 更新全局设置
   */
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => {
    set((state) => ({
      globalSettings: { ...state.globalSettings, ...settings },
    }));
  },

  /**
   * 将全局设置应用到所有图片
   */
  applyGlobalSettings: () => {
    const { globalSettings } = get();
    set((state) => ({
      images: state.images.map((img) => ({
        ...img,
        settings: {
          ...img.settings,
          format: globalSettings.format,
          enableCompression: globalSettings.enableCompression,
          mode: globalSettings.mode,
          maintainAspectRatio: globalSettings.maintainAspectRatio,
          scale: globalSettings.scale,
        },
        status: 'idle' as ProcessStatus,
        result: undefined,
      })),
    }));
  },

  /**
   * 处理单张图片
   */
  processSingleImage: async (id: string) => {
    const { images } = get();
    const image = images.find((img) => img.id === id);
    if (!image) return;

    // 设置处理中状态
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, status: 'processing' as ProcessStatus } : img
      ),
    }));

    try {
      let resultBlob: Blob;
      const { mode, format, enableCompression } = image.settings;

      if (mode === 'convert') {
        // 仅格式转换
        resultBlob = await convertImage(image.file, format, false);
      } else if (mode === 'compress') {
        // 仅压缩（保持原格式）
        resultBlob = await compressImage(image.file);
      } else {
        // 两者都做：先转换再压缩
        const converted = await convertImage(image.file, format, enableCompression);
        if (enableCompression) {
          resultBlob = await compressImage(converted);
        } else {
          resultBlob = converted;
        }
      }

      const resultUrl = URL.createObjectURL(resultBlob);
      const compressionRatio = 1 - resultBlob.size / image.file.size;

      set((state) => ({
        images: state.images.map((img) =>
          img.id === id
            ? {
                ...img,
                status: 'done' as ProcessStatus,
                result: {
                  blob: resultBlob,
                  url: resultUrl,
                  size: resultBlob.size,
                  originalSize: image.file.size,
                  compressionRatio,
                },
              }
            : img
        ),
      }));
    } catch (error) {
      set((state) => ({
        images: state.images.map((img) =>
          img.id === id
            ? {
                ...img,
                status: 'error' as ProcessStatus,
                errorMessage: error instanceof Error ? error.message : '处理失败',
              }
            : img
        ),
      }));
    }
  },

  /**
   * 批量处理所有图片
   */
  processImages: async () => {
    const { images, processSingleImage } = get();
    set({ isProcessing: true });

    const pendingImages = images.filter((img) => img.status !== 'done');
    
    // 并行处理所有图片
    await Promise.all(pendingImages.map((img) => processSingleImage(img.id)));

    set({ isProcessing: false });
  },

  /**
   * 导出所有已处理的图片
   */
  exportImages: async () => {
    const { images } = get();
    const doneImages = images.filter((img) => img.status === 'done' && img.result);

    if (doneImages.length === 0) return;

    if (doneImages.length === 1) {
      // 单张图片直接下载
      const img = doneImages[0];
      if (!img.result) return;
      
      const baseName = img.file.name.replace(/\.[^/.]+$/, '');
      const ext = getExtension(img.settings.format);
      const fileName = `${sanitizeFileName(baseName)}_purepixel.${ext}`;
      
      const link = document.createElement('a');
      link.href = img.result.url;
      link.download = fileName;
      link.click();
    } else {
      // 多张图片打包 ZIP
      const zip = new JSZip();
      
      for (const img of doneImages) {
        if (!img.result) continue;
        
        const baseName = img.file.name.replace(/\.[^/.]+$/, '');
        const ext = getExtension(img.settings.format);
        const fileName = `${sanitizeFileName(baseName)}_purepixel.${ext}`;
        
        zip.file(fileName, img.result.blob);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `purepixel_images_${Date.now()}.zip`;
      link.click();
      
      URL.revokeObjectURL(zipUrl);
    }
  },

  /**
   * 清除所有图片
   */
  clearAll: () => {
    const { images } = get();
    
    // 清理所有 ObjectURL
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.result?.url) {
        URL.revokeObjectURL(img.result.url);
      }
    });
    
    set({ images: [] });
  },
}));
