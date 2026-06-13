<script setup lang="ts">
import { ClipboardList, AlertTriangle, TrendingUp, Clock, RotateCcw, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-vue-next'

const api = useApi()
const router = useRouter()

const dashboard = ref<any>(null)
const loading = ref(true)

const loadDashboard = async () => {
  loading.value = true
  try {
    dashboard.value = await api.get('/api/statistics/dashboard')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)

const formatRate = (rate: number) => (rate * 100).toFixed(1) + '%'

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待调度', class: 'badge-pending' },
  scheduled: { label: '已调度', class: 'badge-generating' },
  generating: { label: '生成中', class: 'badge-generating' },
  completed: { label: '已完成', class: 'badge-completed' },
  failed: { label: '失败', class: 'badge-failed' },
  timeout: { label: '超时', class: 'badge-timeout' },
}

const handleRerun = async (taskId: string) => {
  try {
    await api.post(`/api/tasks/${taskId}/rerun`)
    await loadDashboard()
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">工作台</h1>
      <button @click="loadDashboard" class="btn-secondary text-sm flex items-center gap-1">
        <RotateCcw class="w-3.5 h-3.5" />
        刷新
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-4 gap-4">
        <div class="card-hover p-5 border-l-4 border-l-brand-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">待办事项</p>
              <p class="text-3xl font-bold text-slate-800 mt-1">{{ dashboard.pendingTodoCount }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <ClipboardList class="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <button @click="router.push('/tasks')" class="text-xs text-brand-600 hover:text-brand-700 mt-3 flex items-center gap-1">
            查看任务 <ChevronRight class="w-3 h-3" />
          </button>
        </div>

        <div class="card-hover p-5 border-l-4 border-l-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">超时提醒</p>
              <p class="text-3xl font-bold text-red-600 mt-1">{{ dashboard.timeoutAlertCount }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 text-red-500" />
            </div>
          </div>
          <button v-if="dashboard.timeoutAlertCount > 0" @click="router.push('/tasks?status=timeout')" class="text-xs text-red-600 hover:text-red-700 mt-3 flex items-center gap-1">
            处理超时 <ChevronRight class="w-3 h-3" />
          </button>
        </div>

        <div class="card-hover p-5 border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">今日命中率</p>
              <p class="text-3xl font-bold text-emerald-600 mt-1">{{ formatRate(dashboard.todayHitRate.hitRate) }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-3">{{ dashboard.todayHitRate.hitCount }}/{{ dashboard.todayHitRate.total }} 命中</p>
        </div>

        <div class="card-hover p-5 border-l-4 border-l-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">本周命中率</p>
              <p class="text-3xl font-bold text-blue-600 mt-1">{{ formatRate(dashboard.weekHitRate.hitRate) }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-3">{{ dashboard.weekHitRate.hitCount }}/{{ dashboard.weekHitRate.total }} 命中</p>
        </div>
      </div>

      <div v-if="dashboard.timeoutAlertCount > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle class="w-5 h-5 text-red-500 animate-pulse" />
          <h3 class="font-bold text-red-700">超时提醒</h3>
        </div>
        <p class="text-sm text-red-600">有 {{ dashboard.timeoutAlertCount }} 个任务已超时，请尽快处理或重新调度。</p>
        <button @click="router.push('/tasks?status=timeout')" class="btn-danger mt-3 text-sm">
          前往处理
        </button>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800">近期任务</h2>
          <button @click="router.push('/tasks')" class="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            查看全部 <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="space-y-3">
          <div v-for="task in dashboard.recentTasks" :key="task.id" class="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-slate-800 truncate">{{ task.name }}</span>
                <span :class="statusMap[task.status]?.class || 'badge-pending'">{{ statusMap[task.status]?.label || task.status }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ new Date(task.createdAt).toLocaleDateString() }}
                </span>
                <span>{{ task.completedItems }}/{{ task.totalItems }} 完成</span>
              </div>
            </div>
            <div class="w-24">
              <div class="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all duration-500"
                  :class="task.status === 'completed' ? 'bg-emerald-500' : task.status === 'timeout' ? 'bg-red-500' : 'bg-brand-500'"
                  :style="{ width: task.totalItems > 0 ? (task.completedItems / task.totalItems * 100) + '%' : '0%' }"
                />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button v-if="task.status === 'timeout'" @click="handleRerun(task.id)" class="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-500" title="重新调度">
                <RotateCcw class="w-4 h-4" />
              </button>
              <CheckCircle2 v-if="task.status === 'completed'" class="w-4 h-4 text-emerald-500" />
              <XCircle v-if="task.status === 'failed'" class="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div v-if="dashboard.recentTasks.length === 0" class="text-center py-8 text-slate-400 text-sm">
            暂无近期任务
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
