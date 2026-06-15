<template>
    <div class="space-y-6">
        <div class="flex items-center space-x-3">
            <Link :href="route('reminder-rules.index')" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '编辑提醒规则' : '新建提醒规则' }}</h1>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form @submit.prevent="handleSubmit">
                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">规则名称 *</label>
                                <input
                                    v-model="form.name"
                                    type="text"
                                    required
                                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="请输入规则名称"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                                <textarea
                                    v-model="form.description"
                                    rows="2"
                                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="请输入规则描述（可选）"
                                ></textarea>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">提醒类型 *</label>
                                    <select
                                        v-model="form.type"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="(label, value) in types" :key="value" :value="value">{{ label }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">优先级 *</label>
                                    <select
                                        v-model="form.priority"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="(label, value) in priorities" :key="value" :value="value">{{ label }}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">触发条件 *</label>
                                    <select
                                        v-model="form.trigger_condition"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="(label, value) in triggerConditions" :key="value" :value="value">{{ label }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">触发值</label>
                                    <input
                                        v-model.number="form.trigger_value"
                                        type="number"
                                        min="0"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">时间单位</label>
                                    <select
                                        v-model="form.time_unit"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="(label, value) in timeUnits" :key="value" :value="value">{{ label }}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">通知渠道 *</label>
                                <div class="flex space-x-4">
                                    <label v-for="(label, value) in channels" :key="value" class="flex items-center">
                                        <input
                                            v-model="form.channel"
                                            type="radio"
                                            :value="value"
                                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span class="ml-2 text-sm text-gray-700">{{ label }}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">接收角色</label>
                                <div class="flex flex-wrap gap-3">
                                    <label v-for="(label, value) in roles" :key="value" class="flex items-center">
                                        <input
                                            v-model="form.recipient_roles"
                                            type="checkbox"
                                            :value="value"
                                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span class="ml-2 text-sm text-gray-700">{{ label }}</span>
                                    </label>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">最大提醒次数</label>
                                    <input
                                        v-model.number="form.max_reminders"
                                        type="number"
                                        min="0"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p class="text-xs text-gray-500 mt-1">0表示不限制</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">提醒间隔（小时）</label>
                                    <input
                                        v-model.number="form.reminder_interval_hours"
                                        type="number"
                                        min="1"
                                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p class="text-xs text-gray-500 mt-1">重复提醒的时间间隔</p>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">消息模板</label>
                                <textarea
                                    v-model="form.template"
                                    rows="4"
                                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="请输入消息模板内容...
可用变量: {{ '{{gap_no}}' }}, {{ '{{title}}' }}, {{ '{{due_date}}' }}, {{ '{{responsible}}' }}"
                                ></textarea>
                            </div>

                            <div class="flex items-center">
                                <input
                                    v-model="form.is_enabled"
                                    type="checkbox"
                                    id="is-enabled"
                                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label for="is-enabled" class="ml-2 text-sm text-gray-700">
                                    立即启用此规则
                                </label>
                            </div>
                        </div>

                        <div class="mt-8 flex justify-end space-x-3">
                            <Link
                                :href="route('reminder-rules.index')"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                取消
                            </Link>
                            <button
                                type="submit"
                                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                {{ isEdit ? '保存修改' : '创建规则' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-indigo-50 rounded-lg border border-indigo-200 p-5">
                    <h3 class="text-sm font-medium text-indigo-900 mb-3">规则说明</h3>
                    <ul class="text-sm text-indigo-700 space-y-2">
                        <li>• <strong>缺口到期提醒:</strong> 在整改期限到期前通知责任人</li>
                        <li>• <strong>缺口逾期提醒:</strong> 整改期限已过仍未关闭时提醒</li>
                        <li>• <strong>检查清单到期:</strong> 检查清单截止日期前提醒</li>
                        <li>• <strong>待审核提醒:</strong> 有新的待审核项时通知审核人</li>
                    </ul>
                </div>

                <div class="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
                    <h3 class="text-sm font-medium text-yellow-900 mb-2">注意事项</h3>
                    <ul class="text-sm text-yellow-700 space-y-1">
                        <li>• 提醒规则按定时任务执行</li>
                        <li>• 同一对象不会重复发送相同提醒</li>
                        <li>• 可以设置最大提醒次数避免骚扰</li>
                        <li>• 建议设置合理的提醒间隔</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    rule: Object,
    types: Object,
    triggerConditions: Object,
    timeUnits: Object,
    channels: Object,
    priorities: Object,
    roles: Object,
})

const isEdit = ref(!!props.rule)

const form = reactive({
    name: props.rule?.name || '',
    description: props.rule?.description || '',
    type: props.rule?.type || 'gap_due',
    trigger_condition: props.rule?.trigger_condition || 'before_due',
    trigger_value: props.rule?.trigger_value || 3,
    time_unit: props.rule?.time_unit || 'day',
    channel: props.rule?.channel || 'in_app',
    recipient_roles: props.rule?.recipient_roles || ['compliance_manager', 'project_secretary'],
    recipient_user_ids: props.rule?.recipient_user_ids || [],
    template: props.rule?.template || '',
    is_enabled: props.rule?.is_enabled ?? true,
    priority: props.rule?.priority || 'normal',
    max_reminders: props.rule?.max_reminders || 5,
    reminder_interval_hours: props.rule?.reminder_interval_hours || 24,
})

function handleSubmit() {
    if (isEdit.value) {
        router.put(route('reminder-rules.update', props.rule.id), { ...form })
    } else {
        router.post(route('reminder-rules.store'), { ...form })
    }
}
</script>
