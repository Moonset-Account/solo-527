<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRemindersStore } from '@/stores/reminders'
import type { ReminderRule } from '@/types'

const remindersStore = useRemindersStore()

const showForm = ref(false)
const form = ref<Partial<ReminderRule>>({
  name: '',
  type: 'evaluation',
  condition: '',
  conditionValue: 0,
  action: 'send_notification',
  isEnabled: true,
})

const typeOptions = [
  { value: 'evaluation', label: '评价提醒' },
  { value: 'restock', label: '库存提醒' },
  { value: 'appointment', label: '预约提醒' },
  { value: 'anomaly', label: '异常预警' },
]

const conditionOptions: Record<string, { value: string; label: string }[]> = {
  evaluation: [{ value: 'hours_after_completion', label: '服务完成后（小时）' }],
  restock: [
    { value: 'stock_below_min', label: '库存低于最低值' },
    { value: 'stock_zero', label: '库存为零' },
  ],
  appointment: [{ value: 'minutes_after_appointment', label: '预约超时（分钟）' }],
  anomaly: [{ value: 'consumption_exceeds_ratio', label: '消耗超过倍数' }],
}

const actionOptions = [
  { value: 'send_notification', label: '发送通知' },
  { value: 'send_sms', label: '发送短信' },
  { value: 'send_email', label: '发送邮件' },
  { value: 'send_notification_and_email', label: '通知+邮件' },
]

async function handleSubmit() {
  await remindersStore.createRule(form.value)
  showForm.value = false
  form.value = { name: '', type: 'evaluation', condition: '', conditionValue: 0, action: 'send_notification', isEnabled: true }
}

async function toggleRule(ruleId: string, isEnabled: boolean) {
  await remindersStore.toggleRule(ruleId, isEnabled)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-800">提醒规则列表</h3>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-rosegold rounded-lg hover:bg-rosegold/90 transition-colors"
        @click="showForm = !showForm"
      >
        <Plus class="w-4 h-4" />
        添加规则
      </button>
    </div>

    <div v-if="showForm" class="bg-white rounded-xl border border-rosegold/10 p-5">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
          <input v-model="form.name" required class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">规则类型</label>
            <select v-model="form.type" class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite">
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">触发条件</label>
            <select v-model="form.condition" class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite">
              <option v-for="opt in (conditionOptions[form.type || 'evaluation'] || [])" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">条件值</label>
            <input v-model.number="form.conditionValue" type="number" class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">执行动作</label>
            <select v-model="form.action" class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite">
              <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="showForm = false">取消</button>
          <button type="submit" class="px-4 py-2 text-sm text-white bg-rosegold rounded-lg hover:bg-rosegold/90">保存</button>
        </div>
      </form>
    </div>

    <div
      v-for="rule in remindersStore.rules"
      :key="rule.id"
      class="bg-white rounded-xl border border-rosegold/10 p-4 flex items-center gap-4"
    >
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-800">{{ rule.name }}</p>
        <p class="text-xs text-grayrose mt-0.5">类型: {{ typeOptions.find((t) => t.value === rule.type)?.label }} · 条件: {{ rule.condition }} · 动作: {{ actionOptions.find((a) => a.value === rule.action)?.label }}</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" :checked="rule.isEnabled" class="sr-only peer" @change="toggleRule(rule.id, !rule.isEnabled)" />
        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rosegold"></div>
      </label>
    </div>
  </div>
</template>
