import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
})

request.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user) {
      config.headers['Authorization'] = `Bearer ${user.token || ''}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('user')
        router.push('/login')
      }
      const message = error.response.data?.error || error.response.data?.detail || '请求失败'
      ElMessage.error(message)
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export const api = {
  books: {
    list: (params) => request.get('/books/books/', { params }),
    detail: (id) => request.get(`/books/books/${id}/`),
    create: (data) => request.post('/books/books/', data),
    update: (id, data) => request.put(`/books/books/${id}/`, data),
    offShelf: (id) => request.post(`/books/books/${id}/off_shelf/`),
    onShelf: (id) => request.post(`/books/books/${id}/on_shelf/`),
    export: (params) => request.get('/books/books/export/', { params, responseType: 'blob' }),
    categories: () => request.get('/books/categories/'),
    themes: () => request.get('/books/themes/'),
    copies: (params) => request.get('/books/copies/', { params })
  },
  
  borrowing: {
    list: (params) => request.get('/borrowing/records/', { params }),
    create: (data) => request.post('/borrowing/records/create_borrow/', data),
    transition: (id, data) => request.post(`/borrowing/records/${id}/transition/`, data),
    renew: (id) => request.post(`/borrowing/records/${id}/renew/`),
    export: (params) => request.get('/borrowing/records/export/', { params, responseType: 'blob' }),
    reservations: {
      list: (params) => request.get('/borrowing/reservations/', { params }),
      create: (data) => request.post('/borrowing/reservations/', data),
      cancel: (id) => request.post(`/borrowing/reservations/${id}/cancel/`)
    }
  },
  
  repairs: {
    list: (params) => request.get('/repairs/records/', { params }),
    report: (data) => request.post('/repairs/records/report/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    detail: (id) => request.get(`/repairs/records/${id}/`),
    transition: (id, data) => request.post(`/repairs/records/${id}/transition/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    assign: (id, data) => request.post(`/repairs/records/${id}/assign/`, data),
    addPhoto: (id, data) => request.post(`/repairs/records/${id}/add_photo/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    export: (params) => request.get('/repairs/records/export/', { params, responseType: 'blob' })
  },
  
  activities: {
    list: (params) => request.get('/activities/activities/', { params }),
    detail: (id) => request.get(`/activities/activities/${id}/`),
    create: (data) => request.post('/activities/activities/', data),
    update: (id, data) => request.put(`/activities/activities/${id}/`, data),
    publish: (id) => request.post(`/activities/activities/${id}/publish/`),
    openRegistration: (id) => request.post(`/activities/activities/${id}/open_registration/`),
    closeRegistration: (id) => request.post(`/activities/activities/${id}/close_registration/`),
    cancel: (id) => request.post(`/activities/activities/${id}/cancel/`),
    promoteWaitlist: (id) => request.post(`/activities/activities/${id}/promote_waitlist/`),
    registrations: {
      list: (params) => request.get('/activities/registrations/', { params }),
      register: (data) => request.post('/activities/registrations/register/', data),
      cancel: (id) => request.post(`/activities/registrations/${id}/cancel/`),
      markAttended: (id) => request.post(`/activities/registrations/${id}/mark_attended/`),
      markNoShow: (id) => request.post(`/activities/registrations/${id}/mark_no_show/`),
      export: (params) => request.get('/activities/registrations/export/', { params, responseType: 'blob' })
    },
    notifications: {
      list: () => request.get('/activities/notifications/'),
      markRead: (id) => request.post(`/activities/notifications/${id}/mark_read/`)
    }
  },
  
  deposits: {
    myDeposit: () => request.get('/deposits/accounts/my_deposit/'),
    list: (params) => request.get('/deposits/accounts/', { params }),
    recharge: (id, data) => request.post(`/deposits/accounts/${id}/recharge/`, data),
    deduct: (id, data) => request.post(`/deposits/accounts/${id}/deduct/`, data),
    transactions: {
      list: (params) => request.get('/deposits/transactions/', { params }),
      confirm: (id) => request.post(`/deposits/transactions/${id}/confirm/`),
      export: (params) => request.get('/deposits/transactions/export/', { params, responseType: 'blob' })
    },
    appeals: {
      list: (params) => request.get('/deposits/appeals/', { params }),
      create: (data) => request.post('/deposits/appeals/', data),
      handle: (id, data) => request.post(`/deposits/appeals/${id}/handle/`, data)
    }
  },
  
  accounts: {
    me: () => request.get('/accounts/users/me/'),
    users: (params) => request.get('/accounts/users/', { params }),
    families: (params) => request.get('/accounts/families/', { params }),
    children: (params) => request.get('/accounts/children/', { params }),
    createChild: (data) => request.post('/accounts/children/', data),
    pointHistory: () => request.get('/accounts/users/point_history/'),
    memberLevels: () => request.get('/accounts/member-levels/'),
    upgradeLevel: (familyId, data) => request.post(`/accounts/families/${familyId}/upgrade_level/`, data)
  }
}

export default request
