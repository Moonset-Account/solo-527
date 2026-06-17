<template>
  <div class="page-container">
    <n-card title="作品反馈" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterClass" clearable :options="classOpts" placeholder="班级" style="width: 160px;" />
          <n-select v-model:value="filterType" clearable :options="typeOpts" placeholder="类型" style="width: 120px;" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px;" />
          <n-button @click="reload"><template #icon><n-icon><SearchOutline /></n-icon></template>查询</n-button>
          <n-button type="success" @click="exportExcel"><template #icon><n-icon><DownloadOutline /></n-icon></template>导出Excel</n-button>
          <n-button type="primary" @click="openCreate"><template #icon><n-icon><AddOutline /></n-icon></template>新建反馈</n-button>
        </n-space>
      </template>
      <n-data-table
        :columns="cols"
        :data="list"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="p => { page = p; reload(); }"
      />
    </n-card>
  </div>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 640px;" :title="`反馈详情 - ${detail?.title || ''}`">
    <template v-if="detail">
      <n-descriptions :column="2" bordered size="small" label-placement="left">
        <n-descriptions-item label="学生">{{ detail.student_name }}</n-descriptions-item>
        <n-descriptions-item label="班级">{{ detail.class_name || '-' }}</n-descriptions-item>
        <n-descriptions-item label="类型"><n-tag size="small" round>{{ typeLabel(detail.type) }}</n-tag></n-descriptions-item>
        <n-descriptions-item label="教师">{{ detail.teacher_name }}</n-descriptions-item>
        <n-descriptions-item label="分数" v-if="detail.score">
          <n-statistic :value="detail.score" style="font-size: 16px;"><template #suffix>/ {{ detail.max_score }}分</template></n-statistic>
        </n-descriptions-item>
        <n-descriptions-item label="等级" v-if="detail.level"><n-tag type="success" round>{{ detail.level }}</n-tag></n-descriptions-item>
        <n-descriptions-item label="家长查看">
          <n-tag :type="detail.parent_seen ? 'success' : 'warning'" size="small">
            {{ detail.parent_seen ? '已查看 ' + (detail.parent_seen_at?.slice(5, 16) || '') : '未查看' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ detail.created_at?.slice(0, 16) }}</n-descriptions-item>
      </n-descriptions>
      <n-divider>反馈内容</n-divider>
      <n-alert type="info" style="margin-bottom: 12px;">
        <template #header>{{ detail.title }}</template>
        {{ detail.content }}
      </n-alert>
      <n-grid :cols="2" :x-gap="16" :y-gap="12">
        <n-grid-item>
          <n-card size="small" title="优点" :bordered="false"><n-text>{{ detail.strengths || '-' }}</n-text></n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card size="small" title="不足" :bordered="false"><n-text>{{ detail.weaknesses || '-' }}</n-text></n-card>
        </n-grid-item>
      </n-grid>
      <n-divider>改进建议</n-divider>
      <div style="padding: 12px; background: #f0f9eb; border-radius: 8px;">{{ detail.suggestions || '暂无建议' }}</div>
      <n-divider v-if="detail.work_images?.length">作品图片</n-divider>
      <n-grid v-if="detail.work_images?.length" :cols="3" :x-gap="8" :y-gap="8">
        <n-grid-item v-for="(img, idx) in detail.work_images" :key="idx">
          <n-image :src="img" object-fit="cover" style="border-radius: 8px; aspect-ratio: 1;" />
        </n-grid-item>
      </n-grid>
      <n-divider v-if="detail.parent_reply">家长回复</n-divider>
      <n-alert v-if="detail.parent_reply" type="success" style="margin-top: 12px;">
        <template #header>家长 - {{ detail.parent_reply_at?.slice(5, 16) }}</template>
        {{ detail.parent_reply }}
      </n-alert>
    </template>
  </n-modal>

  <n-modal v-model:show="formVisible" preset="card" style="width: 560px;" :title="'新建作品反馈'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="80">
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item><n-form-item label="学生" path="student_id"><n-select v-model:value="form.student_id" :options="studentOpts" filterable /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="班级"><n-select v-model:value="form.class_id" :options="classOpts" clearable /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="教师" path="teacher_id"><n-select v-model:value="form.teacher_id" :options="teacherOpts" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="类型"><n-select v-model:value="form.type" :options="typeOpts" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="分数"><n-input-number v-model:value="form.score" :min="0" :max="100" style="width: 100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="等级"><n-select v-model:value="form.level" :options="levelOpts" allow-create clearable /></n-form-item></n-grid-item>
      </n-grid>
      <n-form-item label="标题" path="title"><n-input v-model:value="form.title" /></n-form-item>
      <n-form-item label="内容" path="content"><n-input v-model:value="form.content" type="textarea" :rows="3" /></n-form-item>
      <n-form-item label="优点"><n-input v-model:value="form.strengths" type="textarea" :rows="2" /></n-form-item>
      <n-form-item label="不足"><n-input v-model:value="form.weaknesses" type="textarea" :rows="2" /></n-form-item>
      <n-form-item label="建议"><n-input v-model:value="form.suggestions" type="textarea" :rows="2" /></n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end"><n-button @click="formVisible = false">取消</n-button><n-button type="primary" :loading="submitting" @click="submitForm">提交</n-button></n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import { SearchOutline, AddOutline, DownloadOutline } from '@vicons/ionicons5'
import { apiGet, apiPost } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NTag, NButton } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('作品反馈', route.path)
const message = useMessage()

const filterClass = ref<number | null>(null)
const filterType = ref<string | null>(null)
const dateRange = ref<[number, number] | null>(null)
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const classOpts = ref<any[]>([])
const studentOpts = ref<any[]>([])
const teacherOpts = ref<any[]>([])

const typeOpts = [
  { label: '作品', value: 'work' },
  { label: '课堂', value: 'class' },
  { label: '作业', value: 'homework' },
  { label: '其他', value: 'other' },
]
const levelOpts = [
  { label: 'A+ 优秀', value: 'A+' },
  { label: 'A 良好', value: 'A' },
  { label: 'B+ 中上', value: 'B+' },
  { label: 'B 中等', value: 'B' },
  { label: 'C 及格', value: 'C' },
  { label: 'D 待努力', value: 'D' },
]

function typeLabel(v: string) { return { work: '作品', class: '课堂', homework: '作业', other: '其他' }[v] || v }

const pagination = computed(() => ({ page: page.value, pageSize: pageSize.value, itemCount: total.value, showSizePicker: true, pageSizes: [20, 40, 100] }))

const cols: DataTableColumns = [
  { title: '编号', key: 'feedback_code', width: 130 },
  { title: '类型', key: 'type', width: 70, render: (r: any) => typeLabel(r.type) },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '学生', key: 'student_name', width: 90 },
  { title: '班级', key: 'class_name', width: 160 },
  { title: '教师', key: 'teacher_name', width: 90 },
  { title: '分数', key: 'score', width: 80, render: (r: any) => r.score ? h('strong', { style: 'color:#18a058' }, `${r.score}/${r.max_score}`) : '-' },
  { title: '等级', key: 'level', width: 80, render: (r: any) => r.level ? h(NTag, { size: 'small', type: 'success', round: true }, { default: () => r.level }) : '-' },
  { title: '家长', key: 'parent_seen', width: 90, render: (r: any) => h(NTag, { type: r.parent_seen ? 'success' : 'warning', size: 'small' }, { default: () => r.parent_seen ? '已查看' : '未查看' }) },
  { title: '时间', key: 'created_at', width: 140, render: (r: any) => r.created_at?.slice(5, 16) },
  { title: '操作', key: 'ops', width: 100, fixed: 'right', render: (r: any) => h(NButton, { size: 'tiny', type: 'primary', onClick: () => openDetail(r) }, { default: () => '详情' }) },
]

const detailVisible = ref(false)
const detail = ref<any>(null)

const formVisible = ref(false)
const editData = ref<any>(null)
const formRef = ref<FormInst>()
const submitting = ref(false)
const form = reactive<any>({
  type: 'work', class_id: null, student_id: null, schedule_id: null, homework_id: null,
  teacher_id: null, title: '', content: '', score: 80, max_score: 100, level: '',
  strengths: '', weaknesses: '', suggestions: '', work_images: [], is_private: false,
})
const rules: FormRules = {
  student_id: { required: true, type: 'number', message: '请选择学生' },
  teacher_id: { required: true, type: 'number', message: '请选择教师' },
  title: { required: true, message: '请输入标题' },
  content: { required: true, message: '请输入内容' },
}

function openDetail(r: any) { detail.value = r; detailVisible.value = true }
function openCreate() {
  Object.assign(form, {
    type: 'work', class_id: null, student_id: null, schedule_id: null, homework_id: null,
    teacher_id: null, title: '', content: '', score: 80, max_score: 100, level: '',
    strengths: '', weaknesses: '', suggestions: '', work_images: [], is_private: false,
  })
  formVisible.value = true
}

async function submitForm() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    await apiPost('/feedbacks/works', form)
    message.success('反馈创建成功')
    formVisible.value = false
    reload()
  } catch (e: any) { message.error(e?.data?.detail || '保存失败') }
  finally { submitting.value = false }
}

async function exportExcel() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 60)
  let sd = dateRange.value ? new Date(dateRange.value[0]) : start
  let ed = dateRange.value ? new Date(dateRange.value[1]) : end
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const url = `${useRuntimeConfig().public.apiBase}/feedbacks/works/export/xlsx?start_date=${fmt(sd)}&end_date=${fmt(ed)}&class_id=${filterClass.value || ''}`
  window.open(url, '_blank')
}

async function loadOptions() {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) classOpts.value = classes.map(c => ({ label: c.name, value: c.id }))
    const teachers: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(teachers)) teacherOpts.value = teachers.map(t => ({ label: t.real_name, value: t.id }))
    const students: any = await apiGet('/common/students/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(students)) studentOpts.value = students.map(s => ({ label: `${s.name}(${s.student_no})`, value: s.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      page, page_size: pageSize, class_id: filterClass.value, type: filterType.value,
    }
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res: any = await apiGet('/feedbacks/works', params)
    total.value = res?.total || 0
    list.value = res?.items || []
  } catch (e) { list.value = [] }
  finally { loading.value = false }
}

watch(page, reload)
onMounted(() => {
  loadOptions()
  reload()
  if (route.query.class_id) filterClass.value = parseInt(route.query.class_id as string)
})
</script>
