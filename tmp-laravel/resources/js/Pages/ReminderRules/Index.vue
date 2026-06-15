<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">提醒规则管理</h1>
                <p class="text-sm text-gray-500 mt-1">配置合规缺口和检查清单的自动提醒规则</p>
            </div>
            <Link
                :href="route('reminder-rules.create')"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                新建规则
            </Link>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="搜索规则名称..."
                        class="w-64 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        v-model="typeFilter"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部类型</option>
                        <option v-for="(label, value) in types" :key="value" :value="value">{{ label }}</option>
                    </select>
                </div>
                <div class="text-sm text-gray-500">
                    共 {{ rules.total }} 条规则
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">规则名称</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">触发条件</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">通知渠道</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="rule in rules.data" :key="rule.id" class="hover:bg-gray-50">
                            <td class="px-4 py-4">
                                <Link :href="route('reminder-rules.show', rule.id)" class="text-indigo-600 hover:text-indigo-900 font-medium">
                                    {{ rule.name }}
                                </Link>
                                <p class="text-xs text-gray-500 mt-0.5" v-if="rule.description">
                                    {{ rule.description }}
                                </p>
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-900">
                                {{ types[rule.type] || rule.type }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ getTriggerDescription(rule) }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {{ channelLabels[rule.channel] || rule.channel }}
                                </span>
                            </td>
                            <td class="px-4 py-4">
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                    :class="priorityClasses[rule.priority]"
                                >
                                    {{ priorityLabels[rule.priority] || rule.priority }}
                                </span>
                            </td>
                            <td class="px-4 py-4">
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    :class="rule.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                                >
                                    {{ rule.is_enabled ? '已启用' : '已禁用' }}
                                </span>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    @click="toggleRule(rule.id)"
                                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                    {{ rule.is_enabled ? '禁用' : '启用' }}
                                </button>
                                <Link :href="route('reminder-rules.edit', rule.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                                    编辑
                                </Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    rules: Object,
    types: Object,
    filters: Object,
})

const search = ref(props.filters.search || '')
const typeFilter = ref(props.filters.type || '')

const channelLabels = {
    email: '邮件',
    in_app: '站内通知',
    sms: '短信'
}

const priorityLabels = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
}

const priorityClasses = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
}

const triggerConditionLabels = {
    before_due: '到期前',
    after_due: '到期后',
    immediate: '立即',
    daily: '每日'
}

const timeUnitLabels = {
    minute: '分钟',
    hour: '小时',
    day: '天',
    week: '周'
}

function getTriggerDescription(rule) {
    if (rule.trigger_condition === 'immediate') {
        return '立即触发'
    }
    if (rule.trigger_condition === 'daily') {
        return '每日提醒'
    }
    return `${triggerConditionLabels[rule.trigger_condition] || rule.trigger_condition} ${rule.trigger_value} ${timeUnitLabels[rule.time_unit] || rule.time_unit}`
}

function toggleRule(id) {
    router.post(route('reminder-rules.toggle', id), {}, {
        preserveState: true
    })
}
</script>
