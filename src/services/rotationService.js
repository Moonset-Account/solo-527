import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, ROTATION_STATUS } from '@/models/schemas'

class RotationService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.ROTATIONS)
  }

  async createRotation(rotationData) {
    return this.create({
      ...rotationData,
      status: ROTATION_STATUS.PENDING
    })
  }

  async getRotationsByDateRange(startDate, endDate) {
    return this.getAll({
      where: [
        ['date', '>=', startDate],
        ['date', '<=', endDate]
      ],
      orderBy: ['date', 'asc']
    })
  }

  async getRotationsByAssignee(assigneeId) {
    return this.getAll({
      where: [['assigneeId', '==', assigneeId]],
      orderBy: ['date', 'desc']
    })
  }

  async getUpcomingRotations(days = 7) {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return this.getAll({
      where: [
        ['date', '>=', now],
        ['date', '<=', future]
      ],
      orderBy: ['date', 'asc']
    })
  }

  async getAbsentRotationsByUser(userId, startDate) {
    return this.getAll({
      where: [
        ['assigneeId', '==', userId],
        ['status', '==', ROTATION_STATUS.ABSENT],
        ['date', '>=', startDate]
      ],
      orderBy: ['date', 'desc']
    })
  }

  async startRotation(rotationId) {
    return this.update(rotationId, {
      status: ROTATION_STATUS.IN_PROGRESS,
      actualStartTime: new Date()
    })
  }

  async completeRotation(rotationId, notes = '') {
    return this.update(rotationId, {
      status: ROTATION_STATUS.COMPLETED,
      actualEndTime: new Date(),
      notes
    })
  }

  async markAbsent(rotationId, checkedBy) {
    return this.update(rotationId, {
      status: ROTATION_STATUS.ABSENT,
      checkedBy,
      actualEndTime: new Date()
    })
  }

  async countConsecutiveAbsences(userId) {
    const rotations = await this.getAll({
      where: [
        ['assigneeId', '==', userId],
        ['status', 'in', [ROTATION_STATUS.ABSENT, ROTATION_STATUS.COMPLETED]]
      ],
      orderBy: ['date', 'desc'],
      limit: 10
    })

    let consecutiveCount = 0
    for (const rotation of rotations) {
      if (rotation.status === ROTATION_STATUS.ABSENT) {
        consecutiveCount++
      } else if (rotation.status === ROTATION_STATUS.COMPLETED) {
        break
      }
    }

    return consecutiveCount
  }

  async getRotationStatistics() {
    const rotations = await this.getAll()
    const total = rotations.length
    const pending = rotations.filter(r => r.status === ROTATION_STATUS.PENDING).length
    const inProgress = rotations.filter(r => r.status === ROTATION_STATUS.IN_PROGRESS).length
    const completed = rotations.filter(r => r.status === ROTATION_STATUS.COMPLETED).length
    const absent = rotations.filter(r => r.status === ROTATION_STATUS.ABSENT).length
    
    return { total, pending, inProgress, completed, absent }
  }

  async getAttendanceRate(userId, days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const rotations = await this.getAll({
      where: [
        ['assigneeId', '==', userId],
        ['date', '>=', cutoffDate]
      ]
    })

    if (rotations.length === 0) return 100
    
    const completed = rotations.filter(r => r.status === ROTATION_STATUS.COMPLETED).length
    return Math.round((completed / rotations.length) * 100)
  }
}

export const rotationService = new RotationService()
