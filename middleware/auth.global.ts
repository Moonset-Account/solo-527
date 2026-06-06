export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchCurrentUser } = useAuth()
  
  const publicPaths = ['/login', '/public', '/seed']
  
  if (publicPaths.some(path => to.path.startsWith(path))) {
    return
  }
  
  if (!user.value) {
    await fetchCurrentUser()
  }
  
  if (!user.value) {
    return navigateTo('/login')
  }
})
