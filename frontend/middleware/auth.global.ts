export default defineNuxtRouteMiddleware((to, from) => {
  const { checkAuth } = useAuth()

  if (to.path !== '/login' && !checkAuth()) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && checkAuth()) {
    return navigateTo('/')
  }
})
