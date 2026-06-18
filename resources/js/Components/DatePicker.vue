<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Date],
        default: '',
    },
    label: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '请选择日期',
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
    format: {
        type: String,
        default: 'YYYY-MM-DD',
    },
    min: {
        type: [String, Date],
        default: '',
    },
    max: {
        type: [String, Date],
        default: '',
    },
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const inputRef = ref(null);

const inputValue = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
        emit('change', value);
    },
});

const togglePicker = () => {
    if (!props.disabled) {
        isOpen.value = !isOpen.value;
    }
};

const clearDate = () => {
    inputValue.value = '';
    isOpen.value = false;
};

const handleInputChange = (e) => {
    inputValue.value = e.target.value;
};
</script>

<template>
    <div class="relative">
        <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <div class="relative">
            <input
                ref="inputRef"
                type="date"
                :value="inputValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :min="min"
                :max="max"
                :class="[
                    'block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white pr-10',
                    error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                ]"
                @input="handleInputChange"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        </div>

        <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ error }}
        </p>
    </div>
</template>
