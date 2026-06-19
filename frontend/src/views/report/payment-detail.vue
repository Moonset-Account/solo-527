<template>
  <div class="payment-detail">
    <el-page-header @back="handleBack" content="回款进度详情" />

    <el-row :gutter="16" class="section">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>合同信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同编号">{{ detail.contractNo }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ detail.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="项目名称" :span="2">{{ detail.projectName }}</el-descriptions-item>
            <el-descriptions-item label="客户" :span="2">{{ detail.customerName }}</el-descriptions-item>
            <el-descriptions-item label="合同金额" :span="2">
              <span class="amount">{{ formatAmountWithPrefix(detail.contractAmount) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Money /></el-icon>
              <span>回款汇总</span>
            </div>
          </template>
          <div class="payment-summary">
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="summary-item">
                  <div class="label">计划总额</div>
                  <div class="value">{{ formatAmount(detail.plannedAmount) }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="label">已回款</div>
                  <div class="value success">{{ formatAmount(detail.receivedAmount) }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="label">待回款</div>
                  <div class="value warning">{{ formatAmount(detail.pendingAmount) }}</div>
                </div>
              </el-col>
            </el-row>
            <div class="progress-wrapper">
              <el-progress
                :percentage="Math.min(Math.round(detail.progress * 100), 100)"
                :status="detail.progress >= 1 ? 'success' : detail.progress >= 0.8 ? '' : 'warning'"
                stroke-width="20"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="detail.conflictRemark || detail.conflictResult" shadow="never" class="section">
      <template #header>
        <div class="card-header">
          <el-icon><Warning /></el-icon>
          <span>撞单说明</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="线索撞单情况" :span="2">
          {{ detail.conflictRemark || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">
          {{ detail.conflictResult || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理耗时">{{ formatDuration(detail.handleDuration) }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ detail.handlerName || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="section">
      <template #header>
        <div class="card-header">
          <el-icon><Calendar /></el-icon>
          <span>回款计划</span>
        </div>
      </template>
      <el-table :data="detail.paymentPlans || []" stripe>
        <el-table-column prop="period" label="期次" width="80" align="center" />
        <el-table-column prop="periodName" label="期次名称" width="140" />
        <el-table-column prop="ratio" label="回款比例" width="110" align="center">
          <template #default="{ row }">
            {{ formatPercent(row.ratio) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedAmount" label="计划金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.plannedAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实际金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.actualAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedDate" label="计划日期" width="130" />
        <el-table-column prop="actualDate" label="实际日期" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="section">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>回款记录</span>
        </div>
      </template>
      <el-table :data="detail.paymentRecords || []" stripe>
        <el-table-column prop="paymentDate" label="回款日期" width="140" />
        <el-table-column prop="amount" label="金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方式" width="100" />
        <el-table-column prop="payer" label="付款人" width="120" />
        <el-table-column prop="payee" label="收款人" width="120" />
        <el-table-column prop="voucherNo" label="凭证号" width="160" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Money, Warning, Calendar, List } from '@element-plus/icons-vue'
import { getPaymentProgressDetail } from '@/api/report'
import { formatAmount, formatAmountWithPrefix, formatDuration, formatPercent } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = reactive({
  contractNo: '',
  projectName: '',
  customerName: '',
  ownerName: '',
  contractAmount: 0,
  plannedAmount: 0,
  receivedAmount: 0,
  pendingAmount: 0,
  progress: 0,
  conflictRemark: '',
  conflictResult: '',
  handleDuration: 0,
  handlerName: '',
  paymentPlans: [],
  paymentRecords: []
})

const getStatusType = (status) => {
  const map = {
    PAID: 'success',
    PENDING: 'warning',
    OVERDUE: 'danger',
    UNPAID: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    PAID: '已回款',
    PENDING: '待回款',
    OVERDUE: '已逾期',
    UNPAID: '未到期'
  }
  return map[status] || status
}

const handleBack = () => {
  router.back()
}

const fetchDetail = async () => {
  const contractId = route.params.id
  if (!contractId) return
  loading.value = true
  try {
    const res = await getPaymentProgressDetail(contractId)
    if (res.data) {
      Object.assign(detail, res.data)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.payment-detail {
  .section {
    margin-top: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .amount {
    font-size: 18px;
    font-weight: 600;
    color: #409eff;
  }

  .payment-summary {
    .summary-item {
      text-align: center;
      padding: 12px 0;

      .label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }

      .value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;

        &.success {
          color: #67c23a;
        }

        &.warning {
          color: #e6a23c;
        }
      }
    }

    .progress-wrapper {
      margin-top: 16px;
      padding: 0 8px;
    }
  }
}
</style>
