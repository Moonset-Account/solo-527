<template>
  <Transition name="slide-down">
    <div
      v-if="visible"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg"
    >
      <div class="mx-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <AlertCircle class="w-5 h-5 text-red-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-red-800">{{ message }}</p>
            <div v-if="contactPerson || recordReference" class="mt-2 space-y-1">
              <p v-if="contactPerson" class="text-xs text-red-600">
                <span class="font-medium">联系人：</span>{{ contactPerson }}
              </p>
              <p v-if="recordReference" class="text-xs text-red-600">
                <span class="font-medium">记录引用：</span>{{ recordReference }}
              </p>
            </div>
          </div>
          <button
            class="shrink-0 p-0.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
            @click="$emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { AlertCircle, X } from 'lucide-vue-next'

defineProps<{
  visible: boolean
  message: string
  contactPerson?: string
  recordReference?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
