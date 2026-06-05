'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, QrCode, Upload, X, Check, Image as ImageIcon, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useOfflineStore } from '@/store/offline';
import { useAuthStore } from '@/store/auth';
import jsQR from 'jsqr';

type CheckinStatus = 'idle' | 'checking' | 'success' | 'error';

export default function MobileScanPage() {
  const [mode, setMode] = useState<'scan' | 'photo'>('scan');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [matchId, setMatchId] = useState('');
  const [photoType, setPhotoType] = useState<'EVIDENCE' | 'CHECKIN' | 'OTHER'>('EVIDENCE');
  const [isUploading, setIsUploading] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>('idle');
  const [checkinMessage, setCheckinMessage] = useState('');
  const [scannedMatchId, setScannedMatchId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { user } = useAuthStore();
  const { isOnline, addOfflineAction } = useOfflineStore();

  const getUserId = useCallback(() => {
    if (user?._id) {
      return user._id;
    }
    let guestId = localStorage.getItem('guest_user_id');
    if (!guestId) {
      guestId = 'guest_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_user_id', guestId);
    }
    return guestId;
  }, [user]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  }, []);

  const handleCheckin = useCallback(async (decodedMatchId: string) => {
    if (checkinStatus === 'checking' || checkinStatus === 'success') return;
    
    setCheckinStatus('checking');
    setCheckinMessage('');
    
    const checkinData = {
      matchId: decodedMatchId,
      userId: getUserId(),
      type: 'FIELD_STAFF' as const,
    };

    try {
      if (isOnline) {
        const response = await fetch('/api/mobile/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkinData),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          setCheckinStatus('success');
          setCheckinMessage('签到成功！');
        } else {
          setCheckinStatus('error');
          setCheckinMessage(result.message || '签到失败');
        }
      } else {
        await addOfflineAction({
          type: 'CHECKIN',
          payload: checkinData,
        });
        setCheckinStatus('success');
        setCheckinMessage('离线签到已保存，将在恢复网络后同步');
      }
    } catch (error) {
      setCheckinStatus('error');
      setCheckinMessage('签到失败，请重试');
      console.error('Checkin error:', error);
    }
  }, [checkinStatus, getUserId, isOnline, addOfflineAction]);

  const captureAndDecode = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || checkinStatus === 'checking' || checkinStatus === 'success') {
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      const decodedMatchId = code.data.trim();
      if (decodedMatchId && decodedMatchId !== scannedMatchId) {
        setScannedMatchId(decodedMatchId);
        setMatchId(decodedMatchId);
        handleCheckin(decodedMatchId);
      }
    }
  }, [checkinStatus, scannedMatchId, handleCheckin]);

  useEffect(() => {
    if (mode === 'scan') {
      startCamera();
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
          }
          scanIntervalRef.current = setInterval(captureAndDecode, 500);
        };
      }
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera, captureAndDecode]);

  const resetScan = () => {
    setCheckinStatus('idle');
    setCheckinMessage('');
    setScannedMatchId(null);
  };

  const handlePhotoCapture = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhotos([...capturedPhotos, dataUrl]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCapturedPhotos([...capturedPhotos, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(capturedPhotos.filter((_, i) => i !== index));
  };

  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64);
    return response.blob();
  };

  const uploadPhotos = async () => {
    if (capturedPhotos.length === 0 || !matchId) return;
    
    setIsUploading(true);
    
    try {
      for (const photo of capturedPhotos) {
        const blob = await base64ToBlob(photo);
        const formData = new FormData();
        formData.append('file', blob, `photo_${Date.now()}.jpg`);
        formData.append('matchId', matchId);
        formData.append('type', photoType);

        if (isOnline) {
          await fetch('/api/mobile/upload', {
            method: 'POST',
            body: formData,
          });
        } else {
          await addOfflineAction({
            type: 'PHOTO_UPLOAD',
            payload: {
              matchId,
              type: photoType,
              photoData: photo,
            },
          });
        }
      }
      setCapturedPhotos([]);
      alert('上传成功！');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
          {mode === 'scan' ? <QrCode className="w-6 h-6 text-primary" /> : <Camera className="w-6 h-6 text-primary" />}
          移动端工具
        </h1>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          isOnline ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? '在线' : '离线'}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('scan'); resetScan(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'scan' 
              ? 'bg-primary text-white' 
              : 'bg-surface text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <QrCode className="w-4 h-4 inline mr-2" />
          扫码签到
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'photo' 
              ? 'bg-primary text-white' 
              : 'bg-surface text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          拍照上传
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {mode === 'scan' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary/50 rounded-lg">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4">
          {mode === 'scan' ? (
            <div className="space-y-4">
              {checkinStatus === 'idle' && (
                <div className="text-center text-text-secondary text-sm">
                  对准比赛场地二维码，系统将自动识别
                </div>
              )}
              
              {checkinStatus === 'checking' && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在签到...
                  </div>
                </div>
              )}
              
              {checkinStatus === 'success' && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-success text-sm">
                    <Check className="w-4 h-4" />
                    {checkinMessage}
                  </div>
                  {scannedMatchId && (
                    <div className="mt-2 text-xs text-text-secondary">
                      比赛ID: {scannedMatchId}
                    </div>
                  )}
                  <button
                    onClick={resetScan}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    继续扫码
                  </button>
                </div>
              )}
              
              {checkinStatus === 'error' && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <div className="flex items-center gap-2 text-danger text-sm">
                    <X className="w-4 h-4" />
                    {checkinMessage || '签到失败'}
                  </div>
                  <button
                    onClick={resetScan}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    重新扫码
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handlePhotoCapture}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all"
              >
                <Camera className="w-5 h-5 inline mr-2" />
                拍照
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-surface-hover hover:bg-border text-text-secondary rounded-lg font-medium transition-all"
              >
                <Upload className="w-5 h-5 inline mr-2" />
                从相册选择
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {mode === 'photo' && capturedPhotos.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">
              已拍摄 ({capturedPhotos.length})
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">比赛ID</label>
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="输入或扫码获取比赛ID"
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">照片类型</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="EVIDENCE">申诉证据</option>
                <option value="CHECKIN">签到照片</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <button
              onClick={uploadPhotos}
              disabled={isUploading || !matchId}
              className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
            >
              {isUploading ? '上传中...' : (
                <>
                  <ImageIcon className="w-5 h-5 inline mr-2" />
                  {isOnline ? '上传照片' : '保存到离线队列'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
        <h3 className="font-bold text-text-primary text-sm mb-2">使用说明</h3>
        <ul className="text-xs text-text-secondary space-y-1.5">
          <li>• 扫码：对准比赛场地二维码完成签到</li>
          <li>• 拍照：现场照片可作为申诉证据上传</li>
          <li>• 离线：无网络时数据自动保存，恢复后同步</li>
          <li>• 可在「离线数据中心」查看同步状态</li>
        </ul>
      </div>
    </div>
  );
}
