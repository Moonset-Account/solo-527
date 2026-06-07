<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { PermissionConfig } from '@/types'

const props = defineProps<{
  permission: keyof PermissionConfig
  fallback?: string
}>()

const authStore = useAuthStore()

const hasPermission = computed(() => {
  return authStore.permissions[props.permission]
})
</script>

<template>
  <slot v-if="hasPermission" />
  <span v-else-if="fallback" class="text-gray-400 text-sm">{{ fallback }}</span>
</template>
