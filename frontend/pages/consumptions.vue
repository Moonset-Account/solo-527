<template>
  <div class="page-container">
    <n-card title="消课记录" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            clearable
            style="width: 260px;"
          />
          <n-select v-model:value="filterClass" clearable placeholder="班级" style="width: 160px;" :options="classOpts" />
          <n-select v-model:value="filterStudent" clearable placeholder="学生" filterable style="width: 160px;" :options="studentOpts" @update:search="onStudentSearch" />
          <n-select v-model:value="filterStatus" clearable placeholder="状态" style="width: 120px;" :options="statusOpts" />
          <n-select v-model:value="filterAttendance" clearable placeholder="出勤" style="width: 120px;" :options="attendanceOpts" />
          <n-input v-model:value="keyword" clearable placeholder="编号/备注" style="width: 160px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="success" @click="exportExcel">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            导出Excel
          </n-button>
          <n-button type="primary" @click="goCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新建消课
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
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </n-card>
  </div>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 720px;" :title="`消课详情 - ${detailData?.consumption_code || ''}`">
    <template v-if="detailData">
      <n-descriptions :column="3" bordered size="small" label-placement="left">
        <n-descriptions-item label="消课编号">{{ detailData.consumption_code }}</n-descriptions-item>
        <n-descriptions-item label="日期">{{ detailData.consumption_date }}</n-descriptions-item>
        <n-descriptions-item label="课时">{{ detailData.hours_consumed }}</n-descriptions-item>
        <n-descriptions-item label="学生">{{ detailData.student_name }} ({{ detailData.student_no }})</n-descriptions-item>
        <n-descriptions-item label="班级">{{ detailData.class_name }}</n-descriptions-item>
        <n-descriptions-item label="关联排课">{{ detailData.schedule_code }}</n-descriptions-item>
        <n-descriptions-item label="出勤">
          <n-tag :type="attendanceType(detailData.attendance)">{{ attendanceLabel(detailData.attendance) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType(detailData.status)">{{ statusLabel(detailData.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="家长确认">
          <n-tag v-if="detailData.parent_verified" type="success">已确认 {{ detailData.parent_verified_at?.slice(0, 16) }}</n-tag>
          <n-tag v-else type="warning">待确认</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="备注" :span="3">{{ detailData.remark || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-tabs type="line" animated style="margin-top: 20px;">
        <n-tab-pane name="attach" tab="附件 ({{ detailData.attachments?.length || 0 }})">
          <div v-if="!detailData.attachments?.length" style="padding: 24px; text-align: center;">
            <n-empty description="暂无附件" />
          </div>
          <n-list v-else bordered>
            <n-list-item v-for="a in detailData.attachments" :key="a.id">
              <template #icon><n-icon size="18"><AttachOutline /></n-icon></template>
              <a :href="uploadBase + a.file_path" target="_blank" style="color: #2080f0;">
                {{ a.original_name || a.file_name }}
              </a>
              <template #suffix>{{ (a.file_size / 1024).toFixed(1) }} KB</template>
            </n-list-item>
          </n-list>
        </n-tab-pane>
        <n-tab-pane name="remark" tab="备注记录">
          <div v-if="!detailData.remarks?.length" style="padding: 24px; text-align: center;">
            <n-empty description="暂无备注" />
          </div>
          <n-list v-else bordered>
            <n-list-item v-for="r in detailData.remarks" :key="r.id">
              <template #header>
                <n-space justify="space-between" style="width: 100%;">
                  <n-text strong>{{ r.created_by_name }}</n-text>
                  <n-text depth="3" style="font-size: 12px;">{{ r.created_at?.slice(0, 16) }}</n-text>
                </n-space>
              </template>
              {{ r.content }}
            </n-list-item>
          </n-list>
        </n-tab-pane>
        <n-tab-pane name="history" tab="修改历史 ({{ detailData.history_records?.length || 0 }})">
          <div v-if="!detailData.history_records?.length" style="padding: 24px; text-align: center;">
            <n-empty description="暂无修改记录" />
          </div>
          <n-timeline v-else>
            <n-timeline-item
              v-for="h in detailData.history_records"
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
      <template #footer>
        <n-space justify="end">
          <n-button @click="detailVisible = false">关闭</n-button>
          <n-button v-if="detailData.status !== 'consumed'" type="primary" @click="confirmConsumption(detailData)">
            确认消课
          </n-button>
        </n-space>
      </template>
    </template>
  </n-modal>

  <n-modal v-model:show="createVisible" preset="card" style="width: 560px;" title="新建消课记录">
    <n-form ref="createFormRef" :model="createForm" :rules="createRules" label-placement="left" label-width="90">
      <n-form-item label="关联排课" path="schedule_id">
        <n-select v-model:value="createForm.schedule_id" :options="scheduleOpts" filterable placeholder="选择要消课的排课" @update:value="onScheduleChange" />
      </n-form-item>
      <n-form-item label="学生" path="student_id">
        <n-select v-model:value="createForm.student_id" :options="studentOpts" filterable placeholder="选择学生" @update:search="onStudentSearch" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="消课日期" path="consumption_date">
            <n-date-picker v-model:value="createForm.consumption_date" type="date" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="消课时长" path="hours_consumed">
            <n-input-number v-model:value="createForm.hours_consumed" :min="1" :max="8" style="width: 100%;">
              <template #addon>课时</template>
            </n-input-number>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="出勤状态" path="attendance">
            <n-select v-model:value="createForm.attendance" :options="attendanceOpts" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="状态" path="status">
            <n-select v-model:value="createForm.status" :options="statusOpts" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="备注">
        <n-input v-model:value="createForm.remark" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="createVisible = false">取消</n-button>
        <n-button type="primary" :loading="createSubmitting" @click="submitCreate">确认</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import type { ConsumptionItem, ConsumptionDetail } from '~/types'
import { SearchOutline, DownloadOutline, AddOutline, AttachOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const config = useRuntimeConfig()
const uploadBase = config.public.uploadBase

appStore.setPage('消课记录', route.path)

const message = useMessage()
const loading = ref(false)
const dateRange = ref<[number, number] | null>(null)
const filterClass = ref<number | null>(null)
const filterStudent = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const filterAttendance = ref<string | null>(null)
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const classOpts = ref<any[]>([])
const studentOpts = ref<any[]>([])
const scheduleOpts = ref<any[]>([])
const statusOpts = [
  { label: '待确认', value: 'pending' },
  { label: '已消课', value: 'consumed' },
  { label: '已退费', value: 'refunded' },
  { label: '已取消', value: 'cancelled' },
]
const attendanceOpts = [
  { label: '出勤', value: 'present' },
  { label: '缺勤', value: 'absent' },
  { label: '请假', value: 'leave' },
  { label: '迟到', value: 'late' },
  { label: '早退', value: 'leave_early' },
]

const detailVisible = ref(false)
const detailData = ref<ConsumptionDetail | null>(null)

const createVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref<FormInst>()
const createForm = reactive<any>({
  schedule_id: null,
  student_id: null,
  consumption_date: Date.now(),
  hours_consumed: 2,
  attendance: 'present',
  status: 'consumed',
  remark: '',
})
const createRules: FormRules = {
  schedule_id: { required: true, message: '请选择排课', type: 'number', trigger: 'change' },
  student_id: { required: true, message: '请选择学生', type: 'number', trigger: 'change' },
}

watch(() => route.query.schedule_id, (v) => {
  if (v) {
    createForm.schedule_id = parseInt(v as string)
    createVisible.value = true
  }
}, { immediate: true })

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [15, 30, 50, 100],
}))

function onPageChange(p: number) { page.value = p; reload() }
function onPageSizeChange(s: number) { pageSize.value = s; reload() }

function attendanceType(v: string) { return { present: 'success', absent: 'error', leave: 'warning', late: 'warning', leave_early: 'warning' }[v] || 'default' }
function attendanceLabel(v: string) { return { present: '出勤', absent: '缺勤', leave: '请假', late: '迟到', leave_early: '早退' }[v] || v }
function statusType(v: string) { return { pending: 'warning', consumed: 'success', refunded: 'info', cancelled: 'default' }[v] || 'default' }
function statusLabel(v: string) { return { pending: '待确认', consumed: '已消课', refunded: '已退费', cancelled: '已取消' }[v] || v }

const cols: DataTableColumns = [
  { title: '消课编号', key: 'consumption_code', width: 150, ellipsis: true, fixed: 'left' },
  { title: '日期', key: 'consumption_date', width: 110 },
  { title: '学生', key: 'student_name', width: 100 },
  { title: '班级', key: 'class_name', width: 160 },
  { title: '课时', key: 'hours_consumed', width: 70, align: 'center' },
  { title: '出勤', key: 'attendance', width: 80, render: (r: any) => h('n-tag', { type: attendanceType(r.attendance), size: 'small', round: true }, { default: () => attendanceLabel(r.attendance) }) },
  { title: '状态', key: 'status', width: 80, render: (r: any) => h('n-tag', { type: statusType(r.status), size: 'small', round: true }, { default: () => statusLabel(r.status) }) },
  { title: '关联排课', key: 'schedule_code', width: 140, ellipsis: true },
  { title: '备注', key: 'remark', ellipsis: true, render: (r: any) => r.remark || '<span style="color:#909399;">-</span>' },
  { title: '家长确认', key: 'parent_verified', width: 80, render: (r: any) => r.parent_verified ? h('n-tag', { type: 'success', size: 'small' }, { default: () => '已确认' }) : h('n-tag', { type: 'warning', size: 'small' }, { default: () => '待确认' }) },
  { title: '创建时间', key: 'created_at', width: 140, render: (r: any) => r.created_at?.slice(0, 16) },
  {
    title: '操作', key: 'ops', width: 140, fixed: 'right', render: (r: any) => h('n-space', null, {
      default: () => [
        h('n-button', { size: 'tiny', type: 'primary', onClick: () => openDetail(r) }, { default: () => '详情' }),
        h('n-button', { size: 'tiny', quaternary: true, onClick: () => confirmConsumption(r) }, { default: () => '确认' }),
      ],
    }),
  },
]

async function openDetail(r: any) {
  try {
    const d: any = await apiGet(`/schedules/consumptions/${r.id}`)
    if (d) {
      detailData.value = d
      detailVisible.value = true
    }
  } catch (e) {
    console.warn(e)
  }
}

async function confirmConsumption(r: any) {
  try {
    await apiPut(`/schedules/consumptions/${r.id}`, { status: 'consumed' })
    message.success('已确认消课')
    reload()
    detailVisible.value = false
  } catch (e: any) {
    message.error(e?.data?.detail || '操作失败')
  }
}

function goCreate() { createVisible.value = true }

function onScheduleChange(sid: number) {
  if (!sid) return
  onStudentSearch('', sid)
}

async function onStudentSearch(q: string, sid?: number) {
  try {
    const scheduleId = sid || createForm.schedule_id
    const params: any = { keyword: q, campus_id: userStore.selectedCampusId }
    // load students via API
    const studs: any = await apiGet('/common/students/simple', params)
    if (Array.isArray(studs)) studentOpts.value = studs.map(s => ({ label: `${s.name}(${s.student_no})`, value: s.id }))
  } catch (e) { console.warn(e) }
}

async function submitCreate() {
  try { await createFormRef.value?.validate() } catch { return }
  createSubmitting.value = true
  try {
    const payload = { ...createForm }
    if (typeof payload.consumption_date === 'number') payload.consumption_date = new Date(payload.consumption_date).toISOString().split('T')[0]
    await apiPost('/schedules/consumptions', payload)
    message.success('消课创建成功')
    createVisible.value = false
    reload()
  } catch (e: any) {
    message.error(e?.data?.detail || e?.message || '创建失败')
  } finally { createSubmitting.value = false }
}

async function exportExcel() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  let sd = dateRange.value ? new Date(dateRange.value[0]) : start
  let ed = dateRange.value ? new Date(dateRange.value[1]) : end
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const params = new URLSearchParams({
    start_date: fmt(sd), end_date: fmt(ed),
    campus_id: String(userStore.selectedCampusId || ''),
    class_id: String(filterClass.value || ''),
  }).toString()
  const url = `${config.public.apiBase}/schedules/consumptions/export/xlsx?${params}`
  window.open(url, '_blank')
}

async function loadOptions() {
  try {
    const c: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(c)) classOpts.value = c.map(x => ({ label: x.name, value: x.id }))
    const schedules: any = await apiGet('/schedules', { campus_id: userStore.selectedCampusId, page_size: 200 })
    if (Array.isArray(schedules?.items)) scheduleOpts.value = schedules.items.map((s: any) => ({
      label: `${s.course_date} ${s.class_name || ''} ${s.topic || ''}`,
      value: s.id,
    }))
  } catch (e) { console.warn(e) }
  onStudentSearch('')
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      page: page.value, page_size: pageSize.value,
      campus_id: userStore.selectedCampusId,
      class_id: filterClass.value,
      student_id: filterStudent.value,
      status: filterStatus.value,
      attendance: filterAttendance.value,
    }
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res: any = await apiGet('/schedules/consumptions', params)
    total.value = res?.total || 0
    list.value = res?.items || []
  } catch (e) { list.value = []; total.value = 0 }
  finally { loading.value = false }
}

watch([filterClass, filterStatus, filterAttendance], () => { page.value = 1; reload() })
onMounted(() => {
  loadOptions()
  reload()
})
</script>
