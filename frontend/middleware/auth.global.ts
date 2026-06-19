export default defineNuxtRouteMiddleware(async (to, from) => {
  const { initAuth, isAuthenticated, user } = useAuth()

  if (process.client) {
    await initAuth()
  }

  const publicRoutes = ['/login', '/register']

  if (process.client) {
    if (!isAuthenticated.value && !publicRoutes.includes(to.path)) {
      return navigateTo('/login')
    }

    if (isAuthenticated.value && to.path === '/login') {
      return navigateTo('/')
    }
  }
})
