<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">销售工作台</h1>
        <p class="mt-1 text-sm text-slate-500">录入客户背景信息，AI生成专业合规的销售邮件</p>
      </div>
      <div class="flex items-center space-x-2">
        <NTag :bordered="false" type="success" round>
          <NIcon size={12} class="mr-1"><CheckCircleOutlined /></NIcon>
          AI系统正常
        </NTag>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <div class="xl:col-span-2 space-y-5">
        <NCard class="!rounded-2xl shadow-sm" title="客户背景录入" size="large">
          <template #header-extra>
            <NButton size="small" text type="primary" @click="resetForm">
              <NIcon size={14} class="mr-1"><ReloadOutlined /></NIcon>
              重置
            </NButton>
          </template>
          <NForm :model="customerForm" label-placement="top" size="medium">
            <NFormItem label="公司名称" required>
              <NInput v-model:value="customerForm.company" placeholder="请输入客户公司名称" clearable />
            </NFormItem>
            <div class="grid grid-cols-2 gap-4">
              <NFormItem label="所属行业">
                <NSelect v-model:value="customerForm.industry" :options="industryOptions" placeholder="请选择行业" clearable />
              </NFormItem>
              <NFormItem label="公司规模">
                <NSelect v-model:value="customerForm.scale" :options="scaleOptions" placeholder="请选择规模" clearable />
              </NFormItem>
            </div>
            <NFormItem label="核心痛点 / 需求">
              <NInput
                v-model:value="customerForm.painPoints"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                placeholder="例如：企业现金流紧张、员工留存率低、希望增加被动收入等"
              />
            </NFormItem>
            <NFormItem label="沟通阶段">
              <NSteps v-model:current="customerForm.stage" :status="stepStatus" class="!overflow-x-auto">
                <NStep title="初步接触" description="首次建立联系" />
                <NStep title="需求跟进" description="深入了解需求" />
                <NStep title="商务谈判" description="方案报价阶段" />
                <NStep title="成交/维护" description="签约后维护" />
              </NSteps>
            </NFormItem>
            <NFormItem label="上次跟进记录">
              <NInput
                v-model:value="customerForm.lastNote"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 3 }"
                placeholder="简要记录上次沟通的要点..."
              />
            </NFormItem>
            <div class="grid grid-cols-2 gap-4">
              <NFormItem label="话术模板">
                <NSelect
                  v-model:value="customerForm.templateId"
                  :options="templateOptions"
                  placeholder="选择模板"
                  clearable
                  filterable
                />
              </NFormItem>
              <NFormItem label="生成温度">
                <div class="pt-2">
                  <NSlider v-model:value="customerForm.temperature" :min="0" :max="1" :step="0.05" :marks="tempMarks" />
                </div>
              </NFormItem>
            </div>
          </NForm>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <NButton
              type="primary"
              size="large"
              block
              :loading="generating"
              loading-text="AI正在生成中..."
              class="!h-12 !font-bold text-base shadow-xl"
              style="background: linear-gradient(135deg, #0B4F8C 0%, #1469B9 40%, #D4A853 130%); border: none;"
              @click="generateEmail"
            >
              <span class="flex items-center justify-center space-x-2">
                <NIcon size={18}><ThunderboltOutlined /></NIcon>
                <span>📧 生成邮件草稿</span>
              </span>
            </NButton>
          </div>
        </NCard>
      </div>

      <div class="xl:col-span-3 space-y-5">
        <NCard class="!rounded-2xl shadow-sm" size="large">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <h3 class="font-charter font-bold text-lg text-deep-blue-900">生成结果</h3>
                <StatusTag v-if="currentDraft" :status="currentDraft.status" type="email" size="small" class="ml-3" />
              </div>
              <span v-if="currentDraft" class="text-xs text-slate-400">
                生成于 {{ formatTime(currentDraft.createdAt) }}
              </span>
            </div>
          </template>
          <template #header-extra>
            <template v-if="currentDraft">
              <div class="flex items-center space-x-2">
                <NButton size="small" quaternary @click="copyContent">
                  <NIcon size={14} class="mr-1"><CopyOutlined /></NIcon>
                  复制
                </NButton>
                <NButton size="small" quaternary @click="exportEml">
                  <NIcon size={14} class="mr-1"><DownloadOutlined /></NIcon>
                  导出EML
                </NButton>
                <NButton size="small" quaternary type="warning" @click="regenerateEmail">
                  <NIcon size={14} class="mr-1"><ReloadOutlined /></NIcon>
                  重新生成
                </NButton>
                <NButton size="small" type="primary" @click="submitReview">
                  <NIcon size={14} class="mr-1"><SendOutlined /></NIcon>
                  提交复核
                </NButton>
              </div>
            </template>
          </template>
          <div v-if="!currentDraft" class="py-16 text-center">
            <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
              <NIcon size={36} color="#CBD5E1"><MailOutlined /></NIcon>
            </div>
            <p class="text-slate-400">填写左侧信息后点击生成按钮</p>
            <p class="text-xs text-slate-300 mt-1">AI 将根据知识库匹配最相关的内容</p>
          </div>
          <div v-else class="space-y-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1.5 font-medium">邮件主题</label>
              <NInput v-model:value="emailSubject" size="large" placeholder="邮件主题..." />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1.5 font-medium">邮件正文</label>
              <NInput
                v-model:value="emailContent"
                type="textarea"
                :autosize="{ minRows: 12, maxRows: 20 }"
                placeholder="邮件正文内容..."
              />
            </div>
            <div v-if="citedSources.length > 0">
              <label class="block text-xs text-slate-500 mb-2 font-medium flex items-center">
                <NIcon size={12} class="mr-1"><BookOutlined /></NIcon>
                引用来源（共 {{ citedSources.length }} 条）
              </label>
              <div class="flex flex-wrap gap-2">
                <CitedSourceBubble
                  v-for="(src, idx) in citedSources"
                  :key="src.id"
                  :source="src"
                  :similarity="srcSimilarities[idx]"
                />
              </div>
            </div>
          </div>
        </NCard>

        <NCard class="!rounded-2xl shadow-sm" title="最近草稿" size="large">
          <template #header-extra>
            <span class="text-xs text-slate-400">共 {{ draftList.length }} 条</span>
          </template>
          <NDataTable
            :columns="draftColumns"
            :data="draftList"
            :pagination="draftPagination"
            size="small"
            :row-props="(row) => ({
              class: currentDraft?.id === row.id ? '!bg-deep-blue-50/50 cursor-pointer' : 'cursor-pointer hover:!bg-slate-50'
            })"
            @update:page="(p) => draftPagination.page = p"
          />
        </NCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NButton, NIcon, NSelect, NSlider,
  NSteps, NStep, NDataTable, NTag, useMessage, useDialog, type DataTableColumns, type SelectOption
} from 'naive-ui'
import {
  MailOutlined, ThunderboltOutlined, ReloadOutlined, CopyOutlined, DownloadOutlined,
  SendOutlined, CheckCircleOutlined, BookOutlined, EyeOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import CitedSourceBubble from '@/components/business/CitedSourceBubble.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockEmails, mockTemplates, mockKnowledge } from '@/mock/data'
import type { EmailDraft, KnowledgeBase } from '@/types'

usePageTitle('销售工作台')

const message = useMessage()
const dialog = useDialog()

const customerForm = reactive({
  company: '',
  industry: null as string | null,
  scale: null as string | null,
  painPoints: '',
  stage: 0,
  lastNote: '',
  templateId: null as string | null,
  temperature: 0.7
})

const stepStatus = computed(() => (['process', 'wait', 'wait', 'wait'] as const))
const tempMarks: Record<number, string> = { 0: '严谨', 0.5: '平衡', 1: '创意' }

const industryOptions: SelectOption[] = [
  { label: '制造业', value: 'manufacturing' },
  { label: '零售批发', value: 'retail' },
  { label: '互联网科技', value: 'tech' },
  { label: '金融服务', value: 'finance' },
  { label: '医疗健康', value: 'healthcare' },
  { label: '教育', value: 'education' },
  { label: '房地产建筑', value: 'realestate' },
  { label: '其他', value: 'other' }
]

const scaleOptions: SelectOption[] = [
  { label: '初创 (1-50人)', value: 'startup' },
  { label: '小型 (51-200人)', value: 'small' },
  { label: '中型 (201-1000人)', value: 'medium' },
  { label: '大型 (1001-5000人)', value: 'large' },
  { label: '集团 (5000人以上)', value: 'enterprise' }
]

const templateOptions: SelectOption[] = computed(() =>
  mockTemplates.filter(t => t.status === 'active').map(t => ({ label: t.name, value: t.id }))
)

const generating = ref(false)
const currentDraft = ref<EmailDraft | null>(null)
const emailSubject = ref('')
const emailContent = ref('')
const citedSources = ref<KnowledgeBase[]>([])
const srcSimilarities = ref<number[]>([])

const allDrafts = computed(() => mockEmails.filter(e =>
  e.status !== 'sent' || Date.now() - new Date(e.createdAt).getTime() < 7 * 86400000
).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

const draftList = computed(() => allDrafts.value)

const draftPagination = reactive({
  page: 1,
  pageSize: 5,
  itemCount: allDrafts.value.length
})

const draftColumns: DataTableColumns<EmailDraft> = [
  {
    title: '主题',
    key: 'subject',
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'font-medium text-slate-700 cursor-pointer text-sm' }, [
      row.subject || '(无主题)'
    ])
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render: (row) => h(StatusTag, { status: row.status, type: 'email', size: 'small' })
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => h('span', { class: 'text-slate-500 text-xs' }, formatTime(row.createdAt))
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
    render: (row) => h(NButton, {
      size: 'small', text: true, type: 'primary', onClick: () => loadDraft(row)
    }, { default: () => [h(NIcon, { size: 14 }, { default: () => h(EyeOutlined) }), ' 查看'] })
  }
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function resetForm() {
  customerForm.company = ''
  customerForm.industry = null
  customerForm.scale = null
  customerForm.painPoints = ''
  customerForm.stage = 0
  customerForm.lastNote = ''
  customerForm.templateId = null
  customerForm.temperature = 0.7
}

async function generateEmail() {
  if (!customerForm.company) {
    message.warning('请先填写公司名称')
    return
  }
  generating.value = true
  await new Promise(r => setTimeout(r, 1800))
  const id = 'email_gen_' + Date.now()
  const industry = customerForm.industry ? customerForm.industry : '相关行业'
  const company = customerForm.company || '贵公司'
  const stageText = ['初步接触', '需求跟进', '商务谈判', '成交维护'][customerForm.stage]
  const template = mockTemplates.find(t => t.id === customerForm.templateId)

  currentDraft.value = {
    id,
    subject: `关于与${company}合作的${stageText}阶段沟通方案`,
    recipient: '',
    recipientName: '',
    content: '',
    status: 'ai_generated',
    priority: 'normal',
    category: template?.category || 'marketing',
    templateId: customerForm.templateId || undefined,
    riskLevel: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  emailSubject.value = currentDraft.value.subject
  emailContent.value = `尊敬的${company}负责人：

您好！

很高兴能与贵司建立联系。我们关注到贵司在${industry}领域的发展，希望能有机会为您提供专业的金融服务方案。

${customerForm.painPoints ? `针对贵司可能面临的${customerForm.painPoints.split('\n').map(x => x.trim()).filter(Boolean).join('、')}等问题，我们有成熟的解决方案。` : '针对贵司在行业中常见的痛点和挑战，我们准备了以下方案介绍。'}

【方案亮点】
• 智能现金管理工具，提升资金使用效率
• 定制化理财配置，匹配企业风险偏好
• 专属客户经理，7×24小时响应服务

${customerForm.lastNote ? `补充说明：${customerForm.lastNote}` : ''}

我们非常期待与贵司的进一步沟通，可根据您的实际需求进行定制化方案调整。

如有兴趣，请随时回复本邮件或直接联系我。

祝您工作顺利！

客户经理 李明
手机：138-xxxx-xxxx
邮箱：liming@company.com`

  citedSources.value = [mockKnowledge[0], mockKnowledge[2], mockKnowledge[1]].slice(0, 2 + Math.floor(Math.random() * 2))
  srcSimilarities.value = citedSources.value.map(() => 0.7 + Math.random() * 0.25)

  generating.value = false
  message.success('邮件草稿已生成！')
}

function regenerateEmail() {
  generateEmail()
}

function loadDraft(draft: EmailDraft) {
  currentDraft.value = draft
  emailSubject.value = draft.subject
  emailContent.value = draft.content
  const ids = draft.knowledgeIds || []
  citedSources.value = mockKnowledge.filter(k => ids.includes(k.id))
  srcSimilarities.value = citedSources.value.map(() => 0.75 + Math.random() * 0.2)
  message.info('已加载草稿')
}

async function copyContent() {
  try {
    await navigator.clipboard.writeText(emailContent.value)
    message.success('正文已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动选择复制')
  }
}

function exportEml() {
  const eml = `Subject: ${emailSubject.value}\nContent-Type: text/plain; charset=utf-8\n\n${emailContent.value}`
  const blob = new Blob([eml], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${emailSubject.value || 'email'}.eml`
  a.click()
  URL.revokeObjectURL(url)
  message.success('已导出EML文件')
}

function submitReview() {
  if (!emailSubject.value || !emailContent.value) {
    message.warning('请填写完整的邮件内容')
    return
  }
  dialog.warning({
    title: '提交复核',
    content: '提交后邮件将进入复核队列，确认提交吗？',
    positiveText: '确认提交',
    negativeText: '取消',
    onPositiveClick: () => {
      if (currentDraft.value) {
        currentDraft.value.status = 'pending_review'
      }
      message.success('已提交复核队列')
    }
  })
}
</script>
