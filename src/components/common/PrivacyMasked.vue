<script setup lang="ts">
import { computed } from 'vue'
import { maskValue } from '@/utils/privacy'
import type { MaskType } from '@/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  value: string | number
  type: MaskType
  pattern?: string
  alwaysShowMasked?: boolean
}>()

const authStore = useAuthStore()

const displayValue = computed(() => {
  if (props.alwaysShowMasked) {
    return maskValue(props.value, props.type, props.pattern)
  }
  if (authStore.permissions.canViewPersonalData) {
    return String(props.value)
  }
  return maskValue(props.value, props.type, props.pattern)
})
</script>

<template>
  <span class="font-mono">
    {{ displayValue }}
  </span>
</template>
