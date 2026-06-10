<template>
  <div class="cashier-page">
    <el-card class="stats-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <p class="label">今日订单</p>
            <p class="value">{{ dailyStats.totalCount || 0 }} 笔</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <p class="label">今日营收</p>
            <p class="value money">¥{{ dailyStats.totalAmount || 0 }}</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <p class="label">查询日期</p>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="loadStats"
            />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="服务" value="service" />
            <el-option label="会员卡" value="membership" />
            <el-option label="产品" value="product" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="filterForm.paymentMethod" placeholder="全部" clearable style="width: 120px">
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="刷卡" value="card" />
            <el-option label="会员卡" value="membership" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="loadRecords">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>收银记录</span>
          <el-button type="primary" @click="handleAdd">新增收银</el-button>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="顾客" width="100" />
        <el-table-column label="项目" min-width="200">
          <template #default="{ row }">
            {{ row.items?.map(i => i.name).join('、') }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应收" width="100">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实收" width="100">
          <template #default="{ row }">
            <span class="actual">¥{{ row.actualAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="{ row }">
            {{ paymentText(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="cashierName" label="收银员" width="100" />
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.refunded" type="danger" size="small">已退款</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleView(row)">详情</el-button>
            <el-button
              v-if="!row.refunded"
              type="danger"
              size="small"
              text
              @click="handleRefund(row)"
            >
              退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="cashierForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="cashierForm.type" style="width: 100%">
            <el-option label="服务" value="service" />
            <el-option label="会员卡" value="membership" />
            <el-option label="产品" value="product" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="顾客姓名">
          <el-input v-model="cashierForm.customerName" placeholder="请输入顾客姓名" />
        </el-form-item>
        <el-form-item label="顾客手机">
          <el-input v-model="cashierForm.customerPhone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="总金额">
          <el-input-number v-model="cashierForm.totalAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="cashierForm.discountAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实收金额">
          <el-input-number v-model="cashierForm.actualAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="cashierForm.paymentMethod">
            <el-radio value="cash">现金</el-radio>
            <el-radio value="wechat">微信</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="card">刷卡</el-radio>
            <el-radio value="membership">会员卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="cashierForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCashierRecords, createCashierRecord, refundCashierRecord, getDailyStats } from '@/api/cashier'
import dayjs from 'dayjs'

const loading = ref(false)
const records = ref([])
const dailyStats = ref({})
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const dateRange = ref([])

const filterForm = reactive({
  type: '',
  paymentMethod: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增收银')
const submitting = ref(false)

const cashierForm = reactive({
  type: 'service',
  customerName: '',
  customerPhone: '',
  totalAmount: 0,
  discountAmount: 0,
  actualAmount: 0,
  paymentMethod: 'wechat',
  items: [],
  remark: '',
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function typeText(type) {
  const map = {
    service: '服务',
    membership: '会员卡',
    product: '产品',
    other: '其他',
  }
  return map[type] || type
}

function paymentText(method) {
  const map = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝',
    card: '刷卡',
    membership: '会员卡',
    other: '其他',
  }
  return map[method] || method
}

async function loadStats() {
  try {
    dailyStats.value = await getDailyStats(selectedDate.value)
  } catch (e) {}
}

async function loadRecords() {
  loading.value = true
  try {
    const params = { ...filterForm }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const data = await getCashierRecords(params)
    records.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.type = ''
  filterForm.paymentMethod = ''
  dateRange.value = []
  loadRecords()
}

function handleAdd() {
  dialogTitle.value = '新增收银'
  cashierForm.type = 'service'
  cashierForm.customerName = ''
  cashierForm.customerPhone = ''
  cashierForm.totalAmount = 0
  cashierForm.discountAmount = 0
  cashierForm.actualAmount = 0
  cashierForm.paymentMethod = 'wechat'
  cashierForm.remark = ''
  cashierForm.items = []
  dialogVisible.value = true
}

function handleView(row) {
  // 查看详情
}

async function handleSubmit() {
  if (!cashierForm.actualAmount) {
    ElMessage.warning('请输入实收金额')
    return
  }

  submitting.value = true
  try {
    await createCashierRecord(cashierForm)
    ElMessage.success('收款成功')
    dialogVisible.value = false
    loadRecords()
    loadStats()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleRefund(row) {
  ElMessageBox.prompt('请输入退款金额', '退款', {
    confirmButtonText: '确认退款',
    cancelButtonText: '取消',
    inputValue: row.actualAmount,
    inputValidator: (value) => {
      if (!value || isNaN(Number(value))) {
        return '请输入有效金额'
      }
      if (Number(value) > row.actualAmount) {
        return '退款金额不能大于实收金额'
      }
      return true
    },
    type: 'warning',
  }).then(async ({ value }) => {
    try {
      await refundCashierRecord(row._id, Number(value))
      ElMessage.success('退款成功')
      loadRecords()
      loadStats()
    } catch (e) {}
  }).catch(() => {})
}

onMounted(() => {
  loadStats()
  loadRecords()
})
</script>

<style scoped lang="scss">
.cashier-page {
  .stats-card {
    margin-bottom: 20px;
  }

  .stat-item {
    text-align: center;

    .label {
      font-size: 14px;
      color: #999;
      margin: 0 0 8px 0;
    }

    .value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin: 0;

      &.money {
        color: #e6a23c;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actual {
    color: #e91e63;
    font-weight: bold;
  }
}
</style>
