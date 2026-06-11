<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
  placeholder: { type: String, default: '搜索...' },
})

const emit = defineEmits(['update:modelValue', 'search'])

const localValue = ref(props.modelValue || '')

let debounceTimer = null

watch(() => props.modelValue, (val) => {
  localValue.value = val || ''
})

const onInput = () => {
  emit('update:modelValue', localValue.value)
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', localValue.value)
  }, 300)
}

const onKeydown = (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer)
    emit('search', localValue.value)
  }
}
</script>

<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
    <input
      v-model="localValue"
      type="text"
      :placeholder="placeholder"
      class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      @input="onInput"
      @keydown="onKeydown"
    />
  </div>
</template>
