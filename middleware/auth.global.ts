export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return

  const token = localStorage.getItem('token')
  const isLoginPage = to.path === '/login'

  if (!token && !isLoginPage) {
    return navigateTo('/login')
  }
  if (token && isLoginPage) {
    return navigateTo('/')
  }
})
