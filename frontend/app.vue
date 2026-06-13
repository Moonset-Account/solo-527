<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()

onMounted(() => {
  auth.restoreAuth()
})
</script>
