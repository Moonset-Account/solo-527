<script setup>
import { computed } from 'vue';

const props = defineProps({
    currentPage: {
        type: Number,
        required: true,
    },
    lastPage: {
        type: Number,
        required: true,
    },
    perPage: {
        type: Number,
        default: 15,
    },
    total: {
        type: Number,
        default: 0,
    },
    showPerPage: {
        type: Boolean,
        default: true,
    },
    showTotal: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['update:currentPage', 'update:perPage', 'change']);

const pages = computed(() => {
    const pages = [];
    const start = Math.max(1, props.currentPage - 2);
    const end = Math.min(props.lastPage, props.currentPage + 2);

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (end < props.lastPage) {
        if (end < props.lastPage - 1) pages.push('...');
        pages.push(props.lastPage);
    }

    return pages;
});

const perPageOptions = [10, 15, 25, 50, 100];

const goToPage = (page) => {
    if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
        emit('update:currentPage', page);
        emit('change', { page, perPage: props.perPage });
    }
};

const changePerPage = (e) => {
    const value = parseInt(e.target.value);
    emit('update:perPage', value);
    emit('change', { page: 1, perPage: value });
};
</script>

<template>
    <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex-1 flex items-center justify-between">
            <div v-if="showTotal" class="text-sm text-gray-700 dark:text-gray-300">
                显示
                <span class="font-medium">
                    {{ total > 0 ? (currentPage - 1) * perPage + 1 : 0 }}
                </span>
                到
                <span class="font-medium">
                    {{ Math.min(currentPage * perPage, total) }}
                </span>
                共
                <span class="font-medium">{{ total }}</span>
                条
            </div>
            <div v-else></div>

            <div class="flex items-center space-x-4">
                <div v-if="showPerPage" class="flex items-center">
                    <label class="mr-2 text-sm text-gray-700 dark:text-gray-300">每页</label>
                    <select
                        :value="perPage"
                        @change="changePerPage"
                        class="block w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">条</label>
                </div>

                <nav class="flex items-center space-x-1" aria-label="Pagination">
                    <button
                        @click="goToPage(currentPage - 1)"
                        :disabled="currentPage <= 1"
                        class="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span class="sr-only">上一页</span>
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>

                    <template v-for="page in pages" :key="page">
                        <span v-if="page === '...'" class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                        </span>
                        <button
                            v-else
                            @click="goToPage(page)"
                            :class="[
                                'relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border',
                                page === currentPage
                                    ? 'z-10 bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            ]"
                        >
                            {{ page }}
                        </button>
                    </template>

                    <button
                        @click="goToPage(currentPage + 1)"
                        :disabled="currentPage >= lastPage"
                        class="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span class="sr-only">下一页</span>
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>
