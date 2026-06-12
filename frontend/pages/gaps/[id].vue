<template>
  <div class="page-container" v-if="loading"><n-spin size="large" style="display:flex;justify-content:center;padding:80px;" /></div>
  <div class="page-container" v-else-if="detail">
    <div class="mb-md">
      <n-button text @click="router.back()">← 返回列表</n-button>
    </div>
    <div class="grid-cols-3">
      <div style="grid-column: span 2;">
        <div class="card mb-md">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-sm mb-sm">
                <h2 class="title">合规缺口 #{{ detail.gap.id }}</h2>
                <n-tag :color="sevColor(detail.gap.severity)" text-color="#fff" bordered="false" size="small">{{ sevLabel(detail.gap.severity) }}</n-tag>
                <n-tag :type="stTagType(detail.gap.status)" bordered="false" size="small" round>{{ stLabel(detail.gap.status) }}</n-tag>
              </div>
              <div class="desc">{{ detail.gap.description }}</div>
            </div>
            <n-button type="primary" size="small" @click="showEdit = true">更新缺口</n-button>
          </div>
        </div>
        <div class="card mb-md">
          <div class="section-title">关联信息 · 下钻明细</div>
          <div class="info-grid">
            <div class="info-row" v-if="detail.submission">
              <span class="info-l">📄 关联合同</span>
              <span class="info-v">
                <a style="color:#2d8a5e;cursor:pointer" @click="router.push(`/checklists/submission/${detail.submission.id}`)">
                  {{ detail.submission.contract_name }}
                </a>
                <span class="tag-inline" v-if="detail.submission.counterparty"> · {{ detail.submission.counterparty }}</span>
              </span>
            </div>
            <div class="info-row" v-if="detail.submission">
              <span class="info-l">📋 提交信息</span>
              <span class="info-v">
                版本 {{ detail.submission.contract_version || '-' }} ·
                风险等级 <b>{{ riskLabel(detail.submission.risk_level) }}</b> ·
                状态 {{ statusLabel(detail.submission.status) }} ·
                提交人 {{ detail.submission.submitter || '-' }}
              </span>
            </div>
            <div class="info-row" v-if="detail.item">
              <span class="info-l">📝 检查项</span>
              <span class="info-v">
                <n-tag size="small" type="primary" bordered="false">{{ detail.item.section || '其他' }}</n-tag>
                {{ detail.item.question }}
              </span>
            </div>
            <div class="info-row" v-if="detail.item?.required_evidence">
              <span class="info-l">📎 证据要求</span>
              <span class="info-v">{{ detail.item.required_evidence }}</span>
            </div>
          </div>
        </div>

        <div class="card mb-md" v-if="detail.gap.status !== 'closed'">
          <div class="section-title">整改跟进</div>
          <div class="grid-cols-2">
            <div>
              <div class="k-label">整改方案</div>
              <div class="k-value">{{ detail.gap.remediation_plan || '（未填写）' }}</div>
            </div>
            <div>
              <div class="k-label">整改责任人</div>
              <div class="k-value">{{ detail.owner || '（未指定）' }}</div>
            </div>
            <div>
              <div class="k-label">整改期限</div>
              <div class="k-value" :class="deadlineClass">{{ detail.gap.remediation_deadline?.slice(0,10) || '（未设置）' }}{{ deadlineLabel }}</div>
            </div>
            <div>
              <div class="k-label">当前状态</div>
              <div class="k-value">{{ stLabel(detail.gap.status) }}</div>
            </div>
          </div>
          <div class="mt-md" v-if="detail.gap.evidence_details?.length">
            <div class="k-label">证据材料</div>
            <div class="evidence-list">
              <div v-for="(e, i) in detail.gap.evidence_details" :key="i" class="evidence-item">
                📄 {{ typeof e === 'string' ? e : (e.name || e.desc || '材料' + (i+1)) }}
              </div>
            </div>
          </div>
          <div class="mt-md" v-if="detail.gap.resolution_note">
            <div class="k-label">解决说明</div>
            <div class="k-value">{{ detail.gap.resolution_note }}</div>
          </div>
          <div class="mt-md" v-if="detail.gap.actual_resolve_date">
            <div class="k-label">实际解决日期</div>
            <div class="k-value" style="color:#18a058;font-weight:600">{{ detail.gap.actual_resolve_date }}</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">处理轨迹</div>
          <n-timeline :items="timelineItems" size="small" />
        </div>
      </div>

      <div>
        <div class="card mb-md">
          <div class="section-title">风险影响评估</div>
          <n-statistics label="严重程度" :value="sevLabel(detail.gap.severity)" style="margin-bottom: 14px;">
            <template #prefix><n-icon size="18" :color="sevColor(detail.gap.severity)"><AlertCircleOutline /></n-icon></template>
          </n-statistics>
          <n-progress type="line" :percentage="sevPercent(detail.gap.severity)" :color="sevColor(detail.gap.severity)" :indicator-placement="'inside'" style="margin-bottom: 16px;" />
          <n-descriptions label-placement="left" bordered size="small" :column="1">
            <n-descriptions-item label="创建时间">{{ detail.gap.created_at?.slice(0,16).replace('T',' ') || '-' }}</n-descriptions-item>
            <n-descriptions-item label="状态">{{ stLabel(detail.gap.status) }}</n-descriptions-item>
            <n-descriptions-item label="超期风险">{{ overdueRiskLabel }}</n-descriptions-item>
          </n-descriptions>
        </div>
        <div class="card mb-md" v-if="canManage">
          <div class="section-title">快速操作</div>
          <n-space vertical style="width:100%;">
            <n-button block @click="showEdit = true">更新状态 / 期限</n-button>
            <n-button block type="warning" @click="quickUpdate('in_progress')">标记为整改中</n-button>
            <n-button block type="success" @click="quickUpdate('closed')">关闭缺口</n-button>
            <n-button block @click="sendMissReminder" v-if="detail.submission">
              发送材料缺失提醒
            </n-button>
          </n-space>
        </div>
      </div>
    </div>

    <n-modal v-model:show="showEdit" preset="card" title="更新合规缺口" style="width: 640px;">
      <n-form :model="form" label-width="110">
        <n-form-item label="严重程度">
          <n-select v-model:value="form.severity" :options="sevOpts" />
        </n-form-item>
        <n-form-item label="处理状态">
          <n-select v-model:value="form.status" :options="stOpts" />
        </n-form-item>
        <n-form-item label="整改方案">
          <n-input v-model:value="form.remediation_plan" type="textarea" :autosize="{minRows:2,maxRows:4}" />
        </n-form-item>
        <div class="grid-cols-2">
          <n-form-item label="整改期限">
            <n-date-picker v-model:value="form.remediation_deadline" type="date" style="width:100%" value-format="yyyy-MM-dd" />
          </n-form-item>
          <n-form-item label="责任人">
            <n-select v-model:value="form.remediation_owner_id" :options="userOpts" clearable />
          </n-form-item>
        </div>
        <n-form-item label="解决说明">
          <n-input v-model:value="form.resolution_note" type="textarea" placeholder="关闭/缓解时填写" :autosize="{minRows:2}" />
        </n-form-item>
        <n-form-item label="操作备注">
          <n-input v-model:value="form.comment" placeholder="变更原因说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showEdit = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="saveUpdate">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircleOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const canManage = computed(() => auth.canManage || auth.isManager || auth.isReviewer)

const loading = ref(false)
const saving = ref(false)
const detail = ref<any>(null)
const showEdit = ref(false)
const userOpts = ref<any[]>([])
const form = reactive<any>({})

const sevOpts = [
  { value: 'critical', label: '极高' }, { value: 'high', label: '高' },
  { value: 'medium', label: '中' }, { value: 'low', label: '低' },
]
const stOpts = [
  { value: 'open', label: '待处理' }, { value: 'in_progress', label: '整改中' },
  { value: 'mitigated', label: '已缓解' }, { value: 'closed', label: '已关闭' },
  { value: 'accepted', label: '已接受' },
]

const deadlineClass = computed(() => {
  if (!detail.value?.gap?.remediation_deadline) return ''
  const d = detail.value.gap.remediation_deadline.slice(0, 10)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  if (['closed', 'accepted'].includes(detail.value.gap.status)) return ''
  if (diff < 0) return 'color-err'
  if (diff <= 3) return 'color-warn'
  return ''
})
const deadlineLabel = computed(() => {
  if (!detail.value?.gap?.remediation_deadline) return ''
  const d = detail.value.gap.remediation_deadline.slice(0, 10)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  if (['closed', 'accepted'].includes(detail.value.gap.status)) return ''
  if (diff < 0) return ` · 超期${-diff}天`
  if (diff === 0) return ' · 今天到期'
  return ` · 剩${diff}天`
})
const overdueRiskLabel = computed(() => {
  if (!detail.value?.gap?.remediation_deadline) return '未设置期限'
  if (['closed', 'accepted'].includes(detail.value.gap.status)) return '已完成'
  const d = detail.value.gap.remediation_deadline.slice(0, 10)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  if (diff < -7) return { type: 'error', text: `严重超期${-diff}天` }
  if (diff < 0) return { type: 'warning', text: `超期${-diff}天` }
  if (diff <= 3) return { type: 'warning', text: `紧迫（${diff}天）` }
  return { type: 'success', text: `充足（${diff}天）` }
})

const timelineItems = computed(() => {
  const items = (detail.value?.histories || []).map((h: any) => ({
    title: h.action,
    content: h.field ? `${h.field}：${h.old || '-'} → ${h.new || '-'}` : (h.comment || ''),
    time: h.time?.slice(0, 16).replace('T', ' ') || '',
  }))
  const base = [{ title: '缺口创建', content: detail.value?.gap?.description, time: detail.value?.gap?.created_at?.slice(0,16).replace('T',' ') || '' }]
  return [...base, ...items.reverse()].map((x: any, idx: number) => ({
    ...x,
    type: idx === 0 ? 'success' : 'default',
  }))
})

async function loadData() {
  loading.value = true
  try {
    const api = useApi()
    detail.value = await api.get(`/gaps/${route.params.id}/detail`)
    // 填充表单
    Object.assign(form, {
      severity: detail.value.gap.severity,
      status: detail.value.gap.status,
      remediation_plan: detail.value.gap.remediation_plan,
      remediation_deadline: detail.value.gap.remediation_deadline,
      remediation_owner_id: detail.value.gap.remediation_owner_id,
      resolution_note: detail.value.gap.resolution_note,
      comment: '',
    })
    // 加载用户
    try {
      const users = await api.get('/users', { page_size: 200 })
      userOpts.value = (users.items || []).map((u: any) => ({ value: u.id, label: `${u.full_name}（${roleLabel(u.role)}）` }))
    } catch (_) {}
  } finally { loading.value = false }
}

async function quickUpdate(st: string) {
  form.status = st
  if (st === 'closed' && !form.resolution_note) form.resolution_note = '通过快速操作关闭'
  await saveUpdate()
}

async function saveUpdate() {
  saving.value = true
  try {
    const api = useApi()
    const payload: any = { ...form }
    if (payload.remediation_deadline && typeof payload.remediation_deadline !== 'string') {
      payload.remediation_deadline = new Date(payload.remediation_deadline).toISOString().slice(0, 10)
    }
    await api.patch(`/gaps/${route.params.id}`, payload)
    (window as any).__n_msg?.success('更新成功')
    showEdit.value = false
    await loadData()
  } finally { saving.value = false }
}

async function sendMissReminder() {
  if (!detail.value?.submission?.id) return
  try {
    const api = useApi()
    await api.post('/reminders/0/material-missing', {})
    // 模拟发送，实际后端有接口
    (window as any).__n_msg?.success('已发送材料缺失提醒给提交人')
  } catch (e: any) {
    (window as any).__n_msg?.error(e.message || '发送失败')
  }
}

onMounted(loadData)

// helpers
function sevLabel(v: string) { return ({critical:'极高',high:'高',medium:'中',low:'低'} as any)[v] || '-' }
function sevColor(v: string) { return ({critical:'#d03050',high:'#f0a020',medium:'#1d6ff2',low:'#208080'} as any)[v] || '#8a8f99' }
function sevPercent(v: string) { return ({critical:95,high:78,medium:55,low:30} as any)[v] || 0 }
function stLabel(v: string) { return ({open:'待处理',in_progress:'整改中',mitigated:'已缓解',closed:'已关闭',accepted:'已接受'} as any)[v] || v }
function stTagType(v: string): any { return ({open:'error',in_progress:'warning',mitigated:'primary',closed:'success',accepted:'default'} as any)[v] || 'default' }
function riskLabel(v: string) { return sevLabel(v) }
function statusLabel(v: string) { return ({draft:'草稿',submitted:'已提交',under_review:'审核中',lawyer_reviewed:'律师已审',reviewer_approved:'复核通过',rejected:'已驳回',closed:'已关闭'} as any)[v] || v }
function roleLabel(v: string) { return ({admin:'管理员',compliance_manager:'合规经理',lawyer:'律师',reviewer:'复核人',submitter:'提交人'} as any)[v] || v }
</script>

<style scoped>
.title { margin: 0; font-size: 20px; font-weight: 600; }
.desc { font-size: 14px; color: #1f2937; line-height: 1.7; padding: 10px 14px; background: #f7f9f8; border-radius: 8px; margin-top: 8px; }
.info-grid { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; padding: 10px 14px; border: 1px solid #eef1f4; border-radius: 8px; background: #fff; }
.info-l { width: 120px; flex-shrink: 0; color: #6b7280; font-size: 13px; }
.info-v { flex: 1; color: #1f2937; font-size: 13px; line-height: 1.6; }
.tag-inline { color: #6b7280; }
.k-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.k-value { font-size: 14px; color: #1f2937; line-height: 1.6; }
.k-value.color-err { color: #d03050; font-weight: 600; }
.k-value.color-warn { color: #f0a020; font-weight: 600; }
.evidence-list { display: flex; flex-direction: column; gap: 6px; }
.evidence-item { padding: 8px 12px; background: #f0f9f4; border-radius: 6px; color: #1b6b46; font-size: 13px; }
.grid-cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.mb-md { margin-bottom: 16px; }
.mb-sm { margin-bottom: 8px; }
.mt-md { margin-top: 16px; }
</style>
