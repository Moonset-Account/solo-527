export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser, isLoading } = useAuth()

  const publicRoutes = ['/login']
  const isPublic = publicRoutes.includes(to.path)

  if (!user.value && !isLoading.value) {
    await fetchUser()
  }

  if (!user.value && !isPublic) {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }

  const adminRoutes = ['/admin', '/admin/approvals', '/admin/users', '/admin/logs']
  if (adminRoutes.some(r => to.path.startsWith(r)) && user.value && user.value.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
