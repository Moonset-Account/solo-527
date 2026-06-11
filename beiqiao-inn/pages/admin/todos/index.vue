<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const todos = ref<any[]>([])
const reminders = ref<any[]>([])
const loading = ref(false)
const activePriority = ref('ALL')
const activeStatus = ref('PENDING')
const successMessage = ref('')
const showSuccess = ref(false)
const vacancyUpdated = ref(false)

const priorityTabs = [
  { label: '全部', value: 'ALL' },
  { label: 'P0紧急', value: 'P0', badge: 'badge-p0' },
  { label: 'P1重要', value: 'P1', badge: 'badge-p1' },
  { label: 'P2一般', value: 'P2', badge: 'badge-p2' },
]

const statusTabs = [
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'IN_PROGRESS' },
  { label: '已办结', value: 'COMPLETED' },
]

const typeLabel: Record<string, string> = {
  REFUND_APPROVAL: '退款审批',
  CLEANING: '清洁任务',
  REVIEW_REPLY: '评价回复',
}

const typeBadgeClass: Record<string, string> = {
  REFUND_APPROVAL: 'bg-brick/10 text-brick',
  CLEANING: 'bg-info/10 text-info',
  REVIEW_REPLY: 'bg-amber/15 text-amber',
}

const priorityBarClass: Record<string, string> = {
  P0: 'priority-bar-p0',
  P1: 'priority-bar-p1',
  P2: 'priority-bar-p2',
}

const statusLabel: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '处理中',
  COMPLETED: '已办结',
}

async function loadTodos() {
  loading.value = true
  try {
    const query: Record<string, string> = {}
    if (activePriority.value !== 'ALL') query.priority = activePriority.value
    if (activeStatus.value) query.status = activeStatus.value
    todos.value = await $fetch('/api/todos', { query })
  } finally {
    loading.value = false
  }
}

async function loadReminders() {
  try {
    reminders.value = await $fetch('/api/reminders', { query: { isRead: 'false' } })
  } catch {}
}

async function handleStart(id: number) {
  try {
    await $fetch(`/api/todos/${id}/start`, { method: 'PUT' })
    await loadTodos()
  } catch (e: any) {
    console.error('Failed to start todo:', e)
  }
}

async function handleComplete(id: number) {
  try {
    const result: any = await $fetch(`/api/todos/${id}/complete`, { method: 'PUT' })
    await loadTodos()
    await loadReminders()

    if (result.vacancyUpdated) {
      successMessage.value = '待办已办结，空置率已更新'
      vacancyUpdated.value = true
    } else {
      successMessage.value = '待办已办结'
      vacancyUpdated.value = false
    }
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (e: any) {
    console.error('Failed to complete todo:', e)
  }
}

async function markReminderRead(id: number) {
  try {
    await $fetch(`/api/reminders/${id}/read`, { method: 'PUT' })
    await loadReminders()
  } catch (e: any) {
    console.error('Failed to mark reminder read:', e)
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function isOverdue(dueAt: string | null) {
  if (!dueAt) return false
  return new Date(dueAt) < new Date()
}

onMounted(() => {
  loadTodos()
  loadReminders()
})

watch([activePriority, activeStatus], () => {
  loadTodos()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif text-2xl font-bold text-pine">待办中心</h1>
      <button
        @click="loadTodos(); loadReminders()"
        class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0115.357-2m-2H4v.582z" />
        </svg>
        刷新
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showSuccess"
          class="fixed top-4 right-4 z-50 bg-pine text-cream px-5 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ successMessage }}</span>
          <span v-if="vacancyUpdated" class="text-amber text-xs ml-1">(空置率 ↓)</span>
        </div>
      </Transition>
    </Teleport>

    <section v-if="reminders.length > 0" class="mb-6">
      <div class="bg-brick/5 border border-brick/20 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-5 h-5 text-brick" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="font-serif font-semibold text-brick">未读提醒 ({{ reminders.length }})</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="reminder in reminders"
            :key="reminder.id"
            class="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-cream-dark/50 transition-all hover:shadow-sm"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                :class="reminder.priority === 'P0' ? 'badge-p0' : reminder.priority === 'P1' ? 'badge-p1' : 'badge-p2'"
              >
                {{ reminder.priority }}
              </span>
              <span class="text-sm text-pine truncate">{{ reminder.title }}</span>
            </div>
            <button
              class="text-xs text-brick hover:text-brick-light font-medium flex-shrink-0 ml-3 transition-colors"
              @click="markReminderRead(reminder.id)"
            >
              标记已读
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="tab in priorityTabs"
          :key="tab.value"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5"
          :class="activePriority === tab.value
            ? 'bg-pine text-cream shadow-md'
            : 'bg-white text-pine border border-cream-dark hover:bg-cream-dark'"
          @click="activePriority = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="w-2 h-2 rounded-full" :class="tab.value === 'P0' ? 'bg-brick' : tab.value === 'P1' ? 'bg-amber' : 'bg-info'" />
        </button>
      </div>
    </section>

    <section class="mb-6">
      <div class="flex gap-2">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          :class="activeStatus === tab.value
            ? 'bg-pine-light text-cream'
            : 'bg-cream-dark text-pine/70 hover:text-pine'"
          @click="activeStatus = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section>
      <div v-if="loading" class="text-center py-16 text-slate">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
        <p>加载中...</p>
      </div>

      <div v-else-if="todos.length === 0" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-cream-dark mx-auto flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-slate/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-slate text-lg mb-1">暂无待办</p>
        <p class="text-slate/60 text-sm">当前筛选条件下没有待办事项</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="card transition-all duration-300"
          :class="[
            priorityBarClass[todo.priority],
            todo.status === 'COMPLETED' ? 'opacity-60' : '',
          ]"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="typeBadgeClass[todo.type]"
              >
                {{ typeLabel[todo.type] || todo.type }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="todo.priority === 'P0' ? 'badge-p0' : todo.priority === 'P1' ? 'badge-p1' : 'badge-p2'"
              >
                {{ todo.priority }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="todo.status === 'COMPLETED' ? 'bg-pine/10 text-pine' : todo.status === 'IN_PROGRESS' ? 'bg-amber/15 text-amber' : 'bg-slate/10 text-slate'"
              >
                {{ statusLabel[todo.status] }}
              </span>
            </div>
            <span
              v-if="todo.dueAt && isOverdue(todo.dueAt) && todo.status !== 'COMPLETED'"
              class="text-xs text-brick font-medium flex-shrink-0 ml-2"
            >
              已逾期
            </span>
          </div>

          <h3 class="font-serif text-base font-semibold text-pine mb-1" :class="{ 'line-through': todo.status === 'COMPLETED' }">
            {{ todo.title }}
          </h3>
          <p v-if="todo.description" class="text-sm text-pine/60 mb-3 line-clamp-2">
            {{ todo.description }}
          </p>

          <div class="flex items-center justify-between pt-3 border-t border-cream-dark/50">
            <div class="flex items-center gap-4 text-xs text-pine/60">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ todo.assignee?.name || '未分配' }}
              </span>
              <span v-if="todo.dueAt" class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(todo.dueAt) }}
              </span>
              <span v-if="todo.completedAt" class="flex items-center gap-1 text-pine/70">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ formatDate(todo.completedAt) }} 办结
              </span>
            </div>

            <div class="flex gap-2">
              <button
                v-if="todo.status === 'PENDING'"
                class="btn-primary text-xs px-3 py-1.5"
                @click="handleStart(todo.id)"
              >
                开始处理
              </button>
              <button
                v-if="todo.status === 'IN_PROGRESS'"
                class="btn-secondary text-xs px-3 py-1.5"
                @click="handleComplete(todo.id)"
              >
                办结
              </button>
              <span
                v-if="todo.status === 'COMPLETED'"
                class="text-xs text-pine/50 font-medium"
              >
                已完成
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
