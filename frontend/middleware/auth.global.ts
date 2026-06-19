import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isInitialized) {
    auth.init()
  }
  const whitelist = ['/login']
  if (!auth.isLoggedIn && !whitelist.includes(to.path)) {
    return navigateTo('/login')
  }
  if (auth.isLoggedIn && to.path === '/login') {
    return navigateTo('/')
  }
})
