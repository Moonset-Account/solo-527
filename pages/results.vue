<script setup lang="ts">
import { Search, Save, Trash2, Loader2, BookOpen, FileText, AlertCircle, Filter } from 'lucide-vue-next'

const api = useApi()

const activeTab = ref<'logs' | 'results' | 'references'>('results')
const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)

const tasks = ref<any[]>([])

const filters = reactive({
  startDate: '',
  endDate: '',
  batchTaskId: '',
  isHit: '' as string,
  isMissing: '' as string,
  responseStatus: '' as string,
})

const filterPresets = ref<any[]>([])
const showSavePreset = ref(false)
const presetName = ref('')

const loadTasks = async () => {
  try {
    tasks.value = await api.get('/api/tasks')
  } catch (e) {
    console.error(e)
  }
}

const loadPresets = async () => {
  try {
    filterPresets.value = await api.get('/api/filter-presets', { page: 'results' })
  } catch (e) {
    console.error(e)
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    if (filters.batchTaskId) params.batchTaskId = filters.batchTaskId
    if (filters.responseStatus) params.responseStatus = filters.responseStatus
    const res: any = await api.get('/api/call-logs', params)
    items.value = res.items || []
    total.value = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadResults = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    if (filters.isHit !== '') params.isHit = filters.isHit
    if (filters.batchTaskId) params.batchTaskId = filters.batchTaskId
    if (filters.isMissing !== '') params.hasMissingReference = filters.isMissing
    const res: any = await api.get('/api/suggestions', params)
    items.value = res.items || []
    total.value = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadReferences = async () => {
  loading.value = true
  try {
    const params: any = { limit: 500 }
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    if (filters.batchTaskId) params.batchTaskId = filters.batchTaskId
    if (filters.isHit !== '') params.isHit = filters.isHit

    const res: any = await api.get('/api/suggestions', params)
    const allSuggestions = res.items || []
    const allRefs = allSuggestions.flatMap((s: any) =>
      (s.references || []).map((r: any) => ({
        ...r,
        suggestionContent: s.content,
        questionContent: s.question?.content,
        batchTaskId: s.question?.batchTaskId,
      }))
    )

    const missingFilter = filters.isMissing
    items.value = missingFilter === ''
      ? allRefs
      : allRefs.filter((r: any) => String(r.isMissing) === missingFilter)

    total.value = items.value.length
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadData = () => {
  if (activeTab.value === 'logs') loadLogs()
  else if (activeTab.value === 'results') loadResults()
  else loadReferences()
}

watch(activeTab, loadData)

const applyFilters = () => loadData()

const resetFilters = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.batchTaskId = ''
  filters.isHit = ''
  filters.isMissing = ''
  filters.responseStatus = ''
  loadData()
}

const handleSavePreset = async () => {
  if (!presetName.value.trim()) return
  try {
    await api.post('/api/filter-presets', {
      name: presetName.value,
      page: 'results',
      filters: { ...filters, activeTab: activeTab.value },
    })
    presetName.value = ''
    showSavePreset.value = false
    await loadPresets()
  } catch (e) {
    console.error(e)
  }
}

const handleDeletePreset = async (id: string) => {
  try {
    await api.delete(`/api/filter-presets/${id}`)
    await loadPresets()
  } catch (e) {
    console.error(e)
  }
}

const applyPreset = (preset: any) => {
  const f = preset.filters
  filters.startDate = f.startDate || ''
  filters.endDate = f.endDate || ''
  filters.batchTaskId = f.batchTaskId || ''
  filters.isHit = f.isHit ?? ''
  filters.isMissing = f.isMissing ?? ''
  filters.responseStatus = f.responseStatus || ''
  if (f.activeTab) activeTab.value = f.activeTab
  loadData()
}

onMounted(() => {
  loadTasks()
  loadPresets()
  loadData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">结果与筛选</h1>
      <div class="flex items-center gap-2">
        <div v-if="filterPresets.length > 0" class="relative">
          <select
            class="select-field w-44 text-sm"
            @change="(e: any) => { const idx = e.target.value; if (idx && filterPresets[idx]) applyPreset(filterPresets[idx]); }"
          >
            <option value="">常用筛选</option>
            <option v-for="(preset, idx) in filterPresets" :key="preset.id" :value="idx">{{ preset.name }}</option>
          </select>
        </div>
        <button @click="showSavePreset = !showSavePreset" class="btn-secondary text-sm flex items-center gap-1">
          <Save class="w-3.5 h-3.5" />
          保存筛选
        </button>
      </div>
    </div>

    <div v-if="showSavePreset" class="card p-4 flex items-center gap-3">
      <input v-model="presetName" class="input-field w-48" placeholder="筛选名称" />
      <button @click="handleSavePreset" class="btn-primary text-sm" :disabled="!presetName.trim()">保存</button>
      <button @click="showSavePreset = false" class="btn-secondary text-sm">取消</button>
    </div>

    <div v-if="filterPresets.length > 0" class="flex items-center gap-2 flex-wrap">
      <span class="text-xs text-slate-500">已保存：</span>
      <div v-for="preset in filterPresets" :key="preset.id" class="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full">
        <span>{{ preset.name }}</span>
        <button @click="applyPreset(preset)" class="hover:text-brand-900">应用</button>
        <button @click="handleDeletePreset(preset.id)" class="hover:text-red-500">
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>

    <div class="card p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter class="w-4 h-4" />
          筛选条件
        </div>
        <select v-model="filters.batchTaskId" class="select-field w-64">
          <option value="">全部批处理任务</option>
          <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }} ({{ t.totalItems }}条)</option>
        </select>
        <input v-model="filters.startDate" type="date" class="input-field w-40" />
        <span class="text-sm text-slate-400">至</span>
        <input v-model="filters.endDate" type="date" class="input-field w-40" />
        <select v-model="filters.isHit" class="select-field w-28">
          <option value="">命中状态</option>
          <option value="true">已命中</option>
          <option value="false">未命中</option>
        </select>
        <select v-model="filters.isMissing" class="select-field w-28">
          <option value="">引用状态</option>
          <option value="true">有缺失</option>
          <option value="false">无缺失</option>
        </select>
        <select v-if="activeTab === 'logs'" v-model="filters.responseStatus" class="select-field w-24">
          <option value="">状态码</option>
          <option value="200">2xx</option>
          <option value="500">错误</option>
        </select>
        <button @click="applyFilters" class="btn-primary text-sm">应用</button>
        <button @click="resetFilters" class="btn-secondary text-sm">重置</button>
      </div>
    </div>

    <div class="card">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in [{ key: 'logs', label: '调用日志', icon: FileText }, { key: 'results', label: '生成结果', icon: AlertCircle }, { key: 'references', label: '引用来源', icon: BookOpen }]"
          :key="tab.key"
          @click="activeTab = tab.key as any"
          class="flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.key ? 'text-brand-600 border-brand-500' : 'text-slate-500 border-transparent hover:text-slate-700'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <div class="p-4">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
        </div>

        <template v-else>
          <div v-if="activeTab === 'logs'" class="space-y-2">
            <div class="grid grid-cols-12 gap-3 text-xs font-medium text-slate-500 px-3 py-2 bg-slate-50 rounded">
              <div class="col-span-1">状态码</div>
              <div class="col-span-3">接口</div>
              <div class="col-span-4">问题</div>
              <div class="col-span-2">耗时</div>
              <div class="col-span-2">时间</div>
            </div>
            <div v-for="log in items" :key="log.id" class="grid grid-cols-12 gap-3 text-sm px-3 py-2 border-b border-slate-100 hover:bg-slate-50">
              <div class="col-span-1">
                <span :class="log.responseStatus >= 200 && log.responseStatus < 300 ? 'text-emerald-600' : 'text-red-600'">
                  {{ log.responseStatus }}
                </span>
              </div>
              <div class="col-span-3 truncate text-slate-600">{{ log.endpoint }}</div>
              <div class="col-span-4 truncate text-slate-700">{{ log.question?.content || '-' }}</div>
              <div class="col-span-2 text-slate-500">{{ log.durationMs }}ms</div>
              <div class="col-span-2 text-slate-400 text-xs">{{ new Date(log.createdAt).toLocaleString() }}</div>
            </div>
          </div>

          <div v-if="activeTab === 'results'" class="space-y-2">
            <div class="grid grid-cols-12 gap-3 text-xs font-medium text-slate-500 px-3 py-2 bg-slate-50 rounded">
              <div class="col-span-1">命中</div>
              <div class="col-span-2">所属任务</div>
              <div class="col-span-3">问题</div>
              <div class="col-span-4">回复建议</div>
              <div class="col-span-1">置信度</div>
              <div class="col-span-1">引用</div>
            </div>
            <div v-for="item in items" :key="item.id" class="grid grid-cols-12 gap-3 text-sm px-3 py-2 border-b border-slate-100 hover:bg-slate-50">
              <div class="col-span-1">
                <span :class="item.isHit ? 'text-emerald-600' : 'text-amber-600'">{{ item.isHit ? '✓' : '✗' }}</span>
              </div>
              <div class="col-span-2 truncate text-xs text-slate-400">
                {{ (tasks.find(t => t.id === item.question?.batchTaskId)?.name) || '-' }}
              </div>
              <div class="col-span-3 truncate text-slate-700">{{ item.question?.content || '-' }}</div>
              <div class="col-span-4 truncate text-slate-600">{{ item.content }}</div>
              <div class="col-span-1 text-slate-500">{{ (item.confidence * 100).toFixed(0) }}%</div>
              <div class="col-span-1 text-slate-400 text-xs">
                {{ (item.references?.length || 0) - (item.references?.filter((r: any) => r.isMissing).length || 0) }}/{{ item.references?.length || 0 }}
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'references'" class="space-y-2">
            <div class="grid grid-cols-12 gap-3 text-xs font-medium text-slate-500 px-3 py-2 bg-slate-50 rounded">
              <div class="col-span-1">缺失</div>
              <div class="col-span-2">所属任务</div>
              <div class="col-span-3">文档标题</div>
              <div class="col-span-3">关联问题</div>
              <div class="col-span-1">相关度</div>
              <div class="col-span-2">缺失原因</div>
            </div>
            <div v-for="(item, idx) in items" :key="`${item.id}-${idx}`" class="grid grid-cols-12 gap-3 text-sm px-3 py-2 border-b border-slate-100 hover:bg-slate-50">
              <div class="col-span-1">
                <span :class="item.isMissing ? 'text-red-600' : 'text-emerald-600'">{{ item.isMissing ? '!' : '✓' }}</span>
              </div>
              <div class="col-span-2 truncate text-xs text-slate-400">
                {{ (tasks.find(t => t.id === item.batchTaskId)?.name) || '-' }}
              </div>
              <div class="col-span-3 truncate text-slate-700">{{ item.docTitle }}</div>
              <div class="col-span-3 truncate text-slate-500">{{ item.questionContent || '-' }}</div>
              <div class="col-span-1 text-slate-500">{{ (item.relevanceScore * 100).toFixed(0) }}%</div>
              <div class="col-span-2 truncate" :class="item.missingReason ? 'text-red-500' : 'text-slate-400'">{{ item.missingReason || '-' }}</div>
            </div>
          </div>

          <div v-if="items.length === 0" class="text-center py-12 text-slate-400 text-sm">暂无数据</div>
          <div v-if="items.length > 0" class="mt-3 text-xs text-slate-400 text-right">共 {{ total }} 条</div>
        </template>
      </div>
    </div>
  </div>
</template>
