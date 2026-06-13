<script setup lang="ts">
import { Plus, RotateCcw, Trash2, Loader2, Clock, ChevronDown, ChevronUp, Search } from 'lucide-vue-next'

const api = useApi()
const route = useRoute()
const router = useRouter()

const tasks = ref<any[]>([])
const loading = ref(true)
const filterStatus = ref((route.query.status as string) || '')
const showCreate = ref(false)
const creating = ref(false)

const newTask = reactive({
  name: '',
  questions: '',
  timeoutMinutes: 30,
  temperature: 0.7,
})

const loadTasks = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterStatus.value) params.status = filterStatus.value
    tasks.value = await api.get('/api/tasks', params)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(filterStatus, loadTasks)
onMounted(loadTasks)

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待调度', class: 'badge-pending' },
  scheduled: { label: '已调度', class: 'badge-generating' },
  generating: { label: '生成中', class: 'badge-generating' },
  completed: { label: '已完成', class: 'badge-completed' },
  failed: { label: '失败', class: 'badge-failed' },
  timeout: { label: '超时', class: 'badge-timeout' },
}

const handleRerun = async (id: string) => {
  try {
    await api.post(`/api/tasks/${id}/rerun`)
    await loadTasks()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定删除此任务？')) return
  try {
    await api.delete(`/api/tasks/${id}`)
    await loadTasks()
  } catch (e) {
    console.error(e)
  }
}

const handleCreate = async () => {
  creating.value = true
  try {
    const questions = newTask.questions.split('\n').map(q => q.trim()).filter(q => q).map(q => ({ content: q }))
    if (questions.length === 0) {
      alert('请至少输入一个问题')
      creating.value = false
      return
    }
    await api.post('/api/tasks', {
      name: newTask.name || `批量任务 ${new Date().toLocaleDateString()}`,
      totalItems: questions.length,
      timeoutMinutes: newTask.timeoutMinutes,
      config: { generateCount: questions.length, llmModel: 'mock', temperature: newTask.temperature },
      questions,
    })
    showCreate.value = false
    newTask.name = ''
    newTask.questions = ''
    await loadTasks()
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

const expandedTask = ref<string | null>(null)
const taskDetail = ref<any>(null)
const loadingDetail = ref(false)

const toggleDetail = async (id: string) => {
  if (expandedTask.value === id) {
    expandedTask.value = null
    return
  }
  expandedTask.value = id
  loadingDetail.value = true
  try {
    taskDetail.value = await api.get(`/api/tasks/${id}`)
  } catch (e) {
    console.error(e)
  } finally {
    loadingDetail.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">批处理任务</h1>
      <button @click="showCreate = !showCreate" class="btn-primary flex items-center gap-1.5">
        <Plus class="w-4 h-4" />
        新建任务
      </button>
    </div>

    <div v-if="showCreate" class="card p-5 border-l-4 border-l-brand-500">
      <h3 class="font-bold text-slate-800 mb-4">新建批处理任务</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
            <input v-model="newTask.name" class="input-field" placeholder="输入任务名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">超时(分钟)</label>
            <input v-model.number="newTask.timeoutMinutes" type="number" class="input-field" min="5" max="120" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">问题列表（每行一个问题）</label>
          <textarea v-model="newTask.questions" rows="5" class="input-field resize-none" placeholder="每行输入一个客户问题" />
        </div>
        <div class="flex items-center gap-3">
          <button @click="handleCreate" class="btn-primary flex items-center gap-1.5" :disabled="creating">
            <Loader2 v-if="creating" class="w-4 h-4 animate-spin" />
            {{ creating ? '创建中...' : '创建任务' }}
          </button>
          <button @click="showCreate = false" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 text-sm text-slate-500">
          <Search class="w-4 h-4" />
          <span>筛选：</span>
        </div>
        <select v-model="filterStatus" class="select-field w-40">
          <option value="">全部状态</option>
          <option value="pending">待调度</option>
          <option value="generating">生成中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
          <option value="timeout">超时</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <div v-else class="space-y-3">
      <div v-for="task in tasks" :key="task.id" class="card">
        <div class="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors" @click="toggleDetail(task.id)">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-800">{{ task.name }}</span>
              <span :class="statusMap[task.status]?.class || 'badge-pending'">{{ statusMap[task.status]?.label || task.status }}</span>
            </div>
            <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
              <span class="flex items-center gap-1"><Clock class="w-3 h-3" />{{ new Date(task.createdAt).toLocaleString() }}</span>
              <span>{{ task.completedItems }}/{{ task.totalItems }} 完成</span>
              <span v-if="task.creator">创建者：{{ task.creator.displayName }}</span>
            </div>
          </div>
          <div class="w-32">
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="task.status === 'completed' ? 'bg-emerald-500' : task.status === 'timeout' ? 'bg-red-500' : task.status === 'failed' ? 'bg-red-400' : 'bg-brand-500'"
                :style="{ width: task.totalItems > 0 ? (task.completedItems / task.totalItems * 100) + '%' : '0%' }"
              />
            </div>
            <p class="text-xs text-slate-400 text-center mt-1">{{ task.totalItems > 0 ? Math.round(task.completedItems / task.totalItems * 100) : 0 }}%</p>
          </div>
          <div class="flex items-center gap-1">
            <button v-if="task.status === 'timeout' || task.status === 'failed'" @click.stop="handleRerun(task.id)" class="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-500" title="重新调度">
              <RotateCcw class="w-4 h-4" />
            </button>
            <button v-if="task.status === 'completed' || task.status === 'failed'" @click.stop="handleDelete(task.id)" class="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500" title="删除">
              <Trash2 class="w-4 h-4" />
            </button>
            <component :is="expandedTask === task.id ? ChevronUp : ChevronDown" class="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div v-if="expandedTask === task.id" class="border-t border-slate-200 p-4 bg-slate-50">
          <div v-if="loadingDetail" class="flex items-center justify-center py-6">
            <Loader2 class="w-5 h-5 animate-spin text-brand-500" />
          </div>
          <div v-else-if="taskDetail" class="space-y-3">
            <h4 class="text-sm font-medium text-slate-600">生成结果 ({{ taskDetail.questions?.length || 0 }} 条问题)</h4>
            <div v-for="q in taskDetail.questions" :key="q.id" class="bg-white rounded-lg p-3 border border-slate-200">
              <p class="text-sm font-medium text-slate-700">{{ q.content }}</p>
              <div v-if="q.suggestions && q.suggestions.length > 0" class="mt-2 space-y-2">
                <div v-for="s in q.suggestions" :key="s.id" class="flex items-center gap-2 text-sm">
                  <span :class="s.isHit ? 'text-emerald-600' : 'text-amber-600'">
                    {{ s.isHit ? '✓ 命中' : '✗ 未命中' }}
                  </span>
                  <span class="text-slate-500 truncate flex-1">{{ s.content.substring(0, 80) }}...</span>
                  <span class="text-xs text-slate-400">{{ (s.confidence * 100).toFixed(0) }}%</span>
                </div>
              </div>
              <div v-else class="mt-1 text-xs text-slate-400">暂无回复建议</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tasks.length === 0" class="text-center py-16 text-slate-400">
        <p>暂无批处理任务</p>
        <button @click="showCreate = true" class="btn-primary mt-4">创建第一个任务</button>
      </div>
    </div>
  </div>
</template>
