<template>
  <div class="page-container">
    <n-card title="排课管理" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            clearable
            style="width: 260px;"
            @update:value="reload"
          />
          <n-select
            v-model:value="filterClass"
            clearable
            placeholder="班级"
            style="width: 180px;"
            :options="classOpts"
          />
          <n-select
            v-model:value="filterStatus"
            clearable
            placeholder="状态"
            style="width: 140px;"
            :options="statusOpts"
          />
          <n-input
            v-model:value="keyword"
            clearable
            placeholder="搜索主题/教室"
            style="width: 180px;"
          />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="openCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新建排课
          </n-button>
          <n-button @click="() => navigateTo('/calendar')">
            <template #icon><n-icon><CalendarOutline /></n-icon></template>
            日历视图
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
      />
    </n-card>
  </div>
  <ScheduleForm v-model:visible="formVisible" :edit-data="editData" @success="reload" />
  <n-modal v-model:show="consumeVisible" preset="card" style="width: 680px;" title="批量消课">
    <template v-if="currentSchedule">
      <n-descriptions :column="2" size="small" bordered style="margin-bottom: 16px;">
        <n-descriptions-item label="班级">{{ currentSchedule.class_name }}</n-descriptions-item>
        <n-descriptions-item label="日期时间">{{ currentSchedule.course_date }} {{ currentSchedule.start_time?.toString()?.slice(0,5) }}-{{ currentSchedule.end_time?.toString()?.slice(0,5) }}</n-descriptions-item>
        <n-descriptions-item label="教师">{{ currentSchedule.teacher_name }}</n-descriptions-item>
        <n-descriptions-item label="已消课/总人数">{{ consumedCount }} / {{ currentSchedule.assigned_student_count }}</n-descriptions-item>
      </n-descriptions>
      <n-space style="margin-bottom: 12px;">
        <n-select
          v-model:value="defaultAttendance"
          :options="attendanceOpts"
          style="width: 140px;"
          label="默认出勤"
        />
        <n-input-number v-model:value="defaultHours" :min="1" :max="8" style="width: 120px;">
          <template #addon>课时/人</template>
        </n-input-number>
        <n-button quaternary size="small" @click="selectAll(true)">全选</n-button>
        <n-button quaternary size="small" @click="selectAll(false)">取消全选</n-button>
        <n-button type="success" @click="submitBatchConsume" :disabled="selectedStudents.length === 0">
          确认消课 ({{ selectedStudents.length }}人)
        </n-button>
      </n-space>
      <n-data-table
        :columns="studentCols"
        :data="classStudents"
        :row-key="(r: any) => r.id"
        :row-props="(r: any) => ({ style: { background: isConsumed(r) ? '#f0f9eb' : '' } })"
        size="small"
        :max-height="320"
      />
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h, reactive, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import type { ScheduleItem } from '~/types'
import ScheduleForm from '~/components/ScheduleForm.vue'
import { SearchOutline, AddOutline, CalendarOutline } from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut, apiDelete } from '~/composables/useApi'
import type { DataTableColumns, DataTableSelectionCol, FormInst, FormRules } from 'naive-ui'
import { useMessage, useDialog, NTag, NSpace, NButton, NSelect, NInputNumber } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('排课管理', route.path)

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dateRange = ref<[number, number] | null>(null)
const filterClass = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const classOpts = ref<any[]>([])
const statusOpts = [
  { label: '待确认', value: 'planned' },
  { label: '已确认', value: 'confirmed' },
  { label: '上课中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const formVisible = ref(false)
const editData = ref<any>(null)

const consumeVisible = ref(false)
const currentSchedule = ref<any>(null)
const classStudents = ref<any[]>([])
const defaultAttendance = ref('present')
const defaultHours = ref(2)
const selectedStudents = ref<number[]>([])

const attendanceOpts = [
  { label: '出勤', value: 'present' },
  { label: '请假', value: 'leave' },
  { label: '缺勤', value: 'absent' },
  { label: '迟到', value: 'late' },
]

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [10, 15, 30, 50],
}))

function onPageChange(p: number) {
  page.value = p
  reload()
}

const cols: DataTableColumns = [
  { title: '排课编号', key: 'schedule_code', width: 140, ellipsis: true },
  { title: '日期', key: 'course_date', width: 110 },
  { title: '时间', key: 'time_range', width: 120, render: (r: any) => `${r.start_time?.toString()?.slice(0, 5)}-${r.end_time?.toString()?.slice(0, 5)}` },
  { title: '班级', key: 'class_name', width: 180, ellipsis: true },
  { title: '教师', key: 'teacher_name', width: 100 },
  { title: '教室', key: 'classroom', width: 100 },
  { title: '主题', key: 'topic', ellipsis: true, render: (r: any) => r.topic || '<span style="color:#909399;">-</span>' },
  { title: '人数', key: 'count', width: 100, render: (r: any) => `${r.attended_student_count}/${r.assigned_student_count}` },
  { title: '状态', key: 'status', width: 90, render: (r: any) => {
    const m: Record<string, any> = { planned: 'default', confirmed: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error' }
    const ml: Record<string, string> = { planned: '待确认', confirmed: '已确认', in_progress: '上课中', completed: '已完成', cancelled: '已取消' }
    return h('n-tag', { type: m[r.status], size: 'small', round: true }, { default: () => ml[r.status] })
  }},
  {
    title: '操作', key: 'ops', width: 200, fixed: 'right', render: (r: any) => h('n-space', null, {
      default: () => [
        h('n-button', { size: 'tiny', type: 'primary', onClick: () => openConsume(r) }, { default: () => '消课' }),
        h('n-button', { size: 'tiny', quaternary: true, onClick: () => openEdit(r) }, { default: () => '编辑' }),
        h('n-button', { size: 'tiny', type: 'error', quaternary: true, onClick: () => doDelete(r) }, { default: () => '删除' }),
      ],
    }),
  },
]

const studentCols: DataTableColumns = [
  {
    type: 'selection', key: 'selection', multiple: true,
    constraint: (r: any) => !isConsumed(r),
  } as DataTableSelectionCol,
  { title: '学号', key: 'student_no', width: 110 },
  { title: '姓名', key: 'name', width: 100 },
  { title: '专业', key: 'major', width: 80 },
  { title: '剩余课时', key: 'remaining_hours', width: 90 },
  {
    title: '出勤', key: 'attendance', width: 130, render: (r: any) => isConsumed(r)
      ? h('n-tag', { type: 'success', size: 'small' }, { default: () => `已消课(${r._attendance})` })
      : h('n-select', {
          value: r._attendance,
          options: attendanceOpts,
          size: 'small',
          'onUpdate:value': (v: string) => (r._attendance = v),
        }),
  },
  {
    title: '课时', key: 'hours', width: 110, render: (r: any) => isConsumed(r)
      ? r._hours
      : h('n-input-number', { value: r._hours, min: 1, max: 8, size: 'small', style: 'width:90px;', 'onUpdate:value': (v: number) => (r._hours = v) }),
  },
]

function isConsumed(r: any) { return !!r._consumed_id }

const consumedCount = computed(() => classStudents.value.filter(s => isConsumed(s)).length)

function openCreate() {
  editData.value = null
  formVisible.value = true
}

function openEdit(data: any) {
  editData.value = { ...data }
  formVisible.value = true
}

function doDelete(r: any) {
  dialog.warning({
    title: '确认删除？',
    content: `删除排课「${r.schedule_code}」？如果已有关联消课记录，排课状态将改为"已取消"。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await apiDelete(`/schedules/${r.id}`)
        message.success('操作成功')
        reload()
      } catch (e: any) {
        message.error(e?.data?.detail || '删除失败')
      }
    },
  })
}

async function openConsume(r: any) {
  currentSchedule.value = r
  try {
    const studs: any = await apiGet('/classes/students', {})
    // fall back to simple class students
    const studs2: any = await apiGet('/common/students/simple', { class_id: r.class_id })
    const cons: any = await apiGet('/schedules/consumptions', { schedule_id: r.id, page_size: 500 })
    const consumedMap = new Map<number, any>()
    if (cons?.items) cons.items.forEach((c: any) => consumedMap.set(c.student_id, c))
    const list = (Array.isArray(studs2) ? studs2 : []).map(s => ({
      ...s,
      _attendance: defaultAttendance.value,
      _hours: defaultHours.value,
      _consumed_id: consumedMap.get(s.id)?.id,
      _consumed_status: consumedMap.get(s.id)?.status,
    }))
    classStudents.value = list
    selectedStudents.value = list.filter(s => !isConsumed(s)).map(s => s.id)
    consumeVisible.value = true
  } catch (e) {
    console.warn(e)
    // mock
    classStudents.value = []
    consumeVisible.value = true
  }
}

function selectAll(v: boolean) {
  selectedStudents.value = v ? classStudents.value.filter(s => !isConsumed(s)).map(s => s.id) : []
}

async function submitBatchConsume() {
  if (selectedStudents.value.length === 0) return
  const toConsume = classStudents.value.filter(s => selectedStudents.value.includes(s.id) && !isConsumed(s))
  try {
    for (const s of toConsume) {
      await apiPost('/schedules/consumptions', {
        schedule_id: currentSchedule.value.id,
        student_id: s.id,
        hours_consumed: s._hours,
        attendance: s._attendance,
      })
    }
    message.success(`成功消课 ${toConsume.length} 人`)
    consumeVisible.value = false
    reload()
  } catch (e: any) {
    message.error(e?.data?.detail || '消课失败')
  }
}

async function loadClasses() {
  try {
    const c: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(c)) classOpts.value = c.map(x => ({ label: x.name, value: x.id }))
  } catch (e) { console.warn(e) }
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      page: page.value, page_size: pageSize.value,
      campus_id: userStore.selectedCampusId,
      class_id: filterClass.value,
      status: filterStatus.value,
    }
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res: any = await apiGet('/schedules', params)
    total.value = res?.total || 0
    list.value = res?.items || []
  } catch (e) {
    console.warn(e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch([filterClass, filterStatus], reload)
onMounted(() => {
  loadClasses()
  reload()
})
</script>
