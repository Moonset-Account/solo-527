<template>
  <span :class="['tag', `tag-${type}`]" :style="customStyle">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  text?: string
  color?: string
  bgColor?: string
}>(), {
  type: 'default',
  text: '',
})

const customStyle = computed(() => {
  if (props.color && props.bgColor) {
    return {
      color: props.color,
      background: props.bgColor,
      borderColor: props.color + '33',
    }
  }
  return {}
})
</script>
