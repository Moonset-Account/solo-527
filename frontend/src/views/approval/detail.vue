<template>
  <div class="approval-detail" v-loading="loading">
    <el-page-header @back="handleBack" content="审批详情">
      <template #extra>
        <StatusTag v-if="detail.status" :status="detail.status" :status-map="approvalStatusTagMap" />
      </template>
    </el-page-header>
    <el-row :gutter="16" class="content-row">
      <el-col :span="16">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">审批基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="审批编号">{{ detail.approvalNo }}</el-descriptions-item>
            <el-descriptions-item label="审批类型">折扣审批</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detail.applicantName }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ detail.applyTime }}</el-descriptions-item>
            <el-descriptions-item label="当前审批人">{{ detail.currentApproverName }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">折扣信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="原价">
              <span class="amount-text">{{ formatAmount(detail.originalAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="申请折扣率">
              <span class="discount-text">{{ formatPercent(detail.applyDiscountRate, 2, false) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="优惠金额">
              <span class="discount-text">- {{ formatAmount(detail.discountAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="申请成交价">
              <span class="amount-highlight">{{ formatAmount(detail.applyAmount) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">申请原因</span>
            </div>
          </template>
          <div class="apply-reason">{{ detail.applyReason || '暂无' }}</div>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">关联合同信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border v-if="contractInfo">
            <el-descriptions-item label="合同编号">{{ contractInfo.contractNo }}</el-descriptions-item>
            <el-descriptions-item label="合同名称">{{ contractInfo.contractName }}</el-descriptions-item>
            <el-descriptions-item label="客户姓名">{{ contractInfo.customerName }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ contractInfo.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="合同原价">
              {{ formatAmount(contractInfo.originalAmount) }}
            </el-descriptions-item>
            <el-descriptions-item label="签约日期">{{ contractInfo.signDate }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无合同信息" />
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">审批记录</span>
            </div>
          </template>
          <TimelineCard :items="approvalRecords" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="section-card action-card" shadow="never" v-if="canAction">
          <template #header>
            <div class="card-header">
              <span class="card-title">审批操作</span>
            </div>
          </template>
          <el-form :model="actionForm" label-position="top">
            <el-form-item label="审批意见">
              <el-input
                v-model="actionForm.remark"
                type="textarea"
                :rows="4"
                placeholder="请输入审批意见"
              />
            </el-form-item>
            <div class="action-buttons">
              <el-button type="success" :loading="actionLoading" @click="handleApprove">通过</el-button>
              <el-button type="danger" :loading="actionLoading" @click="handleReject">拒绝</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import TimelineCard from '@/components/TimelineCard.vue'
import { getApprovalDetail, approveApproval, rejectApproval } from '@/api/approval'
import { formatAmount, formatPercent } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const detail = ref({})
const contractInfo = ref({})
const approvalRecords = ref([])

const actionForm = reactive({
  remark: ''
})

const approvalStatusTagMap = {
  PENDING: { label: '待审批', type: 'warning' },
  APPROVING: { label: '审批中', type: 'primary' },
  APPROVED: { label: '已通过', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  WITHDRAWN: { label: '已撤回', type: 'info' }
}

const canAction = computed(() => {
  return detail.value.status === 'PENDING' || detail.value.status === 'APPROVING'
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getApprovalDetail(id)
    detail.value = res.data || {}
    contractInfo.value = detail.value.contract || {}
    approvalRecords.value = detail.value.approvalRecords || detail.value.records || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleApprove = async () => {
  actionLoading.value = true
  try {
    await approveApproval(route.params.id, { remark: actionForm.remark || '同意' })
    ElMessage.success('审批通过')
    fetchDetail()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async () => {
  if (!actionForm.remark) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  actionLoading.value = true
  try {
    await rejectApproval(route.params.id, { remark: actionForm.remark })
    ElMessage.success('已拒绝')
    fetchDetail()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.approval-detail {
  .content-row {
    margin-top: 16px;
  }

  .section-card {
    margin-bottom: 16px;
  }

  .card-header {
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .amount-text {
    font-size: 14px;
    color: #606266;
  }

  .amount-highlight {
    font-size: 16px;
    font-weight: 600;
    color: #f56c6c;
  }

  .discount-text {
    color: #67c23a;
    font-weight: 600;
  }

  .apply-reason {
    padding: 8px 0;
    font-size: 14px;
    color: #606266;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  .action-card {
    position: sticky;
    top: 16px;

    .action-buttons {
      display: flex;
      gap: 12px;

      .el-button {
        flex: 1;
      }
    }
  }
}
</style>
