import { ref } from 'vue'

export function useQRScanner() {
  const isScanning = ref(false)
  const scanResult = ref<string | null>(null)
  const error = ref<string | null>(null)

  const startScanner = async () => {
    error.value = null
    scanResult.value = null

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      error.value = '您的浏览器不支持摄像头功能'
      return
    }

    try {
      isScanning.value = true
      const mockScan = () => {
        setTimeout(() => {
          const mockCode = `BK${Date.now().toString().slice(-8)}`
          scanResult.value = mockCode
          isScanning.value = false
        }, 2000)
      }
      mockScan()
    } catch (e: any) {
      error.value = e.message || '启动摄像头失败'
      isScanning.value = false
    }
  }

  const stopScanner = () => {
    isScanning.value = false
  }

  const clearResult = () => {
    scanResult.value = null
    error.value = null
  }

  return {
    isScanning,
    scanResult,
    error,
    startScanner,
    stopScanner,
    clearResult
  }
}
