<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="section-title">合规缺口列表</div>
      <div class="grid-cols-4 filters">
        <n-select v-model:value="q.status" :options="statusOpts" placeholder="状态" clearable />
        <n-select v-model:value="q.severity" :options="sevOpts" placeholder="严重程度" clearable />
        <n-date-picker v-model:value="q.deadline_range" type="daterange" clearable placeholder="整改期限范围" style="width:100%" />
        <div class="flex gap-sm">
          <n-switch v-model:value="q.overdue_only" checked-value="true" unchecked-value="false" @update:value="() => {}">
            <template #checked>仅超期</template>
            <template #unchecked>全部</template>
          </n-switch>
          <n-button type="primary" ghost @click="load" :loading="loading">查询</n-button>
        </div>
      </div>
    </div>
    <div class="card">
      <n-spin :show="loading">
        <n-data-table
          :columns="cols"
          :data="list"
          :pagination="pagination"
          @update:page="(p) => { page.value = p; load() }"
        />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const q = reactive<any>({ status: null, severity: null, deadline_range: null, overdue_only: false })
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const statusOpts = [
  { value: 'open', label: '待处理' },
  { value: 'in_progress', label: '整改中' },
  { value: 'mitigated', label: '已缓解' },
  { value: 'closed', label: '已关闭' },
  { value: 'accepted', label: '已接受' },
]
const sevOpts = [
  { value: 'critical', label: '极高' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const pagination = computed(() => ({ pageSize, itemCount: total.value }))
const cols = computed(() => [
  { title: 'ID', key: 'id', width: 64 },
  { title: '严重程度', key: 'severity', width: 90, render: (r: any) => sevTag(r.severity) },
  { title: '状态', key: 'status', width: 100, render: (r: any) => stTag(r.status) },
  { title: '缺口描述', key: 'description', ellipsis: { tooltip: true }, render: (r: any) => h('a', { style: 'color:#2d8a5e; cursor:pointer', onClick: () => router.push(`/gaps/${r.id}`) }, r.description.slice(0, 80) + (r.description.length > 80 ? '...' : '')) },
  { title: '整改期限', key: 'remediation_deadline', width: 130, render: (r: any) => dlCell(r.remediation_deadline, r.status) },
  { title: '责任人', key: 'owner_id', width: 120, render: () => '-' },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => (r.created_at || '').slice(0, 16).replace('T', ' ') },
])

function sevTag(v: string) {
  const m: Record<string, any> = { critical: ['极高', '#d03050'], high: ['高', '#f0a020'], medium: ['中', '#1d6ff2'], low: ['低', '#208080'] }
  const [t, c] = m[v] || ['-', '#8a8f99']
  return h('n-tag', { size: 'small', color: c, 'text-color': '#fff', bordered: false }, () => t)
}
function stTag(v: string) {
  const m: Record<string, any> = { open: ['待处理', 'error'], in_progress: ['整改中', 'warning'], mitigated: ['已缓解', 'primary'], closed: ['已关闭', 'success'], accepted: ['已接受', 'default'] }
  const [t, ty] = m[v] || [v, 'default']
  return h('n-tag', { size: 'small', type: ty, bordered: false, round: true }, () => t)
}
function dlCell(d: string, st: string) {
  if (!d) return h('span', { style: 'color:#9ca3af' }, '-')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dd = new Date(d); dd.setHours(0, 0, 0, 0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  const closed = ['closed', 'accepted', 'mitigated'].includes(st)
  let col = '#1f2937'; let label = ''
  if (!closed) {
    col = diff < 0 ? '#d03050' : diff <= 3 ? '#f0a020' : '#1f2937'
    label = diff < 0 ? ` (超期${-diff}天)` : diff === 0 ? ' (今天)' : ` (剩${diff}天)`
  }
  return h('span', { style: `color:${col}; font-weight:500` }, d + label)
}

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const params: any = { page: page.value, page_size: pageSize }
    if (q.status) params.status = q.status
    if (q.severity) params.severity = q.severity
    if (q.overdue_only === true || q.overdue_only === 'true') params.overdue_only = true
    if (q.deadline_range && q.deadline_range.length === 2) {
      const fmt = (ts: number) => new Date(ts).toISOString().slice(0, 10)
      params.deadline_from = fmt(q.deadline_range[0])
      params.deadline_to = fmt(q.deadline_range[1])
    }
    const d = await api.get('/gaps', params)
    list.value = d.items
    total.value = d.total
  } finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.filters { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
</style>
