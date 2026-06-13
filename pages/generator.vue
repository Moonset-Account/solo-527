<script setup lang="ts">
import { Send, Loader2, Sparkles, BookOpen, ChevronDown, ChevronUp, Check, X, ListPlus, Settings2 } from 'lucide-vue-next'

const api = useApi()

const question = ref('')
const templateVars = ref('')
const generating = ref(false)
const suggestion = ref<any>(null)
const showBatchConfig = ref(false)

const batchConfig = reactive({
  name: '',
  questionList: '' as string,
  timeoutMinutes: 30,
  temperature: 0.7,
  generateCount: 5,
})

const creatingTask = ref(false)
const taskCreated = ref<any>(null)

const handleGenerate = async () => {
  if (!question.value.trim()) return
  generating.value = true
  suggestion.value = null
  try {
    const vars = templateVars.value.trim() ? JSON.parse(templateVars.value) : undefined
    suggestion.value = await api.post('/api/suggestions/generate', {
      content: question.value,
      templateVars: vars,
    })
  } catch (e: any) {
    console.error(e)
  } finally {
    generating.value = false
  }
}

const handleVerify = async (suggestionId: string, isHit: boolean) => {
  try {
    await api.post(`/api/suggestions/${suggestionId}/verify`, { isHit })
    if (suggestion.value) {
      suggestion.value.isHit = isHit
      suggestion.value.hitVerifiedBy = 'current'
    }
  } catch (e) {
    console.error(e)
  }
}

const handleCreateBatchTask = async () => {
  creatingTask.value = true
  taskCreated.value = null
  try {
    const questions = batchConfig.questionList
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .map(q => ({ content: q }))

    if (questions.length === 0) {
      alert('请至少输入一个问题')
      creatingTask.value = false
      return
    }

    const res = await api.post('/api/tasks', {
      name: batchConfig.name || `批量生成任务 ${new Date().toLocaleDateString()}`,
      totalItems: questions.length,
      timeoutMinutes: batchConfig.timeoutMinutes,
      config: {
        generateCount: batchConfig.generateCount,
        llmModel: 'mock',
        temperature: batchConfig.temperature,
      },
      questions,
    })
    taskCreated.value = res
    showBatchConfig.value = false
  } catch (e) {
    console.error(e)
  } finally {
    creatingTask.value = false
  }
}

const expandedRefs = ref<Set<string>>(new Set())
const toggleRef = (id: string) => {
  if (expandedRefs.value.has(id)) {
    expandedRefs.value.delete(id)
  } else {
    expandedRefs.value.add(id)
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">会话生成器</h1>
      <button @click="showBatchConfig = !showBatchConfig" class="btn-secondary text-sm flex items-center gap-1.5">
        <ListPlus class="w-4 h-4" />
        {{ showBatchConfig ? '收起批量配置' : '批量配置' }}
      </button>
    </div>

    <div class="grid grid-cols-5 gap-6">
      <div :class="showBatchConfig ? 'col-span-3' : 'col-span-5'" class="space-y-4">
        <div class="card p-5">
          <label class="block text-sm font-medium text-slate-700 mb-2">客户问题</label>
          <textarea
            v-model="question"
            rows="5"
            class="input-field resize-none"
            placeholder="请输入客户问题，例如：我的订单为什么还没发货？"
          />
          <div class="flex items-center justify-between mt-3">
            <span class="text-xs text-slate-400">{{ question.length }} 字</span>
            <div class="flex items-center gap-2">
              <button @click="handleGenerate" class="btn-primary flex items-center gap-1.5" :disabled="generating || !question.trim()">
                <Loader2 v-if="generating" class="w-4 h-4 animate-spin" />
                <Sparkles v-else class="w-4 h-4" />
                {{ generating ? '生成中...' : '生成回复建议' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <Settings2 class="w-4 h-4 text-slate-400" />
            <span class="text-sm font-medium text-slate-700">模板变量 (JSON)</span>
          </div>
          <textarea
            v-model="templateVars"
            rows="3"
            class="input-field resize-none font-mono text-xs"
            placeholder='{"customerName": "张三", "orderNo": "ORD123456"}'
          />
        </div>

        <div v-if="suggestion" class="card p-5 border-l-4" :class="suggestion.isHit ? 'border-l-emerald-500' : 'border-l-amber-500'">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-brand-500" />
              <h3 class="font-bold text-slate-800">回复建议</h3>
            </div>
            <div class="flex items-center gap-2">
              <span :class="suggestion.isHit ? 'badge-completed' : 'badge-timeout'">
                {{ suggestion.isHit ? '已命中' : '未命中' }}
              </span>
              <button @click="handleVerify(suggestion.id, true)" class="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-500" title="确认为命中">
                <Check class="w-4 h-4" />
              </button>
              <button @click="handleVerify(suggestion.id, false)" class="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="确认为未命中">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {{ suggestion.content }}
          </div>
          <div class="mt-3 flex items-center gap-4 text-sm">
            <span class="text-slate-500">置信度：</span>
            <div class="flex-1">
              <div class="w-full bg-slate-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :class="suggestion.confidence > 0.75 ? 'bg-emerald-500' : suggestion.confidence > 0.5 ? 'bg-brand-500' : 'bg-red-400'"
                  :style="{ width: (suggestion.confidence * 100) + '%' }"
                />
              </div>
            </div>
            <span class="text-slate-600 font-medium">{{ (suggestion.confidence * 100).toFixed(1) }}%</span>
          </div>

          <div v-if="suggestion.references && suggestion.references.length > 0" class="mt-4 pt-4 border-t border-slate-200">
            <button @click="toggleRef(suggestion.id)" class="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-600">
              <BookOpen class="w-4 h-4" />
              引用来源 ({{ suggestion.references.length }})
              <component :is="expandedRefs.has(suggestion.id) ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
            </button>
            <div v-if="expandedRefs.has(suggestion.id)" class="mt-2 space-y-2">
              <div
                v-for="ref in suggestion.references"
                :key="ref.id"
                class="flex items-center gap-3 p-2 rounded text-sm"
                :class="ref.isMissing ? 'bg-red-50' : 'bg-slate-50'"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-slate-700 truncate">{{ ref.docTitle }}</p>
                  <p v-if="ref.isMissing" class="text-red-500 text-xs mt-0.5">缺失原因：{{ ref.missingReason }}</p>
                </div>
                <span class="text-xs text-slate-500">{{ (ref.relevanceScore * 100).toFixed(0) }}%</span>
                <span v-if="ref.isMissing" class="badge-failed text-xs">缺失</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showBatchConfig" class="col-span-2 space-y-4">
        <div class="card p-5">
          <h3 class="font-bold text-slate-800 mb-4">批量生成配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
              <input v-model="batchConfig.name" class="input-field" placeholder="输入任务名称" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">问题列表（每行一个问题）</label>
              <textarea v-model="batchConfig.questionList" rows="6" class="input-field resize-none" placeholder="我的订单为什么还没发货？&#10;退款什么时候到账？&#10;商品有质量问题如何退换？" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">超时(分钟)</label>
                <input v-model.number="batchConfig.timeoutMinutes" type="number" class="input-field" min="5" max="120" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">温度</label>
                <input v-model.number="batchConfig.temperature" type="number" step="0.1" min="0" max="2" class="input-field" />
              </div>
            </div>
            <button @click="handleCreateBatchTask" class="btn-primary w-full flex items-center justify-center gap-2" :disabled="creatingTask">
              <Loader2 v-if="creatingTask" class="w-4 h-4 animate-spin" />
              <ListPlus v-else class="w-4 h-4" />
              {{ creatingTask ? '创建中...' : '创建批量任务' }}
            </button>
          </div>
        </div>

        <div v-if="taskCreated" class="card p-5 border-l-4 border-l-emerald-500">
          <h4 class="font-bold text-emerald-700 mb-1">任务创建成功</h4>
          <p class="text-sm text-slate-600">任务ID: {{ taskCreated.id }}</p>
          <p class="text-sm text-slate-500 mt-1">请前往批处理任务页面查看进度</p>
          <NuxtLink to="/tasks" class="btn-primary text-sm mt-3 inline-flex items-center gap-1">
            查看任务 <ChevronRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
