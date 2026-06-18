<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { followupRulesApi } from '@/api'
import type { FollowupRule } from '@/types'

const rules = ref<FollowupRule[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingRule = ref<Partial<FollowupRule> | null>(null)

const triggerEvents = [
  { label: '新线索创建', value: 'lead_created' },
  { label: '状态变更', value: 'status_changed' },
  { label: '量房完成', value: 'measurement_done' },
  { label: '报价完成', value: 'quotation_done' },
  { label: '超时未回访', value: 'followup_overdue' },
  { label: '签约成功', value: 'contract_signed' },
]

const actionMethods = [
  { label: '站内通知', value: 'notification' },
  { label: '短信', value: 'sms' },
  { label: '企业微信', value: 'wechat' },
]

async function fetchRules() {
  loading.value = true
  try {
    const { data } = await followupRulesApi.list()
    rules.value = data.sort((a, b) => a.priority - b.priority)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingRule.value = {
    name: '',
    triggerEvent: 'lead_created',
    triggerParams: {},
    actionRemindHours: 24,
    actionMethods: ['notification'],
    actionTarget: '',
    scopeDepartments: [],
    scopeRoles: [],
    scopeSources: [],
    priority: rules.value.length + 1,
    enabled: true,
  }
  showModal.value = true
}

function openEditModal(rule: FollowupRule) {
  editingRule.value = { ...rule }
  showModal.value = true
}

async function saveRule() {
  if (!editingRule.value) return
  if (editingRule.value.id) {
    await followupRulesApi.update(editingRule.value.id, editingRule.value)
  } else {
    await followupRulesApi.create(editingRule.value)
  }
  showModal.value = false
  await fetchRules()
}

async function toggleRule(rule: FollowupRule) {
  await followupRulesApi.toggle(rule.id, !rule.enabled)
  await fetchRules()
}

function getTriggerLabel(value: string) {
  return triggerEvents.find((e) => e.value === value)?.label || value
}

onMounted(fetchRules)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">回访规则</h1>
      <button
        class="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors flex items-center gap-1"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" /> 新建规则
      </button>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">规则名称</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">触发条件</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">提醒时间</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">通知方式</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">优先级</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-8 text-center text-slate-400">加载中...</td>
          </tr>
          <tr v-else-if="!rules.length">
            <td colspan="7" class="px-4 py-8 text-center text-slate-400">暂无规则</td>
          </tr>
          <tr v-for="rule in rules" :key="rule.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 text-sm text-slate-800 font-medium">{{ rule.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ getTriggerLabel(rule.triggerEvent) }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ rule.actionRemindHours }}小时</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ rule.actionMethods.join('、') }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ rule.priority }}</td>
            <td class="px-4 py-3">
              <button @click="toggleRule(rule)" class="text-slate-400 hover:text-amber-500">
                <ToggleRight v-if="rule.enabled" class="w-6 h-6 text-emerald-500" />
                <ToggleLeft v-else class="w-6 h-6 text-slate-300" />
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button class="p-1 rounded hover:bg-slate-100" @click="openEditModal(rule)">
                  <Edit2 class="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-medium text-slate-800 mb-4">
            {{ editingRule?.id ? '编辑规则' : '新建规则' }}
          </h3>
          <form @submit.prevent="saveRule" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">规则名称</label>
              <input
                v-model="editingRule!.name"
                class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">触发条件</label>
              <select
                v-model="editingRule!.triggerEvent"
                class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option v-for="evt in triggerEvents" :key="evt.value" :value="evt.value">
                  {{ evt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">提醒时间（小时）</label>
              <input
                v-model.number="editingRule!.actionRemindHours"
                type="number"
                min="1"
                class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">通知方式</label>
              <div class="flex gap-4">
                <label
                  v-for="method in actionMethods"
                  :key="method.value"
                  class="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    :value="method.value"
                    :checked="editingRule!.actionMethods?.includes(method.value)"
                    @change="
                      ($event: any) => {
                        const checked = $event.target.checked
                        if (checked) editingRule!.actionMethods = [...(editingRule!.actionMethods || []), method.value]
                        else editingRule!.actionMethods = (editingRule!.actionMethods || []).filter((m: string) => m !== method.value)
                      }
                    "
                  />
                  {{ method.label }}
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">优先级</label>
              <input
                v-model.number="editingRule!.priority"
                type="number"
                min="1"
                class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
                @click="showModal = false"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
