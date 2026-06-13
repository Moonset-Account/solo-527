<script setup lang="ts">
import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, Loader2, Save, Trash2 } from 'lucide-vue-next'

const api = useApi()

const loading = ref(true)
const overallHitRate = ref<any>({ total: 0, hitCount: 0, hitRate: 0 })
const bySupervisor = ref<any[]>([])
const byDate = ref<any[]>([])
const missingRoot = ref<any>({ total: 0, hitCount: 0, hitRate: 0, byReason: [] })
const byMissing = computed(() => missingRoot.value.byReason || [])

const dateRange = reactive({
  startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
})

const filterPresets = ref<any[]>([])
const showSavePreset = ref(false)
const presetName = ref('')

const loadPresets = async () => {
  try {
    filterPresets.value = await api.get('/api/filter-presets', { page: 'statistics' })
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { startDate: dateRange.startDate, endDate: dateRange.endDate }
    const [overall, supervisor, date, missing] = await Promise.all([
      api.get('/api/statistics/hit-rate', params),
      api.get('/api/statistics/hit-rate/by-supervisor', params),
      api.get('/api/statistics/hit-rate/by-date', params),
      api.get('/api/statistics/hit-rate/by-missing', params),
    ])
    overallHitRate.value = overall
    bySupervisor.value = supervisor
    byDate.value = date
    missingRoot.value = missing
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSavePreset = async () => {
  if (!presetName.value.trim()) return
  try {
    await api.post('/api/filter-presets', {
      name: presetName.value,
      page: 'statistics',
      filters: { ...dateRange },
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
  if (preset.filters.startDate) dateRange.startDate = preset.filters.startDate
  if (preset.filters.endDate) dateRange.endDate = preset.filters.endDate
  loadData()
}

onMounted(() => {
  loadPresets()
  loadData()
})

const formatRate = (rate: number) => (rate * 100).toFixed(1) + '%'

const maxBarHeight = 120
const maxHitRate = computed(() => Math.max(...bySupervisor.value.map(s => s.hitRate), 0.01))

const dateMaxHitRate = computed(() => Math.max(...byDate.value.map(d => d.hitRate), 0.01))
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">统计分析</h1>
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

    <div class="card p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <input v-model="dateRange.startDate" type="date" class="input-field w-40" />
        <span class="text-sm text-slate-400">至</span>
        <input v-model="dateRange.endDate" type="date" class="input-field w-40" />
        <button @click="loadData" class="btn-primary text-sm">查询</button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <BarChart3 class="w-5 h-5 text-brand-500" />
            <h3 class="font-bold text-slate-800">总命中率</h3>
          </div>
          <div class="flex items-end gap-3">
            <span class="text-4xl font-bold" :class="overallHitRate.hitRate >= 0.7 ? 'text-emerald-600' : overallHitRate.hitRate >= 0.5 ? 'text-brand-500' : 'text-red-500'">
              {{ formatRate(overallHitRate.hitRate) }}
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-2">{{ overallHitRate.hitCount }} / {{ overallHitRate.total }} 命中</p>
          <div class="mt-3">
            <div class="w-full bg-slate-200 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all duration-500"
                :class="overallHitRate.hitRate >= 0.7 ? 'bg-emerald-500' : overallHitRate.hitRate >= 0.5 ? 'bg-brand-500' : 'bg-red-400'"
                :style="{ width: (overallHitRate.hitRate * 100) + '%' }"
              />
            </div>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <TrendingUp class="w-5 h-5 text-blue-500" />
            <h3 class="font-bold text-slate-800">命中趋势</h3>
          </div>
          <div class="h-[100px] flex items-end gap-1">
            <div
              v-for="(d, i) in byDate.slice(-14)"
              :key="i"
              class="flex-1 bg-blue-200 rounded-t transition-all duration-300 hover:bg-blue-400 relative group"
              :style="{ height: (d.hitRate / dateMaxHitRate * 100) + '%' }"
            >
              <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {{ formatRate(d.hitRate) }}
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-1 text-xs text-slate-400">
            <span>{{ byDate.length > 0 ? byDate[0]?.date?.substring(5) : '' }}</span>
            <span>{{ byDate.length > 0 ? byDate[byDate.length - 1]?.date?.substring(5) : '' }}</span>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <AlertCircle class="w-5 h-5 text-red-500" />
              <h3 class="font-bold text-slate-800">引用缺失原因</h3>
            </div>
            <span class="text-xs text-slate-500">同口径 {{ missingRoot.hitCount }}/{{ missingRoot.total }} · {{ formatRate(missingRoot.hitRate || 0) }}</span>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="item in byMissing" :key="item.missingReason" class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-medium text-slate-700 truncate" :title="item.missingReason">{{ item.missingReason }}</span>
                <span class="text-xs text-slate-500 whitespace-nowrap">
                  {{ item.affectedHitCount }}/{{ item.affectedSuggestionCount }} · {{ formatRate(item.affectedHitRate) }} · 缺失{{ item.count }}次
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :class="item.affectedHitRate >= 0.7 ? 'bg-emerald-500' : item.affectedHitRate >= 0.5 ? 'bg-brand-500' : 'bg-red-400'"
                    :style="{ width: Math.min(item.affectedHitRate * 100, 100) + '%' }"
                  />
                </div>
              </div>
            </div>
            <div v-if="byMissing.length === 0" class="text-sm text-slate-400 py-4 text-center">暂无缺失数据</div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <Users class="w-5 h-5 text-brand-500" />
          <h3 class="font-bold text-slate-800">按客服主管拆分命中率</h3>
        </div>
        <div class="space-y-4">
          <div v-for="sup in bySupervisor" :key="sup.supervisorId" class="flex items-center gap-4">
            <div class="w-28 text-sm font-medium text-slate-700 truncate">{{ sup.supervisorName }}</div>
            <div class="flex-1">
              <div class="w-full bg-slate-200 rounded-full h-6 relative">
                <div
                  class="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  :class="sup.hitRate >= 0.7 ? 'bg-emerald-500' : sup.hitRate >= 0.5 ? 'bg-brand-500' : 'bg-red-400'"
                  :style="{ width: Math.max(sup.hitRate / maxHitRate * 100, 8) + '%' }"
                >
                  <span class="text-xs text-white font-medium">{{ formatRate(sup.hitRate) }}</span>
                </div>
              </div>
            </div>
            <div class="w-20 text-xs text-slate-500 text-right">{{ sup.hitCount }}/{{ sup.total }}</div>
          </div>
          <div v-if="bySupervisor.length === 0" class="text-sm text-slate-400 py-8 text-center">暂无主管维度数据</div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <Calendar class="w-5 h-5 text-blue-500" />
          <h3 class="font-bold text-slate-800">按日期拆分命中率</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-2 px-3 text-slate-500 font-medium">日期</th>
                <th class="text-right py-2 px-3 text-slate-500 font-medium">总数</th>
                <th class="text-right py-2 px-3 text-slate-500 font-medium">命中</th>
                <th class="text-right py-2 px-3 text-slate-500 font-medium">命中率</th>
                <th class="py-2 px-3 w-40">趋势</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in byDate" :key="d.date" class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-2 px-3 text-slate-700">{{ d.date }}</td>
                <td class="py-2 px-3 text-right text-slate-600">{{ d.total }}</td>
                <td class="py-2 px-3 text-right text-slate-600">{{ d.hitCount }}</td>
                <td class="py-2 px-3 text-right font-medium" :class="d.hitRate >= 0.7 ? 'text-emerald-600' : d.hitRate >= 0.5 ? 'text-brand-600' : 'text-red-500'">
                  {{ formatRate(d.hitRate) }}
                </td>
                <td class="py-2 px-3">
                  <div class="w-full bg-slate-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="d.hitRate >= 0.7 ? 'bg-emerald-500' : d.hitRate >= 0.5 ? 'bg-brand-500' : 'bg-red-400'"
                      :style="{ width: (d.hitRate * 100) + '%' }"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="byDate.length === 0" class="text-sm text-slate-400 py-8 text-center">暂无日期维度数据</div>
        </div>
      </div>
    </template>
  </div>
</template>
