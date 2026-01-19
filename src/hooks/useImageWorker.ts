'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorkerMessage, WorkerResponse } from '@/workers/image.worker';

type WorkerCallback = (response: WorkerResponse) => void;

/**
 * 图片处理 Worker Hook
 * 管理 Web Worker 的生命周期和消息通信
 */
export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, WorkerCallback>>(new Map());

  // 初始化 Worker
  useEffect(() => {
    // 在客户端动态创建 Worker
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/image.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // 监听 Worker 消息
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id } = e.data;
        const callback = callbacksRef.current.get(id);
        if (callback) {
          callback(e.data);
          // 处理完成后移除回调
          if (e.data.type === 'success' || e.data.type === 'error') {
            callbacksRef.current.delete(id);
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * 处理单张图片
   */
  const processImage = useCallback(
    async (
      id: string,
      file: File,
      format: string,
      mode: 'convert' | 'compress' | 'both',
      enableCompression: boolean,
      onProgress?: (progress: number) => void
    ): Promise<{ blob: Blob; size: number }> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker 未初始化'));
          return;
        }

        // 读取文件为 ArrayBuffer
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;

          // 设置回调
          callbacksRef.current.set(id, (response: WorkerResponse) => {
            if (response.type === 'progress' && onProgress) {
              onProgress(response.progress || 0);
            } else if (response.type === 'success' && response.result) {
              resolve(response.result);
            } else if (response.type === 'error') {
              reject(new Error(response.error || '处理失败'));
            }
          });

          // 发送消息给 Worker
          const message: WorkerMessage = {
            type: mode,
            id,
            imageData: arrayBuffer,
            mimeType: file.type,
            format,
            enableCompression,
          };
          workerRef.current?.postMessage(message, [arrayBuffer]);
        };

        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      });
    },
    []
  );

  /**
   * 检查 Worker 是否可用
   */
  const isWorkerAvailable = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  return {
    processImage,
    isWorkerAvailable,
  };
}
