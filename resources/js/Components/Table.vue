<script setup>
defineProps({
    columns: {
        type: Array,
        required: true,
    },
    data: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    hoverable: {
        type: Boolean,
        default: true,
    },
    striped: {
        type: Boolean,
        default: false,
    },
    emptyText: {
        type: String,
        default: '暂无数据',
    },
});
</script>

<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th
                        v-for="column in columns"
                        :key="column.key"
                        :class="[
                            'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                            column.class || ''
                        ]"
                    >
                        {{ column.label }}
                    </th>
                </tr>
            </thead>
            <tbody
                :class="[
                    'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
                    loading ? 'opacity-50' : ''
                ]"
            >
                <tr v-if="!loading && data.length === 0">
                    <td :colspan="columns.length" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        {{ emptyText }}
                    </td>
                </tr>
                <template v-else-if="!loading">
                    <tr
                        v-for="(row, index) in data"
                        :key="index"
                        :class="[
                            hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : '',
                            striped ? (index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750') : ''
                        ]"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :class="[
                                'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                                column.class || ''
                            ]"
                        >
                            <slot v-if="column.slot" :name="column.slot" :row="row" :index="index" />
                            <span v-else>{{ row[column.key] }}</span>
                        </td>
                    </tr>
                </template>
                <tr v-if="loading">
                    <td :colspan="columns.length" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        加载中...
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
