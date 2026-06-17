export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return

  const token = localStorage.getItem('token')
  const publicPages = ['/login']

  if (!token && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (token && to.path === '/login') {
    return navigateTo('/')
  }
})
