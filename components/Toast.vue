<template>
  <div
    v-if="message"
    class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in"
    :class="typeClasses"
  >
    <span class="text-lg">{{ icon }}</span>
    <span class="text-sm font-medium">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
}>(), {
  type: 'info'
})
const typeMap = {
  success: { classes: 'bg-green-100 text-green-800 border border-green-200', icon: '✅' },
  error: { classes: 'bg-red-100 text-red-800 border border-red-200', icon: '❌' },
  info: { classes: 'bg-blue-100 text-blue-800 border border-blue-200', icon: 'ℹ️' },
  warning: { classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: '⚠️' }
}
const typeClasses = computed(() => typeMap[props.type].classes)
const icon = computed(() => typeMap[props.type].icon)
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
