<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchCurrentUser } = useAuth()

onMounted(async () => {
  const route = useRoute()
  if (!route.path.startsWith('/login') && !route.path.startsWith('/public') && !route.path.startsWith('/seed')) {
    await fetchCurrentUser()
  }
})
</script>
