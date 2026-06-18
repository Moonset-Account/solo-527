<script setup>
import { ref, computed, watch } from 'vue'
import {
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
    columns: {
        type: Array,
        required: true,
    },
    data: {
        type: Array,
        default: () => [],
    },
    searchable: {
        type: Boolean,
        default: false,
    },
    searchPlaceholder: {
        type: String,
        default: '搜索...',
    },
    sortable: {
        type: Boolean,
        default: true,
    },
    pagination: {
        type: Boolean,
        default: true,
    },
    perPage: {
        type: Number,
        default: 10,
    },
    perPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100],
    },
    emptyText: {
        type: String,
        default: '暂无数据',
    },
})

const emit = defineEmits(['sort', 'page-change', 'search'])

const searchQuery = ref('')
const sortColumn = ref(null)
const sortDirection = ref('asc')
const currentPage = ref(1)
const currentPerPage = ref(props.perPage)

const filteredData = computed(() => {
    if (!searchQuery.value) {
        return props.data
    }

    const query = searchQuery.value.toLowerCase()
    return props.data.filter((row) =>
        props.columns.some((col) => {
            if (!col.searchable !== false && col.key) {
                const value = row[col.key]
                return value !== undefined && value !== null && String(value).toLowerCase().includes(query)
            }
            return false
        })
    )
})

const sortedData = computed(() => {
    if (!sortColumn.value) {
        return filteredData.value
    }

    return [...filteredData.value].sort((a, b) => {
        const aVal = a[sortColumn.value]
        const bVal = b[sortColumn.value]

        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
        }

        const aStr = String(aVal)
        const bStr = String(bVal)
        return sortDirection.value === 'asc'
            ? aStr.localeCompare(bStr, 'zh-CN')
            : bStr.localeCompare(aStr, 'zh-CN')
    })
})

const totalPages = computed(() => {
    if (!props.pagination) return 1
    return Math.max(1, Math.ceil(sortedData.value.length / currentPerPage.value))
})

const paginatedData = computed(() => {
    if (!props.pagination) {
        return sortedData.value
    }

    const start = (currentPage.value - 1) * currentPerPage.value
    const end = start + currentPerPage.value
    return sortedData.value.slice(start, end)
})

const startIndex = computed(() => {
    if (sortedData.value.length === 0) return 0
    return (currentPage.value - 1) * currentPerPage.value + 1
})

const endIndex = computed(() => {
    return Math.min(currentPage.value * currentPerPage.value, sortedData.value.length)
})

const handleSort = (column) => {
    if (!props.sortable || column.sortable === false) return

    if (sortColumn.value === column.key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortColumn.value = column.key
        sortDirection.value = 'asc'
    }

    emit('sort', { column: sortColumn.value, direction: sortDirection.value })
}

const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    emit('page-change', currentPage.value)
}

const handlePerPageChange = (e) => {
    currentPerPage.value = Number(e.target.value)
    currentPage.value = 1
}

const handleSearch = () => {
    currentPage.value = 1
    emit('search', searchQuery.value)
}

watch(searchQuery, () => {
    handleSearch()
})

watch(
    () => props.data,
    () => {
        currentPage.value = 1
    },
    { deep: true }
)
</script>

<template>
    <div class="w-full">
        <div
            v-if="searchable || $slots.toolbar"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"
        >
            <div v-if="searchable" class="relative max-w-sm">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    v-model="searchQuery"
                    type="text"
                    :placeholder="searchPlaceholder"
                    class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>
            <div v-if="$slots.toolbar" class="flex items-center gap-2">
                <slot name="toolbar" />
            </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key || column.label"
                            :class="[
                                'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                column.width ? `w-${column.width}` : '',
                                sortable && column.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100' : '',
                            ]"
                            @click="handleSort(column)"
                        >
                            <div class="flex items-center gap-1">
                                {{ column.label }}
                                <template v-if="sortable && column.sortable !== false">
                                    <ChevronUpDownIcon
                                        v-if="sortColumn !== column.key"
                                        class="w-4 h-4 text-gray-400"
                                    />
                                    <ChevronUpIcon
                                        v-else-if="sortDirection === 'asc'"
                                        class="w-4 h-4 text-primary"
                                    />
                                    <ChevronDownIcon
                                        v-else
                                        class="w-4 h-4 text-primary"
                                    />
                                </template>
                            </div>
                        </th>
                        <th
                            v-if="$slots.actions"
                            class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="paginatedData.length === 0">
                        <td
                            :colspan="columns.length + ($slots.actions ? 1 : 0)"
                            class="px-4 py-12 text-center text-sm text-gray-500"
                        >
                            {{ emptyText }}
                        </td>
                    </tr>
                    <tr
                        v-for="(row, rowIndex) in paginatedData"
                        :key="row.id || rowIndex"
                        class="hover:bg-gray-50 transition-colors"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key || column.label"
                            class="px-4 py-3 text-sm text-gray-900"
                        >
                            <slot
                                v-if="$slots[`cell-${column.key}`]"
                                :name="`cell-${column.key}`"
                                :row="row"
                                :value="row[column.key]"
                            >
                            </slot>
                            <template v-else>
                                {{ row[column.key] }}
                            </template>
                        </td>
                        <td
                            v-if="$slots.actions"
                            class="px-4 py-3 text-sm text-right"
                        >
                            <slot name="actions" :row="row" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="pagination"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4"
        >
            <div class="text-sm text-gray-700">
                显示
                <span class="font-medium">{{ startIndex }}</span>
                到
                <span class="font-medium">{{ endIndex }}</span>
                条，共
                <span class="font-medium">{{ sortedData.length }}</span>
                条记录
            </div>

            <div class="flex items-center gap-3">
                <select
                    :value="currentPerPage"
                    @change="handlePerPageChange"
                    class="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                >
                    <option v-for="option in perPageOptions" :key="option" :value="option">
                        {{ option }} 条/页
                    </option>
                </select>

                <nav class="flex items-center gap-1">
                    <button
                        @click="goToPage(currentPage - 1)"
                        :disabled="currentPage === 1"
                        class="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeftIcon class="w-4 h-4" />
                    </button>

                    <button
                        v-if="currentPage > 2"
                        @click="goToPage(1)"
                        class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        1
                    </button>
                    <span v-if="currentPage > 3" class="px-2 text-gray-500">...</span>

                    <button
                        v-for="page in Math.max(1, totalPages)"
                        :key="page"
                        v-show="page >= Math.max(1, currentPage - 1) && page <= Math.min(totalPages, currentPage + 1)"
                        @click="goToPage(page)"
                        :class="[
                            'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                            page === currentPage
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                        ]"
                    >
                        {{ page }}
                    </button>

                    <span v-if="currentPage < totalPages - 2" class="px-2 text-gray-500">...</span>
                    <button
                        v-if="currentPage < totalPages - 1"
                        @click="goToPage(totalPages)"
                        class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {{ totalPages }}
                    </button>

                    <button
                        @click="goToPage(currentPage + 1)"
                        :disabled="currentPage === totalPages"
                        class="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRightIcon class="w-4 h-4" />
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>
