export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  auth.loadFromStorage()

  addRouteMiddleware('auth', () => {
    if (process.client && !auth.isLoggedIn) {
      return navigateTo('/login')
    }
  }, { global: false })
})
