<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-bark/40" @click="$emit('close')" />
        <div
          class="relative z-10 w-full max-w-lg rounded-btn bg-white p-6 shadow-xl"
          @click.stop
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-bark">{{ title }}</h3>
            <button class="text-bark/40 hover:text-bark transition-colors" @click="$emit('close')">
              <X :size="20" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  visible: boolean
  title: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
