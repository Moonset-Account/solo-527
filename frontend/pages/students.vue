<template>
  <div class="page-container">
    <n-card title="学生档案" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterClass" clearable :options="classOpts" placeholder="班级" style="width: 180px;" @update:search="onClassSearch" />
          <n-select v-model:value="filterMajor" clearable :options="majorOpts" placeholder="专业" style="width: 140px;" />
          <n-select v-model:value="filterStatus" clearable :options="statusOpts" placeholder="状态" style="width: 140px;" />
          <n-input v-model:value="keyword" clearable placeholder="姓名/学号/手机号" style="width: 200px;" />
          <n-button @click="reload"><template #icon><n-icon><SearchOutline /></n-icon></template>查询</n-button>
          <n-button type="primary" @click="openCreate"><template #icon><n-icon><AddOutline /></n-icon></template>新建学生</n-button>
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

  <n-modal v-model:show="detailVisible" preset="card" style="width: 680px;" :title="`${detail?.name || ''} - 学生详情`">
    <template v-if="detail">
      <n-space style="margin-bottom: 16px;">
        <n-avatar round :size="72" style="background: linear-gradient(135deg, #2080f0, #18a058);">
          <n-icon size="36"><PersonCircleOutline /></n-icon>
        </n-avatar>
        <div>
          <n-h3 style="margin: 0;">{{ detail.name }}</n-h3>
          <n-space>
            <n-tag>{{ detail.student_no }}</n-tag>
            <n-tag type="info">{{ majorLabel(detail.major) }}</n-tag>
            <n-tag :type="statusType(detail.status)" round>{{ statusLabel(detail.status) }}</n-tag>
          </n-space>
        </div>
      </n-space>
      <n-tabs type="line">
        <n-tab-pane name="basic" tab="基本信息">
          <n-descriptions :column="3" bordered size="small" label-placement="left">
            <n-descriptions-item label="姓名">{{ detail.name }}</n-descriptions-item>
            <n-descriptions-item label="性别">{{ detail.gender === 'male' ? '男' : '女' }}</n-descriptions-item>
            <n-descriptions-item label="生日">{{ detail.birthday || '-' }}</n-descriptions-item>
            <n-descriptions-item label="手机号">{{ detail.phone || '-' }}</n-descriptions-item>
            <n-descriptions-item label="所在学校">{{ detail.school || '-' }}</n-descriptions-item>
            <n-descriptions-item label="年级">{{ detail.grade || '-' }}</n-descriptions-item>
            <n-descriptions-item label="专业">{{ majorLabel(detail.major) }}</n-descriptions-item>
            <n-descriptions-item label="目标院校">{{ detail.target_school || '-' }}</n-descriptions-item>
            <n-descriptions-item label="入学日期">{{ detail.enroll_date || '-' }}</n-descriptions-item>
            <n-descriptions-item label="带班老师">{{ detail.teacher_name || '-' }}</n-descriptions-item>
            <n-descriptions-item label="校区">{{ detail.campus_name || '-' }}</n-descriptions-item>
            <n-descriptions-item label="状态">{{ statusLabel(detail.status) }}</n-descriptions-item>
          </n-descriptions>
          <n-divider>课时情况</n-divider>
          <n-grid :cols="3" :x-gap="12">
            <n-grid-item>
              <n-card><n-statistic label="总课时" :value="detail.total_hours" /></n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card><n-statistic label="已消耗" :value="detail.consumed_hours || 0"><template #suffix><n-text type="warning" depth="3">课时</n-text></template></n-statistic></n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card><n-statistic label="剩余课时" :value="detail.remaining_hours || 0"><template #suffix><n-text type="success" depth="3">课时</n-text></template></n-statistic></n-card>
            </n-grid-item>
          </n-grid>
          <n-progress :percentage="detail.total_hours ? ((detail.consumed_hours || 0) / detail.total_hours * 100) : 0" style="margin-top: 12px;" />
          <n-divider>就读班级</n-divider>
          <n-data-table :columns="classCols" :data="studentClasses" :bordered="false" size="small" :pagination="false" />
        </n-tab-pane>
        <n-tab-pane name="consume" tab="消课记录">
          <n-data-table :columns="consumeCols" :data="studentConsumptions" :bordered="false" size="small" />
        </n-tab-pane>
        <n-tab-pane name="remark" tab="备注信息">
          <div style="padding: 16px; background: #fafafa; border-radius: 8px; white-space: pre-wrap;">{{ detail.remark || '暂无备注' }}</div>
        </n-tab-pane>
      </n-tabs>
      <template #footer>
        <n-space justify="end">
          <n-button @click="detailVisible = false">关闭</n-button>
          <n-button type="primary" @click="editDetail(detail)">编辑档案</n-button>
        </n-space>
      </template>
    </template>
  </n-modal>

  <n-modal v-model:show="formVisible" preset="card" style="width: 560px;" :title="editData?.id ? '编辑学生' : '新建学生'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <n-form-item label="姓名" path="name"><n-input v-model:value="form.name" /></n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item><n-form-item label="性别"><n-radio-group v-model:value="form.gender"><n-radio value="male">男</n-radio><n-radio value="female">女</n-radio></n-radio-group></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="生日"><n-date-picker v-model:value="form.birthday" type="date" style="width: 100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="手机号"><n-input v-model:value="form.phone" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="专业"><n-select v-model:value="form.major" :options="majorOpts" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="在读学校"><n-input v-model:value="form.school" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="年级"><n-select v-model:value="form.grade" :options="gradeOpts" allow-create /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="目标院校"><n-input v-model:value="form.target_school" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="入学日期"><n-date-picker v-model:value="form.enroll_date" type="date" style="width: 100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="总课时" path="total_hours"><n-input-number v-model:value="form.total_hours" :min="0" style="width:100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="带班老师"><n-select v-model:value="form.teacher_id" :options="teacherOpts" filterable clearable /></n-form-item></n-grid-item>
      </n-grid>
      <n-form-item label="家庭住址"><n-input v-model:value="form.address" /></n-form-item>
      <n-form-item label="备注"><n-input v-model:value="form.remark" type="textarea" :rows="2" /></n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end"><n-button @click="formVisible = false">取消</n-button><n-button type="primary" :loading="submitting" @click="submitForm">确认</n-button></n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import { SearchOutline, AddOutline, PersonCircleOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NProgress, NTag, NSpace, NButton, NIcon } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('学生档案', route.path)
const message = useMessage()

const filterClass = ref<number | null>(null)
const filterMajor = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const classOpts = ref<any[]>([])
const teacherOpts = ref<any[]>([])

const majorOpts = [
  { label: '美术', value: 'fine_arts' },
  { label: '音乐', value: 'music' },
  { label: '舞蹈', value: 'dance' },
  { label: '编导播音', value: 'broadcast' },
  { label: '影视', value: 'film' },
  { label: '设计', value: 'design' },
  { label: '表演', value: 'performance' },
]
const gradeOpts = [
  { label: '高一', value: '高一' },
  { label: '高二', value: '高二' },
  { label: '高三', value: '高三' },
  { label: '复读', value: '复读' },
]
const statusOpts = [
  { label: '在读', value: 'active' },
  { label: '休学', value: 'suspended' },
  { label: '已结业', value: 'graduated' },
  { label: '已退学', value: 'withdrawn' },
]

function majorLabel(v: string) { return { fine_arts: '美术', music: '音乐', dance: '舞蹈', broadcast: '编导播音', film: '影视', design: '设计', performance: '表演' }[v] || v }
function statusType(v: string) { return { active: 'success', suspended: 'warning', graduated: 'info', withdrawn: 'error' }[v] || 'default' }
function statusLabel(v: string) { return { active: '在读', suspended: '休学', graduated: '已结业', withdrawn: '已退学' }[v] || v }

const cols: DataTableColumns = [
  { title: '学号', key: 'student_no', width: 130 },
  { title: '姓名', key: 'name', width: 90 },
  { title: '性别', key: 'gender', width: 60, render: (r: any) => r.gender === 'male' ? '男' : '女' },
  { title: '专业', key: 'major', width: 90, render: (r: any) => majorLabel(r.major) },
  { title: '年级', key: 'grade', width: 70 },
  { title: '目标院校', key: 'target_school', ellipsis: true },
  { title: '带班老师', key: 'teacher_name', width: 90 },
  { title: '总课时', key: 'total_hours', width: 70, align: 'center' },
  { title: '剩余', key: 'remaining_hours', width: 70, align: 'center' },
  { title: '课时进度', key: 'progress', width: 150, render: (r: any) => {
    const pct = r.total_hours ? ((r.consumed_hours || 0) / r.total_hours * 100) : 0
    return h(NProgress, { percentage: pct, type: 'line', height: 6, 'show-indicator': false, style: { width: '120px' } })
  }},
  { title: '状态', key: 'status', width: 80, render: (r: any) => h(NTag, { type: statusType(r.status), size: 'small', round: true }, { default: () => statusLabel(r.status) }) },
  { title: '手机号', key: 'phone', width: 120 },
  { title: '入学日期', key: 'enroll_date', width: 110 },
  { title: '操作', key: 'ops', width: 140, fixed: 'right', render: (r: any) => h(NSpace, null, { default: () => [
    h(NButton, { size: 'tiny', type: 'primary', onClick: () => openDetail(r) }, { default: () => '详情' }),
    h(NButton, { size: 'tiny', quaternary: true, onClick: () => editDetail(r) }, { default: () => '编辑' }),
  ]})},
]

const classCols: DataTableColumns = [
  { title: '班级名称', key: 'class_name' },
  { title: '专业', key: 'major' },
  { title: '报名日期', key: 'enroll_date' },
  { title: '分配课时', key: 'allocated_hours' },
  { title: '已用课时', key: 'used_hours' },
  { title: '剩余课时', key: 'remaining_hours' },
]

const consumeCols: DataTableColumns = [
  { title: '日期', key: 'consumption_date', width: 110 },
  { title: '消课编号', key: 'consumption_code', width: 150 },
  { title: '班级', key: 'class_name' },
  { title: '课时', key: 'hours_consumed', width: 60 },
  { title: '出勤', key: 'attendance', width: 70 },
  { title: '状态', key: 'status', width: 80 },
]

const detailVisible = ref(false)
const detail = ref<any>(null)
const studentClasses = ref<any[]>([])
const studentConsumptions = ref<any[]>([])

const formVisible = ref(false)
const editData = ref<any>(null)
const formRef = ref<FormInst>()
const submitting = ref(false)
const form = reactive<any>({
  name: '', gender: 'male', birthday: null, phone: '', school: '', grade: '高三',
  major: 'fine_arts', target_school: '', enroll_date: Date.now(),
  total_hours: 100, campus_id: 1, teacher_id: null, address: '', remark: '',
})
const rules: FormRules = {
  name: { required: true, message: '请输入姓名' },
  total_hours: { required: true, type: 'number', message: '请输入总课时' },
}

async function openDetail(r: any) {
  detail.value = r
  try {
    const classes: any = await apiGet(`/students/${r.id}/classes`)
    if (Array.isArray(classes)) {
      studentClasses.value = classes
    }
    const cons: any = await apiGet('/schedules/consumptions', { student_id: r.id, page_size: 100 })
    if (cons?.items) studentConsumptions.value = cons.items
  } catch (e) { console.warn(e) }
  detailVisible.value = true
}

function editDetail(r: any) {
  editData.value = r
  Object.assign(form, {
    ...r,
    birthday: r.birthday ? new Date(r.birthday).getTime() : null,
    enroll_date: r.enroll_date ? new Date(r.enroll_date).getTime() : Date.now(),
  })
  if (!form.campus_id) form.campus_id = userStore.selectedCampusId || 1
  formVisible.value = true
  detailVisible.value = false
}

function openCreate() {
  editData.value = null
  Object.assign(form, {
    name: '', gender: 'male', birthday: null, phone: '', school: '', grade: '高三',
    major: 'fine_arts', target_school: '', enroll_date: Date.now(),
    total_hours: 100, campus_id: userStore.selectedCampusId || 1, teacher_id: null, address: '', remark: '',
  })
  formVisible.value = true
}

async function submitForm() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (payload.birthday) payload.birthday = new Date(payload.birthday).toISOString().split('T')[0]
    if (payload.enroll_date) payload.enroll_date = new Date(payload.enroll_date).toISOString().split('T')[0]
    if (editData.value?.id) {
      await apiPut(`/students/${editData.value.id}`, payload)
      message.success('更新成功')
    } else {
      await apiPost('/students', payload)
      message.success('创建成功')
    }
    formVisible.value = false
    reload()
  } catch (e: any) { message.error(e?.data?.detail || '保存失败') }
  finally { submitting.value = false }
}

function onClassSearch() {}

async function loadOptions() {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) classOpts.value = classes.map(c => ({ label: c.name, value: c.id }))
    const teachers: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(teachers)) teacherOpts.value = teachers.map(t => ({ label: t.real_name, value: t.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      page, page_size: pageSize,
      campus_id: userStore.selectedCampusId,
      class_id: filterClass.value,
      major: filterMajor.value,
      status: filterStatus.value,
      keyword: keyword.value || undefined,
    }
    const res: any = await apiGet('/students', params)
    total.value = res?.total || 0
    list.value = res?.items || []
  } catch (e) { list.value = [] }
  finally { loading.value = false }
}

onMounted(() => {
  loadOptions()
  reload()
  const q = route.query
  if (q.class_id) filterClass.value = parseInt(q.class_id as string)
})
</script>
