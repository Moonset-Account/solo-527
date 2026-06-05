'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { offlineStorage } from '@/lib/offline-storage';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  uploadType?: string;
  accept?: string;
  maxSize?: number;
  label?: string;
  className?: string;
  allowCamera?: boolean;
}

export function FileUpload({
  value,
  onChange,
  uploadType = 'general',
  accept = 'image/*,application/pdf',
  maxSize = 10 * 1024 * 1024,
  label = '上传文件',
  className = '',
  allowCamera = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (!navigator.onLine) {
        const offlineKey = await offlineStorage.savePhoto(file);
        setPreview(offlineKey);
        onChange(offlineKey);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '上传失败');
      }

      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const clearFile = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const isImage = preview && (/\.(jpg|jpeg|png|gif|webp)$/i.test(preview) || preview.startsWith('http') || preview.startsWith('blob:'));
  const isOffline = preview?.startsWith('drama_club_photo_');

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          {isImage || isOffline ? (
            <div className="relative">
              {isOffline ? (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="预览"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
              )}
              {isOffline && (
                <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  离线缓存，联网后自动上传
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {preview.split('/').pop()}
                </p>
                <p className="text-xs text-gray-500">点击重新上传</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <div className="text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              点击或拖拽文件到此处上传
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                <span>{uploading ? '上传中...' : '选择文件'}</span>
              </button>
              {allowCamera && (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Camera className="h-5 w-5" />
                  <span>拍照</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              支持 JPG、PNG、PDF、Word、Excel 格式，最大 10MB
            </p>
            {!navigator.onLine && (
              <p className="text-xs text-yellow-600 mt-2">
                当前离线，文件将暂存本地，联网后自动上传
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
}
