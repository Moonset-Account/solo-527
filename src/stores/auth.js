import { defineStore } from 'pinia'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { ROLES, COLLECTIONS } from '@/models/schemas'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userData: null,
    initialized: false,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.userData?.role === ROLES.ADMIN,
    isResident: (state) => state.userData?.role === ROLES.RESIDENT,
    canAccess: (state) => (allowedRoles) => {
      if (!state.userData) return false
      return allowedRoles.includes(state.userData.role)
    },
    userId: (state) => state.user?.uid
  },

  actions: {
    async initAuth() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.user = user
            await this.fetchUserData(user.uid)
          } else {
            this.user = null
            this.userData = null
          }
          this.initialized = true
          resolve()
        })
      })
    },

    async fetchUserData(uid) {
      try {
        const docRef = doc(db, COLLECTIONS.USERS, uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          this.userData = { id: uid, ...docSnap.data() }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    },

    async login(email, password) {
      this.loading = true
      try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        this.user = result.user
        await this.fetchUserData(result.user.uid)
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await signOut(auth)
        this.user = null
        this.userData = null
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    async createUserProfile(uid, userData) {
      try {
        const docRef = doc(db, COLLECTIONS.USERS, uid)
        await setDoc(docRef, {
          ...userData,
          consecutiveAbsences: 0,
          role: ROLES.RESIDENT,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
  }
})
