<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    columns: {
        type: Array,
        required: true,
    },
    data: {
        type: Array,
        required: true,
    },
    pagination: {
        type: Object,
        default: null,
    },
    sortable: {
        type: Boolean,
        default: true,
    },
    selectable: {
        type: Boolean,
        default: false,
    },
    rowActions: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['sort', 'page-change', 'row-select', 'row-action']);

const sortField = ref('');
const sortDirection = ref('asc');
const selectedRows = ref([]);

const sortedData = computed(() => {
    if (!sortField.value) {
        return props.data;
    }

    return [...props.data].sort((a, b) => {
        const aVal = a[sortField.value];
        const bVal = b[sortField.value];

        if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    });
});

const handleSort = (column) => {
    if (!props.sortable || column.sortable === false) return;

    if (sortField.value === column.key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortField.value = column.key;
        sortDirection.value = 'asc';
    }

    emit('sort', { field: sortField.value, direction: sortDirection.value });
};

const handlePageChange = (page) => {
    emit('page-change', page);
};

const toggleSelectAll = () => {
    if (selectedRows.value.length === sortedData.value.length) {
        selectedRows.value = [];
    } else {
        selectedRows.value = sortedData.value.map((row) => row.id);
    }
    emit('row-select', selectedRows.value);
};

const toggleSelectRow = (row) => {
    const index = selectedRows.value.indexOf(row.id);
    if (index === -1) {
        selectedRows.value.push(row.id);
    } else {
        selectedRows.value.splice(index, 1);
    }
    emit('row-select', selectedRows.value);
};

const isAllSelected = computed(() => {
    return sortedData.value.length > 0 && selectedRows.value.length === sortedData.value.length;
});

const renderCellValue = (row, column) => {
    if (column.render) {
        return column.render(row);
    }
    return row[column.key];
};

watch(
    () => props.data,
    () => {
        selectedRows.value = [];
    }
);
</script>

<template>
    <div class="flex flex-col">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    v-if="selectable"
                                    class="px-4 py-3 text-left"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="isAllSelected"
                                        @change="toggleSelectAll"
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>

                                <th
                                    v-for="column in columns"
                                    :key="column.key"
                                    :class="[
                                        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                        sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : '',
                                    ]"
                                    @click="handleSort(column)"
                                >
                                    <div class="flex items-center gap-2">
                                        {{ column.label }}
                                        <svg
                                            v-if="sortable && column.sortable !== false && sortField === column.key"
                                            :class="[
                                                'w-4 h-4',
                                                sortDirection === 'desc' ? 'transform rotate-180' : '',
                                            ]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </div>
                                </th>

                                <th
                                    v-if="rowActions.length > 0"
                                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr
                                v-for="row in sortedData"
                                :key="row.id"
                                class="hover:bg-gray-50 transition-colors"
                            >
                                <td v-if="selectable" class="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        :checked="selectedRows.includes(row.id)"
                                        @change="toggleSelectRow(row)"
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </td>

                                <td
                                    v-for="column in columns"
                                    :key="column.key"
                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                                        {{ renderCellValue(row, column) }}
                                    </slot>
                                </td>

                                <td
                                    v-if="rowActions.length > 0"
                                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                                >
                                    <div class="flex justify-end gap-2">
                                        <button
                                            v-for="action in rowActions"
                                            :key="action.key"
                                            @click="$emit('row-action', action.key, row)"
                                            :class="[
                                                'inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium tracking-widest transition ease-in-out duration-150',
                                                action.variant === 'danger'
                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                    : action.variant === 'secondary'
                                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700',
                                            ]"
                                        >
                                            {{ action.label }}
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="sortedData.length === 0">
                                <td
                                    :colspan="columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)"
                                    class="px-6 py-12 text-center text-gray-500"
                                >
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p class="mt-2">暂无数据</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="pagination && pagination.total > 0"
                    class="flex items-center justify-between px-4 py-3 sm:px-6"
                >
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button
                            @click="handlePageChange(pagination.current_page - 1)"
                            :disabled="pagination.current_page <= 1"
                            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <button
                            @click="handlePageChange(pagination.current_page + 1)"
                            :disabled="pagination.current_page >= pagination.last_page"
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一页
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-gray-700">
                                显示第
                                <span class="font-medium">{{ (pagination.current_page - 1) * pagination.per_page + 1 }}</span>
                                到
                                <span class="font-medium">{{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}</span>
                                条，共
                                <span class="font-medium">{{ pagination.total }}</span>
                                条记录
                            </p>
                        </div>
                        <div>
                            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    @click="handlePageChange(pagination.current_page - 1)"
                                    :disabled="pagination.current_page <= 1"
                                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span class="sr-only">上一页</span>
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    v-for="page in pagination.last_page"
                                    :key="page"
                                    @click="handlePageChange(page)"
                                    :class="[
                                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                                        page === pagination.current_page
                                            ? 'z-10 bg-primary-600 border-primary-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                                    ]"
                                >
                                    {{ page }}
                                </button>

                                <button
                                    @click="handlePageChange(pagination.current_page + 1)"
                                    :disabled="pagination.current_page >= pagination.last_page"
                                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span class="sr-only">下一页</span>
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
