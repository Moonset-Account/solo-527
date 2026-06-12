<template>
  <div class="page-container">
    <n-steps :current="step" size="small" class="mb-md">
      <n-step title="选择模板" description="选择合规检查清单模板" />
      <n-step title="填写基础信息" description="合同基本信息" />
      <n-step title="逐项回答检查项" description="按章节完成所有检查项" />
      <n-step title="提交审核" description="生成合规缺口并提交" />
    </n-steps>

    <n-spin :show="loading">
      <!-- STEP 1: 选择模板 -->
      <div v-if="step === 0" class="card">
        <div class="section-title">第 1 步 · 选择合规检查清单模板</div>
        <div class="templates-grid">
          <div v-for="t in templates" :key="t.id"
               :class="['tpl-card', { active: selectedTplId === t.id }]"
               @click="selectedTplId = t.id">
            <div class="tpl-top">
              <div class="tpl-badge">{{ t.category || '通用' }}</div>
              <div class="tpl-version">版本 {{ t.contract_version || '-' }}</div>
            </div>
            <div class="tpl-name">{{ t.name }}</div>
            <div class="tpl-desc">{{ t.description || '暂无描述' }}</div>
            <div class="tpl-foot">
              <span>共 {{ t.items?.length || 0 }} 项检查</span>
              <n-button size="small" v-if="selectedTplId === t.id" type="primary">已选择</n-button>
            </div>
          </div>
          <div v-if="!templates.length" style="grid-column:1/-1">
            <n-empty description="暂无可用模板，请联系管理员创建" />
          </div>
        </div>
        <div class="flex justify-end mt-md gap-sm">
          <n-button type="primary" :disabled="!selectedTplId" @click="goStep(1)">下一步：填写基础信息</n-button>
        </div>
      </div>

      <!-- STEP 2: 基础信息 -->
      <div v-if="step === 1" class="card">
        <div class="section-title">第 2 步 · 填写合同基础信息</div>
        <n-form :model="form" label-width="120" style="max-width: 760px;">
          <n-form-item label="合同名称" required>
            <n-input v-model:value="form.contract_name" placeholder="请输入合同名称" />
          </n-form-item>
          <div class="grid-cols-2">
            <n-form-item label="合同版本">
              <n-select v-model:value="form.contract_version" :options="versionOpts" placeholder="选择合同版本" clearable />
            </n-form-item>
            <n-form-item label="对方主体">
              <n-input v-model:value="form.counterparty" placeholder="对方公司名称" />
            </n-form-item>
            <n-form-item label="合同金额">
              <n-input-number v-model:value="form.contract_amount" :min="0" placeholder="万元" style="width:100%" />
            </n-form-item>
            <n-form-item label="风险等级">
              <n-select v-model:value="form.risk_level" :options="riskOpts" placeholder="评估风险等级" />
            </n-form-item>
          </div>
          <n-form-item label="整改期限">
            <n-date-picker v-model:value="form.deadline" type="date" placeholder="要求完成整改/审查的截止日期" style="width:100%" />
          </n-form-item>
        </n-form>
        <div class="flex justify-end mt-md gap-sm">
          <n-button @click="goStep(0)">上一步</n-button>
          <n-button type="primary" @click="goStep(2)">下一步：填写检查项</n-button>
        </div>
      </div>

      <!-- STEP 3: 检查项 -->
      <div v-if="step === 2" class="card">
        <div class="flex justify-between items-center mb-md">
          <div class="section-title" style="margin:0;">第 3 步 · 逐项回答</div>
          <div class="progress-info">
            已完成 {{ completedCount }} / {{ totalCount }} 项 ·
            合规率 <span :style="{ color: complianceColor }">{{ complianceRate }}%</span>
          </div>
        </div>

        <n-tabs v-model:value="activeSection" type="line" class="mb-sm">
          <n-tab-pane v-for="(items, sec) in groupedItems" :key="sec" :name="sec" :tab="`${sec} (${items.length})`" />
        </n-tabs>

        <div class="items-list">
          <div v-for="(a, idx) in currentAnswers" :key="a.item_id" class="answer-card" :class="answeredClass(a)">
            <div class="ans-head">
              <span class="ans-no">{{ idx + 1 }}</span>
              <span class="ans-required" v-if="getItem(a.item_id)?.is_required">必填</span>
              <span class="ans-risk" v-if="getItem(a.item_id)?.default_risk_level">
                风险：{{ getItem(a.item_id)?.default_risk_level }}
              </span>
            </div>
            <div class="ans-q">{{ getItem(a.item_id)?.question }}</div>
            <div class="ans-desc" v-if="getItem(a.item_id)?.description">{{ getItem(a.item_id)?.description }}</div>
            <div class="ans-evidence-tip" v-if="getItem(a.item_id)?.required_evidence">
              📎 需提供证据：{{ getItem(a.item_id)?.required_evidence }}
            </div>
            <div class="ans-row">
              <div style="flex: 0 0 220px;">
                <n-radio-group v-model:value="a.status" size="small">
                  <n-space vertical>
                    <n-radio value="compliant">✅ 合规</n-radio>
                    <n-radio value="non_compliant">❌ 不合规</n-radio>
                    <n-radio value="partial">⚠️ 部分合规</n-radio>
                    <n-radio value="not_applicable">➖ 不适用</n-radio>
                    <n-radio value="pending">⏳ 待填写</n-radio>
                  </n-space>
                </n-radio-group>
              </div>
              <div class="ans-form" style="flex: 1;">
                <n-input v-model:value="a.answer_text" type="textarea" placeholder="回答说明/合规依据..." :autosize="{minRows: 2, maxRows: 4}" />
                <div style="display:flex; gap:12px; margin-top:8px;">
                  <n-input v-model:value="a.evidence_url" placeholder="证据材料链接" style="flex:1;" />
                  <n-input v-model:value="a.evidence_description" placeholder="证据说明" style="flex:1;" />
                </div>
                <n-input v-model:value="a.comment" placeholder="内部备注（仅可见）" style="margin-top:8px;" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-md gap-sm">
          <n-button @click="goStep(1)">上一步</n-button>
          <n-button @click="saveDraft" :loading="saving">保存草稿</n-button>
          <n-button type="primary" @click="goStep(3)">下一步：预览提交</n-button>
        </div>
      </div>

      <!-- STEP 4: 预览 -->
      <div v-if="step === 3" class="card">
        <div class="section-title">第 4 步 · 预览并提交</div>
        <div class="preview-grid">
          <div class="p-item"><span class="p-l">合同名称：</span><span class="p-v">{{ form.contract_name }}</span></div>
          <div class="p-item"><span class="p-l">合同版本：</span><span class="p-v">{{ form.contract_version || '-' }}</span></div>
          <div class="p-item"><span class="p-l">对方主体：</span><span class="p-v">{{ form.counterparty || '-' }}</span></div>
          <div class="p-item"><span class="p-l">风险等级：</span><span class="p-v">{{ riskLabel(form.risk_level) }}</span></div>
          <div class="p-item"><span class="p-l">整改期限：</span><span class="p-v">{{ form.deadline ? tsToDate(form.deadline) : '-' }}</span></div>
          <div class="p-item"><span class="p-l">合规评分：</span><span class="p-v" :style="{color: complianceColor, fontWeight:600}">{{ complianceRate }}%</span></div>
        </div>

        <n-alert type="warning" title="不合规/部分合规项将自动生成合规缺口" class="mb-md mt-md">
          系统会根据填写结果自动识别合规缺口，分派给对应人员跟进整改。
        </n-alert>

        <n-statistics label="合规缺口预估数" :value="gapCountEstimate" style="margin-bottom: 16px; color: #d03050;" />

        <div class="flex justify-end mt-md gap-sm">
          <n-button @click="goStep(2)">返回修改</n-button>
          <n-button @click="saveDraft" :loading="saving">保存草稿</n-button>
          <n-button type="primary" :loading="submitting" @click="doSubmit">✅ 提交审核并生成缺口</n-button>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const step = ref(0)

const templates = ref<any[]>([])
const selectedTplId = ref<number | null>(null)
const versionOpts = ref<any[]>([])
const riskOpts = [
  { value: 'critical', label: '极高风险' },
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
]
const form = reactive<any>({
  contract_name: '', contract_version: '', counterparty: '',
  contract_amount: null, risk_level: 'medium', deadline: null,
})
const answers = ref<any[]>([])
const submissionId = ref<number | null>(null)
const activeSection = ref<string>('')

const itemsMap = computed(() => {
  const tpl = templates.value.find((t) => t.id === selectedTplId.value)
  if (!tpl) return {}
  const m: Record<number, any> = {}
  tpl.items.forEach((it: any) => { m[it.id] = it })
  return m
})

const groupedItems = computed(() => {
  const tpl = templates.value.find((t) => t.id === selectedTplId.value)
  if (!tpl) return {}
  const g: Record<string, any[]> = {}
  tpl.items.forEach((it: any) => {
    const k = it.section || '其他'
    if (!g[k]) g[k] = []
    g[k].push(it)
  })
  return g
})

const currentAnswers = computed(() => {
  const sec = activeSection.value
  const items = groupedItems.value[sec] || []
  return items.map((it: any) => answers.value.find((a) => a.item_id === it.id) || { item_id: it.id, status: 'pending', answer_text: '', evidence_url: '', evidence_description: '', comment: '' })
})

watch(groupedItems, (g) => {
  if (!activeSection.value && Object.keys(g).length) activeSection.value = Object.keys(g)[0]
}, { immediate: true })

const totalCount = computed(() => answers.value.length)
const completedCount = computed(() => answers.value.filter((a) => a.status !== 'pending').length)
const compliantCount = computed(() => answers.value.filter((a) => a.status === 'compliant' || a.status === 'not_applicable').length)
const complianceRate = computed(() => totalCount.value ? Math.round(100 * compliantCount.value / totalCount.value) : 0)
const complianceColor = computed(() => complianceRate.value >= 80 ? '#18a058' : complianceRate.value >= 60 ? '#f0a020' : '#d03050')
const gapCountEstimate = computed(() => answers.value.filter((a) => a.status === 'non_compliant' || a.status === 'partial').length)

function getItem(id: number) { return itemsMap.value[id] }

function answeredClass(a: any) {
  if (a.status === 'compliant' || a.status === 'not_applicable') return 'ans-ok'
  if (a.status === 'non_compliant' || a.status === 'partial') return 'ans-warn'
  return ''
}

function goStep(n: number) {
  if (n === 1 && !selectedTplId.value) {
    (window as any).__n_msg?.warning('请先选择一个模板')
    return
  }
  if (n === 2 && !form.contract_name) {
    (window as any).__n_msg?.warning('请填写合同名称')
    return
  }
  step.value = n
}

async function loadTemplates() {
  loading.value = true
  try {
    const api = useApi()
    const [tpl, cfg] = await Promise.all([
      api.get('/checklists/templates', { page_size: 50 }),
      api.get('/configs', { config_type: 'contract_version' }),
    ])
    templates.value = tpl.items || []
    versionOpts.value = (cfg || []).map((c: any) => ({ value: c.config_value, label: `${c.config_value} · ${c.description || ''}` }))
    if (!selectedTplId.value && templates.value.length) selectedTplId.value = templates.value[0].id
  } finally { loading.value = false }
}

async function loadSubmission(id: number) {
  loading.value = true
  try {
    const api = useApi()
    const s = await api.get(`/checklists/submissions/${id}`)
    form.contract_name = s.contract_name
    form.contract_version = s.contract_version
    form.counterparty = s.counterparty
    form.contract_amount = s.contract_amount
    form.risk_level = s.risk_level
    if (s.deadline) form.deadline = new Date(s.deadline).getTime()
    submissionId.value = s.id
    selectedTplId.value = s.checklist_id
    answers.value = (s.answers || []).map((a: any) => ({
      item_id: a.item_id, status: a.status, answer_text: a.answer_text,
      evidence_url: a.evidence_url, evidence_description: a.evidence_description, comment: a.comment,
    }))
    step.value = 2
  } finally { loading.value = false }
}

function ensureAnswers() {
  const tpl = templates.value.find((t) => t.id === selectedTplId.value)
  if (!tpl) return
  const has = new Set(answers.value.map((a) => a.item_id))
  tpl.items.forEach((it: any) => {
    if (!has.has(it.id)) {
      answers.value.push({ item_id: it.id, status: 'pending', answer_text: '', evidence_url: '', evidence_description: '', comment: '' })
    }
  })
}

watch(selectedTplId, () => { ensureAnswers() })

onMounted(async () => {
  await loadTemplates()
  if (route.query.id) {
    await loadSubmission(Number(route.query.id))
  }
})

async function saveDraft() {
  saving.value = true
  try {
    const api = useApi()
    ensureAnswers()
    if (!submissionId.value) {
      const data = await api.post('/checklists/submissions', {
        checklist_id: selectedTplId.value,
        contract_name: form.contract_name || '未命名合同',
        contract_version: form.contract_version,
        counterparty: form.counterparty,
        contract_amount: form.contract_amount,
        deadline: form.deadline ? tsToDate(form.deadline) : null,
        risk_level: form.risk_level,
        answers: answers.value,
      })
      submissionId.value = data.id
    } else {
      await api.patch(`/checklists/submissions/${submissionId.value}`, {
        contract_name: form.contract_name,
        contract_version: form.contract_version,
        counterparty: form.counterparty,
        contract_amount: form.contract_amount,
        deadline: form.deadline ? tsToDate(form.deadline) : null,
        risk_level: form.risk_level,
      })
      await api.post(`/checklists/submissions/${submissionId.value}/answers/batch`, {
        answers: answers.value,
      })
    }
    (window as any).__n_msg?.success('草稿已保存')
  } finally { saving.value = false }
}

async function doSubmit() {
  if (!form.contract_name) {
    (window as any).__n_msg?.warning('请填写合同名称'); return
  }
  submitting.value = true
  try {
    await saveDraft()
    const api = useApi()
    await api.post(`/checklists/submissions/${submissionId.value}/submit`)
    try { await api.post(`/gaps/auto-generate/${submissionId.value}`) } catch (_) {}
    (window as any).__n_msg?.success('已提交审核并生成合规缺口')
    setTimeout(() => router.push(`/checklists/submission/${submissionId.value}`), 800)
  } finally { submitting.value = false }
}

function tsToDate(ts: any) {
  if (!ts) return ''
  if (typeof ts === 'number') return new Date(ts).toISOString().slice(0, 10)
  return String(ts).slice(0, 10)
}
function riskLabel(v: string) { return ({ critical: '极高风险', high: '高风险', medium: '中风险', low: '低风险' } as any)[v] || '-' }
</script>

<style scoped>
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.tpl-card {
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all .2s;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.tpl-card:hover { border-color: #52b788; transform: translateY(-2px); }
.tpl-card.active { border-color: #2d8a5e; background: #f0fdf6; }
.tpl-top { display: flex; justify-content: space-between; margin-bottom: 12px; }
.tpl-badge { background: #2d8a5e; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.tpl-version { color: #6b7280; font-size: 12px; }
.tpl-name { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
.tpl-desc { font-size: 13px; color: #6b7280; line-height: 1.5; flex: 1; }
.tpl-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #6b7280; }

.answer-card {
  padding: 18px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-bottom: 14px;
  background: #fff;
  transition: all .2s;
}
.answer-card.ans-ok { border-color: #a9e5c4; background: #f0fdf6; }
.answer-card.ans-warn { border-color: #f6c3a8; background: #fff7ed; }
.ans-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.ans-no {
  width: 28px; height: 28px; border-radius: 50%;
  background: #2d8a5e; color: #fff; text-align: center; line-height: 28px; font-size: 13px; font-weight: 600;
}
.ans-required { background: #d03050; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; }
.ans-risk { color: #6b7280; font-size: 12px; }
.ans-q { font-size: 14px; font-weight: 500; color: #1f2937; margin-bottom: 4px; }
.ans-desc { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.ans-evidence-tip { font-size: 12px; color: #f0a020; background: #fff7ed; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; }
.ans-row { display: flex; gap: 20px; }
.ans-form { }

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #f7f9f8;
  padding: 20px;
  border-radius: 10px;
}
.p-item { display: flex; padding: 6px 0; }
.p-l { color: #6b7280; width: 100px; flex-shrink: 0; }
.p-v { color: #1f2937; font-weight: 500; }

.progress-info { font-size: 13px; color: #6b7280; }
.mt-md { margin-top: 16px; }
.mb-md { margin-bottom: 16px; }
.mb-sm { margin-bottom: 8px; }
.gap-sm { gap: 8px; }
.flex { display: flex; }
.justify-end { justify-content: flex-end; }
.items-center { align-items: center; }
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.filters { gap: 12px; }
</style>
