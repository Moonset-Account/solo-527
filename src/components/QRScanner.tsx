import { useState, useEffect, useRef } from 'react';
import { X, ScanLine, QrCode } from 'lucide-react';
import Modal from './Modal';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [isOpen]);

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setError('无法访问摄像头，请检查权限设置');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const code = formData.get('code') as string;
    if (code) {
      onScan(code);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="扫码" size="md">
      <div className="space-y-4">
        {error ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <ScanLine className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover rounded-lg bg-black"
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-3/4 border-2 border-primary-500 rounded-lg animate-pulse" />
              </div>
            )}
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>将二维码对准框内即可自动识别</p>
          <p className="mt-1">或手动输入编码</p>
        </div>

        <form onSubmit={handleManualInput} className="flex gap-2">
          <input
            type="text"
            name="code"
            placeholder="请输入项目编码"
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary">
            确定
          </button>
        </form>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Modal>
  );
}
