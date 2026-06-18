<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  visible?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/40" @click="emit('cancel')" />
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle class="w-5 h-5 text-amber-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-slate-900">{{ title || '确认操作' }}</h3>
            <p class="mt-2 text-sm text-slate-500">{{ message || '确定要执行此操作吗？' }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            @click="emit('cancel')"
          >
            {{ cancelText || '取消' }}
          </button>
          <button
            class="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            @click="emit('confirm')"
          >
            {{ confirmText || '确认' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
