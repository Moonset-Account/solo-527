import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { filterSensitiveFields } from '@/middleware/permission'
import { useAuthStore } from '@/stores/auth'

export class BaseFirestoreService {
  constructor(collectionName) {
    this.collectionName = collectionName
    this.collectionRef = collection(db, collectionName)
  }

  getCurrentUserRole() {
    const authStore = useAuthStore()
    return authStore.userData?.role || 'guest'
  }

  async getById(id) {
    try {
      const docRef = doc(this.collectionRef, id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      const data = { id: docSnap.id, ...docSnap.data() }
      return filterSensitiveFields(this.collectionName, data, this.getCurrentUserRole())
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error)
      throw error
    }
  }

  async getAll(options = {}) {
    try {
      let q = query(this.collectionRef)
      
      if (options.where) {
        options.where.forEach(([field, op, value]) => {
          q = query(q, where(field, op, value))
        })
      }
      
      if (options.orderBy) {
        const [field, direction = 'asc'] = options.orderBy
        q = query(q, orderBy(field, direction))
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit))
      }
      
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return filterSensitiveFields(this.collectionName, data, this.getCurrentUserRole())
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error)
      throw error
    }
  }

  async create(data) {
    try {
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const docRef = await addDoc(this.collectionRef, dataWithTimestamps)
      return { id: docRef.id, ...dataWithTimestamps }
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error)
      throw error
    }
  }

  async update(id, data) {
    try {
      const docRef = doc(this.collectionRef, id)
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp()
      }
      await updateDoc(docRef, dataWithTimestamp)
      return { id, ...dataWithTimestamp }
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error)
      throw error
    }
  }

  async delete(id) {
    try {
      const docRef = doc(this.collectionRef, id)
      await deleteDoc(docRef)
      return { success: true, id }
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error)
      throw error
    }
  }

  async queryBuilder(conditions) {
    try {
      let q = query(this.collectionRef)
      
      conditions.forEach(condition => {
        switch (condition.type) {
          case 'where':
            q = query(q, where(...condition.params))
            break
          case 'orderBy':
            q = query(q, orderBy(...condition.params))
            break
          case 'limit':
            q = query(q, limit(condition.params))
            break
          case 'startAfter':
            q = query(q, startAfter(condition.params))
            break
        }
      })
      
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return filterSensitiveFields(this.collectionName, data, this.getCurrentUserRole())
    } catch (error) {
      console.error(`Error querying ${this.collectionName}:`, error)
      throw error
    }
  }
}
