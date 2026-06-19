<template>
  <div class="contract-list">
    <FilterBar
      :status-options="contractStatusOptions"
      :user-list="userList"
      @search="handleSearch"
      @reset="handleReset"
    />
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建合同
        </el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="contractNo" label="合同编号" min-width="160" />
        <el-table-column prop="contractName" label="合同名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="原价" min-width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.originalPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="折扣率" min-width="100" align="center">
          <template #default="{ row }">
            {{ formatPercent(row.discountRate, 2, false) }}
          </template>
        </el-table-column>
        <el-table-column label="合同金额" min-width="120" align="right">
          <template #default="{ row }">
            <span class="amount-highlight">{{ formatAmount(row.finalPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="contractStatusTagMap" />
          </template>
        </el-table-column>
        <el-table-column prop="signDate" label="签约日期" min-width="120" />
        <el-table-column label="操作" min-width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="warning" @click="handleDiscountApply(row)">折扣申请</el-button>
            <el-button link type="info" @click="handleApprovalStatus(row)">审批状态</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getContractList } from '@/api/contract'
import { getUserList } from '@/api/user'
import { CONTRACT_STATUS, getDictOptions } from '@/utils/dict'
import { formatAmount, formatPercent } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const userList = ref([])
const searchParams = reactive({})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const contractStatusOptions = getDictOptions(CONTRACT_STATUS)

const contractStatusTagMap = {
  DRAFT: { label: '草稿', type: 'info' },
  PENDING_APPROVAL: { label: '待审批', type: 'warning' },
  APPROVED: { label: '已通过', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  SIGNED: { label: '已签约', type: 'success' },
  EXECUTING: { label: '执行中', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'info' }
}

const fetchUserList = async () => {
  try {
    userList.value = await getUserList() || []
  } catch (e) {
    console.error(e)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const pageResult = await getContractList({
      ...searchParams,
      current: pagination.current,
      size: pagination.size
    })
    tableData.value = pageResult?.records || []
    pagination.total = pageResult?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  Object.assign(searchParams, params)
  pagination.current = 1
  fetchList()
}

const handleReset = () => {
  Object.keys(searchParams).forEach(key => delete searchParams[key])
  pagination.current = 1
  fetchList()
}

const handleCreate = () => {
  router.push('/contracts/create')
}

const handleView = (row) => {
  router.push(`/contracts/${row.id}`)
}

const handleDiscountApply = (row) => {
  router.push({ path: '/approvals/discount/apply', query: { contractId: row.id } })
}

const handleApprovalStatus = (row) => {
  router.push(`/contracts/${row.id}/approval`)
}

onMounted(() => {
  fetchUserList()
  fetchList()
})
</script>

<style lang="scss" scoped>
.contract-list {
  .table-card {
    .table-header {
      margin-bottom: 16px;
    }

    .amount-highlight {
      color: #f56c6c;
      font-weight: 600;
    }

    .pagination {
      margin-top: 16px;
      justify-content: flex-end;
      display: flex;
    }
  }
}
</style>
