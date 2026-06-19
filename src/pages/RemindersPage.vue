<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, User, CheckCircle, Plus, Inbox } from 'lucide-vue-next'
import dayjs from 'dayjs'
import { reminderApi, requirementApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { Reminder, ReminderType, ReminderStatus, Requirement, CreateReminderRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const reminders = ref<Reminder[]>([])
const total = ref(0)
const isLoading = ref(false)
const currentPage = ref(1)

const filterStatus = ref<ReminderStatus | ''>('')
const filterType = ref<ReminderType | ''>('')

const requirements = ref<Requirement[]>([])
const isSubmitting = ref(false)

const newReminder = ref<{
  requirementId: number | null
  type: ReminderType
  message: string
  remindAt: string
}>({
  requirementId: null,
  type: 'urgent',
  message: '',
  remindAt: '',
})

const statusOptions: { label: string; value: ReminderStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待发送', value: 'pending' },
  { label: '已发送', value: 'sent' },
  { label: '已确认', value: 'acknowledged' },
]

const typeOptions: { label: string; value: ReminderType | '' }[] = [
  { label: '全部', value: '' },
  { label: '紧急催办', value: 'urgent' },
  { label: '日程提醒', value: 'schedule' },
  { label: '超期提醒', value: 'auto_overdue' },
]

const typeBadgeMap: Record<ReminderType, { class: string; label: string }> = {
  urgent: { class: 'bg-red-100 text-red-700', label: '紧急催办' },
  schedule: { class: 'bg-amber-100 text-amber-700', label: '日程提醒' },
  auto_overdue: { class: 'bg-orange-100 text-orange-700', label: '超期提醒' },
}

const statusBadgeMap: Record<ReminderStatus, { class: string; label: string }> = {
  pending: { class: 'bg-yellow-100 text-yellow-700', label: '待发送' },
  sent: { class: 'bg-blue-100 text-blue-700', label: '已发送' },
  acknowledged: { class: 'bg-green-100 text-green-700', label: '已确认' },
}

const filteredReminders = computed(() => {
  return reminders.value.filter((r) => {
    if (filterType.value && r.type !== filterType.value) return false
    if (filterStatus.value && r.status !== filterStatus.value) return false
    return true
  })
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchReminders() {
  isLoading.value = true
  try {
    const params: { status?: string; page?: number } = { page: currentPage.value }
    if (filterStatus.value) params.status = filterStatus.value
    const { data } = await reminderApi.list(params)
    reminders.value = data.data
    total.value = data.total
  } finally {
    isLoading.value = false
  }
}

async function fetchRequirements() {
  try {
    const { data } = await requirementApi.list({ perPage: 100 })
    requirements.value = data.data
  } catch {}
}

async function acknowledgeReminder(id: number) {
  try {
    await reminderApi.acknowledge(id)
    await fetchReminders()
  } catch {}
}

async function createReminder() {
  if (!newReminder.value.requirementId || !newReminder.value.message.trim() || !newReminder.value.remindAt) return
  isSubmitting.value = true
  try {
    const payload: CreateReminderRequest = {
      requirementId: newReminder.value.requirementId,
      type: newReminder.value.type,
      message: newReminder.value.message.trim(),
      remindAt: newReminder.value.remindAt,
    }
    await reminderApi.create(payload)
    newReminder.value = { requirementId: null, type: 'urgent', message: '', remindAt: '' }
    await fetchReminders()
  } finally {
    isSubmitting.value = false
  }
}

function goToRequirement(id: number) {
  router.push(`/requirements/${id}`)
}

onMounted(() => {
  fetchReminders()
  fetchRequirements()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-semibold text-slate-800">
        提醒管理
        <span class="text-sm font-normal text-slate-500 ml-2">共 {{ total }} 条</span>
      </h1>
    </div>

    <div class="card p-4 mb-4">
      <div class="flex gap-3 items-center flex-wrap">
        <select v-model="filterStatus" class="select w-auto min-w-[120px]" @change="fetchReminders">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filterType" class="select w-auto min-w-[120px]" @change="fetchReminders">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="filteredReminders.length === 0" class="card p-12 text-center">
      <div class="flex flex-col items-center text-slate-400">
        <Inbox class="w-12 h-12 mb-3" />
        <span>暂无提醒数据</span>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="reminder in filteredReminders"
        :key="reminder.id"
        class="card p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="badge" :class="typeBadgeMap[reminder.type].class">
                {{ typeBadgeMap[reminder.type].label }}
              </span>
              <span class="badge" :class="statusBadgeMap[reminder.status].class">
                {{ statusBadgeMap[reminder.status].label }}
              </span>
            </div>

            <p class="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{{ reminder.message }}</p>

            <a
              class="text-sm text-amber-600 hover:text-amber-700 cursor-pointer font-medium"
              @click.prevent="goToRequirement(reminder.requirementId)"
            >
              {{ reminder.requirement?.title ?? `需求 #${reminder.requirementId}` }}
            </a>

            <div class="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                {{ formatDate(reminder.remindAt) }}
              </span>
              <span class="flex items-center gap-1">
                <User class="w-3.5 h-3.5" />
                {{ reminder.creator?.name ?? '未知' }}
              </span>
            </div>
          </div>

          <button
            v-if="reminder.status === 'pending' || reminder.status === 'sent'"
            class="btn-accent btn-sm shrink-0"
            @click="acknowledgeReminder(reminder.id)"
          >
            <CheckCircle class="w-3.5 h-3.5 mr-1" />
            确认
          </button>
        </div>
      </div>
    </div>

    <div v-if="authStore.canManageReminders" class="card p-6 mt-4">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Plus class="w-5 h-5 text-amber-500" />
        新建提醒
      </h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">关联需求</label>
          <select v-model="newReminder.requirementId" class="select">
            <option :value="null" disabled>请选择需求</option>
            <option v-for="req in requirements" :key="req.id" :value="req.id">{{ req.title }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">提醒类型</label>
          <select v-model="newReminder.type" class="select">
            <option value="urgent">紧急催办</option>
            <option value="schedule">日程提醒</option>
          </select>
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium text-slate-600 mb-1">提醒内容</label>
          <textarea v-model="newReminder.message" class="input resize-none" rows="3" placeholder="请输入提醒内容..." />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">提醒时间</label>
          <input v-model="newReminder.remindAt" type="datetime-local" class="input" />
        </div>

        <div class="flex items-end">
          <button
            class="btn-accent w-full"
            :disabled="!newReminder.requirementId || !newReminder.message.trim() || !newReminder.remindAt || isSubmitting"
            @click="createReminder"
          >
            {{ isSubmitting ? '提交中...' : '创建提醒' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
