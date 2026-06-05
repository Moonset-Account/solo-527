import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ScanLine, QrCode, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';
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
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      setScanResult(code.data);
      stopScanner();
      if (code.data) {
        onScan(code.data);
      }
      return;
    }

    animationRef.current = requestAnimationFrame(scanQRCode);
  }, [onScan]);

  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          animationRef.current = requestAnimationFrame(scanQRCode);
        };
      }

      scanTimeoutRef.current = setTimeout(() => {
        if (scanning && !scanResult) {
          setError('识别超时，请尝试手动输入或调整二维码位置');
          stopScanner();
        }
      }, 15000);
    } catch (e) {
      setError('无法访问摄像头，请检查权限设置');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="扫码识别" size="md">
      <div className="space-y-4">
        {error ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-yellow-700 mb-4">{error}</p>
            <button
              onClick={startScanner}
              className="btn btn-primary"
            >
              重新扫码
            </button>
          </div>
        ) : scanResult ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <QrCode className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-700 font-medium mb-2">识别成功!</p>
            <p className="text-sm text-gray-500 break-all">{scanResult}</p>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover rounded-lg bg-black"
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-3/4 border-2 border-primary-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                </div>
                <div className="absolute top-1/4 left-1/8 right-1/8 h-0.5 bg-primary-500 animate-scan-line" />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>将二维码对准框内即可自动识别</p>
          <p className="mt-1">支持识别项目编码、任务编码</p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">手动输入编码</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="请输入项目编码（如：project-001）"
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(e)}
            />
            <button type="submit" className="btn btn-primary" disabled={!manualInput.trim()}>
              确定
            </button>
          </form>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2">快速测试编码：</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { onScan('project-001'); onClose(); }}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              project-001
            </button>
            <button
              onClick={() => { onScan('task-001'); onClose(); }}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              task-001
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateY(0); }
          50% { transform: translateY(300%); }
          100% { transform: translateY(0); }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </Modal>
  );
}
