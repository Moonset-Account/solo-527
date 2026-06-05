'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, X, Package, QrCode, Upload } from 'lucide-react'

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mode, setMode] = useState<'scan' | 'photo'>('scan')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'scan' && scanning) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [mode, scanning])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setCameraError('无法访问摄像头，请检查权限设置')
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        setScanning(false)
      }
    }
  }

  function retake() {
    setCapturedImage(null)
    setScanning(true)
  }

  function handleManualInput() {
    const code = prompt('请输入器材编号或二维码内容')
    if (code) {
      setResult(code)
    }
  }

  function handleResult() {
    if (result) {
      router.push(`/equipment?search=${encodeURIComponent(result)}`)
    }
  }

  async function uploadImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string)
          setScanning(false)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur safe-area-top">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => { setMode('scan'); setScanning(true); setCapturedImage(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'scan' ? 'bg-primary-600' : ''
                }`}
              >
                扫码
              </button>
              <button
                onClick={() => { setMode('photo'); setScanning(true); setCapturedImage(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'photo' ? 'bg-primary-600' : ''
                }`}
              >
                拍照
              </button>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="relative">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {mode === 'scan' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-primary-500 rounded-lg relative">
                  <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center px-8">
                  <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300 mb-4">{cameraError}</p>
                  <button
                    onClick={handleManualInput}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg"
                  >
                    手动输入编号
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full aspect-square">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="p-6">
        {!capturedImage ? (
          <>
            <div className="text-center mb-6">
              <p className="text-gray-400">
                {mode === 'scan'
                  ? '将二维码放入框内自动扫描'
                  : '对准器材后点击拍照'}
              </p>
            </div>

            <div className="flex justify-center gap-6">
              {mode === 'scan' ? (
                <>
                  <button
                    onClick={handleManualInput}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                      <QrCode size={24} />
                    </div>
                    <span className="text-sm text-gray-400">手动输入</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={uploadImage}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                      <Upload size={24} />
                    </div>
                    <span className="text-sm text-gray-400">上传图片</span>
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <Camera size={32} className="text-white" />
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">拍照</span>
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex-1 bg-white/10 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <X size={20} />
                重拍
              </button>
              <button
                onClick={handleResult}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Package size={20} />
                确认使用
              </button>
            </div>

            {mode === 'photo' && (
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">图片用途</p>
                <div className="grid grid-cols-3 gap-2">
                  {['损坏上报', '器材验收', '归还确认'].map((purpose) => (
                    <button
                      key={purpose}
                      className="py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
