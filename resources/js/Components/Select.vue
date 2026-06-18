<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number, Array],
        default: '',
    },
    options: {
        type: Array,
        default: () => [],
    },
    label: String,
    placeholder: {
        type: String,
        default: '请选择',
    },
    error: String,
    disabled: Boolean,
    required: Boolean,
    id: String,
    multiple: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const selectId = computed(() => props.id || `select-${Math.random().toString(36).slice(2, 11)}`)

const handleChange = (e) => {
    if (props.multiple) {
        const values = Array.from(e.target.selectedOptions).map((option) => option.value)
        emit('update:modelValue', values)
    } else {
        emit('update:modelValue', e.target.value)
    }
}
</script>

<template>
    <div class="w-full">
        <label
            v-if="label"
            :for="selectId"
            class="block text-sm font-medium text-gray-700 mb-1"
        >
            {{ label }}
            <span v-if="required" class="text-danger">*</span>
        </label>
        <select
            :id="selectId"
            :value="modelValue"
            :disabled="disabled"
            :required="required"
            :multiple="multiple"
            :class="[
                'block w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 transition-colors bg-white',
                error
                    ? 'border-danger focus:ring-danger focus:border-danger'
                    : 'border-gray-300 focus:ring-primary focus:border-primary',
                disabled ? 'bg-gray-100 cursor-not-allowed' : '',
                multiple ? 'min-h-[100px]' : '',
            ]"
            @change="handleChange"
        >
            <option v-if="!multiple && placeholder" value="" disabled>
                {{ placeholder }}
            </option>
            <option
                v-for="option in options"
                :key="option.value"
                :value="option.value"
            >
                {{ option.label }}
            </option>
        </select>
        <p v-if="error" class="mt-1 text-sm text-danger">
            {{ error }}
        </p>
    </div>
</template>
