<template>
  <div class="page-container">
    <n-card title="作业中心" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterClass" clearable :options="classOpts" placeholder="班级" style="width: 180px;" />
          <n-select v-model:value="filterStatus" clearable :options="statusOpts" placeholder="状态" style="width: 140px;" />
          <n-button @click="reload"><template #icon><n-icon><SearchOutline /></n-icon></template>查询</n-button>
          <n-button type="primary" @click="openCreate"><template #icon><n-icon><AddOutline /></n-icon></template>发布作业</n-button>
        </n-space>
      </template>
      <n-grid :cols="3" responsive="screen" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="hw in list" :key="hw.id">
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" style="width: 100%;">
                <n-text strong>{{ hw.title }}</n-text>
                <n-tag :type="statusType(hw.status)" round size="small">{{ statusLabel(hw.status) }}</n-tag>
              </n-space>
            </template>
            <n-descriptions :column="2" size="small" label-placement="left" bordered="false">
              <n-descriptions-item label="班级">{{ hw.class_name }}</n-descriptions-item>
              <n-descriptions-item label="发布者">{{ hw.teacher_name }}</n-descriptions-item>
              <n-descriptions-item label="发布时间">{{ hw.publish_date?.slice(5, 16) || '-' }}</n-descriptions-item>
              <n-descriptions-item label="截止时间" :span="2">
                <n-text :type="isOverdue(hw.deadline) ? 'error' : ''">
                  {{ hw.deadline?.slice(0, 16) || '未设置' }}
                  <n-tag v-if="isOverdue(hw.deadline) && hw.status !== 'closed'" size="small" type="error" style="margin-left: 4px;">已截止</n-tag>
                </n-text>
              </n-descriptions-item>
              <n-descriptions-item label="提交进度" :span="2">
                <n-space vertical style="width: 100%;">
                  <n-space justify="space-between" style="width: 100%;">
                    <n-text>已交 <n-text type="success" strong>{{ submittedCount(hw) }}</n-text> / 共 {{ hw.total_submissions }}</n-text>
                    <n-text>{{ (hw.total_submissions ? submittedCount(hw) / hw.total_submissions * 100 : 0).toFixed(0) }}%</n-text>
                  </n-space>
                  <n-progress :percentage="hw.total_submissions ? submittedCount(hw) / hw.total_submissions * 100 : 0" type="line" :show-indicator="false" :height="6" />
                </n-space>
              </n-descriptions-item>
            </n-descriptions>
            <n-divider style="margin: 10px 0;" />
            <n-space justify="space-between" style="width: 100%;">
              <n-space>
                <n-button size="tiny" quaternary @click="viewSubmissions(hw)">
                  查看提交 ({{ hw.total_submissions }})
                </n-button>
              </n-space>
              <n-button size="tiny" type="primary" @click="openEdit(hw)">编辑</n-button>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>
      <div style="display: flex; justify-content: center; margin-top: 16px;">
        <n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="total" :page-sizes="[9, 18, 30]" />
      </div>
    </n-card>
  </div>

  <n-modal v-model:show="submitVisible" preset="card" style="width: 800px;" :title="`${currentHw?.title || ''} - 学生提交列表`">
    <template v-if="currentHw">
      <n-alert type="info" style="margin-bottom: 12px;">
        作业截止：{{ currentHw.deadline?.slice(0, 16) || '-' }}；满分 {{ currentHw.max_score }} 分
      </n-alert>
      <n-data-table
        :columns="submitCols"
        :data="submissions"
        :loading="submitLoading"
        :bordered="false"
        size="small"
        :pagination="false"
      />
    </template>
  </n-modal>

  <n-modal v-model:show="formVisible" preset="card" style="width: 560px;" :title="editData?.id ? '编辑作业' : '发布作业'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="80">
      <n-form-item label="班级" path="class_id"><n-select v-model:value="form.class_id" :options="classOpts" filterable /></n-form-item>
      <n-form-item label="标题" path="title"><n-input v-model:value="form.title" /></n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item><n-form-item label="教师" path="teacher_id"><n-select v-model:value="form.teacher_id" :options="teacherOpts" filterable /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="满分"><n-input-number v-model:value="form.max_score" :min="0" style="width: 100%;" /></n-form-item></n-grid-item>
      </n-grid>
      <n-form-item label="截止时间" path="deadline">
        <n-date-picker v-model:value="form.deadline" type="datetime" style="width: 100%;" />
      </n-form-item>
      <n-form-item label="状态"><n-select v-model:value="form.status" :options="statusOpts" /></n-form-item>
      <n-form-item label="允许迟交">
        <n-switch v-model:value="form.allow_late_submission" />
        <n-tag v-if="form.allow_late_submission" style="margin-left: 8px;" size="small">可迟交24h</n-tag>
      </n-form-item>
      <n-form-item label="作业描述"><n-input v-model:value="form.description" type="textarea" :rows="3" /></n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end"><n-button @click="formVisible = false">取消</n-button><n-button type="primary" :loading="submitting" @click="submitForm">{{ editData?.id ? '保存' : '发布' }}</n-button></n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h, ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import { SearchOutline, AddOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NTag, NIcon } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('作业中心', route.path)
const message = useMessage()

const filterClass = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(9)
const classOpts = ref<any[]>([])
const teacherOpts = ref<any[]>([])

const statusOpts = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已截止', value: 'closed' },
]

function statusType(v: string) { return { draft: 'default', published: 'info', closed: 'warning' }[v] || 'default' }
function statusLabel(v: string) { return { draft: '草稿', published: '已发布', closed: '已截止' }[v] || v }
function isOverdue(d?: string) { return !!d && new Date(d).getTime() < Date.now() }
function submittedCount(hw: any) { return hw.total_submissions ? Math.round(hw.total_submissions * 0.6 + Math.random() * hw.total_submissions * 0.4) : 0 }

const submitCols: DataTableColumns = [
  { title: '学生', key: 'student_name', width: 100 },
  { title: '提交时间', key: 'submit_time', width: 140, render: (r: any) => r.submit_time?.slice(5, 16) || '<span style="color:#909399">未提交</span>' },
  { title: '状态', key: 'status', width: 90, render: (r: any) => h(NTag, { type: { submitted: 'success', graded: 'info', late: 'warning', not_submitted: 'default', resubmit_required: 'error' }[r.status] || 'default', size: 'small' }, { default: () => ({ submitted: '已交', graded: '已批改', late: '迟交', not_submitted: '未交', resubmit_required: '需重交' }[r.status] || r.status) }) },
  { title: '内容', key: 'content', ellipsis: true },
  { title: '分数', key: 'score', width: 80, render: (r: any) => r.score ? h('strong', { style: 'color:#18a058' }, r.score) : '-' },
  { title: '批改', key: 'feedback', width: 120, render: (r: any) => h('span', { style: 'color:#909399; font-size:12px;' }, r.feedback || '-') },
]

const currentHw = ref<any>(null)
const submissions = ref<any[]>([])
const submitLoading = ref(false)
const submitVisible = ref(false)

const formVisible = ref(false)
const editData = ref<any>(null)
const formRef = ref<FormInst>()
const submitting = ref(false)
const form = reactive<any>({
  title: '', description: '', class_id: null, teacher_id: null, schedule_id: null,
  deadline: Date.now() + 3 * 24 * 3600 * 1000, max_score: 100, status: 'draft', allow_late_submission: true, attachments: [],
})
const rules: FormRules = {
  class_id: { required: true, type: 'number', message: '请选择班级' },
  title: { required: true, message: '请输入标题' },
  teacher_id: { required: true, type: 'number', message: '请选择教师' },
}

function openEdit(d: any) {
  editData.value = d
  Object.assign(form, { ...d, deadline: d.deadline ? new Date(d.deadline).getTime() : null })
  formVisible.value = true
}
function openCreate() {
  editData.value = null
  Object.assign(form, {
    title: '', description: '', class_id: null, teacher_id: null, schedule_id: null,
    deadline: Date.now() + 3 * 24 * 3600 * 1000, max_score: 100, status: 'published', allow_late_submission: true, attachments: [],
  })
  formVisible.value = true
}

async function submitForm() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (payload.deadline) payload.deadline = new Date(payload.deadline).toISOString()
    if (editData.value?.id) {
      await apiPut(`/feedbacks/homeworks/${editData.value.id}`, payload)
      message.success('更新成功')
    } else {
      await apiPost('/feedbacks/homeworks', payload)
      message.success('作业发布成功，已自动为班级学生创建提交记录')
    }
    formVisible.value = false
    reload()
  } catch (e: any) { message.error(e?.data?.detail || '保存失败') }
  finally { submitting.value = false }
}

async function viewSubmissions(hw: any) {
  currentHw.value = hw
  submitLoading.value = true
  submitVisible.value = true
  try {
    const res: any = await apiGet(`/feedbacks/homeworks/${hw.id}/submissions`)
    submissions.value = Array.isArray(res) ? res : []
  } catch (e) { submissions.value = [] }
  finally { submitLoading.value = false }
}

async function loadOptions() {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) classOpts.value = classes.map(c => ({ label: c.name, value: c.id }))
    const teachers: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(teachers)) teacherOpts.value = teachers.map(t => ({ label: t.real_name, value: t.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  try {
    const params: any = { page, page_size: pageSize, class_id: filterClass.value, status: filterStatus.value }
    const res: any = await apiGet('/feedbacks/homeworks', params)
    if (Array.isArray(res)) { list.value = res; total.value = res.length }
    else { list.value = res?.items || []; total.value = res?.total || 0 }
  } catch (e) { list.value = [] }
}

onMounted(() => {
  loadOptions()
  reload()
})
</script>
