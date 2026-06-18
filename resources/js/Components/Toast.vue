<script setup>
import { defineStore } from 'pinia';
import { useToast } from '@/Composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-4 right-4 z-50 space-y-2">
            <TransitionGroup name="toast">
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    :class="[
                        'flex items-center w-full max-w-sm p-4 rounded-lg shadow-lg pointer-events-auto',
                        toast.type === 'success' ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : '',
                        toast.type === 'error' ? 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700' : '',
                        toast.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700' : '',
                        toast.type === 'info' ? 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : '',
                        !['success', 'error', 'warning', 'info'].includes(toast.type) ? 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700' : ''
                    ]"
                >
                    <div class="flex-1">
                        <p v-if="toast.title" class="text-sm font-semibold">{{ toast.title }}</p>
                        <p class="text-sm">{{ toast.message }}</p>
                    </div>
                    <button
                        type="button"
                        class="ml-4 -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
                        @click="removeToast(toast.id)"
                    >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

.toast-move {
    transition: transform 0.3s ease;
}
</style>
