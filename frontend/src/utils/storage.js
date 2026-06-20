export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  },

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Storage remove error:', e)
    }
  },

  clear() {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Storage clear error:', e)
    }
  }
}

export const sessionStorage = {
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('SessionStorage set error:', e)
    }
  },

  get(key, defaultValue = null) {
    try {
      const value = window.sessionStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('SessionStorage get error:', e)
      return defaultValue
    }
  },

  remove(key) {
    try {
      window.sessionStorage.removeItem(key)
    } catch (e) {
      console.error('SessionStorage remove error:', e)
    }
  },

  clear() {
    try {
      window.sessionStorage.clear()
    } catch (e) {
      console.error('SessionStorage clear error:', e)
    }
  }
}
