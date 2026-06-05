import { useState, useRef } from 'react';
import { Upload, Camera, X, FileText, Image } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface FileUploadProps {
  projectId: string;
  onUpload: (fileData: any) => void;
  onCancel: () => void;
}

export default function FileUpload({ projectId, onUpload, onCancel }: FileUploadProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('design');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isCameraSupported, openCamera, captureImage, cameraStream, videoRef, closeCamera } = useCamera();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      setName(file.name);
    }
  };

  const handleCapture = async () => {
    const imageData = await captureImage();
    if (imageData) {
      setPreview(imageData);
      setName(`photo_${Date.now()}.jpg`);
      closeCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview && !fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    try {
      const formData = new FormData();
      if (preview) {
        const base64Data = preview.includes(',') ? preview.split(',')[1] : preview;
        formData.append('file', base64Data);
        formData.append('fileName', name);
        formData.append('isBase64', 'true');
      } else if (fileInputRef.current?.files?.[0]) {
        formData.append('file', fileInputRef.current.files[0]);
      }
      formData.append('name', name);
      formData.append('category', category);

      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        onUpload(result.data);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!cameraStream && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文件名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="请输入文件名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文件类别
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="design">设计稿</option>
              <option value="venue">场地资料</option>
              <option value="photo">照片</option>
              <option value="contract">合同</option>
              <option value="other">其他</option>
            </select>
          </div>

          {preview && (
            <div className="relative">
              <img src={preview} alt="预览" className="w-full h-48 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 btn btn-secondary flex items-center justify-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </button>
            {isCameraSupported && (
              <button
                type="button"
                onClick={openCamera}
                className="flex-1 btn btn-secondary flex items-center justify-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                拍照
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
        </>
      )}

      {cameraStream && (
        <div className="space-y-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCapture}
              className="flex-1 btn btn-primary"
            >
              <Camera className="w-4 h-4 mr-2" />
              拍照
            </button>
            <button
              type="button"
              onClick={closeCamera}
              className="flex-1 btn btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={uploading || !name}>
          {uploading ? '上传中...' : '上传文件'}
        </button>
      </div>
    </form>
  );
}
