<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'danger' | 'accent'
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  content: '确定要执行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
  confirmColor: 'primary',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm': []
  'cancel': []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

const confirmButtonClass = {
  primary: 'bg-primary hover:bg-primary/90',
  danger: 'bg-danger hover:bg-danger/90',
  accent: 'bg-accent hover:bg-accent/90',
}
</script>

<template>
  <Modal
    :visible="visible"
    :title="title"
    width="420px"
    :hide-footer="true"
    @update:visible="emit('update:visible', $event)"
    @cancel="handleCancel"
  >
    <div class="flex flex-col items-center text-center py-4">
      <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <AlertTriangle class="w-8 h-8 text-amber-500" />
      </div>
      <p class="text-gray-600 text-sm mb-6">{{ content }}</p>
      
      <div class="flex items-center gap-3 w-full">
        <button
          @click="handleCancel"
          class="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors"
          :class="confirmButtonClass[confirmColor]"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </Modal>
</template>
