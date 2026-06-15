<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  visible: boolean
  title?: string
  width?: string
  confirmText?: string
  cancelText?: string
  hideFooter?: boolean
  closeOnClickOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '480px',
  confirmText: '确认',
  cancelText: '取消',
  hideFooter: false,
  closeOnClickOverlay: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm': []
  'cancel': []
  'close': []
}>()

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleCancel() {
  emit('cancel')
  handleClose()
}

function handleConfirm() {
  emit('confirm')
}

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleCancel()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    handleCancel()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleOverlayClick"
        />
        
        <Transition name="modal-scale">
          <div
            v-if="visible"
            class="relative bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"
            :style="{ width }"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
              <button
                @click="handleCancel"
                class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <slot />
            </div>
            
            <div
              v-if="!hideFooter"
              class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200"
            >
              <button
                @click="handleCancel"
                class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
