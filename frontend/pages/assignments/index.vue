<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">分派管理 · 分派审核</div>
      </div>
      <div class="filters grid-cols-4">
        <n-select v-model:value="q.status" :options="statusOpts" placeholder="分派状态" clearable />
        <n-select v-model:value="q.lawyer_id" :options="lawyerOpts" placeholder="律师" filterable clearable />
        <n-select v-model:value="q.reviewer_id" :options="reviewerOpts" placeholder="复核人" filterable clearable />
        <n-button type="primary" ghost @click="load" :loading="loading">查询</n-button>
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

    <n-modal v-model:show="showAssign" preset="card" title="分派律师与复核人" style="width:600px">
      <AssignForm :submission-id="assignSid" @success="onAssigned" @cancel="showAssign = false" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import AssignForm from '~/components/AssignForm.vue'

const router = useRouter()
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const q = reactive<any>({ status: null, lawyer_id: null, reviewer_id: null })
const list = ref<any[]>([])
const lawyerOpts = ref<any[]>([])
const reviewerOpts = ref<any[]>([])
const usersMap = ref<Record<number, any>>({})
const submissionsMap = ref<Record<number, any>>({})
const unassignedList = ref<any[]>([])
const showAssign = ref(false)
const assignSid = ref<number | null>(null)

const statusOpts = [
  { value: 'assigned', label: '已分派' },
  { value: 'lawyer_processing', label: '律师处理中' },
  { value: 'lawyer_done', label: '律师已完成' },
  { value: 'reviewer_processing', label: '复核处理中' },
  { value: 'completed', label: '已完成' },
]

const pagination = computed(() => ({ pageSize, itemCount: total.value + unassignedList.value.length }))

const cols = computed(() => [
  { title: '类型', key: 'type', width: 90, render: (r: any) => h('n-tag', { size: 'small', type: r._type === 'unassigned' ? 'warning' : 'info', bordered: false }, () => r._type === 'unassigned' ? '待分派' : '已分派') },
  { title: '合同名称', key: 'contract_name', render: (r: any) => h('a', { style: 'color:#2d8a5e;cursor:pointer;font-weight:500', onClick: () => router.push(`/checklists/submission/${r.submission_id}`) }, r.contract_name) },
  { title: '对方主体', key: 'counterparty' },
  { title: '风险等级', key: 'risk_level', width: 90, render: (r: any) => riskTag(r.risk_level) },
  { title: '律师', key: 'lawyer_id', width: 120, render: (r: any) => r._lawyer_name || '（未指派）' },
  { title: '律师期限', key: 'lawyer_deadline', width: 110, render: (r: any) => dlCell(r.lawyer_deadline) },
  { title: '复核人', key: 'reviewer_id', width: 120, render: (r: any) => r._reviewer_name || '（未指派）' },
  { title: '复核期限', key: 'reviewer_deadline', width: 110, render: (r: any) => dlCell(r.reviewer_deadline) },
  { title: '状态', key: 'status', width: 110, render: (r: any) => stTag(r.status) },
  { title: '操作', key: 'ops', width: 160, render: (r: any) => opsCell(r) },
])

function riskTag(v: string) {
  const m: Record<string, any> = { critical: ['极高', '#d03050'], high: ['高', '#f0a020'], medium: ['中', '#1d6ff2'], low: ['低', '#208080'] }
  const [t, c] = m[v] || ['-', '#8a8f99']
  return h('n-tag', { size: 'small', color: c, 'text-color': '#fff', bordered: false }, () => t)
}
function stTag(v: string) {
  const m: Record<string, any> = { pending: ['待分派', 'warning'], assigned: ['已分派', 'info'], lawyer_processing: ['律师处理中', 'warning'], lawyer_done: ['律师已完成', 'primary'], reviewer_processing: ['复核处理中', 'warning'], completed: ['已完成', 'success'] }
  const [t, ty] = m[v] || [v, 'default']
  return h('n-tag', { size: 'small', type: ty, bordered: false, round: true }, () => t)
}
function dlCell(d: string) {
  if (!d) return h('span', { style: 'color:#9ca3af' }, '-')
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(String(d).slice(0,10)); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  const col = diff < 0 ? '#d03050' : diff <= 3 ? '#f0a020' : '#1f2937'
  const label = diff < 0 ? `超期${-diff}天` : diff === 0 ? '今天' : `剩${diff}天`
  return h('div', {}, [h('div', {}, String(d).slice(0,10)), h('span', { style: `color:${col};font-size:11px` }, label)])
}
function opsCell(r: any) {
  return h('div', { style: 'display:flex;gap:8px;' }, [
    r._type === 'unassigned'
      ? h(NButton, { size: 'small', type: 'primary', onClick: () => openAssign(r.submission_id) }, () => '立即分派')
      : h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openAssign(r.submission_id) }, () => '重新分派'),
    h(NButton, { size: 'small', text: true, onClick: () => router.push(`/checklists/submission/${r.submission_id}`) }, () => '查看详情'),
  ])
}

function openAssign(sid: number) { assignSid.value = sid; showAssign.value = true }
function onAssigned() { showAssign.value = false; load() }

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const [a, subs, law, rev] = await Promise.all([
      api.get('/assignments', { ...q, page: page.value, page_size: pageSize }),
      api.get('/checklists/submissions', { status: 'submitted', page_size: 200 }),
      api.get('/users/by-role', { role: 'lawyer' }),
      api.get('/users/by-role', { role: 'reviewer' }),
    ])
    lawyerOpts.value = law.map((u: any) => ({ value: u.id, label: u.full_name }))
    reviewerOpts.value = rev.map((u: any) => ({ value: u.id, label: u.full_name }))
    ;[...law, ...rev].forEach((u: any) => { usersMap.value[u.id] = u })

    // 待分派：已提交且无assignment
    const assignedSubIds = new Set((a.items || []).map((x: any) => x.submission_id))
    unassignedList.value = (subs.items || [])
      .filter((s: any) => !assignedSubIds.has(s.id))
      .map((s: any) => ({
        _type: 'unassigned',
        submission_id: s.id,
        contract_name: s.contract_name,
        counterparty: s.counterparty,
        risk_level: s.risk_level,
        status: 'pending',
        lawyer_deadline: null,
        reviewer_deadline: null,
        lawyer_id: null,
        reviewer_id: null,
        _lawyer_name: '',
        _reviewer_name: '',
      }))

    list.value = [
      ...unassignedList.value,
      ...(a.items || []).map((x: any) => ({
        _type: 'assigned',
        id: x.id,
        submission_id: x.submission_id,
        contract_name: submissionsMap.value[x.submission_id]?.contract_name || `-`,
        counterparty: submissionsMap.value[x.submission_id]?.counterparty || `-`,
        risk_level: submissionsMap.value[x.submission_id]?.risk_level || '',
        status: x.status,
        lawyer_deadline: x.lawyer_deadline,
        reviewer_deadline: x.reviewer_deadline,
        lawyer_id: x.lawyer_id,
        reviewer_id: x.reviewer_id,
        _lawyer_name: usersMap.value[x.lawyer_id]?.full_name || '',
        _reviewer_name: usersMap.value[x.reviewer_id]?.full_name || '',
      })),
    ]
    // 补充 contract_name 等
    (subs.items || []).forEach((s: any) => {
      submissionsMap.value[s.id] = s
      list.value.forEach((r: any) => {
        if (r.submission_id === s.id) {
          r.contract_name = s.contract_name
          r.counterparty = s.counterparty
          r.risk_level = s.risk_level
        }
      })
    })
    total.value = a.total || 0
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.filters { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
.grid-cols-4 { display: grid; }
</style>
