<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    type: {
        type: String,
        default: 'text',
    },
    label: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '',
    },
    error: {
        type: String,
        default: '',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    required: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue', 'input', 'change', 'blur']);

const inputValue = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
        emit('input', value);
    },
});
</script>

<template>
    <div>
        <label v-if="label" :for="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>
        <input
            :type="type"
            :id="label"
            :value="inputValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="[
                'block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
            ]"
            @input="inputValue = $event.target.value"
            @change="emit('change', $event)"
            @blur="emit('blur', $event)"
        />
        <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ error }}
        </p>
    </div>
</template>
