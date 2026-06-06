import { BaseFirestoreService } from './baseService'
import { COLLECTIONS } from '@/models/schemas'

class AnnouncementService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.ANNOUNCEMENTS)
  }

  async createAnnouncement(data, publishedBy, publishedByName) {
    return this.create({
      ...data,
      publishedBy,
      publishedByName,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null
    })
  }

  async getPublishedAnnouncements() {
    return this.getAll({
      where: [['isPublished', '==', true]],
      orderBy: ['publishedAt', 'desc']
    })
  }

  async getAllAnnouncements() {
    return this.getAll({
      orderBy: ['createdAt', 'desc']
    })
  }

  async publishAnnouncement(announcementId) {
    return this.update(announcementId, {
      isPublished: true,
      publishedAt: new Date()
    })
  }

  async unpublishAnnouncement(announcementId) {
    return this.update(announcementId, {
      isPublished: false
    })
  }

  async getImportantAnnouncements(limitCount = 5) {
    return this.getAll({
      where: [
        ['isPublished', '==', true],
        ['type', '==', 'important']
      ],
      orderBy: ['publishedAt', 'desc'],
      limit: limitCount
    })
  }
}

export const announcementService = new AnnouncementService()
