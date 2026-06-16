<template>
  <div>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div
        v-for="tab in tabs"
        :key="tab.severity"
        class="card cursor-pointer transition-all"
        :class="{ 'ring-2 ring-primary-500 bg-primary-50': activeTab === tab.severity }"
        @click="activeTab = tab.severity"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ tab.label }}</p>
            <p class="text-2xl font-bold mt-1" :class="tab.textClass">{{ getSeverityCount(tab.severity) }}</p>
          </div>
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-2xl', tab.bg]">
            {{ tab.icon }}
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2">点击筛选此级别提醒</p>
      </div>
    </div>

    <div class="card mb-6">
      <div class="flex items-end gap-4 flex-wrap">
        <div>
          <label class="label">类型</label>
          <select v-model="filters.type" class="input">
            <option value="ALL">全部类型</option>
            <option v-for="(label, key) in reminderTypeLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">状态</label>
          <select v-model="filters.status" class="input">
            <option value="ALL">全部状态</option>
            <option value="PENDING">待发送</option>
            <option value="SENT">已发送</option>
            <option value="FAILED">发送失败</option>
            <option value="ACKNOWLEDGED">已确认</option>
          </select>
        </div>
        <button class="btn-primary" @click="loadData">筛选</button>
        <button class="btn-secondary" @click="showCreateModal = true">+ 手动发送提醒</button>
      </div>
    </div>

    <div class="card">
      <div class="space-y-3">
        <div
          v-for="r in filteredReminders"
          :key="r.id"
          class="p-4 rounded-lg border transition-all hover:shadow-md"
          :class="reminderSeverityColors[r.severity]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3 flex-1">
              <span class="text-2xl">{{ getSeverityIcon(r.severity) }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold">{{ r.title }}</h4>
                  <BadgeTag :text="reminderSeverityLabels[r.severity]" />
                  <BadgeTag :text="reminderTypeLabels[r.type]" />
                  <span v-if="r.severity === 'CRITICAL'" class="badge bg-red-600 text-white">
                    ⚠️ 阻断告警
                  </span>
                </div>
                <p class="text-sm opacity-80 mt-1">{{ r.message }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs opacity-70">
                  <span>📅 计划发送: {{ formatDate(r.sendAt) }}</span>
                  <span v-if="r.sentAt">✅ 已发送: {{ formatDate(r.sentAt) }}</span>
                  <NuxtLink v-if="r.candidate" :to="`/candidates/${r.candidateId}`" class="hover:underline">
                    👤 {{ r.candidate.name }}
                  </NuxtLink>
                  <span v-if="r.interview">📅 {{ r.interview.title }}</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <BadgeTag :text="r.status" :color-class="getStatusColor(r.status)" />
            </div>
          </div>
        </div>
        <div v-if="filteredReminders.length === 0" class="py-12 text-center text-gray-400">暂无符合条件的提醒</div>
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreateModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">手动发送提醒</h3>
        <div class="space-y-4">
          <div>
            <label class="label">候选人ID</label>
            <input v-model.number="createForm.candidateId" type="number" class="input" />
          </div>
          <div>
            <label class="label">标题</label>
            <input v-model="createForm.title" type="text" class="input" />
          </div>
          <div>
            <label class="label">消息内容</label>
            <textarea v-model="createForm.message" class="input" rows="3"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">类型</label>
              <select v-model="createForm.type" class="input">
                <option v-for="(label, key) in reminderTypeLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="label">严重级别</label>
              <select v-model="createForm.severity" class="input">
                <option v-for="(label, key) in reminderSeverityLabels" :key="key" :value="key">{{ label }}</option>
              </select>
              <p class="text-xs text-gray-400 mt-1">普通提示: INFO | 警告: WARNING | 阻断告警: CRITICAL</p>
            </div>
          </div>
          <div>
            <label class="label">发送时间</label>
            <input v-model="createForm.sendAt" type="datetime-local" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn-primary" @click="handleCreate">创建提醒</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reminderTypeLabels, reminderSeverityLabels, reminderSeverityColors, formatDate } from '~/composables/useConstants'
import { useReminderStore } from '~/stores/reminder'

const reminderStore = useReminderStore()
const reminders = computed(() => reminderStore.reminders)

const tabs = [
  { severity: 'ALL', label: '全部提醒', icon: '🔔', bg: 'bg-blue-50', textClass: 'text-blue-700' },
  { severity: 'INFO', label: '普通提示 (INFO)', icon: 'ℹ️', bg: 'bg-blue-50', textClass: 'text-blue-700' },
  { severity: 'WARNING', label: '警告 (WARNING)', icon: '⚠️', bg: 'bg-yellow-50', textClass: 'text-yellow-700' },
  { severity: 'CRITICAL', label: '阻断告警 (CRITICAL)', icon: '🚨', bg: 'bg-red-50', textClass: 'text-red-700' }
]

const activeTab = ref('ALL')
const filters = reactive({ type: 'ALL', status: 'ALL' })
const showCreateModal = ref(false)
const createForm = reactive({
  candidateId: 0, title: '', message: '',
  type: 'FOLLOW_UP_NEEDED', severity: 'INFO',
  sendAt: ''
})

const filteredReminders = computed(() => {
  return reminders.value.filter(r => {
    if (activeTab.value !== 'ALL' && r.severity !== activeTab.value) return false
    if (filters.type !== 'ALL' && r.type !== filters.type) return false
    if (filters.status !== 'ALL' && r.status !== filters.status) return false
    return true
  })
})

function getSeverityCount(severity: string) {
  if (severity === 'ALL') return reminders.value.length
  return reminders.value.filter(r => r.severity === severity).length
}

function getSeverityIcon(severity: string) {
  if (severity === 'CRITICAL') return '🚨'
  if (severity === 'WARNING') return '⚠️'
  return 'ℹ️'
}

function getStatusColor(status: string) {
  if (status === 'SENT') return 'bg-green-100 text-green-800'
  if (status === 'FAILED') return 'bg-red-100 text-red-800'
  if (status === 'ACKNOWLEDGED') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-800'
}

async function handleCreate() {
  if (!createForm.candidateId || !createForm.title || !createForm.sendAt) {
    alert('请填写候选人ID、标题和发送时间')
    return
  }
  try {
    await reminderStore.createReminder(createForm)
    showCreateModal.value = false
    loadData()
  } catch (e: any) {
    alert(e?.statusMessage || '创建失败')
  }
}

function loadData() {
  reminderStore.fetchReminders()
}

onMounted(loadData)
</script>
