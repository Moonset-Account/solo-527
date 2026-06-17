<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    filters: {
        type: Array,
        required: true,
    },
    modelValue: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:modelValue', 'filter', 'reset']);

const localFilters = ref({ ...props.modelValue });

watch(
    () => props.modelValue,
    (newVal) => {
        localFilters.value = { ...newVal };
    },
    { deep: true }
);

const handleFilter = () => {
    emit('update:modelValue', { ...localFilters.value });
    emit('filter', { ...localFilters.value });
};

const handleReset = () => {
    localFilters.value = {};
    emit('update:modelValue', {});
    emit('reset');
};
</script>

<template>
    <div class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="flex flex-wrap gap-4 items-end">
            <template v-for="filter in filters" :key="filter.name">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ filter.label }}
                    </label>

                    <input
                        v-if="filter.type === 'text'"
                        v-model="localFilters[filter.name]"
                        :type="filter.inputType || 'text'"
                        :placeholder="filter.placeholder || ''"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />

                    <select
                        v-else-if="filter.type === 'select'"
                        v-model="localFilters[filter.name]"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                        <option value="">全部</option>
                        <option
                            v-for="option in filter.options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>

                    <input
                        v-else-if="filter.type === 'date'"
                        v-model="localFilters[filter.name]"
                        type="date"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />

                    <input
                        v-else-if="filter.type === 'daterange'"
                        v-model="localFilters[filter.name]"
                        type="date"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                </div>
            </template>

            <div class="flex gap-2">
                <button
                    type="button"
                    @click="handleFilter"
                    class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    筛选
                </button>
                <button
                    type="button"
                    @click="handleReset"
                    class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                >
                    重置
                </button>
            </div>
        </div>
    </div>
</template>
