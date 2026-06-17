<template>
  <div class="page-container">
    <n-card title="题库版本管理" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterMajor" clearable placeholder="专业" style="width: 140px;" :options="majorOpts" />
          <n-select v-model:value="filterStatus" clearable placeholder="状态" style="width: 130px;" :options="statusOpts" />
          <n-input v-model:value="keyword" clearable placeholder="版本号/名称" style="width: 180px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="openCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新建版本
          </n-button>
        </n-space>
      </template>
      <n-data-table
        :columns="cols"
        :data="list"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        size="medium"
        @update:page="p => { page = p; reload(); }"
        @update:page-size="s => { pageSize = s; reload(); }"
      />
    </n-card>
  </div>

  <n-modal v-model:show="formVisible" preset="card" style="width: 600px;" :title="editData?.id ? '编辑题库版本' : '新建题库版本'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="版本号" path="version_code">
            <n-input v-model:value="form.version_code" placeholder="如：V2025.01" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="版本名称" path="version_name">
            <n-input v-model:value="form.version_name" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="适用专业" path="major">
            <n-select v-model:value="form.major" :options="majorOpts" clearable />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="科目" path="subject">
            <n-select v-model:value="form.subject" :options="subjectOpts" clearable />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="题目总数" path="total_questions">
            <n-input-number v-model:value="form.total_questions" :min="0" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="总分" path="total_score">
            <n-input-number v-model:value="form.total_score" :min="0" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="考试时长" path="duration_minutes">
            <n-input-number v-model:value="form.duration_minutes" :min="0" style="width: 100%;">
              <template #addon>分钟</template>
            </n-input-number>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="及格分数" path="passing_score">
            <n-input-number v-model:value="form.passing_score" :min="0" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="标签">
            <n-tag-input v-model:value="form.tags" type="success" round closable />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-form-item label="版本描述" path="description">
            <n-input v-model:value="form.description" type="textarea" :rows="3" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="文件上传">
            <n-upload
              v-model:file-list="uploadedFiles"
              :max="1"
              accept=".xlsx,.xls,.doc,.docx,.pdf"
              :custom-request="customUpload"
              :show-file-list="true"
            >
              <n-button>
                <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
                上传题库文件
              </n-button>
            </n-upload>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="状态" path="status">
            <n-select v-model:value="form.status" :options="statusOpts" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="formVisible = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="submitForm">提交</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 640px;" :title="`题库详情 - ${detailData?.version_name || ''}`">
    <template v-if="detailData">
      <n-descriptions :column="2" bordered label-placement="left" size="small">
        <n-descriptions-item label="版本号">{{ detailData.version_code }}</n-descriptions-item>
        <n-descriptions-item label="版本名称">{{ detailData.version_name }}</n-descriptions-item>
        <n-descriptions-item label="适用专业">{{ majorLabel(detailData.major) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="科目">{{ subjectLabel(detailData.subject) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="题目总数">{{ detailData.total_questions }} 题</n-descriptions-item>
        <n-descriptions-item label="总分">{{ detailData.total_score }} 分</n-descriptions-item>
        <n-descriptions-item label="考试时长">{{ detailData.duration_minutes }} 分钟</n-descriptions-item>
        <n-descriptions-item label="及格分数">{{ detailData.passing_score }} 分</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType(detailData.status)" size="small">{{ statusLabel(detailData.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="发布时间">{{ detailData.published_at?.slice(0, 16) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="创建时间" :span="2">{{ detailData.created_at?.slice(0, 19) }}</n-descriptions-item>
        <n-descriptions-item label="标签" :span="2">
          <n-space v-if="detailData.tags?.length" wrap>
            <n-tag v-for="t in detailData.tags" :key="t" size="small" round type="info">{{ t }}</n-tag>
          </n-space>
          <span v-else>-</span>
        </n-descriptions-item>
        <n-descriptions-item label="版本描述" :span="2">{{ detailData.description || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-tabs type="line" animated style="margin-top: 20px;">
        <n-tab-pane name="history" tab="修改历史">
          <div v-if="!historyRecords.length" style="padding: 24px; text-align: center;">
            <n-empty description="暂无修改记录" />
          </div>
          <n-timeline v-else>
            <n-timeline-item
              v-for="h in historyRecords"
              :key="h.id"
              type="info"
              :title="h.operator_name + ' - ' + h.action"
              :time="h.created_at?.slice(0, 16)"
            >
              {{ h.change_summary }}
            </n-timeline-item>
          </n-timeline>
        </n-tab-pane>
      </n-tabs>
    </template>
    <template #footer>
      <n-space justify="end">
        <n-button @click="detailVisible = false">关闭</n-button>
        <n-button type="primary" @click="openEdit(detailData)">编辑</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, AddOutline, EyeOutline, CreateOutline,
  TrashOutline, CloudUploadOutline
} from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut, apiDelete } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules, UploadFile, UploadCustomRequestOptions } from 'naive-ui'
import { useMessage, useDialog, NTag, NSpace, NButton, NEmpty, NTimeline, NTimelineItem } from 'naive-ui'
import type { QuestionBank, HistoryRecord } from '~/types'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('题库版本', route.path)
const message = useMessage()
const dialog = useDialog()

const filterMajor = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const keyword = ref('')
const list = ref<QuestionBank[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const majorOpts = [
  { label: '美术', value: 'fine_art' },
  { label: '音乐', value: 'music' },
  { label: '舞蹈', value: 'dance' },
  { label: '播音主持', value: 'broadcast' },
  { label: '表演', value: 'acting' },
  { label: '编导', value: 'directing' },
  { label: '摄影', value: 'photography' },
]
const subjectOpts = [
  { label: '素描', value: 'sketch' },
  { label: '色彩', value: 'color' },
  { label: '速写', value: 'quick_sketch' },
  { label: '声乐', value: 'vocal' },
  { label: '乐理', value: 'theory' },
  { label: '形体', value: 'body' },
  { label: '台词', value: 'lines' },
  { label: '编导基础', value: 'direct_basic' },
]
const statusOpts = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
]

function majorLabel(v: string) { return majorOpts.find(o => o.value === v)?.label || v }
function subjectLabel(v: string) { return subjectOpts.find(o => o.value === v)?.label || v }
function statusLabel(v: string) { return statusOpts.find(o => o.value === v)?.label || v }
function statusType(v: string) { return { draft: 'warning', published: 'success', archived: 'default' }[v] || 'default' }

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 40, 100]
}))

const cols: DataTableColumns = [
  { title: '版本号', key: 'version_code', width: 120 },
  { title: '版本名称', key: 'version_name', width: 160 },
  { title: '专业', key: 'major', width: 90, render: (r: any) => majorLabel(r.major) || '-' },
  { title: '科目', key: 'subject', width: 90, render: (r: any) => subjectLabel(r.subject) || '-' },
  { title: '题数', key: 'total_questions', width: 80, align: 'right' },
  { title: '总分', key: 'total_score', width: 80, align: 'right' },
  { title: '时长(分)', key: 'duration_minutes', width: 90, align: 'right' },
  { title: '及格分', key: 'passing_score', width: 90, align: 'right' },
  { title: '状态', key: 'status', width: 90, render: (r: any) => h(NTag, { type: statusType(r.status), size: 'small' }, { default: () => statusLabel(r.status) }) },
  { title: '创建时间', key: 'created_at', width: 150, render: (r: any) => r.created_at?.slice(0, 16) },
  {
    title: '操作', key: 'ops', width: 180, fixed: 'right', render: (r: any) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => viewDetail(r) }, {
          default: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        }),
        h(NButton, { size: 'tiny', type: 'default', quaternary: true, onClick: () => openEdit(r) }, {
          default: () => h(NIcon, null, { default: () => h(CreateOutline) }),
        }),
        h(NButton, { size: 'tiny', type: 'error', quaternary: true, onClick: () => onDelete(r) }, {
          default: () => h(NIcon, null, { default: () => h(TrashOutline) }),
        }),
      ]
    })
  },
]

async function reload() {
  loading.value = true
  try {
    const res = await apiGet<any>('/questions/', {
      major: filterMajor.value, status: filterStatus.value,
      keyword: keyword.value, page: page.value, page_size: pageSize.value
    })
    list.value = res?.items || res?.data?.items || []
    total.value = res?.total || res?.data?.total || 0
  } finally { loading.value = false }
}

const formVisible = ref(false)
const formRef = ref<FormInst | null>(null)
const editData = ref<QuestionBank | null>(null)
const submitting = ref(false)
const uploadedFiles = ref<UploadFile[]>([])
const form = reactive<Partial<QuestionBank>>({
  version_code: '', version_name: '', major: '', subject: '',
  description: '', status: 'draft', total_questions: 0,
  total_score: 100, duration_minutes: 120, passing_score: 60, tags: []
})

const rules: FormRules = {
  version_code: { required: true, message: '请输入版本号', trigger: 'blur' },
  version_name: { required: true, message: '请输入版本名称', trigger: 'blur' },
}

function resetForm() {
  Object.assign(form, {
    version_code: '', version_name: '', major: '', subject: '',
    description: '', status: 'draft', total_questions: 0,
    total_score: 100, duration_minutes: 120, passing_score: 60, tags: [], file_path: ''
  })
  uploadedFiles.value = []
}

function openCreate() { editData.value = null; resetForm(); formVisible.value = true }

function openEdit(r: QuestionBank) {
  editData.value = r
  Object.assign(form, r)
  form.tags = r.tags ? [...r.tags] : []
  formVisible.value = true
}

function customUpload({ file, onFinish }: UploadCustomRequestOptions) {
  message.info(`文件 ${file.name} 上传成功（模拟）`)
  form.file_path = `/uploads/demo/${file.name}`
  onFinish()
}

async function submitForm() {
  try {
    await formRef.value?.validate()
  } catch { return }
  submitting.value = true
  try {
    if (editData.value?.id) {
      await apiPut(`/questions/${editData.value.id}`, form)
      message.success('更新成功')
    } else {
      await apiPost('/questions/', form)
      message.success('创建成功')
    }
    formVisible.value = false
    reload()
  } finally { submitting.value = false }
}

function onDelete(r: QuestionBank) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除题库版本「${r.version_name}」吗？`,
    positiveText: '删除', negativeText: '取消',
    onPositiveClick: async () => {
      await apiDelete(`/questions/${r.id}`)
      message.success('已删除')
      reload()
    }
  })
}

const detailVisible = ref(false)
const detailData = ref<QuestionBank | null>(null)
const historyRecords = ref<HistoryRecord[]>([])

async function viewDetail(r: QuestionBank) {
  detailData.value = r
  detailVisible.value = true
  try {
    const res = await apiGet<any>(`/common/history`, { entity_type: 'question_bank', entity_id: r.id })
    historyRecords.value = res?.items || res?.data?.items || res || []
  } catch { historyRecords.value = [] }
}

onMounted(reload)
</script>
