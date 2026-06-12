<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">📂 检查清单 · 我的提交</div>
        <n-button type="primary" @click="router.push('/checklists/create')">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新建检查
        </n-button>
      </div>
      <div class="filters grid-cols-4">
        <n-select v-model:value="q.status" :options="statusOpts" placeholder="状态筛选" clearable />
        <n-select v-model:value="q.risk_level" :options="riskOpts" placeholder="风险等级" clearable />
        <n-input v-model:value="q.keyword" placeholder="合同名称/对方搜索" clearable />
        <n-button type="primary" ghost @click="load" :loading="loading">查询</n-button>
      </div>
    </div>
    <div class="card">
      <n-spin :show="loading">
        <n-data-table
          :columns="cols"
          :data="list"
          :pagination="pagination"
          :row-class-name="(_, idx) => idx % 2 ? 'row-alt' : ''"
          @update:page="onPage"
        />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { AddOutline } from '@vicons/ionicons5'
import { NButton } from 'naive-ui'

const router = useRouter()
const loading = ref(false)
const q = reactive<any>({ status: null, risk_level: null, keyword: '', mine: true })
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const statusOpts = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'under_review', label: '审核中' },
  { value: 'lawyer_reviewed', label: '律师已审' },
  { value: 'reviewer_approved', label: '复核通过' },
  { value: 'rejected', label: '已驳回' },
]
const riskOpts = [
  { value: 'critical', label: '极高风险' },
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
]

const cols = computed(() => [
  { title: 'ID', key: 'id', width: 64 },
  { title: '合同名称', key: 'contract_name', render: (r: any) => h('a', { style: 'color:#2d8a5e; cursor:pointer; font-weight:500', onClick: () => router.push(`/checklists/submission/${r.id}`) }, r.contract_name) },
  { title: '合同版本', key: 'contract_version', width: 100 },
  { title: '对方主体', key: 'counterparty' },
  { title: '风险等级', key: 'risk_level', width: 100, render: (r: any) => riskTag(r.risk_level) },
  { title: '合规评分', key: 'overall_score', width: 100, render: (r: any) => scoreBadge(r.overall_score) },
  { title: '整改期限', key: 'deadline', width: 120, render: (r: any) => deadlineCell(r.deadline) },
  { title: '状态', key: 'status', width: 110, render: (r: any) => statusTag(r.status) },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => (r.created_at || '').slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'ops', width: 180, render: (r: any) => opsCell(r) },
])

const pagination = computed(() => ({ pageSize: pageSize.value, itemCount: total.value }))

function statusTag(v: string) {
  const m: Record<string, any> = {
    draft: ['草稿', 'default'], submitted: ['已提交', 'info'], under_review: ['审核中', 'warning'],
    lawyer_reviewed: ['律师已审', 'primary'], reviewer_approved: ['复核通过', 'success'],
    rejected: ['已驳回', 'error'], closed: ['已关闭', 'default'],
  }
  const [t, ty] = m[v] || [v, 'default']
  return h('n-tag', { size: 'small', type: ty, bordered: false, round: () => true }, () => t)
}
function riskTag(v: string) {
  const m: Record<string, any> = { critical: ['极高', '#d03050'], high: ['高', '#f0a020'], medium: ['中', '#1d6ff2'], low: ['低', '#208080'] }
  const [t, c] = m[v] || ['-', '#8a8f99']
  return h('n-tag', { size: 'small', color: c, 'text-color': '#fff', bordered: false }, () => t)
}
function scoreBadge(s: any) {
  const v = s == null ? '-' : Number(s).toFixed(0)
  const col = s == null ? '#8a8f99' : s >= 80 ? '#18a058' : s >= 60 ? '#f0a020' : '#d03050'
  return h('span', { style: `color:${col}; font-weight:600` }, v)
}
function deadlineCell(d: string) {
  if (!d) return h('span', { style: 'color:#9ca3af' }, '-')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dd = new Date(d); dd.setHours(0, 0, 0, 0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  const col = diff < 0 ? '#d03050' : diff <= 3 ? '#f0a020' : '#1f2937'
  const label = diff < 0 ? `超期${-diff}天` : diff === 0 ? '今天' : `剩${diff}天`
  return h('div', {}, [h('div', {}, d), h('span', { style: `color:${col}; font-size:11px` }, label)])
}
function opsCell(r: any) {
  return h('div', { style: 'display:flex; gap:8px' }, [
    h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => router.push(`/checklists/submission/${r.id}`) }, () => '详情'),
    r.status === 'draft' && h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => router.push(`/checklists/create?id=${r.id}`) }, () => '继续编辑'),
  ].filter(Boolean))
}

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const params: any = { ...q, page: page.value, page_size: pageSize.value }
    Object.keys(params).forEach((k) => { if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k] })
    const d = await api.get('/checklists/submissions', params)
    list.value = d.items
    total.value = d.total
  } finally { loading.value = false }
}
function onPage(p: number) { page.value = p; load() }

onMounted(load)
</script>

<style scoped>
.filters { gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.row-alt { background: #fafbfb; }
</style>
