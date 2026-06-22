<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-bark/40" @click="$emit('close')" />
        <div
          class="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
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
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
