"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { api } from "@/lib/trpc/client";

interface PhotoUploadProps {
  onUploadComplete?: (photoId: string, url: string) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
  uploadedPhotoId?: string;
}

export function PhotoUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept = "image/*",
  className,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = api.repair.uploadPhoto.useMutation({
    onSuccess: (data, variables) => {
      const uploadingFile = uploading.find(
        (u) => u.file.name === variables.fileName && u.file.size === variables.fileSize
      );
      if (uploadingFile) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadingFile.id
              ? { ...u, progress: 100, uploadedPhotoId: data.id }
              : u
          )
        );
        onUploadComplete?.(data.id, data.url);
      }
    },
    onError: (error, variables) => {
      const uploadingFile = uploading.find(
        (u) => u.file.name === variables.fileName && u.file.size === variables.fileSize
      );
      if (uploadingFile) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadingFile.id ? { ...u, error: error.message } : u
          )
        );
      }
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploading.length + files.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 超过 ${formatFileSize(maxSize)} 限制`);
        continue;
      }

      const uploadingId = Math.random().toString(36).substr(2, 9);
      setUploading((prev) => [
        ...prev,
        { id: uploadingId, file, progress: 50 },
      ]);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const storageKey = `photos/${uploadingId}/${file.name}`;
        const storageUrl = `/api/files/${uploadingId}/${encodeURIComponent(file.name)}`;

        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadingId ? { ...u, progress: 75 } : u
          )
        );

        uploadPhoto.mutate({
          url: storageUrl,
          key: storageKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeUploading = (id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className={className}>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
      >
        <Upload className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
        <p className="text-sm font-medium text-zinc-700">点击或拖拽上传照片</p>
        <p className="text-xs text-zinc-500 mt-1">
          支持 JPG、PNG、GIF 格式，单张不超过 {formatFileSize(maxSize)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploading.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploading.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
            >
              <ImageIcon className="h-8 w-8 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-700 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(item.file.size)}
                </p>
                {item.error ? (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                ) : item.uploadedPhotoId ? (
                  <p className="text-xs text-green-600 mt-1">上传成功</p>
                ) : (
                  <div className="mt-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeUploading(item.id)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
