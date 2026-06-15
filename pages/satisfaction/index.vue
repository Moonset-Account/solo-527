<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">满意度统计</h1>
      <div class="flex gap-8">
        <button class="btn" @click="loadData">刷新</button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>日期范围：</label>
          <input v-model="filters.startDate" type="date" @change="loadData" />
          <span>至</span>
          <input v-model="filters.endDate" type="date" @change="loadData" />
        </div>
        <div class="filter-item">
          <label>模块类型：</label>
          <select v-model="filters.moduleType" @change="loadData">
            <option value="all">全部</option>
            <option value="WORKORDER">工单</option>
            <option value="INSPECTION">巡检</option>
            <option value="VISITOR">访客</option>
            <option value="ENGINEERING">工程报修</option>
          </select>
        </div>
        <div v-if="user?.role !== 'TENANT'" class="filter-item">
          <label>租户：</label>
          <select v-model="filters.tenantId" @change="loadData">
            <option value="">全部</option>
            <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <button class="btn btn-primary" @click="loadData">查询</button>
        </div>
        <div class="filter-item">
          <div class="relative">
            <button class="btn" @click="showPresetMenu = !showPresetMenu">
              📋 筛选方案 {{ activePreset ? `(${activePreset.name})` : '' }}
            </button>
            <div v-if="showPresetMenu" class="preset-menu">
              <div
                v-for="p in presets"
                :key="p.id"
                class="preset-item"
                :class="{ active: p.isDefault }"
                @click="applyPreset(p)"
              >
                <span>{{ p.name }}{{ p.isDefault ? ' (默认)' : '' }}</span>
                <button class="btn btn-danger btn-sm" @click.stop="deletePreset(p.id)">删除</button>
              </div>
              <div class="preset-item" @click="showSavePreset = true">
                <span class="text-primary">+ 保存当前筛选</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-4 mb-24">
      <div class="stat-card">
        <div class="flex-between mb-8">
          <div class="stat-value" style="color: #1890ff;">{{ stats.overallAvgScore?.toFixed(1) || '0.0' }}</div>
          <div :class="['trend-indicator', getTrendClass(stats.scoreTrend)]">
            <span v-if="stats.scoreTrend > 0">↑ {{ Math.abs(stats.scoreTrend).toFixed(1) }}</span>
            <span v-else-if="stats.scoreTrend < 0">↓ {{ Math.abs(stats.scoreTrend).toFixed(1) }}</span>
            <span v-else>— 0.0</span>
          </div>
        </div>
        <div class="stat-label">综合平均分</div>
        <div class="progress-bar mt-12">
          <div class="progress-fill" :style="{ width: `${(stats.overallAvgScore || 0) * 20}%` }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #722ed1;">{{ stats.totalSurveys || 0 }}</div>
        <div class="stat-label">总调查数</div>
        <div class="text-secondary mt-8 text-sm">份有效问卷</div>
      </div>
      <div class="stat-card">
        <div class="flex-between mb-8">
          <div class="stat-value" style="color: #fa8c16;">{{ stats.responseRate?.toFixed(1) || '0.0' }}%</div>
          <div :class="['trend-indicator', getTrendClass(stats.responseRateTrend)]">
            <span v-if="stats.responseRateTrend > 0">↑ {{ Math.abs(stats.responseRateTrend).toFixed(1) }}</span>
            <span v-else-if="stats.responseRateTrend < 0">↓ {{ Math.abs(stats.responseRateTrend).toFixed(1) }}</span>
            <span v-else>— 0.0</span>
          </div>
        </div>
        <div class="stat-label">回复率</div>
        <div class="progress-bar mt-12">
          <div class="progress-fill" :style="{ width: `${stats.responseRate || 0}%`, background: '#fa8c16' }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #52c41a;">{{ stats.tenantsSurveyed || 0 }}</div>
        <div class="stat-label">参与调查租户</div>
        <div class="text-secondary mt-8 text-sm">个租户参与</div>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">评分分布</h3>
        <div class="score-distribution">
          <div v-for="item in scoreDistribution" :key="item.score" class="score-bar-row">
            <div class="score-label">{{ item.score }} 星</div>
            <div class="score-bar-container">
              <div 
                class="score-bar-fill" 
                :style="{ 
                  width: `${(item.count / maxScoreCount) * 100}%`,
                  background: getScoreColor(item.score)
                }"
              ></div>
            </div>
            <div class="score-count">{{ item.count }} ({{ item.percentage?.toFixed(1) }}%)</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-16">维度分析</h3>
        <div class="dimension-analysis">
          <div v-for="dim in dimensionBreakdown" :key="dim.key" class="dimension-row">
            <div class="dimension-label">{{ dim.label }}</div>
            <div class="dimension-bar-container">
              <div 
                class="dimension-bar-fill" 
                :style="{ 
                  width: `${(dim.score / 5) * 100}%`,
                  background: getDimensionColor(dim.key)
                }"
              ></div>
            </div>
            <div class="dimension-score">{{ dim.score?.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-24">
      <h3 class="mb-16">近6个月趋势</h3>
      <div class="trend-chart">
        <div class="trend-grid">
          <div v-for="i in 5" :key="i" class="trend-grid-line" :style="{ bottom: `${i * 20}%` }">
            <span class="trend-grid-label">{{ (6 - i).toFixed(1) }}</span>
          </div>
        </div>
        <div class="trend-bars">
          <div v-for="(item, index) in trendData" :key="item.month" class="trend-bar-group">
            <div class="trend-bar-wrapper">
              <div 
                class="trend-bar" 
                :style="{ 
                  height: `${(item.avgScore / 5) * 100}%`,
                  background: index === trendData.length - 1 ? '#1890ff' : '#91d5ff'
                }"
              >
                <span class="trend-bar-value">{{ item.avgScore?.toFixed(1) }}</span>
              </div>
            </div>
            <div class="trend-bar-label">{{ item.month }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-24">
      <h3 class="mb-16">模块类型分析</h3>
      <div class="tabs">
        <div 
          v-for="mod in moduleTypes" 
          :key="mod.value"
          :class="['tab-item', { active: activeModule === mod.value }]"
          @click="activeModule = mod.value"
        >
          {{ mod.label }}
        </div>
      </div>
      <div v-if="moduleStats[activeModule]" class="module-stats">
        <div class="grid-3">
          <div class="module-stat-card">
            <div class="module-stat-value" style="color: #1890ff;">
              {{ moduleStats[activeModule].avgScore?.toFixed(1) || '0.0' }}
            </div>
            <div class="module-stat-label">平均分</div>
          </div>
          <div class="module-stat-card">
            <div class="module-stat-value" style="color: #722ed1;">
              {{ moduleStats[activeModule].surveyCount || 0 }}
            </div>
            <div class="module-stat-label">调查数</div>
          </div>
          <div class="module-stat-card">
            <div :class="['trend-indicator', 'trend-large', getTrendClass(moduleStats[activeModule].trend)]">
              <span v-if="moduleStats[activeModule].trend > 0">↑ {{ Math.abs(moduleStats[activeModule].trend).toFixed(1) }}</span>
              <span v-else-if="moduleStats[activeModule].trend < 0">↓ {{ Math.abs(moduleStats[activeModule].trend).toFixed(1) }}</span>
              <span v-else>— 0.0</span>
            </div>
            <div class="module-stat-label">趋势</div>
          </div>
        </div>
        <div class="mt-16">
          <div v-for="dim in moduleStats[activeModule].dimensions" :key="dim.key" class="dimension-row">
            <div class="dimension-label">{{ dim.label }}</div>
            <div class="dimension-bar-container">
              <div 
                class="dimension-bar-fill" 
                :style="{ 
                  width: `${(dim.score / 5) * 100}%`,
                  background: getDimensionColor(dim.key)
                }"
              ></div>
            </div>
            <div class="dimension-score">{{ dim.score?.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-24">
      <h3 class="mb-16">租户排名</h3>
      <table class="table">
        <thead>
          <tr>
            <th class="sortable" @click="sortTenants('tenantName')">
              租户名称
              <span class="sort-icon">{{ getSortIcon('tenantName') }}</span>
            </th>
            <th class="sortable" @click="sortTenants('avgScore')">
              平均分
              <span class="sort-icon">{{ getSortIcon('avgScore') }}</span>
            </th>
            <th class="sortable" @click="sortTenants('surveyCount')">
              调查数
              <span class="sort-icon">{{ getSortIcon('surveyCount') }}</span>
            </th>
            <th class="sortable" @click="sortTenants('lastSurveyDate')">
              最后调查时间
              <span class="sort-icon">{{ getSortIcon('lastSurveyDate') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedTenantRankings" :key="item.tenantId">
            <td>{{ item.tenantName }}</td>
            <td>
              <span :class="['score-badge', getScoreBadgeClass(item.avgScore)]">
                {{ item.avgScore?.toFixed(1) }}
              </span>
            </td>
            <td>{{ item.surveyCount }}</td>
            <td>{{ formatTime(item.lastSurveyDate) }}</td>
          </tr>
          <tr v-if="sortedTenantRankings.length === 0">
            <td colspan="4" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 class="mb-16">最近调查记录</h3>
      <table class="table">
        <thead>
          <tr>
            <th>租户名称</th>
            <th>模块类型</th>
            <th>关联编号</th>
            <th>综合评分</th>
            <th>响应速度</th>
            <th>服务态度</th>
            <th>维修质量</th>
            <th>费用合理</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in recentSurveys" :key="item.id">
            <td>{{ item.tenantName }}</td>
            <td><span class="tag tag-blue">{{ getModuleLabel(item.moduleType) }}</span></td>
            <td>{{ item.relatedNo }}</td>
            <td>
              <span :class="['score-badge', getScoreBadgeClass(item.overallScore)]">
                {{ item.overallScore?.toFixed(1) }}
              </span>
            </td>
            <td>{{ item.responseSpeed?.toFixed(1) }}</td>
            <td>{{ item.serviceAttitude?.toFixed(1) }}</td>
            <td>{{ item.repairQuality?.toFixed(1) }}</td>
            <td>{{ item.costReasonableness?.toFixed(1) }}</td>
            <td>{{ formatTime(item.createdAt) }}</td>
            <td>
              <button class="btn btn-primary btn-sm" @click="viewDetail(item)">详情</button>
            </td>
          </tr>
          <tr v-if="recentSurveys.length === 0">
            <td colspan="10" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="['page-btn', { active: p === page }]"
          @click="changePage(p)"
        >
          {{ p }}
        </button>
        <button class="page-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showSavePreset" class="modal-mask" @click.self="showSavePreset = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">保存筛选方案</span>
          <button class="btn" @click="showSavePreset = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">方案名称</label>
            <input v-model="presetForm.name" class="form-input" placeholder="请输入方案名称" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="presetForm.isDefault" /> 设为默认
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showSavePreset = false">取消</button>
          <button class="btn btn-primary" @click="savePreset">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-mask" @click.self="showDetailModal = false">
      <div class="modal" style="max-width: 800px;">
        <div class="modal-header">
          <span class="modal-title">调查详情</span>
          <button class="btn" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body" v-if="selectedSurvey">
          <div class="detail-section">
            <h4 class="mb-12">基本信息</h4>
            <div class="grid-2 mb-16">
              <div><strong>租户：</strong>{{ selectedSurvey.tenantName }}</div>
              <div><strong>模块：</strong>{{ getModuleLabel(selectedSurvey.moduleType) }}</div>
              <div><strong>关联编号：</strong>{{ selectedSurvey.relatedNo }}</div>
              <div><strong>创建时间：</strong>{{ formatTime(selectedSurvey.createdAt) }}</div>
            </div>
          </div>
          <div class="detail-section">
            <h4 class="mb-12">评分详情</h4>
            <div class="mb-16">
              <div class="flex-between mb-8">
                <span>综合评分</span>
                <span :class="['score-badge', 'score-large', getScoreBadgeClass(selectedSurvey.overallScore)]">
                  {{ selectedSurvey.overallScore?.toFixed(1) }}
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: `${(selectedSurvey.overallScore / 5) * 100}%`,
                    background: getScoreColor(Math.round(selectedSurvey.overallScore))
                  }"
                ></div>
              </div>
            </div>
            <div v-for="dim in dimensionBreakdown" :key="dim.key" class="dimension-row mb-8">
              <div class="dimension-label">{{ dim.label }}</div>
              <div class="dimension-bar-container">
                <div 
                  class="dimension-bar-fill" 
                  :style="{ 
                    width: `${(selectedSurvey[dim.key] / 5) * 100}%`,
                    background: getDimensionColor(dim.key)
                  }"
                ></div>
              </div>
              <div class="dimension-score">{{ selectedSurvey[dim.key]?.toFixed(1) }}</div>
            </div>
          </div>
          <div v-if="selectedSurvey.suggestion" class="detail-section mt-16">
            <h4 class="mb-12">意见建议</h4>
            <div class="suggestion-box">{{ selectedSurvey.suggestion }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import dayjs from 'dayjs'

const { user, initAuth, isLoggedIn } = useAuth()

const stats = ref<any>({
  overallAvgScore: 0,
  scoreTrend: 0,
  totalSurveys: 0,
  responseRate: 0,
  responseRateTrend: 0,
  tenantsSurveyed: 0
})

const scoreDistribution = ref<any[]>([
  { score: 5, count: 0, percentage: 0 },
  { score: 4, count: 0, percentage: 0 },
  { score: 3, count: 0, percentage: 0 },
  { score: 2, count: 0, percentage: 0 },
  { score: 1, count: 0, percentage: 0 }
])

const dimensionBreakdown = ref<any[]>([
  { key: 'overall', label: '综合评分', score: 0 },
  { key: 'responseSpeed', label: '响应速度', score: 0 },
  { key: 'serviceAttitude', label: '服务态度', score: 0 },
  { key: 'repairQuality', label: '维修质量', score: 0 },
  { key: 'costReasonableness', label: '费用合理性', score: 0 }
])

const trendData = ref<any[]>([])
const tenantRankings = ref<any[]>([])
const recentSurveys = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const filters = reactive({
  startDate: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  moduleType: 'all',
  tenantId: ''
})

const moduleTypes = [
  { value: 'WORKORDER', label: '工单' },
  { value: 'INSPECTION', label: '巡检' },
  { value: 'VISITOR', label: '访客' },
  { value: 'ENGINEERING', label: '工程报修' }
]

const activeModule = ref('WORKORDER')

const moduleStats = reactive<Record<string, any>>({
  WORKORDER: { avgScore: 0, surveyCount: 0, trend: 0, dimensions: [] },
  INSPECTION: { avgScore: 0, surveyCount: 0, trend: 0, dimensions: [] },
  VISITOR: { avgScore: 0, surveyCount: 0, trend: 0, dimensions: [] },
  ENGINEERING: { avgScore: 0, surveyCount: 0, trend: 0, dimensions: [] }
})

const tenants = ref<any[]>([])
const presets = ref<any[]>([])
const activePreset = ref<any>(null)
const showPresetMenu = ref(false)
const showSavePreset = ref(false)
const showDetailModal = ref(false)
const selectedSurvey = ref<any>(null)
const presetForm = reactive({
  name: '',
  isDefault: false
})

const sortField = ref<string>('avgScore')
const sortOrder = ref<'asc' | 'desc'>('desc')

const maxScoreCount = computed(() => {
  return Math.max(...scoreDistribution.value.map(s => s.count), 1)
})

const sortedTenantRankings = computed(() => {
  const list = [...tenantRankings.value]
  list.sort((a: any, b: any) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]
    if (sortField.value === 'lastSurveyDate') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })
  return list
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await Promise.all([
    loadTenants(),
    loadPresets()
  ])
  await loadData()
})

async function loadTenants() {
  if (user.value?.role === 'TENANT') return
  try {
    const res: any = await useApiFetch('/tenants')
    if (res.code === 200) {
      tenants.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function loadPresets() {
  try {
    const res: any = await useApiFetch('/filter-presets?pageKey=satisfaction-stats')
    if (res.code === 200) {
      presets.value = res.data
      const defaultPreset = res.data.find((p: any) => p.isDefault)
      if (defaultPreset) {
        applyPreset(defaultPreset)
      }
    }
  } catch (e) {
    // ignore
  }
}

async function loadData() {
  try {
    const params = new URLSearchParams({
      ...filters,
      tenantId: filters.tenantId as string
    } as any)
    const res: any = await useApiFetch(`/satisfaction/stats?${params.toString()}`)
    if (res.code === 200) {
      const data = res.data
      stats.value = data.summary || stats.value
      scoreDistribution.value = data.scoreDistribution || scoreDistribution.value
      dimensionBreakdown.value = data.dimensionBreakdown || dimensionBreakdown.value
      trendData.value = data.trendData || []
      tenantRankings.value = data.tenantRankings || []
      if (data.moduleStats) {
        Object.assign(moduleStats, data.moduleStats)
      }
    }
    await loadRecentSurveys()
  } catch (e) {
    // ignore
  }
}

async function loadRecentSurveys() {
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString(),
      ...filters,
      tenantId: filters.tenantId as string
    } as any)
    const res: any = await useApiFetch(`/satisfaction/surveys?${params.toString()}`)
    if (res.code === 200) {
      recentSurveys.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    // ignore
  }
}

function changePage(p: number) {
  page.value = p
  loadRecentSurveys()
}

function sortTenants(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

function getSortIcon(field: string) {
  if (sortField.value !== field) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

function applyPreset(preset: any) {
  activePreset.value = preset
  Object.assign(filters, preset.filters)
  showPresetMenu.value = false
  page.value = 1
  loadData()
}

async function savePreset() {
  if (!presetForm.name) {
    alert('请输入方案名称')
    return
  }
  try {
    const res: any = await useApiFetch('/filter-presets', {
      method: 'POST',
      body: {
        name: presetForm.name,
        pageKey: 'satisfaction-stats',
        filters: { ...filters },
        isDefault: presetForm.isDefault
      }
    })
    if (res.code === 200) {
      showSavePreset.value = false
      presetForm.name = ''
      presetForm.isDefault = false
      loadPresets()
    }
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  }
}

async function deletePreset(id: number) {
  if (!confirm('确定要删除此筛选方案吗？')) return
  try {
    await useApiFetch(`/filter-presets/${id}`, { method: 'DELETE' })
    loadPresets()
  } catch (e) {
    // ignore
  }
}

function viewDetail(item: any) {
  selectedSurvey.value = item
  showDetailModal.value = true
}

function getTrendClass(trend: number) {
  if (trend > 0) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return 'trend-flat'
}

function getScoreColor(score: number) {
  const colors: Record<number, string> = {
    5: '#52c41a',
    4: '#73d13d',
    3: '#faad14',
    2: '#fa8c16',
    1: '#f5222d'
  }
  return colors[score] || '#1890ff'
}

function getDimensionColor(key: string) {
  const colors: Record<string, string> = {
    overall: '#1890ff',
    responseSpeed: '#722ed1',
    serviceAttitude: '#eb2f96',
    repairQuality: '#52c41a',
    costReasonableness: '#fa8c16'
  }
  return colors[key] || '#1890ff'
}

function getScoreBadgeClass(score: number) {
  if (score >= 4.5) return 'score-excellent'
  if (score >= 3.5) return 'score-good'
  if (score >= 2.5) return 'score-average'
  if (score >= 1.5) return 'score-poor'
  return 'score-bad'
}

function getModuleLabel(type: string) {
  const map: Record<string, string> = {
    WORKORDER: '工单',
    INSPECTION: '巡检',
    VISITOR: '访客',
    ENGINEERING: '工程报修'
  }
  return map[type] || type
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.text-primary {
  color: #1890ff;
}

.text-sm {
  font-size: 12px;
}

.relative {
  position: relative;
}

.preset-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 10;
  margin-top: 4px;
}

.preset-item {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.preset-item:last-child {
  border-bottom: none;
}

.preset-item:hover {
  background: #f5f5f5;
}

.preset-item.active {
  background: #e6f7ff;
}

.mt-8 {
  margin-top: 8px;
}

.mt-12 {
  margin-top: 12px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-12 {
  margin-bottom: 12px;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-indicator {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.trend-large {
  font-size: 24px;
  font-weight: 600;
}

.trend-up {
  color: #52c41a;
  background: #f6ffed;
}

.trend-down {
  color: #f5222d;
  background: #fff1f0;
}

.trend-flat {
  color: #8c8c8c;
  background: #f5f5f5;
}

.score-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  width: 50px;
  font-weight: 500;
}

.score-bar-container {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.score-count {
  width: 100px;
  text-align: right;
  color: #8c8c8c;
  font-size: 13px;
}

.dimension-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-label {
  width: 100px;
  font-weight: 500;
}

.dimension-bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dimension-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.dimension-score {
  width: 50px;
  text-align: right;
  font-weight: 600;
}

.trend-chart {
  position: relative;
  height: 300px;
  padding: 0 20px 30px;
}

.trend-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30px;
}

.trend-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #f0f0f0;
}

.trend-grid-label {
  position: absolute;
  left: -30px;
  top: -10px;
  font-size: 12px;
  color: #8c8c8c;
}

.trend-bars {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
}

.trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.trend-bar-wrapper {
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
}

.trend-bar {
  width: 40px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s;
  min-height: 4px;
}

.trend-bar-value {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
  white-space: nowrap;
}

.trend-bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.module-stat-card {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.module-stat-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.module-stat-label {
  color: #8c8c8c;
  font-size: 14px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  color: #1890ff;
}

.sort-icon {
  margin-left: 4px;
  font-size: 12px;
}

.score-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.score-large {
  font-size: 24px;
  padding: 8px 20px;
  border-radius: 16px;
}

.score-excellent {
  background: #f6ffed;
  color: #52c41a;
}

.score-good {
  background: #e6f7ff;
  color: #1890ff;
}

.score-average {
  background: #fff7e6;
  color: #fa8c16;
}

.score-poor {
  background: #fff1f0;
  color: #faad14;
}

.score-bad {
  background: #fff1f0;
  color: #f5222d;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  border-left: 3px solid #1890ff;
  padding-left: 12px;
}

.suggestion-box {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  line-height: 1.8;
  color: #595959;
}
</style>
