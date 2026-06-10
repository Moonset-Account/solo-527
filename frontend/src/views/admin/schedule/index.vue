<template>
  <div class="schedule-page">
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="选择周">
          <el-date-picker
            v-model="weekDate"
            type="week"
            format="YYYY 第 ww 周"
            value-format="YYYY-MM-DD"
            @change="loadSchedule"
          />
        </el-form-item>
        <el-form-item label="技师">
          <el-select v-model="selectedTechnician" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="tech in technicians"
              :key="tech._id"
              :label="tech.name"
              :value="tech._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadSchedule">查询</el-button>
          <el-button @click="handleBatchSetting">批量设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班表</span>
        </div>
      </template>

      <el-table :data="scheduleData" border v-loading="loading">
        <el-table-column prop="technicianName" label="技师" width="120" fixed />
        <el-table-column
          v-for="day in weekDays"
          :key="day.date"
          :label="day.label"
          min-width="120"
        >
          <template #default="{ row }">
            <div class="schedule-cell">
              <template v-if="row[day.date]">
                <el-tag
                  :type="row[day.date].type === 'rest' ? 'info' : 'success'"
                  size="small"
                  @click="handleEditDay(row._id, day.date, row[day.date])"
                >
                  {{ typeText(row[day.date].type) }}
                </el-tag>
                <p v-if="row[day.date].type === 'work'" class="time">
                  {{ row[day.date].startTime || '09:00' }} - {{ row[day.date].endTime || '18:00' }}
                </p>
              </template>
              <template v-else>
                <span class="no-schedule" @click="handleEditDay(row._id, day.date, null)">
                  <el-icon><Plus /></el-icon>
                  设置
                </span>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="排班设置" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="日期">
          <span>{{ formatDate(currentDate) }}</span>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="scheduleForm.type">
            <el-radio value="work">上班</el-radio>
            <el-radio value="rest">休息</el-radio>
            <el-radio value="leave">请假</el-radio>
            <el-radio value="training">培训</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scheduleForm.type === 'work'" label="上班时间">
          <el-time-picker
            v-model="scheduleForm.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="开始时间"
            style="width: 140px"
          />
          <span style="margin: 0 8px">-</span>
          <el-time-picker
            v-model="scheduleForm.endTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="结束时间"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getActiveTechnicians } from '@/api/technicians'
import { getSchedules, createSchedule, updateSchedule } from '@/api/schedule'
import dayjs from 'dayjs'

const loading = ref(false)
const technicians = ref([])
const weekDate = ref(dayjs().startOf('week').format('YYYY-MM-DD'))
const selectedTechnician = ref('')
const scheduleData = ref([])

const dialogVisible = ref(false)
const submitting = ref(false)
const currentTechId = ref('')
const currentDate = ref('')

const scheduleForm = reactive({
  type: 'work',
  startTime: '09:00',
  endTime: '18:00',
  remark: '',
})

const weekDays = computed(() => {
  const start = dayjs(weekDate.value).startOf('week')
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = start.add(i, 'day')
    days.push({
      date: day.format('YYYY-MM-DD'),
      label: `${day.format('MM-DD')} ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.day()]}`,
    })
  }
  return days
})

function typeText(type) {
  const map = {
    work: '上班',
    rest: '休息',
    leave: '请假',
    training: '培训',
  }
  return map[type] || type
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

async function loadTechnicians() {
  try {
    const data = await getActiveTechnicians()
    technicians.value = data
  } catch (e) {}
}

async function loadSchedule() {
  loading.value = true
  try {
    const startDate = weekDays.value[0].date
    const endDate = weekDays.value[6].date

    const techList = selectedTechnician.value
      ? technicians.value.filter(t => t._id === selectedTechnician.value)
      : technicians.value

    const result = []
    for (const tech of techList) {
      const row = {
        _id: tech._id,
        technicianId: tech._id,
        technicianName: tech.name,
      }

      try {
        const schedules = await getSchedules({
          technicianId: tech._id,
          startDate,
          endDate,
        })

        for (const schedule of schedules) {
          const dateStr = dayjs(schedule.date).format('YYYY-MM-DD')
          row[dateStr] = schedule
        }
      } catch (e) {}

      result.push(row)
    }

    scheduleData.value = result
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function handleEditDay(techId, date, existing) {
  currentTechId.value = techId
  currentDate.value = date
  if (existing) {
    scheduleForm.type = existing.type
    scheduleForm.startTime = existing.startTime || '09:00'
    scheduleForm.endTime = existing.endTime || '18:00'
    scheduleForm.remark = existing.remark || ''
  } else {
    scheduleForm.type = 'work'
    scheduleForm.startTime = '09:00'
    scheduleForm.endTime = '18:00'
    scheduleForm.remark = ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const existingData = scheduleData.value.find(row => row._id === currentTechId.value)
    const existingSchedule = existingData?.[currentDate.value]

    if (existingSchedule) {
      await updateSchedule(existingSchedule._id, scheduleForm)
    } else {
      await createSchedule({
        technicianId: currentTechId.value,
        technicianName: existingData?.technicianName,
        date: currentDate.value,
        ...scheduleForm,
      })
    }

    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadSchedule()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleBatchSetting() {
  ElMessage.info('批量设置功能开发中')
}

onMounted(() => {
  loadTechnicians().then(() => {
    loadSchedule()
  })
})
</script>

<style scoped lang="scss">
.schedule-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .schedule-cell {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    .time {
      font-size: 12px;
      color: #999;
      margin: 0;
    }

    .no-schedule {
      color: #ccc;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;

      &:hover {
        color: #e91e63;
      }
    }
  }
}
</style>
