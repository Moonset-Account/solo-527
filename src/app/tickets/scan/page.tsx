'use client';

import { useState, useRef } from 'react';
import { QrCode, Check, X, Loader2 } from 'lucide-react';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    ticket?: any;
  } | null>(null);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleScan = async (qrCode: string) => {
    setScanning(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: '验票成功！',
          ticket: data.ticket,
        });
      } else {
        setResult({
          success: false,
          message: data.error || '验票失败',
        });
      }
    } catch {
      setResult({
        success: false,
        message: '网络错误，请稍后重试',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          扫码验票
        </h1>
        <p className="text-gray-500 mt-1">扫描电子票二维码进行验票</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-dashed border-primary/50 rounded-2xl flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-600" />
              </div>
            </div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse" />
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手动输入票码
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="输入票码..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={scanning || !manualInput.trim()}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {scanning ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    '验票'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div>
          {result && (
            <div
              className={`rounded-xl p-8 ${
                result.success
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    result.success
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {result.success ? (
                    <Check className="h-10 w-10" />
                  ) : (
                    <X className="h-10 w-10" />
                  )}
                </div>
              </div>
              <p
                className={`text-center text-xl font-semibold ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>

              {result.success && result.ticket && (
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">剧目</span>
                    <span className="font-medium">
                      {result.ticket.order?.show?.production?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">座位</span>
                    <span className="font-medium">
                      {result.ticket.seat?.rowLabel}排{' '}
                      {result.ticket.seat?.seatNumber}号
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">票档</span>
                    <span className="font-medium">
                      {result.ticket.seat?.tier?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">持票人</span>
                    <span className="font-medium">
                      {result.ticket.order?.user?.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                等待扫描
              </h3>
              <p className="text-gray-500">
                将二维码对准扫描区域或手动输入票码进行验票
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
