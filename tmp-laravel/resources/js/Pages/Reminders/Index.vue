<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">我的提醒</h1>
                <p class="text-sm text-gray-500 mt-1">
                    共 {{ unread_count }} 条未读提醒
                </p>
            </div>
            <button
                @click="markAllRead"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                全部标记为已读
            </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <select
                        v-model="typeFilter"
                        @change="applyFilters"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部类型</option>
                        <option value="gap_due">缺口到期提醒</option>
                        <option value="gap_overdue">缺口逾期提醒</option>
                        <option value="checklist_due">检查清单到期</option>
                        <option value="review_pending">待审核提醒</option>
                    </select>
                    <select
                        v-model="isReadFilter"
                        @change="applyFilters"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部</option>
                        <option value="false">未读</option>
                        <option value="true">已读</option>
                    </select>
                </div>
            </div>

            <div class="divide-y divide-gray-200">
                <div
                    v-for="reminder in reminders.data"
                    :key="reminder.id"
                    class="p-4 hover:bg-gray-50 cursor-pointer"
                    :class="{ 'bg-indigo-50': !reminder.read_at }"
                    @click="viewReminder(reminder)"
                >
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <div
                                class="w-10 h-10 rounded-full flex items-center justify-center"
                                :class="getTypeClass(reminder.type)"
                            >
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <p class="text-sm font-medium text-gray-900">
                                    {{ reminder.title }}
                                    <span v-if="!reminder.read_at" class="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                                </p>
                                <span class="text-xs text-gray-500">
                                    {{ formatTime(reminder.created_at) }}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                                {{ reminder.content }}
                            </p>
                            <div class="mt-2 flex items-center space-x-2">
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                    :class="getTypeBadgeClass(reminder.type)"
                                >
                                    {{ getTypeLabel(reminder.type) }}
                                </span>
                                <span class="text-xs text-gray-400">
                                    {{ getChannelLabel(reminder.channel) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!reminders.data?.length" class="p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">暂无提醒</h3>
                    <p class="mt-1 text-sm text-gray-500">您目前没有任何提醒消息</p>
                </div>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        共 {{ reminders.total }} 条提醒
                    </div>
                    <div class="flex space-x-2">
                        <button
                            v-if="reminders.prev_page_url"
                            @click="prevPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-500">
                            第 {{ reminders.current_page }} 页
                        </span>
                        <button
                            v-if="reminders.next_page_url"
                            @click="nextPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'

const props = defineProps({
    reminders: Object,
    unread_count: Number,
    filters: Object,
})

const typeFilter = ref(props.filters.type || '')
const isReadFilter = ref(props.filters.is_read || '')

function getTypeLabel(type) {
    const labels = {
        gap_due: '缺口到期提醒',
        gap_overdue: '缺口逾期提醒',
        checklist_due: '检查清单到期',
        review_pending: '待审核提醒',
    }
    return labels[type] || type
}

function getTypeClass(type) {
    const classes = {
        gap_due: 'bg-yellow-500',
        gap_overdue: 'bg-red-500',
        checklist_due: 'bg-blue-500',
        review_pending: 'bg-purple-500',
    }
    return classes[type] || 'bg-gray-500'
}

function getTypeBadgeClass(type) {
    const classes = {
        gap_due: 'bg-yellow-100 text-yellow-800',
        gap_overdue: 'bg-red-100 text-red-800',
        checklist_due: 'bg-blue-100 text-blue-800',
        review_pending: 'bg-purple-100 text-purple-800',
    }
    return classes[type] || 'bg-gray-100 text-gray-800'
}

function getChannelLabel(channel) {
    const labels = {
        email: '邮件通知',
        in_app: '站内通知',
        sms: '短信通知',
    }
    return labels[channel] || channel
}

function formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

    return d.toLocaleDateString('zh-CN')
}

function applyFilters() {
    router.get(route('reminders.index'), {
        type: typeFilter.value,
        is_read: isReadFilter.value,
    }, { preserveState: true })
}

function prevPage() {
    router.get(route('reminders.index'), { ...props.filters, page: props.reminders.current_page - 1 }, { preserveState: true })
}

function nextPage() {
    router.get(route('reminders.index'), { ...props.filters, page: props.reminders.current_page + 1 }, { preserveState: true })
}

function viewReminder(reminder) {
    if (!reminder.read_at) {
        router.post(route('reminders.read', reminder.id), {}, {
            preserveState: true
        })
    }

    if (reminder.notifiable_type === 'App\\Models\\ComplianceGap') {
        router.visit(route('compliance-gaps.show', reminder.notifiable_id))
    }
}

function markAllRead() {
    if (confirm('确定要将所有提醒标记为已读吗？')) {
        router.post(route('reminders.mark-all-read'), {}, {
            preserveState: true
        })
    }
}
</script>
