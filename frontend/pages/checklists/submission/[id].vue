<template>
  <div class="page-container">
    <n-spin :show="loading">
      <template v-if="data">
        <div class="card mb-md">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-sm mb-sm">
                <h2 class="title">{{ data.contract_name }}</h2>
                <n-tag :type="statusTagType(data.status)" size="small" round bordered="false">{{ statusLabel(data.status) }}</n-tag>
                <n-tag v-if="data.risk_level" :color="riskColor(data.risk_level)" text-color="#fff" size="small" bordered="false">{{ riskLabel(data.risk_level) }}</n-tag>
              </div>
              <div class="meta">
                <span v-if="data.contract_version">版本 {{ data.contract_version }} · </span>
                <span v-if="data.counterparty">对方：{{ data.counterparty }} · </span>
                <span v-if="data.deadline">整改期限：{{ data.deadline?.slice(0,10) }} · </span>
                <span>合规评分：<b :style="{color: scoreColor}">{{ data.overall_score ?? '-' }}</b></span>
              </div>
            </div>
            <div class="flex gap-sm">
              <n-button v-if="data.status === 'draft'" @click="router.push(`/checklists/create?id=${data.id}`)">继续编辑</n-button>
              <n-button v-if="data.status === 'submitted' && canManage" type="primary" @click="showAssign = true">
                <template #icon><n-icon><PeopleOutline /></n-icon></template>
                分派律师/复核人
              </n-button>
              <n-button @click="router.push('/checklists/submissions')">返回列表</n-button>
            </div>
          </div>
        </div>

        <n-tabs v-model:value="tab" type="segment" animated class="mb-md">
          <n-tab-pane name="answers" tab="📝 检查项填写 ({{ data.answers?.length || 0 }})" />
          <n-tab-pane name="gaps" tab="⚠️ 合规缺口 ({{ gapCount }})" />
          <n-tab-pane name="assignment" tab="👥 分派审核" />
          <n-tab-pane name="timeline" tab="📜 处理记录" />
        </n-tabs>

        <div v-if="tab === 'answers'" class="card">
          <div v-for="(items, sec) in groupedAnswers" :key="sec" class="sec-block">
            <div class="sec-title">{{ sec }} ({{ items.length }})</div>
            <div class="items-list">
              <div v-for="a in items" :key="a.item_id" class="ans-row" :class="ansClass(a.status)">
                <div class="ans-status">
                  <n-tag :type="ansStatusTagType(a.status)" size="small" bordered="false" round>{{ ansStatusLabel(a.status) }}</n-tag>
                </div>
                <div class="ans-main">
                  <div class="q-text">{{ a.item?.section ? '' : '' }}<b>{{ a.item?.question }}</b></div>
                  <div class="q-desc" v-if="a.item?.description">{{ a.item?.description }}</div>
                  <div class="q-evidence" v-if="a.item?.required_evidence">📎 需提供：{{ a.item?.required_evidence }}</div>
                  <div class="a-text" v-if="a.answer_text">💬 {{ a.answer_text }}</div>
                  <div class="a-meta" v-if="a.evidence_url || a.evidence_description">
                    <span v-if="a.evidence_url">🔗 <a :href="a.evidence_url" target="_blank" style="color:#2d8a5e">证据链接</a></span>
                    <span v-if="a.evidence_description">📝 {{ a.evidence_description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tab === 'gaps'" class="card">
          <div class="flex justify-between items-center mb-md">
            <div class="section-title" style="margin:0;">合规缺口列表（可点击下钻查看明细）</div>
            <n-button type="primary" size="small" @click="regenGaps" :loading="regenLoading">重新识别缺口</n-button>
          </div>
          <n-empty v-if="!gaps.length" description="暂无合规缺口，或点击上方按钮重新识别" size="small" />
          <div v-else class="gap-list">
            <div v-for="g in gaps" :key="g.id"
                 class="gap-card"
                 :style="{ borderLeftColor: sevColor(g.severity) }"
                 @click="router.push(`/gaps/${g.id}`)">
              <div class="gap-head">
                <n-tag :color="sevColor(g.severity)" text-color="#fff" size="small" bordered="false">{{ sevLabel(g.severity) }}</n-tag>
                <n-tag :type="gapStatusTag(g.status)" size="small" bordered="false" round>{{ gapStatusLabel(g.status) }}</n-tag>
                <span class="gap-date" v-if="g.remediation_deadline">整改期限：{{ g.remediation_deadline?.slice(0,10) }}</span>
              </div>
              <div class="gap-desc">{{ g.description }}</div>
              <div class="gap-foot">
                <span v-if="g.remediation_plan" class="gap-plan">整改方案：{{ g.remediation_plan?.slice(0, 50) }}...</span>
                <span class="gap-link">查看明细 →</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tab === 'assignment'" class="card">
          <AssignDetail :submission-id="data.id" @assigned="loadData" />
        </div>

        <div v-if="tab === 'timeline'" class="card">
          <n-steps vertical :current="999" size="small">
            <n-step :status="data.created_at ? 'finish' : 'wait'" :title="'创建草稿'" :description="data.created_at?.slice(0,19).replace('T',' ') || ''" />
            <n-step :status="data.submitted_at ? 'finish' : 'wait'" :title="'提交审核'" :description="data.submitted_at?.slice(0,19).replace('T',' ') || ''" />
            <n-step :status="assignment ? (assignment.lawyer_started_at ? 'finish' : 'process') : 'wait'"
                    :title="assignment ? `律师审核：${lawyerName}` : '等待分派律师'"
                    :description="assignDesc('lawyer')" />
            <n-step :status="assignment ? (assignment.lawyer_finished_at ? 'finish' : 'wait') : 'wait'"
                    :title="'律师完成'"
                    :description="assignment?.lawyer_finished_at?.slice(0,19).replace('T',' ') || ''" />
            <n-step :status="assignment ? (assignment.reviewer_started_at ? 'finish' : 'wait') : 'wait'"
                    :title="assignment ? `复核审核：${reviewerName}` : '等待分派复核人'"
                    :description="assignDesc('reviewer')" />
            <n-step :status="data.completed_at ? 'finish' : 'wait'"
                    :title="'复核完成'"
                    :description="data.completed_at?.slice(0,19).replace('T',' ') || ''" />
          </n-steps>
        </div>
      </template>
    </n-spin>

    <n-modal v-model:show="showAssign" preset="card" title="分派律师与复核人" style="width: 560px;">
      <AssignForm :submission-id="data?.id" @success="onAssigned" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PeopleOutline } from '@vicons/ionicons5'
import AssignDetail from '~/components/AssignDetail.vue'
import AssignForm from '~/components/AssignForm.vue'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const canManage = computed(() => auth.canManage)

const loading = ref(false)
const regenLoading = ref(false)
const data = ref<any>(null)
const gaps = ref<any[]>([])
const assignment = ref<any>(null)
const usersMap = ref<Record<number, any>>({})
const tab = ref('answers')
const showAssign = ref(false)

const groupedAnswers = computed(() => {
  const g: Record<string, any[]> = {}
  ;(data.value?.answers || []).forEach((a: any) => {
    const sec = a.item?.section || '其他'
    if (!g[sec]) g[sec] = []
    g[sec].push(a)
  })
  return g
})

const scoreColor = computed(() => {
  const s = data.value?.overall_score
  if (s == null) return '#8a8f99'
  return s >= 80 ? '#18a058' : s >= 60 ? '#f0a020' : '#d03050'
})

const gapCount = computed(() => gaps.value.length)

const lawyerName = computed(() => usersMap.value[assignment.value?.lawyer_id]?.full_name || '-')
const reviewerName = computed(() => usersMap.value[assignment.value?.reviewer_id]?.full_name || '-')

function assignDesc(who: 'lawyer' | 'reviewer') {
  if (!assignment.value) return ''
  if (who === 'lawyer') return assignment.value.lawyer_finished_at
    ? assignment.value.lawyer_finished_at.slice(0, 19).replace('T', ' ')
    : assignment.value.lawyer_started_at
      ? '处理中'
      : (assignment.value.lawyer_deadline ? `截止：${String(assignment.value.lawyer_deadline).slice(0,10)}` : '待处理')
  return assignment.value.reviewer_finished_at
    ? assignment.value.reviewer_finished_at.slice(0, 19).replace('T', ' ')
    : assignment.value.reviewer_started_at
      ? '处理中'
      : (assignment.value.reviewer_deadline ? `截止：${String(assignment.value.reviewer_deadline).slice(0,10)}` : '待处理')
}

async function loadData() {
  loading.value = true
  try {
    const api = useApi()
    const sid = route.params.id
    const [sub, g, a, ulaw, ure] = await Promise.all([
      api.get(`/checklists/submissions/${sid}`),
      api.get('/gaps', { submission_id: sid, page_size: 200 }),
      api.get('/assignments', { page_size: 1 }),
      api.get('/users/by-role', { role: 'lawyer' }),
      api.get('/users/by-role', { role: 'reviewer' }),
    ])
    data.value = sub
    gaps.value = g.items || []
    const all = a.items || []
    assignment.value = all.find((x: any) => x.submission_id == sid) || null
    ;[...ulaw, ...ure].forEach((u: any) => { usersMap.value[u.id] = u })
  } finally { loading.value = false }
}

async function regenGaps() {
  regenLoading.value = true
  try {
    const api = useApi()
    await api.post(`/gaps/auto-generate/${route.params.id}`)
    const d = await api.get('/gaps', { submission_id: route.params.id, page_size: 200 })
    gaps.value = d.items || []
    (window as any).__n_msg?.success(`已识别 ${d.total} 个合规缺口`)
  } finally { regenLoading.value = false }
}

function onAssigned() {
  showAssign.value = false
  loadData()
  tab.value = 'assignment'
}

onMounted(loadData)

// helpers
function statusLabel(s: string) { return ({draft:'草稿',submitted:'已提交',under_review:'审核中',lawyer_reviewed:'律师已审',reviewer_approved:'复核通过',rejected:'已驳回',closed:'已关闭'} as any)[s] || s }
function statusTagType(s: string): any { return ({draft:'default',submitted:'info',under_review:'warning',lawyer_reviewed:'primary',reviewer_approved:'success',rejected:'error',closed:'default'} as any)[s] || 'default' }
function riskColor(r: string) { return ({critical:'#d03050',high:'#f0a020',medium:'#1d6ff2',low:'#208080'} as any)[r] || '#8a8f99' }
function riskLabel(r: string) { return ({critical:'极高',high:'高',medium:'中',low:'低'} as any)[r] || '-' }
function ansStatusLabel(s: string) { return ({compliant:'合规',non_compliant:'不合规',partial:'部分合规',not_applicable:'不适用',pending:'待填写'} as any)[s] || s }
function ansStatusTagType(s: string): any { return ({compliant:'success',non_compliant:'error',partial:'warning',not_applicable:'default',pending:'info'} as any)[s] || 'default' }
function ansClass(s: string) { return {compliant:'ans-ok',non_compliant:'ans-bad',partial:'ans-warn',not_applicable:'ans-ok'}[s] || 'ans-pending' }
function sevColor(s: string) { return riskColor(s) }
function sevLabel(s: string) { return riskLabel(s) }
function gapStatusLabel(s: string) { return ({open:'待处理',in_progress:'整改中',mitigated:'已缓解',closed:'已关闭',accepted:'已接受'} as any)[s] || s }
function gapStatusTag(s: string): any { return ({open:'error',in_progress:'warning',mitigated:'primary',closed:'success',accepted:'default'} as any)[s] || 'default' }
</script>

<style scoped>
.title { margin: 0; font-size: 22px; font-weight: 600; color: #1f2937; }
.meta { font-size: 13px; color: #6b7280; }
.sec-block { margin-bottom: 22px; }
.sec-title {
  background: linear-gradient(90deg, #e8f5ee 0%, transparent 100%);
  padding: 10px 14px;
  border-left: 4px solid #2d8a5e;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1b6b46;
  border-radius: 6px;
}
.ans-row {
  display: flex;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 10px;
  background: #fff;
}
.ans-row.ans-ok { border-color: #a9e5c4; background: #f0fdf6; }
.ans-row.ans-bad { border-color: #f0a2b4; background: #fff0f3; }
.ans-row.ans-warn { border-color: #f6c3a8; background: #fff7ed; }
.ans-row.ans-pending { }
.ans-status { flex-shrink: 0; padding-top: 2px; }
.ans-main { flex: 1; min-width: 0; }
.q-text { font-size: 14px; margin-bottom: 4px; color: #1f2937; }
.q-desc { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.q-evidence { font-size: 12px; color: #f0a020; margin-bottom: 6px; background: #fff7ed; padding: 4px 8px; border-radius: 4px; display: inline-block; }
.a-text { font-size: 13px; color: #1f2937; margin-bottom: 4px; }
.a-meta { font-size: 12px; color: #6b7280; display: flex; gap: 16px; margin-top: 4px; }

.gap-list { display: flex; flex-direction: column; gap: 12px; }
.gap-card {
  padding: 16px 18px;
  border-radius: 10px;
  background: #fff;
  border-left: 4px solid #8a8f99;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: all .2s;
}
.gap-card:hover { transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.gap-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.gap-date { margin-left: auto; font-size: 12px; color: #6b7280; }
.gap-desc { font-size: 14px; color: #1f2937; line-height: 1.6; margin-bottom: 8px; }
.gap-foot { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
.gap-link { color: #2d8a5e; font-weight: 500; }

.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.mb-md { margin-bottom: 16px; }
.mb-sm { margin-bottom: 8px; }
</style>
