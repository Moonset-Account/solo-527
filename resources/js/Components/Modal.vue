<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    title: String,
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(value),
    },
    closeable: {
        type: Boolean,
        default: true,
    },
})

const emit = defineEmits(['close'])

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
}

const handleClose = () => {
    if (props.closeable) {
        emit('close')
    }
}

const handleKeydown = (e) => {
    if (e.key === 'Escape' && props.closeable) {
        handleClose()
    }
}

watch(
    () => props.show,
    (newVal) => {
        if (newVal) {
            document.addEventListener('keydown', handleKeydown)
            document.body.style.overflow = 'hidden'
        } else {
            document.removeEventListener('keydown', handleKeydown)
            document.body.style.overflow = ''
        }
    }
)

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
})
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="handleClose"
            >
                <Transition
                    enter-active-class="transition-all duration-200"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition-all duration-200"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                >
                    <div
                        v-if="show"
                        :class="[
                            'bg-white rounded-xl shadow-xl w-full',
                            sizeClasses[size],
                        ]"
                    >
                        <div
                            v-if="title || closeable"
                            class="flex items-center justify-between px-6 py-4 border-b border-gray-200"
                        >
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ title }}
                            </h3>
                            <button
                                v-if="closeable"
                                @click="handleClose"
                                class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <XMarkIcon class="w-5 h-5" />
                            </button>
                        </div>
                        <div class="px-6 py-4">
                            <slot />
                        </div>
                        <div
                            v-if="$slots.footer"
                            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl"
                        >
                            <slot name="footer" />
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
