export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    return
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return navigateTo('/login')
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return navigateTo('/dashboard')
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return navigateTo('/dashboard')
  }
})
