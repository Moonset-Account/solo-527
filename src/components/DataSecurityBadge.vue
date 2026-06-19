<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: 'public' | 'internal' | 'confidential' | 'restricted'
}>()

const config = computed(() => {
  const map: Record<string, { type: string; label: string }> = {
    public: { type: 'success', label: '公开' },
    internal: { type: 'primary', label: '内部' },
    confidential: { type: 'warning', label: '机密' },
    restricted: { type: 'danger', label: '受限' },
  }
  return map[props.level] || map.public
})
</script>

<template>
  <el-tag :type="config.type" size="small">{{ config.label }}</el-tag>
</template>
