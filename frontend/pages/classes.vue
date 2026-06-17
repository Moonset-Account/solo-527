<template>
  <div class="page-container">
    <n-card title="班级管理" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterMajor" clearable :options="majorOpts" placeholder="专业" style="width: 140px;" />
          <n-select v-model:value="filterStatus" clearable :options="statusOpts" placeholder="状态" style="width: 140px;" />
          <n-input v-model:value="keyword" clearable placeholder="搜索班级名称/编号" style="width: 200px;" />
          <n-button @click="reload"><template #icon><n-icon><SearchOutline /></n-icon></template>查询</n-button>
          <n-button type="primary" @click="openCreate"><template #icon><n-icon><AddOutline /></n-icon></template>新建班级</n-button>
        </n-space>
      </template>
      <n-grid :cols="3" responsive="screen" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="c in list" :key="c.id">
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" style="width: 100%;">
                <div>
                  <n-tag size="small" :type="majorType(c.major)" round>{{ majorLabel(c.major) }}</n-tag>
                  <n-text strong style="margin-left: 6px;">{{ c.name }}</n-text>
                </div>
                <n-tag size="small" :type="statusType(c.status)" round>{{ statusLabel(c.status) }}</n-tag>
              </n-space>
            </template>
            <n-descriptions :column="2" size="small" label-placement="left">
              <n-descriptions-item label="班级编号" :span="2">{{ c.class_code }}</n-descriptions-item>
              <n-descriptions-item label="班主任">{{ c.head_teacher_name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="校区">{{ c.campus_name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="人数">
                <n-text type="success">{{ c.current_students }}</n-text> / {{ c.max_students }}
              </n-descriptions-item>
              <n-descriptions-item label="满班率">
                <n-tag size="small" :type="c.fill_rate >= 90 ? 'success' : c.fill_rate >= 70 ? 'info' : c.fill_rate >= 50 ? 'warning' : 'error'" round>
                  {{ c.fill_rate?.toFixed(1) }}%
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="总课时">{{ c.total_hours || 0 }}</n-descriptions-item>
              <n-descriptions-item label="开课时间">{{ c.start_date?.slice(0, 10) || '-' }}</n-descriptions-item>
            </n-descriptions>
            <n-progress
              :percentage="c.fill_rate"
              type="line"
              :show-indicator="false"
              :color="c.fill_rate >= 90 ? '#18a058' : c.fill_rate >= 70 ? '#2080f0' : c.fill_rate >= 50 ? '#f0a020' : '#d03050'"
              style="margin: 12px 0;"
              :height="6"
            />
            <n-space justify="space-between" style="width: 100%;">
              <n-space>
                <n-button size="tiny" quaternary @click="goStudents(c)">学生名单</n-button>
                <n-button size="tiny" quaternary @click="goSchedule(c)">排课</n-button>
                <n-button size="tiny" quaternary @click="goFeedback(c)">作品反馈</n-button>
              </n-space>
              <n-button size="tiny" type="primary" quaternary @click="openEdit(c)">编辑</n-button>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>
      <div style="display: flex; justify-content: center; margin-top: 16px;">
        <n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="total" :page-sizes="[9, 18, 30]" />
      </div>
    </n-card>
  </div>

  <n-modal v-model:show="formVisible" preset="card" style="width: 560px;" :title="editData?.id ? '编辑班级' : '新建班级'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <n-form-item label="班级名称" path="name"><n-input v-model:value="form.name" /></n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item><n-form-item label="专业"><n-select v-model:value="form.major" :options="majorOpts" allow-create /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="班型"><n-select v-model:value="form.class_type" :options="classTypeOpts" allow-create /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="最大人数"><n-input-number v-model:value="form.max_students" :min="1" style="width:100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="当前人数"><n-input-number v-model:value="form.current_students" :min="0" style="width:100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="班主任"><n-select v-model:value="form.head_teacher_id" :options="teacherOpts" filterable clearable /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="总课时"><n-input-number v-model:value="form.total_hours" :min="0" style="width:100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="开课日期"><n-date-picker v-model:value="form.start_date" type="date" style="width:100%;" /></n-form-item></n-grid-item>
        <n-grid-item><n-form-item label="结课日期"><n-date-picker v-model:value="form.end_date" type="date" style="width:100%;" /></n-form-item></n-grid-item>
      </n-grid>
      <n-form-item label="状态"><n-select v-model:value="form.status" :options="statusOpts" /></n-form-item>
      <n-form-item label="班级描述"><n-input v-model:value="form.description" type="textarea" :rows="2" /></n-form-item>
      <n-form-item label="备注"><n-input v-model:value="form.remark" type="textarea" :rows="2" /></n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end"><n-button @click="formVisible = false">取消</n-button><n-button type="primary" :loading="submitting" @click="submitForm">确认</n-button></n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import { SearchOutline, AddOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { FormInst, FormRules } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('班级管理', route.path)
const message = useMessage()

const filterMajor = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(9)
const loading = ref(false)

const majorOpts = [
  { label: '美术', value: 'fine_arts' },
  { label: '音乐', value: 'music' },
  { label: '舞蹈', value: 'dance' },
  { label: '编导播音', value: 'broadcast' },
  { label: '影视', value: 'film' },
  { label: '设计', value: 'design' },
  { label: '表演', value: 'performance' },
]
const classTypeOpts = [
  { label: '长期集训', value: '长期集训' },
  { label: '基础强化', value: '基础强化' },
  { label: '精品小班', value: '精品小班' },
  { label: '寒暑假班', value: '寒暑假班' },
  { label: '考前冲刺', value: '考前冲刺' },
]
const statusOpts = [
  { label: '筹备中', value: 'preparing' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结课', value: 'completed' },
  { label: '已暂停', value: 'suspended' },
]
const teacherOpts = ref<any[]>([])

function majorType(v: string) { return { fine_arts: 'success', music: 'info', dance: 'warning', broadcast: 'error', film: 'info', design: 'success', performance: 'warning' }[v] || 'default' }
function majorLabel(v: string) { return { fine_arts: '美术', music: '音乐', dance: '舞蹈', broadcast: '编导播音', film: '影视', design: '设计', performance: '表演' }[v] || v }
function statusType(v: string) { return { preparing: 'default', ongoing: 'success', completed: 'info', suspended: 'warning' }[v] || 'default' }
function statusLabel(v: string) { return { preparing: '筹备中', ongoing: '进行中', completed: '已结课', suspended: '已暂停' }[v] || v }

const formVisible = ref(false)
const editData = ref<any>(null)
const formRef = ref<FormInst>()
const submitting = ref(false)
const form = reactive<any>({
  name: '', major: 'fine_arts', class_type: '长期集训', description: '',
  max_students: 25, current_students: 0, status: 'preparing',
  campus_id: 1, head_teacher_id: null, start_date: null, end_date: null,
  total_hours: 0, remark: '',
})
const rules: FormRules = {
  name: { required: true, message: '请输入班级名称' },
  max_students: { required: true, type: 'number', message: '请设置最大人数' },
}

function openCreate() { editData.value = null; Object.assign(form, { name: '', major: 'fine_arts', class_type: '长期集训', description: '', max_students: 25, current_students: 0, status: 'preparing', campus_id: userStore.selectedCampusId || 1, head_teacher_id: null, start_date: null, end_date: null, total_hours: 0, remark: '' }); formVisible.value = true }
function openEdit(d: any) {
  editData.value = d
  Object.assign(form, { ...d, start_date: d.start_date ? new Date(d.start_date).getTime() : null, end_date: d.end_date ? new Date(d.end_date).getTime() : null })
  formVisible.value = true
}

async function submitForm() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (payload.start_date) payload.start_date = new Date(payload.start_date).toISOString()
    if (payload.end_date) payload.end_date = new Date(payload.end_date).toISOString()
    if (!payload.campus_id) payload.campus_id = userStore.selectedCampusId || 1
    if (editData.value?.id) {
      await apiPut(`/classes/${editData.value.id}`, payload)
      message.success('更新成功')
    } else {
      await apiPost('/classes', payload)
      message.success('创建成功')
    }
    formVisible.value = false
    reload()
  } catch (e: any) { message.error(e?.data?.detail || '保存失败') }
  finally { submitting.value = false }
}

function goStudents(c: any) { navigateTo(`/students?class_id=${c.id}`) }
function goSchedule(c: any) { navigateTo(`/schedules?class_id=${c.id}`) }
function goFeedback(c: any) { navigateTo(`/feedbacks?class_id=${c.id}`) }

async function loadTeachers() {
  try {
    const d: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(d)) teacherOpts.value = d.map(t => ({ label: t.real_name, value: t.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize.value, campus_id: userStore.selectedCampusId, major: filterMajor.value, status: filterStatus.value }
    if (keyword.value) params.keyword = keyword.value
    const res: any = await apiGet('/classes', params)
    total.value = res?.total || 0
    list.value = res?.items || []
  } catch (e) { list.value = [] }
  finally { loading.value = false }
}

watch(page, reload)
watch(pageSize, reload)
onMounted(() => {
  loadTeachers()
  reload()
  const q = route.query
  if (q.class_id) {}
})

import { useMessage } from 'naive-ui'
</script>
