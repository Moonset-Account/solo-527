<template>
  <div class="checkin-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <p class="stat-label">今日预约</p>
          <p class="stat-value">{{ todayStats.total || 0 }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p class="stat-label">已签到</p>
          <p class="stat-value checked-in">{{ todayStats.checkedIn || 0 }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p class="stat-label">已完成</p>
          <p class="stat-value completed">{{ todayStats.completed || 0 }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <p class="stat-label">今日营收</p>
          <p class="stat-value money">¥{{ todayStats.totalAmount || 0 }}</p>
        </div>
      </el-col>
    </el-row>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待核销" value="pending" />
            <el-option label="服务中" value="checked_in" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
        <el-form-item>
          <el-button type="primary" @click="loadRecords">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <span>核销记录</span>
      </template>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.appointmentDate) }} {{ row.appointmentTime }}
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="顾客" width="100" />
        <el-table-column prop="customerPhone" label="手机号" width="130" />
        <el-table-column prop="technicianName" label="技师" width="100" />
        <el-table-column label="服务项目" min-width="150">
          <template #default="{ row }">
            {{ row.services?.map(s => s.serviceName).join('、') }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应收" width="100">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实收" width="100">
          <template #default="{ row }">
            ¥{{ row.actualAmount || row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              text
              @click="handleCheckin(row)"
            >
              签到
            </el-button>
            <el-button
              v-if="row.status === 'checked_in'"
              type="success"
              size="small"
              text
              @click="handleComplete(row)"
            >
              完成结算
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'checked_in'"
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
    </el-card>

    <el-dialog v-model="completeDialogVisible" title="完成结算" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="应收金额">
          <span>¥{{ currentRecord?.totalAmount || 0 }}</span>
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="completeForm.discountAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实收金额" required>
          <el-input-number v-model="completeForm.actualAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item
          label="会员卡抵扣"
          :required="completeForm.paymentMethod === 'membership'"
        >
          <el-select
            v-model="completeForm.customerMembershipId"
            :placeholder="completeForm.paymentMethod === 'membership' ? '请选择顾客会员卡' : '选择会员卡（可选）'"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="m in customerMemberships"
              :key="m._id"
              :label="m.membershipName + (m.remainingTimes != null ? ' (剩余:' + m.remainingTimes + '次)' : ' (余额:¥' + m.remainingAmount + ')')"
              :value="m._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="completeForm.customerMembershipId"
          :label="getMembershipDeductionLabel()"
          :required="completeForm.paymentMethod === 'membership'"
        >
          <el-input-number
            v-model="completeForm.membershipDeduction"
            :min="completeForm.paymentMethod === 'membership' ? 1 : 0"
            :max="getMembershipDeductionMax()"
            :step="getMembershipDeductionStep()"
            :precision="getMembershipDeductionPrecision()"
            style="width: 100%"
          />
          <span v-if="currentCustomerMembership()?.remainingTimes != null" class="deduction-hint">
            最多可用 {{ currentCustomerMembership().remainingTimes }} 次
          </span>
        </el-form-item>
        <el-form-item label="支付方式" required>
          <el-radio-group v-model="completeForm.paymentMethod">
            <el-radio value="cash">现金</el-radio>
            <el-radio value="wechat">微信</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="card">刷卡</el-radio>
            <el-radio value="membership">会员卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="completeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmComplete">
          确认结算
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCheckinRecords, checkin, completeCheckin, cancelCheckin, getTodayCheckinStats, createCheckinFromAppointment } from '@/api/checkin'
import { getAppointment } from '@/api/appointments'
import { getCustomerMemberships } from '@/api/memberships'
import { createCashierRecord } from '@/api/cashier'
import dayjs from 'dayjs'

const route = useRoute()

const loading = ref(false)
const records = ref([])
const todayStats = ref({})
const customerMemberships = ref([])

const filterForm = reactive({
  status: '',
  date: dayjs().format('YYYY-MM-DD'),
})

const completeDialogVisible = ref(false)
const currentRecord = ref(null)
const submitting = ref(false)

const completeForm = reactive({
  discountAmount: 0,
  actualAmount: 0,
  customerMembershipId: '',
  membershipDeduction: 0,
  paymentMethod: 'wechat',
  remark: '',
})

const currentCustomerMembership = () => {
  if (!completeForm.customerMembershipId) return null
  return customerMemberships.value.find(m => m._id === completeForm.customerMembershipId) || null
}

function getMembershipDeductionLabel() {
  const cm = currentCustomerMembership()
  if (cm && cm.remainingTimes != null) return '抵扣次数'
  return '抵扣金额'
}

function getMembershipDeductionStep() {
  const cm = currentCustomerMembership()
  if (cm && cm.remainingTimes != null) return 1
  return 10
}

function getMembershipDeductionPrecision() {
  const cm = currentCustomerMembership()
  if (cm && cm.remainingTimes != null) return 0
  return 2
}

function getMembershipDeductionMax() {
  const cm = currentCustomerMembership()
  if (!cm) return undefined
  if (cm.remainingTimes != null) return cm.remainingTimes
  if (cm.remainingAmount != null) return cm.remainingAmount
  return undefined
}

watch(
  () => completeForm.customerMembershipId,
  (newVal) => {
    if (newVal) {
      const cm = customerMemberships.value.find(m => m._id === newVal)
      if (cm) {
        if (cm.remainingTimes != null) {
          completeForm.membershipDeduction = 1
        } else if (cm.remainingAmount != null) {
          completeForm.membershipDeduction = Math.min(cm.remainingAmount, completeForm.actualAmount || 0)
        }
      }
    } else {
      completeForm.membershipDeduction = 0
    }
  }
)

watch(
  () => completeForm.paymentMethod,
  (newVal) => {
    if (newVal === 'membership' && customerMemberships.value.length === 0) {
      ElMessage.warning('该顾客暂无可用会员卡，请先为顾客办理会员卡')
    }
    if (newVal !== 'membership' && completeForm.customerMembershipId) {
      const cm = currentCustomerMembership()
      if (cm && cm.remainingTimes != null) {
        completeForm.membershipDeduction = 0
      }
    }
    if (newVal !== 'membership') {
      completeForm.membershipDeduction = 0
    }
  }
)

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function statusText(status) {
  const map = {
    pending: '待核销',
    checked_in: '服务中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    pending: 'warning',
    checked_in: 'primary',
    completed: 'success',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

async function loadStats() {
  try {
    todayStats.value = await getTodayCheckinStats()
  } catch (e) {}
}

async function loadRecords() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.status) params.status = filterForm.status
    if (filterForm.date) params.date = filterForm.date
    const data = await getCheckinRecords(params)
    records.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function handleCheckin(row) {
  try {
    await checkin(row._id)
    ElMessage.success('签到成功')
    loadRecords()
    loadStats()
  } catch (e) {}
}

async function handleComplete(row) {
  currentRecord.value = row
  completeForm.discountAmount = 0
  completeForm.actualAmount = row.totalAmount
  completeForm.customerMembershipId = ''
  completeForm.membershipDeduction = 0
  completeForm.paymentMethod = 'wechat'
  completeForm.remark = ''

  if (row.customerId) {
    try {
      customerMemberships.value = await getCustomerMemberships(row.customerId)
    } catch (e) {
      customerMemberships.value = []
    }
  }

  completeDialogVisible.value = true
}

async function confirmComplete() {
  if (!completeForm.actualAmount) {
    ElMessage.warning('请输入实收金额')
    return
  }
  if (!completeForm.paymentMethod) {
    ElMessage.warning('请选择支付方式')
    return
  }
  if (completeForm.paymentMethod === 'membership') {
    if (!completeForm.customerMembershipId) {
      ElMessage.warning('支付方式为会员卡时必须选择顾客会员卡')
      return
    }
    if (!completeForm.membershipDeduction || completeForm.membershipDeduction <= 0) {
      ElMessage.warning('支付方式为会员卡时必须输入正数抵扣值')
      return
    }
    const cm = currentCustomerMembership()
    if (cm && cm.remainingTimes != null) {
      if (!Number.isInteger(completeForm.membershipDeduction)) {
        ElMessage.warning('次卡抵扣次数必须为整数')
        return
      }
      if (completeForm.membershipDeduction > cm.remainingTimes) {
        ElMessage.warning(`抵扣次数不能超过剩余次数（剩余${cm.remainingTimes}次）`)
        return
      }
    }
  }

  submitting.value = true
  try {
    await completeCheckin(currentRecord.value._id, completeForm)

    await createCashierRecord({
      type: 'service',
      customerId: currentRecord.value.customerId,
      customerName: currentRecord.value.customerName,
      appointmentId: currentRecord.value.appointmentId,
      items: currentRecord.value.services?.map(s => ({
        id: s.serviceId,
        name: s.serviceName,
        price: s.price,
        quantity: 1,
      })),
      totalAmount: currentRecord.value.totalAmount,
      discountAmount: completeForm.discountAmount,
      actualAmount: completeForm.actualAmount,
      paymentMethod: completeForm.paymentMethod,
      remark: completeForm.remark,
    })

    ElMessage.success('结算完成')
    completeDialogVisible.value = false
    loadRecords()
    loadStats()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleCancel(row) {
  ElMessageBox.confirm('确定要取消此核销记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await cancelCheckin(row._id)
      ElMessage.success('已取消')
      loadRecords()
      loadStats()
    } catch (e) {}
  }).catch(() => {})
}

async function handleAppointmentCheckin(appointmentId) {
  try {
    const appt = await getAppointment(appointmentId)
    if (appt) {
      await createCheckinFromAppointment(appt)
      ElMessage.success('已创建核销记录')
      loadRecords()
    }
  } catch (e) {}
}

onMounted(() => {
  loadStats()
  loadRecords()

  if (route.query.appointmentId) {
    handleAppointmentCheckin(route.query.appointmentId)
  }
})
</script>

<style scoped lang="scss">
.checkin-page {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .stat-label {
      font-size: 14px;
      color: #999;
      margin: 0 0 8px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin: 0;

      &.checked-in {
        color: #409eff;
      }

      &.completed {
        color: #67c23a;
      }

      &.money {
        color: #e6a23c;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .deduction-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
