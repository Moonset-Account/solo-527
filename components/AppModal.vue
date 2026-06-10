<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-mask" @click.self="handleClose">
        <div class="modal" :style="{ width: width, maxWidth: maxWidth }">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="close-btn" @click="handleClose">×</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="showFooter" class="modal-footer">
            <button v-if="showCancel" class="btn btn-default" @click="handleClose">
              取消
            </button>
            <button class="btn btn-primary" @click="handleConfirm" :disabled="confirmLoading">
              {{ confirmLoading ? '处理中...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  width?: string
  maxWidth?: string
  showFooter?: boolean
  showCancel?: boolean
  confirmText?: string
  confirmLoading?: boolean
}>(), {
  title: '提示',
  width: '520px',
  maxWidth: '90vw',
  showFooter: true,
  showCancel: true,
  confirmText: '确定',
  confirmLoading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss" scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
