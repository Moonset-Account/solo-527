<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <select v-model="statsRange" class="form-select" style="width:160px" @change="fetchStats">
          <option value="7">最近 7 天</option>
          <option value="30">最近 30 天</option>
          <option value="90">最近 90 天</option>
          <option value="365">最近一年</option>
        </select>
        <button class="btn btn-secondary" @click="exportReport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出报表
        </button>
      </div>
      <div class="text-sm text-gray-500">
        统计区间: {{ formatDate(dateRange.from, false) }} - {{ formatDate(dateRange.to, false) }}
      </div>
    </div>

    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-label">合同总数</div>
        <div class="stat-value">{{ overview.totalContracts || 0 }}</div>
        <div class="stat-change up">
          本月新增 {{ overview.newContracts || 0 }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已完成</div>
        <div class="stat-value text-success">{{ overview.completedContracts || 0 }}</div>
        <div class="stat-change up">
          完成率 {{ completionRate }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">处理中</div>
        <div class="stat-value text-warning">{{ overview.inProgressContracts || 0 }}</div>
        <div class="stat-change">
          <span class="text-danger">{{ deadlineStats.rectifyUrgent || 0 }} 项逾期</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">合同总金额</div>
        <div class="stat-value" style="color:var(--purple)">{{ formatAmount(overview.totalAmount) }}</div>
        <div class="stat-change">
          均单 {{ formatAmount(overview.avgAmount) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">合规缺口</div>
        <div class="stat-value text-danger">{{ gapTotal }}</div>
        <div class="stat-change down">
          待处理 {{ gapOpen + gapInProgress }} 项
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均审阅时长</div>
        <div class="stat-value" style="color:var(--info)">{{ avgReviewHours }} h</div>
        <div class="stat-change">
          样本 {{ lawyerReviewTime.length }} 份合同
        </div>
      </div>
    </div>

    <div class="grid-2 mb-4" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-header">
          <div class="card-title">合同状态分布</div>
        </div>
        <div class="card-body">
          <div class="bar-chart">
            <div v-for="(item, idx) in statusDistribution" :key="idx" class="bar-row">
              <div class="bar-label" style="width:110px">
                <span class="badge" :class="getStatusBadgeClass(item.status)">{{ getStatusLabel(item.status) }}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill"
                     :style="{ width: item.percent + '%', background: getStatusColor(item.status) }"></div>
              </div>
              <div class="bar-value" style="width:70px;text-align:right">
                <span class="font-semibold">{{ item.count }}</span>
                <span class="text-gray-500 text-sm ml-1">({{ item.percent }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">合规缺口严重程度</div>
        </div>
        <div class="card-body">
          <div class="grid-4 mb-4 text-center">
            <div class="p-3 rounded-lg" style="background:#fee2e2">
              <div class="text-2xl font-bold" style="color:#991b1b">{{ severityCounts.CRITICAL || 0 }}</div>
              <div class="text-xs mt-1" style="color:#991b1b">严重</div>
            </div>
            <div class="p-3 rounded-lg" style="background:#fef3c7">
              <div class="text-2xl font-bold" style="color:#92400e">{{ severityCounts.HIGH || 0 }}</div>
              <div class="text-xs mt-1" style="color:#92400e">高</div>
            </div>
            <div class="p-3 rounded-lg" style="background:#ffedd5">
              <div class="text-2xl font-bold" style="color:#c2410c">{{ severityCounts.MEDIUM || 0 }}</div>
              <div class="text-xs mt-1" style="color:#c2410c">中</div>
            </div>
            <div class="p-3 rounded-lg" style="background:#cffafe">
              <div class="text-2xl font-bold" style="color:#155e75">{{ severityCounts.LOW || 0 }}</div>
              <div class="text-xs mt-1" style="color:#155e75">低</div>
            </div>
          </div>
          <div class="grid-2 text-center">
            <div class="p-3 rounded-lg" style="background:#dbeafe">
              <div class="text-lg font-bold" style="color:#1e40af">合同类型</div>
              <div class="text-2xl mt-1">{{ typeStats.length }}</div>
            </div>
            <div class="p-3 rounded-lg" style="background:#dcfce7">
              <div class="text-lg font-bold" style="color:#166534">已解决缺口</div>
              <div class="text-2xl mt-1">{{ gapResolved }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">人员效率排行</div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px">排名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>部门</th>
              <th class="text-center">分派数</th>
              <th class="text-center">意见数</th>
              <th class="text-center">完成数</th>
              <th>效率评分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, idx) in rankedUsers" :key="u.userId">
              <td>
                <span v-if="idx === 0" class="badge badge-warning" style="font-size:12px">🏆 1</span>
                <span v-else-if="idx === 1" class="badge badge-info" style="font-size:12px">🥈 2</span>
                <span v-else-if="idx === 2" class="badge badge-lawyer" style="font-size:12px">🥉 3</span>
                <span v-else class="text-gray-500 font-semibold">{{ idx + 1 }}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="user-mini-avatar" style="background:var(--primary)">{{ u.name?.charAt(0) }}</div>
                  <span class="font-semibold">{{ u.name }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(u.role)">{{ getRoleLabel(u.role) }}</span>
              </td>
              <td class="text-gray-600">-</td>
              <td class="text-center font-semibold">{{ u.assignCount }}</td>
              <td class="text-center font-semibold">{{ u.opinionCount }}</td>
              <td class="text-center font-semibold">{{ u.completeCount }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="progress-bar" style="flex:1;max-width:120px">
                    <div class="progress-fill"
                         :style="{ width: u.score + '%', background: getScoreColor(u.score) }"></div>
                  </div>
                  <span class="font-semibold text-sm">{{ u.score }}分</span>
                </div>
              </td>
            </tr>
            <tr v-if="rankedUsers.length === 0">
              <td colspan="8" class="text-center text-gray-400 py-8">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">合同类型分析</div>
      </div>
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>合同类型</th>
                <th class="text-center">数量</th>
                <th class="text-center">占比</th>
                <th>总金额</th>
                <th>平均金额</th>
                <th>分布</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in sortedTypeStats" :key="t.contractType">
                <td><span class="badge badge-info">{{ t.contractType }}</span></td>
                <td class="text-center font-semibold">{{ t._count.id }}</td>
                <td class="text-center">{{ getTypePercent(t._count.id) }}%</td>
                <td>{{ formatAmount(t._sum?.amount) }}</td>
                <td>{{ formatAmount(t._avg?.amount) }}</td>
                <td style="min-width:200px">
                  <div class="progress-bar">
                    <div class="progress-fill"
                         :style="{ width: getTypePercent(t._count.id) + '%', background: 'var(--primary)' }"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">审阅完成时长分析（Top 10）</div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="table">
          <thead>
            <tr>
              <th>合同编号</th>
              <th>合同名称</th>
              <th>律师ID</th>
              <th class="text-center">耗时 (小时)</th>
              <th>完成时间</th>
              <th>效率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in lawyerReviewTime.slice(0, 10)" :key="c.contractId">
              <td class="font-semibold text-primary">{{ c.contractNo }}</td>
              <td class="truncate" style="max-width:300px" :title="c.title">{{ c.title }}</td>
              <td class="text-gray-600">{{ c.lawyerId || '-' }}</td>
              <td class="text-center">
                <span class="font-bold" :class="getDurationClass(c.durationHours)">
                  {{ c.durationHours }}
                </span>
              </td>
              <td>{{ formatDate(c.completedAt) }}</td>
              <td>
                <span class="badge" :class="getDurationBadge(c.durationHours)">
                  {{ getDurationLabel(c.durationHours) }}
                </span>
              </td>
            </tr>
            <tr v-if="lawyerReviewTime.length === 0">
              <td colspan="6" class="text-center text-gray-400 py-8">暂无完成数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'

const ui = useUiStore()

const statsRange = ref('30')
const loading = ref(false)

const overview = reactive<any>({})
const statusStats = ref<any[]>([])
const typeStats = ref<any[]>([])
const userEfficiency = ref<any[]>([])
const deadlineStats = reactive<any>({})
const gapStats = ref<any[]>([])
const lawyerReviewTime = ref<any[]>([])
const dateRange = reactive<any>({ from: null, to: null })

const completionRate = computed(() => {
  const total = overview.totalContracts || 1
  return Math.round((overview.completedContracts || 0) / total * 100)
})

const avgReviewHours = computed(() => {
  if (lawyerReviewTime.value.length === 0) return 0
  const sum = lawyerReviewTime.value.reduce((s: number, c: any) => s + (c.durationHours || 0), 0)
  return Math.round(sum / lawyerReviewTime.value.length * 10) / 10
})

const gapTotal = computed(() => gapStats.value.reduce((s: number, g: any) => s + (g._count?.id || 0), 0))

const gapOpen = computed(() => gapStats.value.find((g: any) => g.status === 'OPEN')?._count?.id || 0)
const gapInProgress = computed(() => gapStats.value.find((g: any) => g.status === 'IN_PROGRESS')?._count?.id || 0)
const gapResolved = computed(() => gapStats.value.find((g: any) => g.status === 'RESOLVED')?._count?.id || 0)

const severityCounts = computed(() => {
  const map: Record<string, number> = {}
  for (const g of gapStats.value) {
    if (g.severity) {
      map[g.severity] = (map[g.severity] || 0) + (g._count?.id || 0)
    }
  }
  return map
})

const statusDistribution = computed(() => {
  const total = overview.totalContracts || 1
  return statusStats.value.map((s: any) => ({
    status: s.status,
    count: s._count.id,
    percent: Math.round(s._count.id / total * 100)
  }))
})

const sortedTypeStats = computed(() =>
  [...typeStats.value].sort((a: any, b: any) => b._count.id - a._count.id)
)

const rankedUsers = computed(() => {
  return [...userEfficiency.value]
    .map((u: any) => ({
      ...u,
      score: Math.min(100, u.assignCount * 5 + u.opinionCount * 8 + u.completeCount * 15)
    }))
    .sort((a: any, b: any) => b.score - a.score)
})

function getTypePercent(count: number): number {
  const total = typeStats.value.reduce((s: number, t: any) => s + t._count.id, 0) || 1
  return Math.round(count / total * 100)
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: '#3b82f6',
    ASSIGNED_LAWYER: '#0891b2',
    LAWYER_REVIEWING: '#f59e0b',
    LAWYER_COMPLETED: '#0891b2',
    ASSIGNED_REVIEWER: '#0891b2',
    REVIEWER_REVIEWING: '#f59e0b',
    REVIEWER_COMPLETED: '#0891b2',
    PENDING_RECTIFICATION: '#f59e0b',
    RECTIFYING: '#f59e0b',
    COMPLETED: '#16a34a',
    ERROR: '#dc2626'
  }
  return colors[status] || '#6b7280'
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#f59e0b'
  return '#dc2626'
}

function getDurationClass(h: number) {
  if (h <= 24) return 'text-success'
  if (h <= 72) return 'text-warning'
  return 'text-danger'
}

function getDurationBadge(h: number) {
  if (h <= 24) return 'badge-completed'
  if (h <= 72) return 'badge-processing'
  return 'badge-error'
}

function getDurationLabel(h: number) {
  if (h <= 24) return '高效'
  if (h <= 72) return '正常'
  return '超时'
}

async function fetchStats() {
  loading.value = true
  ui.showLoading('加载统计数据...')
  try {
    const res: any = await $fetch('/api/stats/overview', {
      params: { range: statsRange.value }
    })
    Object.assign(overview, res.overview || {})
    statusStats.value = res.statusStats || []
    typeStats.value = res.typeStats || []
    userEfficiency.value = res.userEfficiency || []
    Object.assign(deadlineStats, res.deadlineStats || {})
    gapStats.value = res.gapStats || []
    lawyerReviewTime.value = res.lawyerReviewTime || []
    if (res.dateRange) {
      dateRange.from = res.dateRange.from
      dateRange.to = res.dateRange.to
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}

function exportReport() {
  alert('报表导出功能：演示环境已生成模拟报表数据。实际部署中可通过 Excel/PDF 格式下载。')
}

onMounted(() => {
  ui.setPageTitle('效率统计报表')
  ui.setActiveNav('stats')
  fetchStats()
})
</script>

<style scoped>
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: var(--gray-100);
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.6s ease;
}

.user-mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}
</style>
