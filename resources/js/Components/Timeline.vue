<script setup>
const props = defineProps({
    items: {
        type: Array,
        required: true,
    },
});

const statusColors = {
    completed: 'bg-green-500',
    current: 'bg-primary-500',
    pending: 'bg-gray-300',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
};

const lineColors = {
    completed: 'bg-green-500',
    pending: 'bg-gray-200',
};
</script>

<template>
    <div class="flow-root">
        <ul class="-mb-8">
            <li v-for="(item, index) in items" :key="item.id || index">
                <div class="relative pb-8">
                    <span
                        v-if="index < items.length - 1"
                        :class="[
                            'absolute left-5 top-5 -ml-px h-full w-0.5',
                            item.status === 'completed' ? lineColors.completed : lineColors.pending,
                        ]"
                        aria-hidden="true"
                    ></span>
                    <div class="relative flex items-start space-x-3">
                        <div>
                            <div
                                :class="[
                                    'relative flex items-center justify-center h-10 w-10 rounded-full ring-8 ring-white',
                                    statusColors[item.status] || statusColors.pending,
                                ]"
                            >
                                <svg
                                    v-if="item.status === 'completed'"
                                    class="h-5 w-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <svg
                                    v-else-if="item.status === 'current'"
                                    class="h-5 w-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <svg
                                    v-else-if="item.status === 'warning'"
                                    class="h-5 w-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <svg
                                    v-else-if="item.status === 'danger'"
                                    class="h-5 w-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div v-else class="h-2.5 w-2.5 rounded-full bg-white"></div>
                            </div>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div>
                                <div class="text-sm">
                                    <p class="font-medium text-gray-900">{{ item.title }}</p>
                                </div>
                                <p class="mt-0.5 text-sm text-gray-500">{{ item.date }}</p>
                            </div>
                            <div v-if="item.description" class="mt-2 text-sm text-gray-700">
                                {{ item.description }}
                            </div>
                            <div v-if="item.meta" class="mt-2 flex flex-wrap gap-2">
                                <span
                                    v-for="(meta, metaKey) in item.meta"
                                    :key="metaKey"
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                    {{ meta }}
                                </span>
                            </div>
                        </div>
                        <div v-if="item.action" class="flex-shrink-0">
                            <button
                                @click="$emit('action', item.action, item)"
                                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                {{ item.action.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>
