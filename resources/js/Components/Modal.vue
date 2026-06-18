<script setup>
import { watch } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: '',
    },
    size: {
        type: String,
        default: 'md',
    },
    closeOnOverlay: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['close', 'update:show']);

const closeModal = () => {
    emit('close');
    emit('update:show', false);
};

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

watch(() => props.show, (val) => {
    if (val) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
                <div
                    class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0"
                    @click.self="closeOnOverlay && closeModal()"
                >
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeOnOverlay && closeModal()"></div>

                    <div
                        :class="[
                            'relative z-10 transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:w-full',
                            sizeClasses[size]
                        ]"
                    >
                        <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                                {{ title }}
                            </h3>
                            <button
                                type="button"
                                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                @click="closeModal"
                            >
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div class="px-6 py-4">
                            <slot />
                        </div>

                        <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 dark:bg-gray-700 sm:flex sm:flex-row-reverse">
                            <slot name="footer" />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

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
