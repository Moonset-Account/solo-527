<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { checkAuth, isLoggedIn } = useAuth()

onMounted(() => {
  checkAuth()
})

useRouter().beforeEach((to) => {
  if (to.path !== '/login' && !isLoggedIn.value) {
    return '/login'
  }
  if (to.path === '/login' && isLoggedIn.value) {
    return '/'
  }
})
</script>
