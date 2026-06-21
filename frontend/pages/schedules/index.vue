<template>
  <div class="schedules-page space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">排班管理</h1>
        <p class="text-sm text-gray-500 mt-1">{{ schedulesStore.dateRangeLabel }}</p>
      </div>
      <div class="flex items-center gap-3">
        <n-radio-group v-model:value="viewMode" size="small" @update:value="handleViewChange">
          <n-radio-button value="week">周视图</n-radio-button>
          <n-radio-button value="month">月视图</n-radio-button>
        </n-radio-group>
        <n-button size="small" type="primary" @click="openBulkSchedule">
          <template #icon>
            <n-icon><AddSharp /></n-icon>
          </template>
          批量排班
        </n-button>
        <n-button size="small">
          <template #icon>
            <n-icon><DownloadSharp /></n-icon>
          </template>
          导出
        </n-button>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 16px 20px 20px;">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <n-button circle size="small" quaternary @click="schedulesStore.prevPeriod()">
            <template #icon><n-icon><ChevronBackSharp /></n-icon></template>
          </n-button>
          <n-button size="small" type="primary" ghost @click="schedulesStore.goToday()">今天</n-button>
          <n-button circle size="small" quaternary @click="schedulesStore.nextPeriod()">
            <template #icon><n-icon><ChevronForwardSharp /></n-icon></template>
          </n-button>
          <span class="text-base font-semibold text-gray-800 ml-3">{{ schedulesStore.dateRangeLabel }}</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-sky-400"></span>早班</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-indigo-400"></span>晚班</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-teal-500"></span>全天</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-gray-300"></span>休息</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="min-w-[900px]">
          <div class="grid bg-gray-50 rounded-t-xl overflow-hidden" :style="{ gridTemplateColumns: `160px repeat(${schedulesStore.currentDates.length}, 1fr)` }">
            <div class="p-3 text-xs font-medium text-gray-500 border-r border-gray-200">员工 / 日期</div>
            <div
              v-for="(date, dIdx) in schedulesStore.currentDates"
              :key="date"
              class="p-3 text-center border-r border-gray-200 last:border-r-0"
              :class="isToday(date) ? 'bg-teal-50' : ''"
            >
              <div class="text-xs text-gray-500">{{ getWeekDayLabel(date) }}</div>
              <div class="text-sm font-semibold mt-0.5" :class="isToday(date) ? 'text-teal-700' : 'text-gray-800'">{{ dayjs(date).format('MM/DD') }}</div>
            </div>
          </div>

          <div
            v-for="staff in schedulesStore.staffs"
            :key="staff.id"
            class="grid border-b border-gray-100 last:border-b-0"
            :style="{ gridTemplateColumns: `160px repeat(${schedulesStore.currentDates.length}, 1fr)` }"
          >
            <div class="p-3 flex items-center gap-3 border-r border-gray-100 bg-gray-50/50">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 shadow-sm"
                :style="{ backgroundColor: staff.avatarColor }"
              >
                {{ staff.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-800 truncate">{{ staff.name }}</div>
                <div class="text-xs text-gray-500 truncate">{{ staff.role }}</div>
              </div>
            </div>
            <div
              v-for="date in schedulesStore.currentDates"
              :key="`${staff.id}-${date}`"
              class="p-1.5 border-r border-gray-100 last:border-r-0"
              :class="isToday(date) ? 'bg-teal-50/30' : ''"
            >
              <div
                v-if="getCellData(staff.id, date)"
                class="rounded-lg p-2 cursor-pointer transition-all hover:shadow-md border group"
                :class="[getShiftColor(getCellData(staff.id, date)!.shift).bg, getShiftColor(getCellData(staff.id, date)!.shift).border]"
                @click="openEditModal(staff, date)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold" :class="getShiftColor(getCellData(staff.id, date)!.shift).text">
                    {{ getShiftInfo(getCellData(staff.id, date)!.shift).label }}
                  </span>
                  <n-icon size="12" class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CreateSharp />
                  </n-icon>
                </div>
                <div v-if="getCellData(staff.id, date)!.shift !== 'rest'" class="text-[10px] text-gray-500 mt-1">
                  {{ getShiftInfo(getCellData(staff.id, date)!.shift).start }}-{{ getShiftInfo(getCellData(staff.id, date)!.shift).end }}
                </div>
                <div v-if="getCellData(staff.id, date)!.shift !== 'rest'" class="flex items-center gap-1 mt-1.5">
                  <div class="flex-1 h-1 rounded-full bg-white/60 overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: Math.min(100, getCellData(staff.id, date)!.tasks * 12) + '%',
                        backgroundColor: getLoadBarColor(getCellData(staff.id, date)!.tasks),
                      }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-gray-500">{{ getCellData(staff.id, date)!.tasks }}任务</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card class="!rounded-2xl !border-0" title="负荷预警" content-style="padding: 16px 20px 20px;">
      <template #header-extra>
        <n-badge :value="schedulesStore.loadWarnings.length" show-zero>
          <n-tag size="small" type="warning" round>需关注</n-tag>
        </n-badge>
      </template>
      <div v-if="schedulesStore.loadWarnings.length === 0" class="py-8 text-center text-gray-400">
        <n-icon size="32" class="mb-2"><CheckmarkCircleSharp /></n-icon>
        <div class="text-sm">当前排班无异常预警</div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="warning in schedulesStore.loadWarnings"
          :key="warning.id"
          class="flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-md"
          :class="warning.level === 'danger' ? 'bg-red-50 hover:bg-red-100/70' : 'bg-orange-50 hover:bg-orange-100/70'"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="warning.level === 'danger' ? 'bg-red-100' : 'bg-orange-100'"
          >
            <n-icon :size="20" :color="warning.level === 'danger' ? '#EF4444' : '#F97316'">
              <AlertCircleSharp />
            </n-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <n-tag :type="warning.level === 'danger' ? 'error' : 'warning'" size="small" round>
                {{ warning.level === 'danger' ? '严重' : '警告' }}
              </n-tag>
              <span class="font-medium text-gray-800 text-sm">{{ warning.staffName }}</span>
              <span class="text-xs text-gray-500">{{ dayjs(warning.date).format('MM月DD日') }}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1.5">{{ warning.message }}</p>
          </div>
          <n-button text size="small" @click="schedulesStore.dismissWarning(warning.id)">
            <template #icon>
              <n-icon size="14"><CloseSharp /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <n-button text size="small" style="color: #1A8A7D;" @click="goLoadAnalysis">
          查看详细负荷分析
          <template #icon>
            <n-icon size="14"><ChevronForwardSharp /></n-icon>
          </template>
        </n-button>
        <span class="text-xs text-gray-400">数据每小时自动更新</span>
      </div>
    </n-card>

    <n-modal v-model:show="editModalVisible" preset="card" :title="editModalTitle" style="width: 440px;">
      <div class="space-y-5">
        <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
            :style="{ backgroundColor: editingStaff?.avatarColor || '#1A8A7D' }"
          >
            {{ editingStaff?.name?.charAt(0) || '?' }}
          </div>
          <div>
            <div class="text-base font-semibold text-gray-800">{{ editingStaff?.name }}</div>
            <div class="text-sm text-gray-500">{{ editingStaff?.role }} · {{ editingDate ? dayjs(editingDate).format('YYYY年MM月DD日 dddd') : '' }}</div>
          </div>
        </div>

        <div>
          <div class="text-sm font-medium text-gray-700 mb-2">选择班次</div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="shift in shiftOptions"
              :key="shift.value"
              class="p-3 rounded-xl border-2 cursor-pointer transition-all"
              :class="editingShift === shift.value
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
              @click="editingShift = shift.value"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: shift.color }"></span>
                <span class="text-sm font-medium text-gray-800">{{ shift.label }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1 ml-5">{{ shift.time }}</div>
            </div>
          </div>
        </div>

        <div v-if="editingShift !== 'rest'">
          <div class="text-sm font-medium text-gray-700 mb-2">预估任务数</div>
          <n-input-number v-model:value="editingTasks" :min="0" :max="20" placeholder="任务数量" style="width: 100%;" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" @click="saveSchedule">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { ShiftType, Staff } from '~/stores/schedules'
import { getShiftInfo, getShiftColor } from '~/stores/schedules'
import {
  ChevronBackSharp,
  ChevronForwardSharp,
  AddSharp,
  DownloadSharp,
  CreateSharp,
  AlertCircleSharp,
  CloseSharp,
  CheckmarkCircleSharp,
} from '@vicons/ionicons5'

const schedulesStore = useSchedulesStore()
const router = useRouter()
const message = useMessage()

const viewMode = ref<'week' | 'month'>(schedulesStore.currentView)

const editModalVisible = ref(false)
const editingStaff = ref<Staff | null>(null)
const editingDate = ref<string>('')
const editingShift = ref<ShiftType>('morning')
const editingTasks = ref<number>(5)

const shiftOptions = [
  { value: 'morning' as ShiftType, label: '早班', time: '08:00 - 16:00', color: '#0EA5E9' },
  { value: 'evening' as ShiftType, label: '晚班', time: '14:00 - 22:00', color: '#6366F1' },
  { value: 'full' as ShiftType, label: '全天', time: '09:00 - 18:00', color: '#1A8A7D' },
  { value: 'rest' as ShiftType, label: '休息', time: '全天休息', color: '#9CA3AF' },
]

const editModalTitle = computed(() => editingStaff.value ? `编辑排班 - ${editingStaff.value.name}` : '编辑排班')

function handleViewChange(v: 'week' | 'month') {
  schedulesStore.setView(v)
}

function isToday(date: string) {
  return dayjs(date).isSame(dayjs(), 'day')
}

function getWeekDayLabel(date: string) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[dayjs(date).day()]
}

function getCellData(staffId: string, date: string) {
  return schedulesStore.getSchedule(staffId, date)
}

function getLoadBarColor(tasks: number) {
  if (tasks >= 7) return '#EF4444'
  if (tasks >= 5) return '#F97316'
  return '#10B981'
}

function openEditModal(staff: Staff, date: string) {
  editingStaff.value = staff
  editingDate.value = date
  const cell = getCellData(staff.id, date)
  if (cell) {
    editingShift.value = cell.shift
    editingTasks.value = cell.tasks
  }
  editModalVisible.value = true
}

function openBulkSchedule() {
  message.info('批量排班功能开发中')
}

function saveSchedule() {
  if (!editingStaff.value || !editingDate.value) return
  schedulesStore.updateSchedule(editingStaff.value.id, editingDate.value, editingShift.value)
  const cell = getCellData(editingStaff.value.id, editingDate.value)
  if (cell) cell.tasks = editingTasks.value
  message.success('排班更新成功')
  editModalVisible.value = false
}

function goLoadAnalysis() {
  router.push('/schedules/load-analysis')
}
</script>

<style scoped>
.schedules-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
