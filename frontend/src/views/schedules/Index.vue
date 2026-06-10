<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">排产计划</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建排产
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="车间">
          <el-input v-model="filters.workshop" placeholder="车间名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card class="calendar-card">
      <template #header>
        <div class="card-header">
          <span>排产日历</span>
          <el-date-picker
            v-model="currentMonth"
            type="month"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="loadCalendar"
          />
        </div>
      </template>
      <div class="calendar-grid">
        <div class="calendar-header">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="calendar-body">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-schedule': day.schedules?.length > 0,
            }"
          >
            <div class="day-number">{{ day.date }}</div>
            <div class="day-schedules">
              <div
                v-for="schedule in day.schedules?.slice(0, 3)"
                :key="schedule.id"
                class="schedule-item"
                @click="viewDetail(schedule)"
              >
                <span class="order-no">{{ schedule.workOrder?.orderNo }}</span>
                <span class="qty">{{ schedule.plannedQuantity }}件</span>
              </div>
              <div v-if="day.schedules?.length > 3" class="more">
                +{{ day.schedules.length - 3 }} 更多
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <div class="table-container" style="margin-top: 20px">
      <h3 class="section-title">排产列表</h3>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="排产日期" width="120">
          <template #default="{ row }">{{ formatDate(row.scheduleDate) }}</template>
        </el-table-column>
        <el-table-column prop="workOrder.orderNo" label="工单号" width="120" />
        <el-table-column prop="workOrder.productName" label="产品名称" min-width="120" />
        <el-table-column prop="workshop" label="车间" width="100" />
        <el-table-column prop="line" label="产线" width="80" />
        <el-table-column label="班次" width="80">
          <template #default="{ row }">{{ shiftText(row.shift) }}</template>
        </el-table-column>
        <el-table-column prop="plannedQuantity" label="计划数量" width="100" align="right" />
        <el-table-column prop="actualQuantity" label="实际数量" width="100" align="right" />
        <el-table-column label="排产人" width="100">
          <template #default="{ row }">{{ row.scheduler?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link v-if="canManage" @click="openAdjustDialog(row)">调整</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="工单" prop="workOrderId">
          <el-select v-model="formData.workOrderId" filterable style="width: 100%">
            <el-option
              v-for="order in workOrderList"
              :key="order.id"
              :label="`${order.orderNo} - ${order.productName}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排产日期" prop="scheduleDate">
          <el-date-picker v-model="formData.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="车间">
          <el-input v-model="formData.workshop" />
        </el-form-item>
        <el-form-item label="产线">
          <el-input v-model="formData.line" />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="formData.shift" placeholder="请选择" style="width: 100%">
            <el-option label="早班" value="morning" />
            <el-option label="中班" value="afternoon" />
            <el-option label="晚班" value="night" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQuantity">
          <el-input-number v-model="formData.plannedQuantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.notes" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="调整原因" v-if="isAdjust">
          <el-input v-model="formData.reason" type="textarea" :rows="2" placeholder="请填写调整原因（风险操作留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { scheduleApi, workOrderApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const calendarData = ref({})
const workOrderList = ref([])

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const currentMonth = ref(dayjs().format('YYYY-MM'))
const dateRange = ref([
  dayjs().startOf('month').format('YYYY-MM-DD'),
  dayjs().endOf('month').format('YYYY-MM-DD'),
])

const filters = reactive({
  workshop: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const calendarDays = computed(() => {
  const start = dayjs(currentMonth.value).startOf('month').startOf('week')
  const end = dayjs(currentMonth.value).endOf('month').endOf('week')
  const days = []
  let day = start

  while (day.isBefore(end) || day.isSame(end, 'day')) {
    const dateStr = day.format('YYYY-MM-DD')
    days.push({
      date: day.date(),
      fullDate: dateStr,
      isCurrentMonth: day.format('YYYY-MM') === currentMonth.value,
      isToday: day.isSame(dayjs(), 'day'),
      schedules: calendarData.value[dateStr] || [],
    })
    day = day.add(1, 'day')
  }

  return days
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const isAdjust = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  workOrderId: null,
  scheduleDate: '',
  workshop: '',
  line: '',
  shift: '',
  plannedQuantity: 0,
  notes: '',
  reason: '',
})

const formRules = {
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
  scheduleDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  plannedQuantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function shiftText(shift) {
  const map = { morning: '早班', afternoon: '中班', night: '晚班' }
  return map[shift] || '-'
}

async function loadWorkOrders() {
  try {
    const res = await workOrderApi.list({ perPage: 100, status: 'pending,scheduled,in_production' })
    workOrderList.value = res.data.data
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await scheduleApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function loadCalendar() {
  try {
    const start = dayjs(currentMonth.value).startOf('month').format('YYYY-MM-DD')
    const end = dayjs(currentMonth.value).endOf('month').format('YYYY-MM-DD')
    const res = await scheduleApi.calendar({ startDate: start, endDate: end })
    calendarData.value = res.data || {}
  } catch (e) {}
}

function resetFilters() {
  filters.workshop = ''
  dateRange.value = [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]
  pagination.page = 1
  loadData()
}

function viewDetail(row) {
  ElMessage.info('查看排产详情功能')
}

function openCreateDialog() {
  isEdit.value = false
  isAdjust.value = false
  dialogTitle.value = '新建排产计划'
  Object.assign(formData, {
    id: null,
    workOrderId: null,
    scheduleDate: dayjs().format('YYYY-MM-DD'),
    workshop: '',
    line: '',
    shift: 'morning',
    plannedQuantity: 100,
    notes: '',
    reason: '',
  })
  dialogVisible.value = true
}

function openAdjustDialog(row) {
  isEdit.value = true
  isAdjust.value = true
  dialogTitle.value = '调整排产计划'
  Object.assign(formData, {
    id: row.id,
    workOrderId: row.workOrderId,
    scheduleDate: dayjs(row.scheduleDate).format('YYYY-MM-DD'),
    workshop: row.workshop || '',
    line: row.line || '',
    shift: row.shift || '',
    plannedQuantity: row.plannedQuantity,
    notes: row.notes || '',
    reason: '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isAdjust.value) {
      const { reason, ...data } = formData
      await scheduleApi.adjust(formData.id, { ...data, reason })
      ElMessage.success('排产调整成功')
    } else {
      await scheduleApi.create(formData)
      ElMessage.success('排产创建成功')
    }

    dialogVisible.value = false
    loadData()
    loadCalendar()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadWorkOrders()
  loadData()
  loadCalendar()
})
</script>

<style scoped>
.calendar-card {
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-grid {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.calendar-header {
  display: flex;
  background: #f5f7fa;
}

.weekday {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-weight: 500;
  color: #606266;
  border-right: 1px solid #ebeef5;
}

.weekday:last-child {
  border-right: none;
}

.calendar-body {
  display: flex;
  flex-wrap: wrap;
}

.calendar-day {
  width: calc(100% / 7);
  min-height: 120px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.calendar-day:hover {
  background: #f5f7fa;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.other-month {
  background: #fafafa;
  color: #c0c4cc;
}

.calendar-day.today {
  background: #ecf5ff;
}

.calendar-day.today .day-number {
  color: #409eff;
  font-weight: bold;
}

.day-number {
  font-size: 14px;
  margin-bottom: 6px;
}

.day-schedules {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-item {
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.schedule-item:hover {
  opacity: 0.8;
}

.more {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.section-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
