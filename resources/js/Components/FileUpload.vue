<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: [File, Array, String],
        default: null,
    },
    label: {
        type: String,
        default: '',
    },
    accept: {
        type: String,
        default: '*',
    },
    multiple: {
        type: Boolean,
        default: false,
    },
    maxSize: {
        type: Number,
        default: 10,
    },
    error: {
        type: String,
        default: '',
    },
    required: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue', 'change']);

const inputRef = ref(null);
const isDragging = ref(false);
const previewUrl = ref('');

const files = computed(() => {
    if (Array.isArray(props.modelValue)) {
        return props.modelValue;
    }
    if (props.modelValue instanceof File) {
        return [props.modelValue];
    }
    if (typeof props.modelValue === 'string' && props.modelValue) {
        return [{ name: props.modelValue, isUrl: true }];
    }
    return [];
});

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFiles = (fileList) => {
    const fileArray = Array.from(fileList);
    const validFiles = fileArray.filter(file => {
        if (file.size > props.maxSize * 1024 * 1024) {
            return false;
        }
        return true;
    });

    const result = props.multiple ? validFiles : validFiles[0] || null;
    emit('update:modelValue', result);
    emit('change', result);
};

const handleDrop = (e) => {
    e.preventDefault();
    isDragging.value = false;
    if (!props.disabled) {
        handleFiles(e.dataTransfer.files);
    }
};

const handleDragOver = (e) => {
    e.preventDefault();
    if (!props.disabled) {
        isDragging.value = true;
    }
};

const handleDragLeave = () => {
    isDragging.value = false;
};

const triggerInput = () => {
    if (!props.disabled) {
        inputRef.value?.click();
    }
};

const removeFile = (index) => {
    if (props.multiple && Array.isArray(props.modelValue)) {
        const newFiles = [...props.modelValue];
        newFiles.splice(index, 1);
        emit('update:modelValue', newFiles);
        emit('change', newFiles);
    } else {
        emit('update:modelValue', null);
        emit('change', null);
    }
};
</script>

<template>
    <div>
        <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <div
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @click="triggerInput"
            :class="[
                'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
                error ? 'border-red-300 focus:border-red-500' : ''
            ]"
        >
            <input
                ref="inputRef"
                type="file"
                :accept="accept"
                :multiple="multiple"
                :disabled="disabled"
                class="hidden"
                @change="handleFiles($event.target.files)"
            />

            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span class="text-indigo-600 dark:text-indigo-400 font-medium">点击上传</span>
                <span class="ml-1">或拖拽文件到此处</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                支持 {{ accept }} 格式，最大 {{ maxSize }}MB
            </p>
        </div>

        <div v-if="files.length > 0" class="mt-3 space-y-2">
            <div
                v-for="(file, index) in files"
                :key="index"
                class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
                <div class="flex items-center space-x-2">
                    <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ file.name }}</span>
                    <span v-if="file.size" class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(file.size) }}</span>
                </div>
                <button
                    v-if="!disabled"
                    type="button"
                    class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                    @click.stop="removeFile(index)"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ error }}
        </p>
    </div>
</template>
