import { configureStore, createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
    roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  },
  reducers: {
    setLogin: (state, action) => {
      const { token, user, permissions, roles } = action.payload
      state.token = token
      state.user = user
      state.permissions = permissions
      state.roles = roles
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('permissions', JSON.stringify(permissions))
      localStorage.setItem('roles', JSON.stringify(roles))
    },
    setLogout: (state) => {
      state.token = ''
      state.user = null
      state.permissions = []
      state.roles = []
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      localStorage.removeItem('roles')
    },
  },
})

const appSlice = createSlice({
  name: 'app',
  initialState: {
    notifications: [],
    loading: false,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications = [action.payload, ...state.notifications]
    },
    clearNotification: (state, action) => {
      state.notifications.splice(action.payload, 1)
    },
    clearAllNotifications: (state) => {
      state.notifications = []
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { setLogin, setLogout } = authSlice.actions
export const { addNotification, clearNotification, clearAllNotifications, setLoading } = appSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    app: appSlice.reducer,
  },
})
