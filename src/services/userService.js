import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, ROLES } from '@/models/schemas'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

class UserService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.USERS)
  }

  async createUser(uid, userData) {
    const docRef = doc(db, COLLECTIONS.USERS, uid)
    await setDoc(docRef, {
      ...userData,
      role: ROLES.RESIDENT,
      consecutiveAbsences: 0,
      lastAbsenceCheckDate: null,
      plotIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: uid, ...userData }
  }

  async getResidents() {
    return this.getAll({
      where: [['role', '==', ROLES.RESIDENT]],
      orderBy: ['name', 'asc']
    })
  }

  async getAdmins() {
    return this.getAll({
      where: [['role', '==', ROLES.ADMIN]],
      orderBy: ['name', 'asc']
    })
  }

  async updateRole(userId, role) {
    return this.update(userId, { role })
  }

  async updateConsecutiveAbsences(userId, count) {
    return this.update(userId, {
      consecutiveAbsences: count,
      lastAbsenceCheckDate: new Date()
    })
  }

  async incrementConsecutiveAbsences(userId) {
    const user = await this.getById(userId)
    const newCount = (user.consecutiveAbsences || 0) + 1
    await this.update(userId, {
      consecutiveAbsences: newCount,
      lastAbsenceCheckDate: new Date()
    })
    return newCount
  }

  async resetConsecutiveAbsences(userId) {
    return this.update(userId, {
      consecutiveAbsences: 0,
      lastAbsenceCheckDate: new Date()
    })
  }

  async getUserStatistics() {
    const users = await this.getAll()
    const total = users.length
    const admins = users.filter(u => u.role === ROLES.ADMIN).length
    const residents = users.filter(u => u.role === ROLES.RESIDENT).length
    const withAbsences = users.filter(u => (u.consecutiveAbsences || 0) > 0).length
    const highAbsence = users.filter(u => (u.consecutiveAbsences || 0) >= 3).length
    
    return { total, admins, residents, withAbsences, highAbsence }
  }

  async getUsersWithHighAbsences(threshold = 3) {
    return this.getAll({
      where: [['consecutiveAbsences', '>=', threshold]],
      orderBy: ['consecutiveAbsences', 'desc']
    })
  }
}

export const userService = new UserService()
