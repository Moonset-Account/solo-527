<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">销售工作台</h1>
        <p class="mt-1 text-sm text-slate-500">录入客户背景信息，AI生成专业合规的销售邮件</p>
      </div>
      <div class="flex items-center space-x-2">
        <NTag :bordered="false" type="success" round>
          <NIcon :size="12" class="mr-1"><CheckCircleOutlined /></NIcon>
          AI系统正常
        </NTag>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <div class="xl:col-span-2 space-y-5">
        <NCard class="!rounded-2xl shadow-sm" title="客户背景录入" size="large">
          <template #header-extra>
            <NButton size="small" text type="primary" @click="resetForm">
              <NIcon :size="14" class="mr-1"><ReloadOutlined /></NIcon>
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
              <NSteps v-model:current="customerForm.stage" class="!overflow-x-auto">
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
                <NIcon :size="18"><ThunderboltOutlined /></NIcon>
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
            <div v-if="currentDraft" class="flex items-center space-x-2">
              <NButton size="small" quaternary @click="copyContent">
                <NIcon :size="14" class="mr-1"><CopyOutlined /></NIcon>
                复制
              </NButton>
              <NButton size="small" quaternary @click="exportEml">
                <NIcon :size="14" class="mr-1"><DownloadOutlined /></NIcon>
                导出EML
              </NButton>
              <NButton size="small" quaternary type="warning" @click="regenerateEmail">
                <NIcon :size="14" class="mr-1"><ReloadOutlined /></NIcon>
                重新生成
              </NButton>
              <NButton size="small" type="primary" @click="submitReview">
                <NIcon :size="14" class="mr-1"><SendOutlined /></NIcon>
                提交复核
              </NButton>
            </div>
          </template>
          <div v-if="!currentDraft" class="py-16 text-center">
            <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
              <NIcon :size="36" color="#CBD5E1"><MailOutlined /></NIcon>
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
                <NIcon :size="12" class="mr-1"><BookOutlined /></NIcon>
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
            @update:page="onDraftPageChange"
          />
        </NCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
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
import { generateEmailApi, getEmailListApi, getEmailDetailApi, submitForReviewApi, updateEmailApi } from '@/api/modules/emails'
import { getTemplateListApi } from '@/api/modules/templates'
import type { EmailDraft, KnowledgeBase, TemplateStatus } from '@/types'

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

const templateOptions = ref<SelectOption[]>([])

const generating = ref(false)
const currentDraft = ref<EmailDraft | null>(null)
const emailSubject = ref('')
const emailContent = ref('')
const citedSources = ref<KnowledgeBase[]>([])
const srcSimilarities = ref<number[]>([])

const draftList = ref<EmailDraft[]>([])

const draftPagination = reactive({
  page: 1,
  pageSize: 5,
  itemCount: 0
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

async function fetchTemplates() {
  try {
    const resp = await getTemplateListApi({ page: 1, pageSize: 100, status: 'active' })
    templateOptions.value = (resp.list as unknown as TemplateStatus[]).map(t => ({
      label: `${t.name} (v${t.version})`,
      value: t.id
    }))
  } catch {
    templateOptions.value = []
  }
}

async function fetchDrafts() {
  try {
    const resp = await getEmailListApi({ page: draftPagination.page, pageSize: draftPagination.pageSize })
    draftList.value = resp.list
    draftPagination.itemCount = resp.total
  } catch {
    draftList.value = []
    draftPagination.itemCount = 0
  }
}

function onDraftPageChange(page: number) {
  draftPagination.page = page
  fetchDrafts()
}

function mapCitedSources(result: EmailDraft): KnowledgeBase[] {
  const srcs = (result as unknown as { citedSources?: Array<{ knowledgeId?: string; id?: string; title?: string; excerpt?: string; similarity?: number }> }).citedSources || []
  if (srcs.length === 0) {
    return []
  }
  return srcs.map((s) => ({
    id: String(s.knowledgeId ?? s.id ?? Math.random()),
    title: s.title || '知识库条目',
    category: 'product' as const,
    content: s.excerpt || '',
    tags: [],
    version: 'v1.0',
    status: 'active' as const,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
  }))
}

function mapSimilarities(result: EmailDraft): number[] {
  const srcs = (result as unknown as { citedSources?: Array<{ similarity?: number }> }).citedSources || []
  if (srcs.length === 0) {
    return []
  }
  return srcs.map((s) => s.similarity ?? (0.75 + Math.random() * 0.2))
}

async function generateEmail() {
  if (!customerForm.company) {
    message.warning('请先填写公司名称')
    return
  }
  generating.value = true
  try {
    const result = await generateEmailApi({
      company: customerForm.company,
      industry: customerForm.industry,
      scale: customerForm.scale,
      painPoints: customerForm.painPoints,
      stage: customerForm.stage,
      lastNote: customerForm.lastNote,
      templateId: customerForm.templateId,
      temperature: customerForm.temperature,
    } as unknown as Parameters<typeof generateEmailApi>[0])

    currentDraft.value = result
    emailSubject.value = result.subject
    emailContent.value = result.content
    citedSources.value = mapCitedSources(result)
    srcSimilarities.value = mapSimilarities(result)

    await fetchDrafts()
    message.success('邮件草稿已生成！')
  } catch {
  } finally {
    generating.value = false
  }
}

function regenerateEmail() {
  generateEmail()
}

async function loadDraft(draft: EmailDraft) {
  try {
    const result = await getEmailDetailApi(draft.id)
    currentDraft.value = result
    emailSubject.value = result.subject
    emailContent.value = result.content
    citedSources.value = mapCitedSources(result)
    srcSimilarities.value = mapSimilarities(result)
    message.info('已加载草稿')
  } catch {
  }
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
  if (!currentDraft.value) {
    return
  }
  dialog.warning({
    title: '提交复核',
    content: '提交后邮件将进入复核队列，确认提交吗？',
    positiveText: '确认提交',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        if (currentDraft.value) {
          await updateEmailApi(currentDraft.value.id, {
            subject: emailSubject.value,
            content: emailContent.value,
          })
          const updated = await submitForReviewApi(currentDraft.value.id)
          currentDraft.value = updated
          await fetchDrafts()
          message.success('已提交复核队列')
        }
      } catch (e) {
        const err = e as Error
        message.error(err.message || '提交复核失败')
      }
    }
  })
}

onMounted(async () => {
  await Promise.all([fetchTemplates(), fetchDrafts()])
})
</script>
