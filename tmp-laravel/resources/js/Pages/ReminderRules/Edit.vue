<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('reminder-rules.show', rule.id)" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">编辑提醒规则</h1>
                    <p class="text-sm text-gray-500 mt-1">{{ rule.name }}</p>
                </div>
            </div>
        </div>

        <form @submit.prevent="submitForm" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">规则名称 *</label>
                        <input
                            v-model="form.name"
                            type="text"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">提醒类型 *</label>
                        <select
                            v-model="form.type"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option v-for="(label, value) in types" :key="value" :value="value">
                                {{ label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                        <select
                            v-model="form.priority"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option v-for="(label, value) in priorities" :key="value" :value="value">
                                {{ label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">触发条件类型</label>
                        <select
                            v-model="form.trigger_condition"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option v-for="(label, value) in triggerConditions" :key="value" :value="value">
                                {{ label }}
                            </option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">单位</label>
                            <select
                                v-model="form.time_unit"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option v-for="(label, value) in timeUnits" :key="value" :value="value">
                                    {{ label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">提醒间隔（小时）</label>
                        <input
                            v-model.number="form.reminder_interval_hours"
                            type="number"
                            min="1"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">最大提醒次数</label>
                        <input
                            v-model.number="form.max_reminders"
                            type="number"
                            min="0"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0 表示无限制"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">通知渠道</label>
                        <select
                            v-model="form.channel"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option v-for="(label, value) in channels" :key="value" :value="value">
                                {{ label }}
                            </option>
                        </select>
                    </div>

                    <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">接收角色</label>
                            <div class="space-y-2 border border-gray-200 rounded-md p-3">
                                <label v-for="(label, value) in roles" :key="value" class="flex items-center">
                                    <input
                                        :value="value"
                                        type="checkbox"
                                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        v-model="form.recipient_roles"
                                    />
                                    <span class="ml-2 text-sm text-gray-700">{{ label }}</span>
                                </label>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <div class="flex items-center">
                                <input
                                    v-model="form.is_enabled"
                                    type="checkbox"
                                    id="is-enabled"
                                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label for="is-enabled" class="ml-2 text-sm text-gray-700">
                                    启用此规则
                                </label>
                            </div>
                            <div class="mt-4 text-xs text-gray-500 space-y-1">
                                <p>启用后系统将按规则配置自动发送提醒。</p>
                                <p>建议在保存测试后启用。</p>
                            </div>
                        </div>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">消息模板</label>
                        <textarea
                            v-model="form.template"
                            rows="3"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="支持占位符：{title} {gap_no} {severity} {due_date} {responsible} 等..."
                        ></textarea>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">描述/备注</label>
                        <textarea
                            v-model="form.description"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <Link
                    :href="route('reminder-rules.show', rule.id)"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    取消
                </Link>
                <button
                    type="submit"
                    class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    保存修改
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive } from 'vue'
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

const form = reactive({
    name: props.rule?.name || '',
    description: props.rule?.description || '',
    type: props.rule?.type || 'gap_due',
    trigger_condition: props.rule?.trigger_condition || 'before_due',
    trigger_value: props.rule?.trigger_value ?? 7,
    time_unit: props.rule?.time_unit || 'day',
    reminder_interval_hours: props.rule?.reminder_interval_hours ?? 24,
    max_reminders: props.rule?.max_reminders ?? 5,
    channel: props.rule?.channel || 'in_app',
    recipient_roles: props.rule?.recipient_roles || [],
    recipient_user_ids: props.rule?.recipient_user_ids || [],
    template: props.rule?.template || '',
    priority: props.rule?.priority || 'normal',
    is_enabled: props.rule?.is_enabled ?? true,
})

function submitForm() {
    router.put(route('reminder-rules.update', props.rule.id), { ...form })
}
</script>
