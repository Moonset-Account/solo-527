<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('update:modelValue', false)"></div>
        <div :class="['relative bg-white rounded-2xl shadow-2xl transition-all w-full', sizeClass]" role="dialog">
          <div v-if="title || closable" class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 v-if="title" class="font-bold text-lg text-gray-900">{{ title }}</h3>
            <button v-if="closable" @click="$emit('update:modelValue', false)" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-6">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-wrap gap-2 justify-end">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  closable: { type: Boolean, default: true },
  size: { type: String, default: 'md', validator: v => ['sm','md','lg','xl','2xl'].includes(v) }
});

defineEmits(['update:modelValue']);

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}[props.size] || 'max-w-md'));
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.95) translateY(-10px); }
</style>
