<script setup>
import { computed } from 'vue'

const props = defineProps({
    color: {
        type: String,
        default: 'gray',
        validator: (value) => ['gray', 'green', 'yellow', 'red', 'blue', 'indigo', 'purple', 'pink'].includes(value),
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value),
    },
    dot: {
        type: Boolean,
        default: false,
    },
})

const colorClasses = computed(() => {
    const colors = {
        gray: {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            dot: 'bg-gray-500',
        },
        green: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            dot: 'bg-green-500',
        },
        yellow: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            dot: 'bg-yellow-500',
        },
        red: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            dot: 'bg-red-500',
        },
        blue: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            dot: 'bg-blue-500',
        },
        indigo: {
            bg: 'bg-indigo-100',
            text: 'text-indigo-800',
            dot: 'bg-indigo-500',
        },
        purple: {
            bg: 'bg-purple-100',
            text: 'text-purple-800',
            dot: 'bg-purple-500',
        },
        pink: {
            bg: 'bg-pink-100',
            text: 'text-pink-800',
            dot: 'bg-pink-500',
        },
    }

    return colors[props.color]
})

const sizeClasses = computed(() => {
    const sizes = {
        sm: {
            badge: 'px-2 py-0.5 text-xs',
            dot: 'w-1.5 h-1.5 mr-1',
        },
        md: {
            badge: 'px-2.5 py-1 text-xs',
            dot: 'w-2 h-2 mr-1.5',
        },
        lg: {
            badge: 'px-3 py-1.5 text-sm',
            dot: 'w-2.5 h-2.5 mr-2',
        },
    }

    return sizes[props.size]
})
</script>

<template>
    <span
        :class="[
            'inline-flex items-center font-medium rounded-full',
            colorClasses.bg,
            colorClasses.text,
            sizeClasses.badge,
        ]"
    >
        <span
            v-if="dot"
            :class="[
                'rounded-full flex-shrink-0',
                colorClasses.dot,
                sizeClasses.dot,
            ]"
        ></span>
        <slot />
    </span>
</template>
