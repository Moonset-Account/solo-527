<template>
  <div class="page-container">
    <n-card title="课程日历" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space>
          <n-select
            v-model:value="filterClass"
            clearable
            placeholder="选择班级"
            style="width: 200px;"
            :options="classOptions"
            @update:value="reload"
          />
          <n-select
            v-model:value="filterTeacher"
            clearable
            placeholder="选择教师"
            style="width: 160px;"
            :options="teacherOptions"
            @update:value="reload"
          />
          <n-button type="primary" @click="openCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新建排课
          </n-button>
          <n-button @click="generateMonthly">
            <template #icon><n-icon><MagnetOutline /></n-icon></template>
            一键生成月度排课
          </n-button>
        </n-space>
      </template>
      <n-grid :cols="12" :x-gap="16" :y-gap="16">
        <n-grid-item :span="9">
          <n-calendar
            v-model:value="selectedDate"
            is-date-disabled={() => false}
            @update:value="onDateChange"
          >
            <template #date-cell="{ value }">
              <div @click="selectDate(value)">
                <div
                  v-for="item in getScheduleByDate(value.date)"
                  :key="item.id"
                  :style="{
                    background: item.color || '#2080f0',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }"
                  @click.stop="openDetail(item)"
                >
                  {{ item.start_time?.toString()?.slice(0, 5) }} {{ item.class_name || '课程' }}
                </div>
              </div>
            </template>
          </n-calendar>
        </n-grid-item>
        <n-grid-item :span="3">
          <n-card :title="`${formatDateStr(selectedDate)} 课程安排`" size="small" :bordered="false">
            <div v-if="daySchedules.length === 0" style="padding: 20px 0;">
              <n-empty description="当日无排课" />
            </div>
            <n-timeline v-else>
              <n-timeline-item
                v-for="s in daySchedules"
                :key="s.id"
                :type="statusType(s.status)"
                :title="`${s.start_time?.toString()?.slice(0,5)} - ${s.end_time?.toString()?.slice(0,5)}`"
                @click="openDetail(s)"
                style="cursor: pointer;"
              >
                <n-text strong style="font-size: 13px;">{{ s.class_name || '课程' }}</n-text>
                <br />
                <n-text depth="3" style="font-size: 12px;">
                  {{ s.teacher_name || '未指派' }} @ {{ s.classroom || '待定教室' }}
                </n-text>
                <br />
                <n-tag
                  v-if="s.topic"
                  size="small"
                  style="margin-top: 4px;"
                  :type="statusTagType(s.status)"
                >
                  {{ s.topic }}
                </n-tag>
                <div style="margin-top: 6px;">
                  <n-space>
                    <n-button size="tiny" type="primary" @click.stop="goConsume(s)">消课</n-button>
                    <n-button size="tiny" quaternary @click.stop="openEdit(s)">编辑</n-button>
                  </n-space>
                </div>
              </n-timeline-item>
            </n-timeline>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-card>
  </div>

  <ScheduleForm v-model:visible="formVisible" :edit-data="editData" @success="reload" />
  <MonthlyGenerateForm v-model:visible="monthlyVisible" @success="reload" />
  <n-modal v-model:show="detailVisible" preset="card" style="width: 560px;" :title="`排课详情 - ${editData?.schedule_code || ''}`">
    <template v-if="detailData">
      <n-descriptions :column="2" bordered label-placement="left" size="small">
        <n-descriptions-item label="班级">{{ detailData.class_name }}</n-descriptions-item>
        <n-descriptions-item label="授课教师">{{ detailData.teacher_name }}</n-descriptions-item>
        <n-descriptions-item label="日期">{{ detailData.course_date }}</n-descriptions-item>
        <n-descriptions-item label="时长">{{ detailData.duration_minutes }}分钟</n-descriptions-item>
        <n-descriptions-item label="时间">{{ detailData.start_time }} - {{ detailData.end_time }}</n-descriptions-item>
        <n-descriptions-item label="教室">{{ detailData.classroom }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusTagType(detailData.status)">{{ statusLabel(detailData.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="人数">{{ detailData.assigned_student_count }}人/实到{{ detailData.attended_student_count }}人</n-descriptions-item>
        <n-descriptions-item label="主题" :span="2">{{ detailData.topic }}</n-descriptions-item>
        <n-descriptions-item label="内容" :span="2">{{ detailData.content }}</n-descriptions-item>
      </n-descriptions>
      <n-divider style="margin: 16px 0;">操作</n-divider>
      <n-space justify="end">
        <n-button @click="detailVisible = false">关闭</n-button>
        <n-button type="primary" @click="openEdit(detailData)">编辑排课</n-button>
        <n-button type="success" @click="goConsume(detailData)">去消课</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import type { ScheduleItem, ClassSimple } from '~/types'
import {
  AddOutline, MagnetOutline,
} from '@vicons/ionicons5'
import ScheduleForm from '~/components/ScheduleForm.vue'
import MonthlyGenerateForm from '~/components/MonthlyGenerateForm.vue'
import { apiGet } from '~/composables/useApi'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()

appStore.setPage('课程日历', route.path)

const selectedDate = ref<number>(Date.now())
const filterClass = ref<number | null>(null)
const filterTeacher = ref<number | null>(null)
const schedules = ref<ScheduleItem[]>([])
const classOptions = computed(() => [])
const teacherOptions = computed(() => [])
const formVisible = ref(false)
const monthlyVisible = ref(false)
const editData = ref<any>(null)
const detailVisible = ref(false)
const detailData = ref<any>(null)

const daySchedules = computed(() =>
  getScheduleByDate(new Date(selectedDate.value))
)

function formatDateStr(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getScheduleByDate(d: Date) {
  const ds = d.toISOString().split('T')[0]
  return schedules.value.filter(s => s.course_date === ds)
}

function onDateChange(d: any) {
  selectedDate.value = d.time
}

function selectDate(d: any) {
  selectedDate.value = new Date(d.date).getTime()
}

function openCreate() {
  editData.value = null
  formVisible.value = true
}

function openEdit(data: any) {
  detailVisible.value = false
  editData.value = { ...data }
  formVisible.value = true
}

function openDetail(item: any) {
  detailData.value = { ...item }
  detailVisible.value = true
}

function goConsume(s: any) {
  navigateTo(`/consumptions?schedule_id=${s.id}`)
}

function generateMonthly() {
  monthlyVisible.value = true
}

function statusType(s: string) {
  return { planned: 'default', confirmed: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error' }[s] || 'default'
}
function statusTagType(s: string) { return statusType(s) as any }
function statusLabel(s: string) {
  return { planned: '待确认', confirmed: '已确认', in_progress: '上课中', completed: '已完成', cancelled: '已取消' }[s] || s
}

async function loadOptions() {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) {
      ;(classOptions as any).value = classes.map((c: any) => ({ label: c.name, value: c.id }))
    }
    const teachers: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(teachers)) {
      ;(teacherOptions as any).value = teachers.map((t: any) => ({ label: t.real_name, value: t.id }))
    }
  } catch (e) {
    console.warn(e)
  }
}

async function reload() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  try {
    const d: any = await apiGet('/schedules/calendar', {
      campus_id: userStore.selectedCampusId,
      class_id: filterClass.value,
      teacher_id: filterTeacher.value,
      start: fmt(start), end: fmt(end),
    })
    if (Array.isArray(d)) schedules.value = d
  } catch (e) {
    console.warn(e)
  }
}

onMounted(() => {
  loadOptions()
  reload()
})
</script>
