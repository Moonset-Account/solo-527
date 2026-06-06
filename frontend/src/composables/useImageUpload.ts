import { ref } from 'vue'
import { artworkAPI } from '../utils/api'

interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  uploadedUrl?: string
}

export function useImageUpload() {
  const images = ref<UploadedImage[]>([])
  const isDragging = ref(false)

  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return '只支持 JPG、PNG、GIF、WEBP 格式的图片'
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return '图片大小不能超过 10MB'
    }
    return null
  }

  const addFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        console.warn(error)
        continue
      }

      const previewUrl = await createImagePreview(file)
      images.value.push({
        id: generateId(),
        file,
        previewUrl,
        status: 'pending',
        progress: 0
      })
    }
  }

  const removeImage = (id: string) => {
    const index = images.value.findIndex(img => img.id === id)
    if (index > -1) {
      URL.revokeObjectURL(images.value[index].previewUrl)
      images.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    images.value.forEach(img => URL.revokeObjectURL(img.previewUrl))
    images.value = []
  }

  const uploadImage = async (image: UploadedImage): Promise<string> => {
    image.status = 'uploading'
    image.progress = 0

    try {
      const formData = new FormData()
      formData.append('file', image.file)

      const progressInterval = setInterval(() => {
        image.progress = Math.min(image.progress + Math.random() * 20, 80)
      }, 100)

      const result: any = await artworkAPI.uploadImage(formData)

      clearInterval(progressInterval)
      image.progress = 100
      image.status = 'success'
      image.uploadedUrl = result.url

      return result.url
    } catch (e: any) {
      image.status = 'error'
      image.error = e.response?.data?.error || e.message || '上传失败'
      throw e
    }
  }

  const uploadAll = async (): Promise<string[]> => {
    const pendingImages = images.value.filter(img => img.status === 'pending')
    const urls: string[] = []

    for (const image of pendingImages) {
      try {
        const url = await uploadImage(image)
        urls.push(url)
      } catch (e) {
        console.error('图片上传失败', e)
      }
    }

    return urls
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files)
    }
  }

  return {
    images,
    isDragging,
    addFiles,
    removeImage,
    clearAll,
    uploadImage,
    uploadAll,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
