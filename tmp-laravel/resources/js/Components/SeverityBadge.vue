<template>
    <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="severityClass"
    >
        {{ label }}
    </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    severity: {
        type: String,
        required: true
    }
})

const severityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
}

const severityClasses = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
}

const label = computed(() => {
    return severityLabels[props.severity] || props.severity
})

const severityClass = computed(() => {
    return severityClasses[props.severity] || 'bg-gray-100 text-gray-800'
})
</script>
