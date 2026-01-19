/**
 * 图片处理 Web Worker
 * 将耗时的图片转换和压缩操作移至后台线程，避免阻塞主线程
 */

// Worker 消息类型
export interface WorkerMessage {
  type: 'convert' | 'compress' | 'both';
  id: string;
  imageData: ArrayBuffer;
  mimeType: string;
  format: string;
  enableCompression: boolean;
}

export interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  id: string;
  result?: {
    blob: Blob;
    size: number;
  };
  progress?: number;
  error?: string;
}

// 监听主线程消息
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, id, imageData, mimeType, format, enableCompression } = e.data;

  try {
    // 发送进度更新
    self.postMessage({ type: 'progress', id, progress: 10 } as WorkerResponse);

    // 创建 Blob 用于处理
    const blob = new Blob([imageData], { type: mimeType });
    const imageBitmap = await createImageBitmap(blob);

    self.postMessage({ type: 'progress', id, progress: 30 } as WorkerResponse);

    // 创建 OffscreenCanvas 进行处理
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }

    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    self.postMessage({ type: 'progress', id, progress: 50 } as WorkerResponse);

    // 确定输出格式和质量
    let outputFormat = format;
    let quality = 1.0;

    if (type === 'convert' || type === 'both') {
      // 格式转换
      if (enableCompression) {
        // 无损压缩使用较高质量
        if (format === 'image/jpeg' || format === 'image/webp') {
          quality = 0.92;
        } else if (format === 'image/avif') {
          quality = 0.9;
        }
      }
    } else if (type === 'compress') {
      // 仅压缩，保持原格式
      outputFormat = mimeType;
      quality = 0.92;
    }

    self.postMessage({ type: 'progress', id, progress: 70 } as WorkerResponse);

    // 转换为 Blob
    const resultBlob = await canvas.convertToBlob({
      type: outputFormat,
      quality,
    });

    self.postMessage({ type: 'progress', id, progress: 90 } as WorkerResponse);

    // 返回结果
    self.postMessage({
      type: 'success',
      id,
      result: {
        blob: resultBlob,
        size: resultBlob.size,
      },
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : '处理失败',
    } as WorkerResponse);
  }
};
