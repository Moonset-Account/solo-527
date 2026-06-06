import { BaseFirestoreService } from './baseService'
import { COLLECTIONS } from '@/models/schemas'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/firebase/config'

class PhotoLogService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.PHOTO_LOGS)
  }

  async uploadPhoto(file, path = 'photo-logs') {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `${path}/${fileName}`)
    
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    
    return { url: downloadURL, path: `${path}/${fileName}` }
  }

  async deletePhoto(storagePath) {
    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  }

  async createPhotoLog(data, uploadedBy, uploadedByName, file) {
    const photoResult = await this.uploadPhoto(file)
    return this.create({
      ...data,
      photoUrl: photoResult.url,
      storagePath: photoResult.path,
      uploadedBy,
      uploadedByName,
      tags: data.tags || []
    })
  }

  async getPhotosByPlot(plotId) {
    return this.getAll({
      where: [['plotId', '==', plotId]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getPhotosByUser(userId) {
    return this.getAll({
      where: [['uploadedBy', '==', userId]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getPhotosByTag(tag) {
    return this.getAll({
      where: [['tags', 'array-contains', tag]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getRecentPhotos(limitCount = 20) {
    return this.getAll({
      orderBy: ['createdAt', 'desc'],
      limit: limitCount
    })
  }
}

export const photoLogService = new PhotoLogService()
