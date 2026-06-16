<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = ref(false)

function open() {
  visible.value = true
}

function close() {
  visible.value = false
  emit('cancel')
}

function confirm() {
  visible.value = false
  emit('confirm')
}

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="close" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="close">
            <X class="w-5 h-5" />
          </button>
          <div class="flex items-start gap-4">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                variant === 'danger' ? 'bg-coral/10' : variant === 'warning' ? 'bg-amber-50' : 'bg-rosegold/10',
              ]"
            >
              <AlertTriangle
                :class="[
                  'w-5 h-5',
                  variant === 'danger' ? 'text-coral' : variant === 'warning' ? 'text-amber-500' : 'text-rosegold',
                ]"
              />
            </div>
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">{{ title || '确认操作' }}</h3>
              <p class="mt-2 text-sm text-gray-500">{{ message }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              @click="close"
            >
              {{ cancelText || '取消' }}
            </button>
            <button
              :class="[
                'px-4 py-2 text-sm text-white rounded-lg transition-colors',
                variant === 'danger' ? 'bg-coral hover:bg-coral/90' : 'bg-rosegold hover:bg-rosegold/90',
              ]"
              @click="confirm"
            >
              {{ confirmText || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
