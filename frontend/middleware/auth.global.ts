export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, fetchUserInfo } = useAuth()
  
  const publicRoutes = ['/login', '/register']
  
  if (!isAuthenticated.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
  
  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }
  
  if (isAuthenticated.value) {
    await fetchUserInfo()
  }
})
