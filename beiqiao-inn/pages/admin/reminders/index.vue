<script setup lang="ts">
import type { ReminderCondition } from '~/shared/types'

definePageMeta({ layout: 'admin' })

interface Rule {
  id: number
  name: string
  condition: ReminderCondition
  priority: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

const rules = ref<Rule[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const editingRule = ref<Rule | null>(null)
const saving = ref(false)

const fieldOptions = [
  { label: '可售数量', value: 'availableCount' },
  { label: '空置率', value: 'vacancyRate' },
]

const operatorOptions = [
  { label: '<', value: 'LT' },
  { label: '<=', value: 'LTE' },
  { label: '>', value: 'GT' },
  { label: '>=', value: 'GTE' },
  { label: '=', value: 'EQ' },
]

const priorityOptions = [
  { label: 'P0紧急', value: 'P0' },
  { label: 'P1重要', value: 'P1' },
  { label: 'P2一般', value: 'P2' },
]

const form = reactive({
  name: '',
  field: 'availableCount' as 'availableCount' | 'vacancyRate',
  operator: 'LT' as 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ',
  value: 0,
  priority: 'P2',
  enabled: true,
})

const operatorSymbol: Record<string, string> = {
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>=',
  EQ: '=',
}

const fieldLabel: Record<string, string> = {
  availableCount: '可售数量',
  vacancyRate: '空置率',
}

async function loadRules() {
  loading.value = true
  try {
    rules.value = await $fetch('/api/reminders/rules')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingRule.value = null
  form.name = ''
  form.field = 'availableCount'
  form.operator = 'LT'
  form.value = 0
  form.priority = 'P2'
  form.enabled = true
  modalOpen.value = true
}

function openEditModal(rule: Rule) {
  editingRule.value = rule
  form.name = rule.name
  form.field = (rule.condition as ReminderCondition).field || 'availableCount'
  form.operator = (rule.condition as ReminderCondition).operator || 'LT'
  form.value = (rule.condition as ReminderCondition).value ?? 0
  form.priority = rule.priority
  form.enabled = rule.enabled
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingRule.value = null
}

async function saveRule() {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const condition: ReminderCondition = {
      field: form.field,
      operator: form.operator,
      value: form.value,
    }

    if (editingRule.value) {
      await $fetch(`/api/reminders/rules/${editingRule.value.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
          condition,
          priority: form.priority,
          enabled: form.enabled,
        },
      })
    } else {
      await $fetch('/api/reminders/rules', {
        method: 'POST',
        body: {
          name: form.name,
          condition,
          priority: form.priority,
          enabled: form.enabled,
        },
      })
    }
    closeModal()
    await loadRules()
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(rule: Rule) {
  await $fetch(`/api/reminders/rules/${rule.id}`, {
    method: 'PUT',
    body: { enabled: !rule.enabled },
  })
  await loadRules()
}

function conditionSummary(rule: Rule) {
  const cond = rule.condition as ReminderCondition
  if (!cond) return ''
  return `${fieldLabel[cond.field] || cond.field} ${operatorSymbol[cond.operator] || cond.operator} ${cond.value}`
}

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif text-2xl font-bold text-pine">提醒规则</h1>
      <button class="btn-primary text-sm" @click="openCreateModal">
        新增规则
      </button>
    </div>

    <section>
      <div v-if="loading" class="text-center py-16 text-slate">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
        <p>加载中...</p>
      </div>

      <div v-else-if="rules.length === 0" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-cream-dark mx-auto flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-slate/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p class="text-slate text-lg mb-1">暂无规则</p>
        <p class="text-slate/60 text-sm">点击"新增规则"创建提醒规则</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="card"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-serif text-base font-semibold text-pine">{{ rule.name }}</h3>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="rule.priority === 'P0' ? 'badge-p0' : rule.priority === 'P1' ? 'badge-p1' : 'badge-p2'"
                >
                  {{ rule.priority }}
                </span>
              </div>
              <div class="bg-cream rounded-lg px-3 py-2 inline-block">
                <code class="text-sm text-pine/80 font-mono">{{ conditionSummary(rule) }}</code>
              </div>
            </div>

            <div class="flex items-center gap-3 ml-4">
              <button
                class="text-xs text-pine/60 hover:text-pine transition-colors font-medium"
                @click="openEditModal(rule)"
              >
                编辑
              </button>

              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0"
                :class="rule.enabled ? 'bg-pine' : 'bg-cream-dark'"
                @click="toggleEnabled(rule)"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200"
                  :class="rule.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-pine-dark/50 backdrop-blur-sm" @click="closeModal" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
          <h3 class="font-serif text-xl font-semibold text-pine mb-5">
            {{ editingRule ? '编辑规则' : '新增规则' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-pine mb-1.5">规则名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="输入规则名称"
                class="w-full border border-cream-dark rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-pine mb-1.5">触发条件</label>
              <div class="flex gap-2">
                <select
                  v-model="form.field"
                  class="flex-1 border border-cream-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 bg-white"
                >
                  <option v-for="opt in fieldOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <select
                  v-model="form.operator"
                  class="w-20 border border-cream-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 bg-white"
                >
                  <option v-for="opt in operatorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input
                  v-model.number="form.value"
                  type="number"
                  placeholder="阈值"
                  class="w-24 border border-cream-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-pine mb-1.5">优先级</label>
              <div class="flex gap-2">
                <button
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  :class="form.priority === opt.value
                    ? 'bg-pine text-cream'
                    : 'bg-cream-dark text-pine/70 hover:text-pine'"
                  @click="form.priority = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-pine">启用规则</label>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                :class="form.enabled ? 'bg-pine' : 'bg-cream-dark'"
                @click="form.enabled = !form.enabled"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200"
                  :class="form.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button class="btn-secondary flex-1" @click="closeModal">取消</button>
            <button
              class="btn-primary flex-1"
              :class="{ 'opacity-50 cursor-not-allowed': !form.name.trim() || saving }"
              :disabled="!form.name.trim() || saving"
              @click="saveRule"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
