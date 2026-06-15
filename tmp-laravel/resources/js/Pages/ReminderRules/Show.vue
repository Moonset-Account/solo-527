<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('reminder-rules.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <div class="flex items-center space-x-3">
                        <h1 class="text-2xl font-bold text-gray-900">{{ rule.name }}</h1>
                        <span
                            :class="rule.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                            {{ rule.is_enabled ? '已启用' : '已停用' }}
                        </span>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">{{ rule.description || '暂无描述' }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button
                    @click="toggleActive"
                    :class="rule.is_enabled ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'"
                    class="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white"
                >
                    {{ rule.is_enabled ? '停用规则' : '启用规则' }}
                </button>
                <Link
                    :href="route('reminder-rules.edit', rule.id)"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    编辑规则
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">规则配置</h3>
                <dl class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt class="text-gray-500">提醒类型</dt>
                        <dd class="mt-1 font-medium text-gray-900">{{ types[rule.type] || rule.type }}</dd>
                    </div>
                    <div>
                        <dt class="text-gray-500">触发条件</dt>
                        <dd class="mt-1 font-medium text-gray-900">
                            {{ triggerConditions[rule.trigger_condition] || rule.trigger_condition }}
                            <span v-if="rule.trigger_value" class="text-gray-600">
                                {{ rule.trigger_value }} {{ timeUnits[rule.time_unit] || '' }}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-gray-500">优先级</dt>
                        <dd class="mt-1 font-medium text-gray-900">{{ priorities[rule.priority] || rule.priority }}</dd>
                    </div>
                    <div>
                        <dt class="text-gray-500">通知渠道</dt>
                        <dd class="mt-1 font-medium text-gray-900">{{ channels[rule.channel] || rule.channel }}</dd>
                    </div>
                    <div>
                        <dt class="text-gray-500">重复间隔</dt>
                        <dd class="mt-1 font-medium text-gray-900">{{ rule.reminder_interval_hours }} 小时</dd>
                    </div>
                    <div>
                        <dt class="text-gray-500">最大次数</dt>
                        <dd class="mt-1 font-medium text-gray-900">
                            {{ rule.max_reminders === 0 ? '无限制' : rule.max_reminders + ' 次' }}
                        </dd>
                    </div>
                </dl>

                <div class="mt-6 pt-6 border-t border-gray-200">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">接收角色</h4>
                    <div class="flex flex-wrap gap-2">
                        <template v-if="Array.isArray(rule.recipient_roles) && rule.recipient_roles.length > 0">
                            <span
                                v-for="role in rule.recipient_roles"
                                :key="role"
                                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                                {{ roles[role] || role }}
                            </span>
                        </template>
                        <span v-else class="text-sm text-gray-500">未设置（使用默认规则）</span>
                    </div>
                </div>

                <div v-if="rule.template" class="mt-6 pt-6 border-t border-gray-200">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">消息模板</h4>
                    <div class="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap border border-gray-200">
                        {{ rule.template }}
                    </div>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-400">
                    <p>创建时间：{{ formatDate(rule.created_at) }}</p>
                    <p>最后更新：{{ formatDate(rule.updated_at) }}</p>
                    <p class="mt-1">创建人：{{ rule.createdBy?.name || '-' }}</p>
                </div>
            </div>

            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <p class="text-sm font-medium text-gray-500">已发送提醒</p>
                        <p class="mt-2 text-3xl font-bold text-gray-900">{{ stats?.total_sent || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <p class="text-sm font-medium text-gray-500">本月发送</p>
                        <p class="mt-2 text-3xl font-bold text-indigo-600">{{ stats?.month_count || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <p class="text-sm font-medium text-gray-500">已读</p>
                        <p class="mt-2 text-3xl font-bold text-green-600">{{ stats?.read_count || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <p class="text-sm font-medium text-gray-500">未读</p>
                        <p class="mt-2 text-3xl font-bold text-red-600">{{ stats?.unread_count || 0 }}</p>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">最近发送日志</h3>
                        <Link :href="route('reminders.index', { rule_id: rule.id })" class="text-sm text-indigo-600 hover:text-indigo-500">
                            查看全部
                        </Link>
                    </div>

                    <div v-if="reminderLogs && reminderLogs.length > 0" class="space-y-3">
                        <div
                            v-for="log in reminderLogs"
                            :key="log.id"
                            class="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2">
                                    <Link
                                        :href="getNotifiableLink(log)"
                                        class="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
                                    >
                                        {{ log.title }}
                                    </Link>
                                    <span
                                        v-if="log.read_at"
                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                    >
                                        已读
                                    </span>
                                    <span
                                        v-else
                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                                    >
                                        未读
                                    </span>
                                </div>
                                <div class="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                    <span>收件人：{{ log.recipient_name || '-' }}</span>
                                    <span>渠道：{{ channels[log.channel] || log.channel }}</span>
                                </div>
                            </div>
                            <div class="ml-4 flex-shrink-0 text-right">
                                <p class="text-xs text-gray-400">{{ formatDateTime(log.sent_at || log.created_at) }}</p>
                            </div>
                        </div>
                    </div>

                    <p v-else class="text-sm text-gray-500 text-center py-6">
                        暂无发送记录
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    rule: Object,
    reminderLogs: Array,
    stats: Object,
    types: Object,
    triggerConditions: Object,
    timeUnits: Object,
    channels: Object,
    priorities: Object,
    roles: Object,
})

function formatDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}

function formatDateTime(date) {
    if (!date) return '-'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return diffMin + ' 分钟前'
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return diffH + ' 小时前'
    return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getNotifiableLink(log) {
    if (!log.notifiable_type || !log.notifiable_id) return '#'
    const type = log.notifiable_type.split('\\').pop()
    if (type === 'ComplianceGap') {
        return route('compliance-gaps.show', log.notifiable_id)
    }
    if (type === 'ChecklistRecord') {
        return route('checklist-records.show', log.notifiable_id)
    }
    return '#'
}

function toggleActive() {
    router.post(route('reminder-rules.toggle', props.rule.id))
}
</script>
