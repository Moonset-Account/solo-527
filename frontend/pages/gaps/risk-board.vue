<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">⏰ 期限风险看板 · 处理结果回传与到期预警</div>
        <div class="flex gap-sm">
          <n-radio-group v-model:value="viewMode" size="small">
            <n-radio-button value="board">看板</n-radio-button>
            <n-radio-button value="table">列表</n-radio-button>
          </n-radio-group>
          <n-button type="primary" ghost @click="load" :loading="loading">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </div>
      </div>
      <div class="summary-cards grid-cols-4">
        <div class="sum-card sum-total">
          <div class="sum-label">处理中合同</div>
          <div class="sum-value">{{ data.summary?.total || 0 }}</div>
        </div>
        <div class="sum-card sum-critical">
          <div class="sum-label">🔴 极高/高风险</div>
          <div class="sum-value">{{ (data.summary?.critical || 0) + (data.summary?.high || 0) }}</div>
          <div class="sum-sub">极高 {{ data.summary?.critical || 0 }} · 高 {{ data.summary?.high || 0 }}</div>
        </div>
        <div class="sum-card sum-overdue">
          <div class="sum-label">⚠️ 超期 / 临期</div>
          <div class="sum-value">{{ (data.summary?.overdue || 0) + (data.summary?.within_3d || 0) }}</div>
          <div class="sum-sub">超期 {{ data.summary?.overdue || 0 }} · 3天内 {{ data.summary?.within_3d || 0 }}</div>
        </div>
        <div class="sum-card sum-safe">
          <div class="sum-label">✅ 期限充足</div>
          <div class="sum-value">{{ (data.summary?.within_7d || 0) + (data.summary?.more_than_7d || 0) }}</div>
          <div class="sum-sub">7天内 {{ data.summary?.within_7d || 0 }} · 7天以上 {{ data.summary?.more_than_7d || 0 }}</div>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'board'" class="card mb-md">
      <div class="board-lanes">
        <div class="lane lane-overdue">
          <div class="lane-head">
            <span class="lane-title">🔴 已超期</span>
            <n-badge :value="overdueList.length" type="error" />
          </div>
          <div class="lane-body">
            <BoardCard v-for="item in overdueList" :key="item.id" :item="item" @click="go(item)" />
            <n-empty v-if="!overdueList.length" description="无超期项目" size="small" />
          </div>
        </div>
        <div class="lane lane-urgent">
          <div class="lane-head">
            <span class="lane-title">🟠 3天内到期</span>
            <n-badge :value="urgentList.length" type="warning" />
          </div>
          <div class="lane-body">
            <BoardCard v-for="item in urgentList" :key="item.id" :item="item" @click="go(item)" />
            <n-empty v-if="!urgentList.length" description="无紧急项目" size="small" />
          </div>
        </div>
        <div class="lane lane-soon">
          <div class="lane-head">
            <span class="lane-title">🟡 7天内到期</span>
            <n-badge :value="soonList.length" />
          </div>
          <div class="lane-body">
            <BoardCard v-for="item in soonList" :key="item.id" :item="item" @click="go(item)" />
            <n-empty v-if="!soonList.length" description="无近期项目" size="small" />
          </div>
        </div>
        <div class="lane lane-safe">
          <div class="lane-head">
            <span class="lane-title">🟢 7天以上</span>
            <n-badge :value="safeList.length" type="success" />
          </div>
          <div class="lane-body">
            <BoardCard v-for="item in safeList" :key="item.id" :item="item" @click="go(item)" />
            <div v-if="noDeadlineList.length" class="no-deadline">
              <div class="nd-title">⏳ 未设期限 ({{ noDeadlineList.length }})</div>
              <BoardCard v-for="item in noDeadlineList" :key="item.id" :item="item" :show-deadline="false" @click="go(item)" />
            </div>
            <n-empty v-if="!safeList.length && !noDeadlineList.length" description="暂无项目" size="small" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card">
      <n-spin :show="loading">
        <n-data-table
          :columns="cols"
          :data="data.items || []"
          :pagination="false"
        />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshOutline } from '@vicons/ionicons5'
import BoardCard from '~/components/BoardCard.vue'

const router = useRouter()
const loading = ref(false)
const viewMode = ref('board')
const data = ref<any>({ items: [], summary: {} })

const overdueList = computed(() => (data.value.items || []).filter((x: any) => x.days_left !== null && x.days_left < 0))
const urgentList = computed(() => (data.value.items || []).filter((x: any) => x.days_left !== null && x.days_left >= 0 && x.days_left <= 3))
const soonList = computed(() => (data.value.items || []).filter((x: any) => x.days_left !== null && x.days_left > 3 && x.days_left <= 7))
const safeList = computed(() => (data.value.items || []).filter((x: any) => x.days_left !== null && x.days_left > 7))
const noDeadlineList = computed(() => (data.value.items || []).filter((x: any) => x.days_left === null))

const cols = computed(() => [
  { title: '合同名称', key: 'contract_name', render: (r: any) => h('a', { style: 'color:#2d8a5e;cursor:pointer;font-weight:500', onClick: () => go(r) }, r.contract_name) },
  { title: '对方主体', key: 'counterparty' },
  { title: '风险等级', key: 'risk_level', width: 100, render: (r: any) => riskTag(r.risk_level) },
  { title: '整改期限', key: 'deadline', width: 130, render: (r: any) => deadlineCell(r) },
  { title: '状态', key: 'status', width: 120, render: (r: any) => statusTag(r.status) },
  { title: '合规缺口', key: 'gaps', width: 160, render: (r: any) => gapsCell(r) },
  { title: '操作', key: 'ops', width: 100, render: (r: any) => h('n-button', { size: 'small', text: true, type: 'primary', onClick: () => go(r) }, () => '查看详情') },
])

function riskTag(v: string) {
  const m: Record<string, any> = { critical: ['极高', '#d03050'], high: ['高', '#f0a020'], medium: ['中', '#1d6ff2'], low: ['低', '#208080'] }
  const [t, c] = m[v] || ['-', '#8a8f99']
  return h('n-tag', { size: 'small', color: c, 'text-color': '#fff', bordered: false }, () => t)
}
function statusTag(v: string) {
  const m: Record<string, any> = { draft: ['草稿', 'default'], submitted: ['已提交', 'info'], under_review: ['审核中', 'warning'], lawyer_reviewed: ['律师已审', 'primary'], reviewer_approved: ['复核通过', 'success'], rejected: ['已驳回', 'error'], closed: ['已关闭', 'default'] }
  const [t, ty] = m[v] || [v, 'default']
  return h('n-tag', { size: 'small', type: ty, bordered: false, round: true }, () => t)
}
function deadlineCell(r: any) {
  if (!r.deadline) return h('span', { style: 'color:#9ca3af' }, '-')
  const col = r.days_left < 0 ? '#d03050' : r.days_left <= 3 ? '#f0a020' : r.days_left <= 7 ? '#e0a020' : '#18a058'
  const label = r.days_left < 0 ? `超期${-r.days_left}天` : r.days_left === 0 ? '今天到期' : `剩${r.days_left}天`
  return h('div', {}, [
    h('div', {}, r.deadline),
    h('span', { style: `color:${col};font-size:11px;font-weight:600` }, label),
  ])
}
function gapsCell(r: any) {
  return h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, [
    r.critical_gap_count > 0 && h('n-tag', { size: 'small', color: '#d03050', 'text-color': '#fff', bordered: false }, () => `极高 ${r.critical_gap_count}`),
    r.high_gap_count > 0 && h('n-tag', { size: 'small', color: '#f0a020', 'text-color': '#fff', bordered: false }, () => `高 ${r.high_gap_count}`),
    r.gap_count > 0 && (r.critical_gap_count + r.high_gap_count === 0) && h('n-tag', { size: 'small', type: 'info', bordered: false }, () => `共 ${r.gap_count}`),
    r.gap_count === 0 && h('n-tag', { size: 'small', type: 'success', bordered: false }, () => '无缺口'),
  ])
}
function go(r: any) { router.push(`/checklists/submission/${r.id}`) }

async function load() {
  loading.value = true
  try {
    const api = useApi()
    data.value = await api.get('/dashboard/risk-board')
  } finally { loading.value = false }
}

onMounted(load)
</script>

<script lang="ts">
export default { name: 'RiskBoardPage' }
</script>

<style scoped>
.summary-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.sum-card {
  padding: 18px 20px;
  border-radius: 10px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.sum-card::before {
  content: '';
  position: absolute;
  right: -20px;
  top: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.sum-total { background: linear-gradient(135deg, #1d6ff2, #4a98ff); }
.sum-critical { background: linear-gradient(135deg, #d03050, #ff6b85); }
.sum-overdue { background: linear-gradient(135deg, #f0a020, #ffc369); }
.sum-safe { background: linear-gradient(135deg, #18a058, #4ecb87); }
.sum-label { font-size: 13px; opacity: 0.9; margin-bottom: 6px; }
.sum-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.sum-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }

.board-lanes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.lane {
  background: #fafbfc;
  border-radius: 10px;
  padding: 12px;
  min-height: 500px;
}
.lane-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 10px;
  margin-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}
.lane-overdue .lane-head { border-color: #d03050; }
.lane-urgent .lane-head { border-color: #f0a020; }
.lane-soon .lane-head { border-color: #e0a020; }
.lane-safe .lane-head { border-color: #18a058; }
.lane-title { font-size: 13px; font-weight: 600; color: #1f2937; }
.lane-body { display: flex; flex-direction: column; gap: 10px; }
.no-deadline { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
.nd-title { font-size: 12px; color: #6b7280; margin-bottom: 8px; }

.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
.grid-cols-4 { display: grid; }

@media (max-width: 1280px) {
  .board-lanes { grid-template-columns: repeat(2, 1fr); }
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .board-lanes { grid-template-columns: 1fr; }
  .summary-cards { grid-template-columns: 1fr 1fr; }
}
</style>
