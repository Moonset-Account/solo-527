<template>
  <div class="my-appointments-page">
    <div class="page-header">
      <h2>我的预约</h2>
      <el-tabs v-model="activeTab" @tab-change="loadAppointments">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待服务" name="pending" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>
    </div>

    <div v-loading="loading" class="appointment-list">
      <div v-for="appt in appointments" :key="appt._id" class="appointment-card">
        <div class="card-header">
          <div class="date-info">
            <span class="date">{{ formatDate(appt.appointmentDate) }}</span>
            <span class="time">{{ appt.startTime }} - {{ appt.endTime }}</span>
          </div>
          <el-tag :type="statusType(appt.status)">{{ statusText(appt.status) }}</el-tag>
        </div>
        <div class="card-body">
          <div class="tech-info">
            <el-avatar :size="40" :src="appt.technicianAvatar">
              {{ appt.technicianName?.charAt(0) }}
            </el-avatar>
            <div class="tech-detail">
              <p class="tech-name">{{ appt.technicianName }}</p>
              <p class="services">
                {{ appt.services?.map(s => s.serviceName).join('、') }}
              </p>
            </div>
          </div>
          <div class="price">¥{{ appt.totalPrice }}</div>
        </div>
        <div class="card-footer">
          <div v-if="appt.remark" class="remark">备注：{{ appt.remark }}</div>
          <div class="actions">
            <el-button
              v-if="appt.status === 'pending' || appt.status === 'confirmed'"
              size="small"
              @click="handleReschedule(appt)"
            >
              改时间
            </el-button>
            <el-button
              v-if="appt.status === 'pending' || appt.status === 'confirmed'"
              size="small"
              type="danger"
              @click="handleCancel(appt)"
            >
              取消预约
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && appointments.length === 0" description="暂无预约记录" />
    </div>

    <el-dialog v-model="rescheduleVisible" title="修改预约时间" width="500px">
      <el-form label-width="80px">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="rescheduleForm.date"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadRescheduleSlots"
          />
        </el-form-item>
        <el-form-item label="选择时间">
          <div v-loading="loadingSlots" class="time-slots">
            <el-tag
              v-for="slot in rescheduleSlots"
              :key="slot"
              :type="rescheduleForm.time === slot ? 'primary' : 'info'"
              class="slot-tag"
              @click="rescheduleForm.time = slot"
            >
              {{ slot }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rescheduleVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmReschedule">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAppointments, cancelAppointment, rescheduleAppointment, getAvailableTimeSlots } from '@/api/appointments'
import dayjs from 'dayjs'

const loading = ref(false)
const appointments = ref([])
const activeTab = ref('all')
const rescheduleVisible = ref(false)
const currentAppointment = ref(null)
const rescheduleSlots = ref([])
const loadingSlots = ref(false)
const submitting = ref(false)

const rescheduleForm = reactive({
  date: '',
  time: '',
})

async function loadAppointments() {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value !== 'all') {
      if (activeTab.value === 'pending') {
        params.status = 'pending'
      } else if (activeTab.value === 'completed') {
        params.status = 'completed'
      } else if (activeTab.value === 'cancelled') {
        params.status = 'cancelled'
      }
    }
    const data = await getAppointments(params)
    appointments.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function statusText(status) {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未到店',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    pending: 'warning',
    confirmed: 'primary',
    checked_in: 'success',
    completed: 'success',
    cancelled: 'info',
    no_show: 'danger',
  }
  return map[status] || 'info'
}

function handleReschedule(appt) {
  currentAppointment.value = appt
  rescheduleForm.date = dayjs(appt.appointmentDate).format('YYYY-MM-DD')
  rescheduleForm.time = appt.startTime
  rescheduleVisible.value = true
  loadRescheduleSlots()
}

function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7
}

async function loadRescheduleSlots() {
  if (!currentAppointment.value || !rescheduleForm.date) return
  
  loadingSlots.value = true
  try {
    const totalDuration = currentAppointment.value.totalDuration || 60
    const data = await getAvailableTimeSlots(
      currentAppointment.value.technicianId,
      rescheduleForm.date,
      totalDuration
    )
    rescheduleSlots.value = data
  } catch (e) {
    rescheduleSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

async function confirmReschedule() {
  if (!rescheduleForm.date || !rescheduleForm.time) {
    ElMessage.warning('请选择日期和时间')
    return
  }

  submitting.value = true
  try {
    await rescheduleAppointment(currentAppointment.value._id, {
      appointmentDate: rescheduleForm.date,
      startTime: rescheduleForm.time,
    })
    ElMessage.success('预约时间已修改')
    rescheduleVisible.value = false
    loadAppointments()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleCancel(appt) {
  ElMessageBox.confirm('确定要取消此预约吗？', '提示', {
    confirmButtonText: '确定取消',
    cancelButtonText: '再想想',
    type: 'warning',
  }).then(async () => {
    try {
      await cancelAppointment(appt._id)
      ElMessage.success('预约已取消')
      loadAppointments()
    } catch (e) {
      // 错误已处理
    }
  }).catch(() => {})
}

onMounted(() => {
  loadAppointments()
})
</script>

<style scoped lang="scss">
.my-appointments-page {
  .page-header {
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 16px;

    h2 {
      margin: 0 0 16px 0;
    }
  }

  .appointment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .appointment-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;

      .date-info {
        .date {
          font-size: 16px;
          font-weight: 600;
          margin-right: 12px;
        }

        .time {
          color: #666;
          font-size: 14px;
        }
      }
    }

    .card-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;

      .tech-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .tech-detail {
          .tech-name {
            margin: 0 0 4px 0;
            font-weight: 500;
          }

          .services {
            margin: 0;
            font-size: 12px;
            color: #999;
          }
        }
      }

      .price {
        font-size: 20px;
        font-weight: bold;
        color: #e91e63;
      }
    }

    .card-footer {
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;

      .remark {
        font-size: 12px;
        color: #999;
        margin-bottom: 12px;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  }
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-tag {
  cursor: pointer;
  padding: 6px 12px;
}
</style>
