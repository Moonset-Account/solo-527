<template>
  <div class="appointments-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="服务中" value="checked_in" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="未到店" value="no_show" />
          </el-select>
        </el-form-item>
        <el-form-item label="技师">
          <el-select v-model="filterForm.technicianId" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="tech in technicians"
              :key="tech._id"
              :label="tech.name"
              :value="tech._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="顾客">
          <el-input v-model="filterForm.keyword" placeholder="姓名/手机" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAppointments">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>预约列表</span>
          <el-button type="primary" @click="handleAdd">新增预约</el-button>
        </div>
      </template>

      <el-table :data="appointments" v-loading="loading" stripe>
        <el-table-column prop="appointmentDate" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.appointmentDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="时间" width="120">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="顾客" width="100" />
        <el-table-column prop="customerPhone" label="手机号" width="120" />
        <el-table-column prop="technicianName" label="技师" width="100" />
        <el-table-column label="服务项目">
          <template #default="{ row }">
            {{ row.services?.map(s => s.serviceName).join('、') }}
          </template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.totalPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleView(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'confirmed'"
              type="primary"
              size="small"
              text
              @click="handleCheckin(row)"
            >
              核销
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'confirmed'"
              type="danger"
              size="small"
              text
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadAppointments"
        @current-change="loadAppointments"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="appointmentForm" label-width="100px">
        <el-form-item label="顾客姓名" required>
          <el-input v-model="appointmentForm.customerName" placeholder="请输入顾客姓名" />
        </el-form-item>
        <el-form-item label="顾客手机" required>
          <el-input v-model="appointmentForm.customerPhone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="服务技师" required>
          <el-select v-model="appointmentForm.technicianId" placeholder="请选择技师" style="width: 100%">
            <el-option
              v-for="tech in technicians"
              :key="tech._id"
              :label="tech.name"
              :value="tech._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务项目" required>
          <el-select
            v-model="appointmentForm.serviceIds"
            multiple
            placeholder="请选择服务项目"
            style="width: 100%"
            @change="calculateTotal"
          >
            <el-option
              v-for="service in services"
              :key="service._id"
              :label="service.name + '（¥' + service.price + '）'"
              :value="service._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期" required>
          <el-date-picker
            v-model="appointmentForm.appointmentDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-select v-model="appointmentForm.startTime" placeholder="请选择时间" style="width: 100%">
            <el-option
              v-for="slot in timeSlots"
              :key="slot"
              :label="slot"
              :value="slot"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计金额">
          <span>¥{{ totalAmount }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="appointmentForm.remark"
            type="textarea"
            :rows="3"
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAppointments,
  createAppointment,
  cancelAppointment,
  getAvailableTimeSlots,
} from '@/api/appointments'
import { getActiveServices } from '@/api/services'
import { getActiveTechnicians } from '@/api/technicians'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const appointments = ref([])
const technicians = ref([])
const services = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = reactive({
  status: '',
  technicianId: '',
  date: '',
  keyword: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增预约')
const submitting = ref(false)
const timeSlots = ref([])

const appointmentForm = reactive({
  customerName: '',
  customerPhone: '',
  technicianId: '',
  serviceIds: [],
  appointmentDate: '',
  startTime: '',
  remark: '',
})

const totalAmount = computed(() => {
  let total = 0
  for (const id of appointmentForm.serviceIds) {
    const service = services.value.find(s => s._id === id)
    if (service) {
      total += service.price
    }
  }
  return total
})

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

function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7
}

async function loadAppointments() {
  loading.value = true
  try {
    const params = { ...filterForm }
    const data = await getAppointments(params)
    appointments.value = data
    total.value = data.length
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function loadTechnicians() {
  try {
    const data = await getActiveTechnicians()
    technicians.value = data
  } catch (e) {}
}

async function loadServices() {
  try {
    const data = await getActiveServices()
    services.value = data
  } catch (e) {}
}

function resetFilter() {
  filterForm.status = ''
  filterForm.technicianId = ''
  filterForm.date = ''
  filterForm.keyword = ''
  loadAppointments()
}

function calculateTotal() {
  // 计算已在 computed 中实现
}

async function loadTimeSlots() {
  if (!appointmentForm.technicianId || !appointmentForm.appointmentDate) {
    timeSlots.value = []
    return
  }

  try {
    const totalDuration = appointmentForm.serviceIds.reduce((sum, id) => {
      const service = services.value.find(s => s._id === id)
      return sum + (service?.duration || 60)
    }, 0) || 60

    const data = await getAvailableTimeSlots(
      appointmentForm.technicianId,
      appointmentForm.appointmentDate,
      totalDuration
    )
    timeSlots.value = data
  } catch (e) {
    timeSlots.value = []
  }
}

watch(
  () => [appointmentForm.technicianId, appointmentForm.appointmentDate, appointmentForm.serviceIds],
  () => {
    loadTimeSlots()
  }
)

function handleAdd() {
  dialogTitle.value = '新增预约'
  appointmentForm.customerName = ''
  appointmentForm.customerPhone = ''
  appointmentForm.technicianId = ''
  appointmentForm.serviceIds = []
  appointmentForm.appointmentDate = dayjs().format('YYYY-MM-DD')
  appointmentForm.startTime = ''
  appointmentForm.remark = ''
  dialogVisible.value = true
  loadTimeSlots()
}

function handleView(row) {
  // 查看详情
}

async function handleSubmit() {
  if (!appointmentForm.customerName || !appointmentForm.customerPhone) {
    ElMessage.warning('请填写顾客信息')
    return
  }
  if (!appointmentForm.technicianId) {
    ElMessage.warning('请选择技师')
    return
  }
  if (!appointmentForm.serviceIds.length) {
    ElMessage.warning('请选择服务项目')
    return
  }
  if (!appointmentForm.appointmentDate || !appointmentForm.startTime) {
    ElMessage.warning('请选择预约时间')
    return
  }

  submitting.value = true
  try {
    await createAppointment(appointmentForm)
    ElMessage.success('预约创建成功')
    dialogVisible.value = false
    loadAppointments()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleCancel(row) {
  ElMessageBox.confirm('确定要取消此预约吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await cancelAppointment(row._id)
      ElMessage.success('预约已取消')
      loadAppointments()
    } catch (e) {}
  }).catch(() => {})
}

function handleCheckin(row) {
  router.push({ path: '/admin/checkin', query: { appointmentId: row._id } })
}

onMounted(() => {
  loadAppointments()
  loadTechnicians()
  loadServices()
})
</script>

<style scoped lang="scss">
.appointments-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
