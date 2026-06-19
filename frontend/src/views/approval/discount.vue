<template>
  <div class="approval-discount">
    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="待我审批" name="pending" />
      <el-tab-pane label="我发起的" name="my" />
    </el-tabs>
    <el-form :model="filterForm" inline class="filter-bar">
      <el-form-item label="审批状态">
        <el-select
          v-model="filterForm.statuses"
          multiple
          placeholder="请选择状态"
          clearable
          style="width: 220px"
        >
          <el-option
            v-for="item in approvalStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item v-if="activeTab === 'my'" label="申请人">
        <el-select
          v-model="filterForm.applicantId"
          placeholder="请选择申请人"
          clearable
          style="width: 160px"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname || user.username"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="approvalNo" label="审批编号" min-width="160" />
        <el-table-column prop="contractName" label="关联合同" min-width="180" show-overflow-tooltip />
        <el-table-column label="原价" min-width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.originalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="申请折扣" min-width="120" align="center">
          <template #default="{ row }">
            {{ formatPercent(row.applyDiscountRate, 2, false) }}
          </template>
        </el-table-column>
        <el-table-column label="申请金额" min-width="120" align="right">
          <template #default="{ row }">
            <span class="amount-highlight">{{ formatAmount(row.applyAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" min-width="100" />
        <el-table-column prop="currentApproverName" label="当前审批人" min-width="100" />
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="approvalStatusTagMap" />
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="操作" min-width="200" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="activeTab === 'pending' && (row.status === 'PENDING' || row.status === 'APPROVING')">
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button link type="primary" @click="handleView(row)">查看详情</el-button>
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
    <el-dialog
      v-model="rejectDialogVisible"
      title="审批拒绝"
      width="500px"
    >
      <el-form :model="rejectForm" label-position="top">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { getApprovalList, approveApproval, rejectApproval } from '@/api/approval'
import { getUserList } from '@/api/user'
import { APPROVAL_STATUS, getDictOptions } from '@/utils/dict'
import { formatAmount, formatPercent } from '@/utils/format'

const router = useRouter()

const activeTab = ref('pending')
const loading = ref(false)
const tableData = ref([])
const userList = ref([])
const searchParams = reactive({})

const filterForm = reactive({
  statuses: [],
  dateRange: [],
  applicantId: null
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const rejectForm = reactive({
  id: null,
  remark: ''
})

const approvalStatusOptions = getDictOptions(APPROVAL_STATUS)

const approvalStatusTagMap = {
  PENDING: { label: '待审批', type: 'warning' },
  APPROVING: { label: '审批中', type: 'primary' },
  APPROVED: { label: '已通过', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  WITHDRAWN: { label: '已撤回', type: 'info' }
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
    const pageResult = await getApprovalList({
      ...searchParams,
      type: 'DISCOUNT',
      scope: activeTab.value,
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

const handleTabChange = () => {
  pagination.current = 1
  fetchList()
}

const handleSearch = () => {
  Object.assign(searchParams, {
    statuses: filterForm.statuses,
    applicantId: filterForm.applicantId
  })
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    searchParams.startDate = filterForm.dateRange[0]
    searchParams.endDate = filterForm.dateRange[1]
  } else {
    delete searchParams.startDate
    delete searchParams.endDate
  }
  pagination.current = 1
  fetchList()
}

const handleReset = () => {
  filterForm.statuses = []
  filterForm.dateRange = []
  filterForm.applicantId = null
  Object.keys(searchParams).forEach(key => delete searchParams[key])
  pagination.current = 1
  fetchList()
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定通过该审批吗？', '提示', {
      type: 'warning'
    })
    await approveApproval(row.id, { remark: '同意' })
    ElMessage.success('审批通过')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const handleReject = (row) => {
  rejectForm.id = row.id
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.remark) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  rejectLoading.value = true
  try {
    await rejectApproval(rejectForm.id, { remark: rejectForm.remark })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    fetchList()
  } catch (e) {
    console.error(e)
  } finally {
    rejectLoading.value = false
  }
}

const handleView = (row) => {
  router.push(`/approvals/${row.id}`)
}

onMounted(() => {
  fetchUserList()
  fetchList()
})
</script>

<style lang="scss" scoped>
.approval-discount {
  .main-tabs {
    background-color: #fff;
    padding: 0 16px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .filter-bar {
    padding: 16px;
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .table-card {
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
