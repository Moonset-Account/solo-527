<template>
  <div class="page-container">
    <div v-if="loading" style="height: 400px; display: flex; align-items: center; justify-content: center;">
      <n-spin size="large" />
    </div>
    <template v-else>
      <div class="grid-cols-4 mb-lg">
        <StatCard v-for="s in statCards" :key="s.label" :data="s" />
      </div>

      <div class="grid-cols-3 mb-lg">
        <div style="grid-column: span 2;">
          <div class="card">
            <div class="flex justify-between items-center mb-md">
              <div class="section-title" style="margin:0;">📌 待办事项（{{ data.todos?.length || 0 }}）</div>
              <n-button size="small" text type="primary" @click="router.push('/assignments')">全部查看</n-button>
            </div>
            <n-empty v-if="!data.todos?.length" description="暂无待办事项，干得不错！" size="small" />
            <n-list bordered v-else size="large">
              <n-list-item v-for="t in data.todos.slice(0, 8)" :key="t.type + t.id">
                <template #prefix>
                  <n-tag :type="priorityTag(t.priority)" size="small" :bordered="false" round>{{ typeLabel(t.type) }}</n-tag>
                </template>
                <template #default>
                  <div class="todo-item">
                    <div class="todo-title" @click="router.push(t.url)">{{ t.title }}</div>
                    <div class="todo-meta">
                      <span v-if="t.deadline" :class="['deadline', deadlineClass(t.deadline)]">
                        📅 {{ fmtDate(t.deadline) }}
                        <span v-if="days(t.deadline) !== null">({{ daysLeftLabel(t.deadline) }})</span>
                      </span>
                      <span v-if="t.extra?.counterparty" class="meta-item">🏢 {{ t.extra.counterparty }}</span>
                      <span v-if="t.extra?.risk_level" class="meta-item">
                        <n-tag size="small" :color="riskColor(t.extra.risk_level)" text-color="#fff" :bordered="false">
                          {{ riskLabel(t.extra.risk_level) }}风险
                        </n-tag>
                      </span>
                    </div>
                  </div>
                </template>
              </n-list-item>
            </n-list>
          </div>
        </div>
        <div>
          <div class="card h-full">
            <div class="flex justify-between items-center mb-md">
              <div class="section-title" style="margin:0;">⚠️ 异常预警（{{ data.abnormals?.length || 0 }}）</div>
              <n-button size="small" text type="primary" @click="router.push('/gaps')">查看缺口</n-button>
            </div>
            <n-empty v-if="!data.abnormals?.length" description="暂无异常" size="small" />
            <div v-else class="abnormal-list">
              <div v-for="a in data.abnormals.slice(0, 8)" :key="a.type + a.id"
                   class="abnormal-item"
                   @click="router.push(a.url)">
                <div class="abnormal-left">
                  <div class="severity-dot" :style="{ background: sevColor(a.severity) }"></div>
                </div>
                <div class="abnormal-main">
                  <div class="abnormal-title">{{ a.title }}</div>
                  <div class="abnormal-desc">{{ a.description }}</div>
                  <div class="abnormal-tag">
                    <n-tag size="small" :bordered="false" :type="a.type.includes('超期') ? 'error' : 'warning'">{{ a.type }}</n-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-cols-3 mb-lg">
        <div style="grid-column: span 2;">
          <div class="card">
            <div class="section-title" style="margin:0 0 16px;">📈 最近14天数据变化趋势</div>
            <TrendChart :data="data.trend" />
          </div>
        </div>
        <div>
          <div class="card h-full">
            <div class="section-title" style="margin:0 0 16px;">🎯 活跃缺口风险分布</div>
            <RiskPieChart :data="data.trend?.by_risk_level" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex justify-between items-center mb-md">
          <div class="section-title" style="margin:0;">📋 提交状态分布</div>
          <n-button size="small" text type="primary" @click="router.push('/checklists/submissions')">查看列表</n-button>
        </div>
        <StatusBarChart :data="data.trend?.by_status" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '~/components/StatCard.vue'
import TrendChart from '~/components/TrendChart.vue'
import RiskPieChart from '~/components/RiskPieChart.vue'
import StatusBarChart from '~/components/StatusBarChart.vue'

const router = useRouter()
const loading = ref(true)
const data = ref<any>({})

const statCards = computed(() => {
  const s = data.value.stats || {}
  return [
    { label: '待处理事项', value: s.todo_count || 0, icon: '📌', color: '#1d6ff2', tip: '包含分派、整改、审核' },
    { label: '异常预警', value: s.abnormal_count || 0, icon: '⚠️', color: '#f0a020', tip: '高危+极高风险缺口' },
    { label: '整改超期', value: s.overdue_count || 0, icon: '⏰', color: '#d03050', tip: '已过整改期限未关闭' },
    { label: '按时完成率', value: `${s.on_time_rate || 0}%`, icon: '✅', color: '#18a058', tip: `总提交 ${s.submission_total || 0} 份 · 缺口 ${s.gap_total || 0} 个` },
  ]
})

onMounted(async () => {
  try {
    const api = useApi()
    data.value = await api.get('/dashboard')
  } finally { loading.value = false }
})

function typeLabel(t: string): string {
  return { '待分派': '分派', '律师审核': '律师', '复核': '复核', '整改': '整改' }[t] || t
}
function priorityTag(p: string): string {
  return { critical: 'error', high: 'warning', medium: 'primary', low: 'default' }[p] || 'default'
}
function fmtDate(s: string): string { return s ? s.slice(0, 10) : '' }
function days(s: string): number | null {
  if (!s) return null
  const d = new Date(s); const t = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0)
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}
function daysLeftLabel(s: string): string {
  const n = days(s)
  if (n === null) return ''
  if (n < 0) return `超期${-n}天`
  if (n === 0) return '今天到期'
  return `剩${n}天`
}
function deadlineClass(s: string): string {
  const n = days(s)
  if (n === null) return ''
  if (n < 0) return 'dl-overdue'
  if (n <= 3) return 'dl-urgent'
  return ''
}
function riskColor(r: string): string { return { critical: '#d03050', high: '#f0a020', medium: '#1d6ff2', low: '#208080' }[r] || '#8a8f99' }
function riskLabel(r: string): string { return { critical: '极高', high: '高', medium: '中', low: '低' }[r] || '-' }
function sevColor(s: string): string { return riskColor(s) }
</script>

<style scoped>
.todo-item { width: 100%; }
.todo-title {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
  cursor: pointer;
}
.todo-title:hover { color: #2d8a5e; }
.todo-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
.meta-item { display: inline-flex; align-items: center; }
.deadline.dl-overdue { color: #d03050; font-weight: 500; }
.deadline.dl-urgent { color: #f0a020; font-weight: 500; }

.abnormal-list { display: flex; flex-direction: column; gap: 10px; }
.abnormal-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all .2s;
}
.abnormal-item:hover { background: #f4f6f5; }
.severity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.abnormal-main { flex: 1; min-width: 0; }
.abnormal-title { font-size: 13px; font-weight: 500; color: #1f2937; margin-bottom: 2px; }
.abnormal-desc { font-size: 12px; color: #6b7280; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-full { height: 100%; }
</style>
