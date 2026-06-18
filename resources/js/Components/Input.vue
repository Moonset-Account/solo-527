<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    type: {
        type: String,
        default: 'text',
    },
    label: String,
    placeholder: String,
    error: String,
    disabled: Boolean,
    required: Boolean,
    id: String,
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 11)}`)

const handleInput = (e) => {
    emit('update:modelValue', e.target.value)
}
</script>

<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="inputId"
            class="block text-sm font-medium text-gray-700 mb-1"
        >
            {{ label }}
            <span v-if="required" class="text-danger">*</span>
        </label>
        <input
            :id="inputId"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :required="required"
            :class="[
                'block w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 transition-colors',
                error
                    ? 'border-danger focus:ring-danger focus:border-danger'
                    : 'border-gray-300 focus:ring-primary focus:border-primary',
                disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
            ]"
            @input="handleInput"
        />
        <p v-if="error" class="mt-1 text-sm text-danger">
            {{ error }}
        </p>
    </div>
</template>
