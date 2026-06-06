import { ref } from 'vue'
import { getArtworkImage } from '../utils/images'

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

  const uploadImage = async (image: UploadedImage, seed?: number): Promise<string> => {
    image.status = 'uploading'
    image.progress = 0

    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 25
        image.progress = Math.min(progress, 95)
        if (progress >= 90) {
          clearInterval(interval)
          const url = getArtworkImage(seed || Date.now())
          image.uploadedUrl = url
          image.progress = 100
          image.status = 'success'
          resolve(url)
        }
      }, 150)
    })
  }

  const uploadAll = async (): Promise<string[]> => {
    const pendingImages = images.value.filter(img => img.status === 'pending')
    const urls: string[] = []

    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i]
      try {
        const url = await uploadImage(image, i)
        urls.push(url)
      } catch (e: any) {
        image.status = 'error'
        image.error = e.message
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
