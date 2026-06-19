<template>
  <div class="payment-report">
    <el-row :gutter="16" class="summary-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-label">合同总额</div>
            <div class="card-value">{{ formatAmountWithPrefix(summary.totalAmount) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-label">计划回款</div>
            <div class="card-value">{{ formatAmountWithPrefix(summary.plannedAmount) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-label">实际回款</div>
            <div class="card-value success">{{ formatAmountWithPrefix(summary.receivedAmount) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-label">逾期金额</div>
            <div class="card-value danger">{{ formatAmountWithPrefix(summary.overdueAmount) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <FilterBar
      :show-keyword="false"
      :show-date-range="true"
      :show-owner="true"
      :user-list="userList"
      @search="handleSearch"
      @reset="handleReset"
    />

    <el-card shadow="never">
      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="contractNo" label="合同编号" width="160" />
        <el-table-column prop="projectName" label="项目名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户" width="140" show-overflow-tooltip />
        <el-table-column prop="ownerName" label="负责人" width="100" />
        <el-table-column prop="contractAmount" label="合同金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.contractAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedAmount" label="计划回款" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.plannedAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="实际回款" width="130" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.receivedAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="回款进度" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.min(Math.round(row.progress * 100), 100)"
              :status="row.progress >= 1 ? 'success' : row.progress >= 0.8 ? '' : 'warning'"
            />
          </template>
        </el-table-column>
        <el-table-column label="撞单说明" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.conflictRemark" type="warning" size="small" effect="light">
              {{ row.conflictRemark }}
            </el-tag>
            <span v-else class="text-muted">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="handleDuration" label="处理耗时" width="130">
          <template #default="{ row }">
            {{ formatDuration(row.handleDuration) }}
          </template>
        </el-table-column>
        <el-table-column prop="handlerName" label="责任人" width="100" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FilterBar from '@/components/FilterBar.vue'
import { getPaymentProgress } from '@/api/report'
import { formatAmount, formatAmountWithPrefix, formatDuration } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const userList = ref([])
const summary = reactive({
  totalAmount: 0,
  plannedAmount: 0,
  receivedAmount: 0,
  overdueAmount: 0
})
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})
const queryParams = reactive({
  startDate: '',
  endDate: '',
  ownerId: null
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPaymentProgress({
      ...queryParams,
      pageNum: pagination.current,
      pageSize: pagination.size
    })
    tableData.value = res.data?.records || []
    pagination.total = res.data?.total || 0
    if (res.data?.summary) {
      Object.assign(summary, res.data.summary)
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  Object.assign(queryParams, params)
  pagination.current = 1
  fetchData()
}

const handleReset = () => {
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.ownerId = null
  pagination.current = 1
  fetchData()
}

const handleViewDetail = (row) => {
  router.push(`/reports/payment/${row.contractId}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.payment-report {
  .summary-cards {
    margin-bottom: 16px;
  }

  .card-content {
    .card-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .card-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;

      &.success {
        color: #67c23a;
      }

      &.danger {
        color: #f56c6c;
      }
    }
  }

  .text-muted {
    color: #909399;
  }

  .pagination {
    margin-top: 16px;
    justify-content: flex-end;
    display: flex;
  }
}
</style>
