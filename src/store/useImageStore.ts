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
  resizeMode: 'none',
  scale: 1,
};

/**
 * 尺寸调整选项
 */
interface ResizeOptions {
  resizeMode: 'none' | 'scale' | 'custom';
  scale?: number;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

/**
 * 计算调整后的尺寸
 */
const calculateResizedDimensions = (
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): { width: number; height: number } => {
  if (options.resizeMode === 'none') {
    return { width: originalWidth, height: originalHeight };
  }

  if (options.resizeMode === 'scale' && options.scale) {
    return {
      width: Math.round(originalWidth * options.scale),
      height: Math.round(originalHeight * options.scale),
    };
  }

  if (options.resizeMode === 'custom') {
    let targetWidth = options.width || originalWidth;
    let targetHeight = options.height || originalHeight;

    if (options.maintainAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      
      if (options.width && !options.height) {
        // 只设置了宽度，根据宽高比计算高度
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else if (!options.width && options.height) {
        // 只设置了高度，根据宽高比计算宽度
        targetWidth = Math.round(targetHeight * aspectRatio);
      } else if (options.width && options.height) {
        // 都设置了，按照较小的缩放比例计算
        const scaleX = options.width / originalWidth;
        const scaleY = options.height / originalHeight;
        const scale = Math.min(scaleX, scaleY);
        targetWidth = Math.round(originalWidth * scale);
        targetHeight = Math.round(originalHeight * scale);
      }
    }

    return { width: targetWidth, height: targetHeight };
  }

  return { width: originalWidth, height: originalHeight };
};

/**
 * 检查浏览器是否支持指定格式
 */
const checkFormatSupport = async (format: string): Promise<boolean> => {
  if (format === 'image/avif') {
    // AVIF 支持检测
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob !== null && blob.size > 0),
        'image/avif',
        0.5
      );
    });
  }
  return true;
};

/**
 * 获取回退格式
 */
const getFallbackFormat = (format: string): string => {
  // 如果 AVIF 不支持，回退到 WebP
  if (format === 'image/avif') return 'image/webp';
  return format;
};

/**
 * 使用 Canvas 进行图片格式转换和尺寸调整
 * 增强移动端兼容性：crossOrigin 属性、格式回退、超时处理
 */
const convertImage = async (
  file: File,
  format: string,
  enableCompression: boolean,
  resizeOptions?: ResizeOptions
): Promise<Blob> => {
  // 检查格式支持
  const isFormatSupported = await checkFormatSupport(format);
  const targetFormat = isFormatSupported ? format : getFallbackFormat(format);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    // 设置超时（移动端网络较慢时防止无限等待）
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载超时，请重试'));
    }, 30000);
    
    // 设置 crossOrigin 属性，某些移动端 WebView 需要
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        // 计算目标尺寸
        const { width, height } = resizeOptions
          ? calculateResizedDimensions(img.width, img.height, resizeOptions)
          : { width: img.width, height: img.height };
        
        // 移动端内存限制检查：限制最大尺寸
        const maxDimension = 4096;
        let finalWidth = width;
        let finalHeight = height;
        
        if (width > maxDimension || height > maxDimension) {
          const scale = Math.min(maxDimension / width, maxDimension / height);
          finalWidth = Math.round(width * scale);
          finalHeight = Math.round(height * scale);
          console.warn(`图片尺寸超限，已自动缩小至 ${finalWidth}x${finalHeight}`);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }
        
        // 启用高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        // 延迟释放 ObjectURL，确保移动端完成绘制
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // 确定输出质量
        let quality = 1.0;
        if (enableCompression) {
          if (targetFormat === 'image/jpeg' || targetFormat === 'image/webp') {
            quality = 0.92;
          } else if (targetFormat === 'image/avif') {
            quality = 0.9;
          }
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              // Blob 生成失败，尝试回退到 PNG
              console.warn(`${targetFormat} 生成失败，回退到 PNG`);
              canvas.toBlob(
                (pngBlob) => {
                  if (pngBlob) {
                    resolve(pngBlob);
                  } else {
                    reject(new Error('图片转换失败，请尝试其他格式'));
                  }
                },
                'image/png',
                1.0
              );
            }
          },
          targetFormat,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(new Error('图片处理出错：' + (err instanceof Error ? err.message : '未知错误')));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败，请检查文件是否损坏'));
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
   * 添加图片文件（使用 FileReader 生成 Base64 预览，移动端兼容性更好）
   */
  addFiles: async (files: File[]) => {
    const { globalSettings } = get();
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    
    // 使用 FileReader 将文件转换为 Base64 Data URL
    const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
    };
    
    // 并行读取所有文件
    const previewUrls = await Promise.all(
      validFiles.map((file) => fileToDataUrl(file).catch(() => ''))
    );
    
    const newImages: ImageConfig[] = validFiles.map((file, index) => ({
      id: generateId(),
      file,
      previewUrl: previewUrls[index] || '',
      status: 'idle' as ProcessStatus,
      settings: {
        format: globalSettings.format,
        enableCompression: globalSettings.enableCompression,
        mode: globalSettings.mode,
        maintainAspectRatio: globalSettings.maintainAspectRatio,
        scale: globalSettings.scale,
        width: globalSettings.width,
        height: globalSettings.height,
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
          width: globalSettings.width,
          height: globalSettings.height,
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
      const { globalSettings } = get();
      const { mode, format, enableCompression, scale, width, height, maintainAspectRatio } = image.settings;

      // 构建尺寸调整选项
      const resizeOptions: ResizeOptions = {
        resizeMode: globalSettings.resizeMode,
        scale,
        width,
        height,
        maintainAspectRatio,
      };

      if (mode === 'convert') {
        // 仅格式转换（包含尺寸调整）
        resultBlob = await convertImage(image.file, format, false, resizeOptions);
      } else if (mode === 'compress') {
        // 仅压缩（包含尺寸调整）
        const resized = await convertImage(image.file, image.file.type, false, resizeOptions);
        resultBlob = await compressImage(resized);
      } else {
        // 两者都做：先转换（含尺寸调整）再压缩
        const converted = await convertImage(image.file, format, enableCompression, resizeOptions);
        if (enableCompression) {
          resultBlob = await compressImage(converted);
        } else {
          resultBlob = converted;
        }
      }

      // 使用 FileReader 将 Blob 转换为 Base64 Data URL（移动端兼容性更好）
      const blobToDataUrl = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Blob 读取失败'));
          reader.readAsDataURL(blob);
        });
      };

      const resultUrl = await blobToDataUrl(resultBlob);
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
