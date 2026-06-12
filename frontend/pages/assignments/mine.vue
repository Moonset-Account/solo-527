<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">我的任务</div>
        <div class="flex gap-sm">
          <n-radio-group v-model:value="role" size="small">
            <n-radio-button value="all">全部</n-radio-button>
            <n-radio-button value="lawyer" v-if="auth.isLawyer">律师任务</n-radio-button>
            <n-radio-button value="reviewer" v-if="auth.isReviewer">复核任务</n-radio-button>
          </n-radio-group>
          <n-select v-model:value="q.status" :options="statusOpts" placeholder="状态" clearable style="width:160px" />
          <n-button type="primary" ghost @click="load" :loading="loading">刷新</n-button>
        </div>
      </div>
    </div>
    <div class="card">
      <n-spin :show="loading">
        <n-empty v-if="!list.length" description="当前没有分派给您的任务" />
        <div v-else class="task-list">
          <div v-for="t in list" :key="t.id"
               class="task-card"
               :style="{ borderLeftColor: riskColor(t.risk_level) }">
            <div class="task-head">
              <n-tag :type="roleTagType(t)" size="small" bordered="false">{{ roleLabel(t) }}</n-tag>
              <n-tag v-if="t.risk_level" :color="riskColor(t.risk_level)" text-color="#fff" size="small" bordered="false">{{ riskLabel(t.risk_level) }}</n-tag>
              <n-tag :type="stTagType(t.status)" size="small" bordered="false" round>{{ stLabel(t.status) }}</n-tag>
              <div class="task-deadline" v-if="t.my_deadline">
                📅 {{ String(t.my_deadline).slice(0,10) }}
                <span :class="dlClass(t.my_deadline, t.status)">{{ dlLabel(t.my_deadline, t.status) }}</span>
              </div>
            </div>
            <div class="task-title" @click="go(t)">{{ t.contract_name }}</div>
            <div class="task-meta">
              <span v-if="t.counterparty">🏢 {{ t.counterparty }}</span>
              <span v-if="t.counterpart">🆚 {{ t.counterpart_name }}</span>
              <span v-if="t.comment">💬 {{ t.comment?.slice(0, 40) }}{{ t.comment?.length > 40 ? '...' : '' }}</span>
            </div>
            <div class="task-foot">
              <span class="task-time">分派：{{ t.assigned_at?.slice(0,16).replace('T',' ') }}</span>
              <n-button size="small" type="primary" @click="go(t)">处理</n-button>
            </div>
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const role = ref('all')
const q = reactive<any>({ status: null })
const list = ref<any[]>([])

const statusOpts = [
  { value: 'assigned', label: '待处理' },
  { value: 'lawyer_processing', label: '律师处理中' },
  { value: 'lawyer_done', label: '律师已完成' },
  { value: 'reviewer_processing', label: '复核处理中' },
  { value: 'completed', label: '已完成' },
]

function go(t: any) { router.push(`/checklists/submission/${t.submission_id}`) }

function riskColor(r: string) { return ({critical:'#d03050',high:'#f0a020',medium:'#1d6ff2',low:'#208080'} as any)[r] || '#8a8f99' }
function riskLabel(r: string) { return ({critical:'极高',high:'高',medium:'中',low:'低'} as any)[r] || '-' }
function stLabel(s: string) { return ({assigned:'待处理',lawyer_processing:'律师处理中',lawyer_done:'律师已完成',reviewer_processing:'复核处理中',completed:'已完成'} as any)[s] || s }
function stTagType(s: string): any { return ({assigned:'info',lawyer_processing:'warning',lawyer_done:'primary',reviewer_processing:'warning',completed:'success'} as any)[s] || 'default' }
function roleLabel(t: any) { return t._role === 'lawyer' ? '律师审核' : '复核审核' }
function roleTagType(t: any): any { return t._role === 'lawyer' ? 'primary' : 'success' }
function dlClass(d: string, st: string) {
  if (st === 'completed' || st === 'lawyer_done') return ''
  const diff = diffDays(d)
  if (diff < 0) return 'dl-err'
  if (diff <= 3) return 'dl-warn'
  return ''
}
function dlLabel(d: string, st: string) {
  if (st === 'completed' || st === 'lawyer_done') return ''
  const diff = diffDays(d)
  if (diff < 0) return ` (超期${-diff}天)`
  if (diff === 0) return ' (今天)'
  return ` (剩${diff}天)`
}
function diffDays(d: string) {
  const s = String(d).slice(0, 10)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(s); dd.setHours(0,0,0,0)
  return Math.round((dd.getTime() - today.getTime()) / 86400000)
}

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const params: any = { page_size: 200 }
    if (role.value !== 'all') params.role = role.value
    if (q.status) params.status = q.status
    const [a, subs] = await Promise.all([
      api.get('/assignments/mine', params),
      api.get('/checklists/submissions', { page_size: 200 }),
    ])
    const sMap: Record<number, any> = {}
    ;(subs.items || []).forEach((s: any) => { sMap[s.id] = s })

    const merged: any[] = []
    ;(a.items || []).forEach((x: any) => {
      const s = sMap[x.submission_id] || {}
      // 律师角色
      if (x.lawyer_id === auth.user?.id && (role.value === 'all' || role.value === 'lawyer')) {
        merged.push({
          ...x,
          _role: 'lawyer',
          my_deadline: x.lawyer_deadline,
          counterpart_name: x.reviewer_id ? usersMapName(x.reviewer_id) : '',
          comment: x.lawyer_comment,
          contract_name: s.contract_name,
          counterparty: s.counterparty,
          risk_level: s.risk_level,
        })
      }
      // 复核角色
      if (x.reviewer_id === auth.user?.id && (role.value === 'all' || role.value === 'reviewer')) {
        merged.push({
          ...x,
          _role: 'reviewer',
          my_deadline: x.reviewer_deadline,
          counterpart_name: x.lawyer_id ? usersMapName(x.lawyer_id) : '',
          comment: x.reviewer_comment,
          contract_name: s.contract_name,
          counterparty: s.counterparty,
          risk_level: s.risk_level,
        })
      }
    })
    list.value = merged.sort((a, b) => (b.assigned_at || '').localeCompare(a.assigned_at || ''))
  } finally { loading.value = false }
}
const usersMap = ref<Record<number, any>>({})
function usersMapName(uid: number) { return usersMap.value[uid]?.full_name || '' }

onMounted(async () => {
  try {
    const api = useApi()
    const [law, rev] = await Promise.all([
      api.get('/users/by-role', { role: 'lawyer' }),
      api.get('/users/by-role', { role: 'reviewer' }),
    ])
    ;[...law, ...rev].forEach((u: any) => { usersMap.value[u.id] = u })
  } catch (_) {}
  load()
})
</script>

<style scoped>
.task-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
.task-card {
  padding: 18px;
  background: #fff;
  border-radius: 10px;
  border-left: 4px solid #2d8a5e;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all .2s;
}
.task-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.task-head { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
.task-deadline { margin-left: auto; font-size: 12px; color: #6b7280; }
.task-deadline .dl-err { color: #d03050; font-weight: 600; }
.task-deadline .dl-warn { color: #f0a020; font-weight: 600; }
.task-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 8px; cursor: pointer; }
.task-title:hover { color: #2d8a5e; }
.task-meta { font-size: 12px; color: #6b7280; display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
.task-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px dashed #eef1f4; }
.task-time { font-size: 11px; color: #9ca3af; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
</style>
