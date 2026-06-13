export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return

  const auth = useAuthStore()
  auth.restoreAuth()

  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(to.path)) {
    if (auth.isLoggedIn) {
      return navigateTo('/')
    }
    return
  }

  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }

  const roleProtected: Record<string, string[]> = {
    '/stats': ['admin', 'supervisor'],
    '/risk': ['admin', 'supervisor'],
    '/feedback': ['admin', 'supervisor'],
    '/users': ['admin'],
  }

  for (const [path, roles] of Object.entries(roleProtected)) {
    if (to.path.startsWith(path) && !roles.includes(auth.userRole)) {
      return navigateTo('/')
    }
  }
})
