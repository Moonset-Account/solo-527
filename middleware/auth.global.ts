export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.user) {
    await auth.fetchUser()
  }

  const publicPaths = ['/login']
  if (publicPaths.includes(to.path)) {
    if (auth.isLoggedIn) {
      return navigateTo('/')
    }
    return
  }

  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }
})
