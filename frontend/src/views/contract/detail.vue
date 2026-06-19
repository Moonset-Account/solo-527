<template>
  <div class="contract-detail" v-loading="loading">
    <el-page-header @back="handleBack" :content="detail.contractName || '合同详情'">
      <template #extra>
        <el-button type="primary" @click="handleEdit">编辑</el-button>
      </template>
    </el-page-header>
    <el-row :gutter="16" class="content-row">
      <el-col :span="16">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">基本信息</span>
              <StatusTag :status="detail.status" :status-map="contractStatusTagMap" />
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同编号">{{ detail.contractNo }}</el-descriptions-item>
            <el-descriptions-item label="合同名称">{{ detail.contractName }}</el-descriptions-item>
            <el-descriptions-item label="合同类型">{{ getDecorationTypeName(decorationType) }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ detail.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="关联线索">{{ detail.leadName }}</el-descriptions-item>
            <el-descriptions-item label="签约日期">{{ detail.signDate }}</el-descriptions-item>
            <el-descriptions-item label="客户姓名" :span="2">{{ detail.customerName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ formatPhone(detail.customerPhone) }}</el-descriptions-item>
            <el-descriptions-item label="客户地址">{{ detail.customerAddress }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">金额信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="原价">
              <span class="amount-text">{{ formatAmount(detail.originalAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="折扣率">
              {{ formatPercent(detail.discountRate, 2, false) }}
            </el-descriptions-item>
            <el-descriptions-item label="优惠金额">
              <span class="discount-text">- {{ formatAmount(detail.discountAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="合同金额">
              <span class="amount-highlight">{{ formatAmount(detail.contractAmount) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">条款信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="付款条款" :span="2">{{ detail.paymentTerms }}</el-descriptions-item>
            <el-descriptions-item label="工期（天）">{{ detail.constructionPeriod }}</el-descriptions-item>
            <el-descriptions-item label="开工日期">{{ detail.startDate }}</el-descriptions-item>
            <el-descriptions-item label="竣工日期">{{ detail.endDate }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">审批信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="审批状态">
              <StatusTag :status="detail.approvalStatus" :status-map="approvalStatusTagMap" />
            </el-descriptions-item>
            <el-descriptions-item label="当前审批人">{{ detail.currentApproverName }}</el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">{{ detail.approvalRemark }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">附件列表</span>
            </div>
          </template>
          <div class="attachment-upload-wrapper">
            <AttachmentUpload
              v-model="attachmentList"
              :upload-url="uploadUrl"
              @change="handleAttachmentChange"
            />
          </div>
          <div v-if="attachmentList && attachmentList.length" class="attachment-list">
            <div v-for="(item, index) in attachmentList" :key="item.id || index" class="attachment-item">
              <el-icon class="attachment-icon"><Document /></el-icon>
              <a :href="item.url" target="_blank" class="attachment-name">{{ item.name }}</a>
              <span class="attachment-size">{{ formatFileSize(item.size) }}</span>
              <el-button
                type="danger"
                link
                size="small"
                class="delete-btn"
                @click="handleDeleteAttachment(item)"
              >
                删除
              </el-button>
            </div>
          </div>
          <el-empty v-if="!attachmentList || !attachmentList.length" description="暂无附件" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">操作记录</span>
            </div>
          </template>
          <TimelineCard :items="timelineItems" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import TimelineCard from '@/components/TimelineCard.vue'
import AttachmentUpload from '@/components/AttachmentUpload.vue'
import { getContractDetail, deleteContractAttachment } from '@/api/contract'
import { DECORATION_TYPE, getDecorationTypeName } from '@/utils/dict'
import { formatAmount, formatPercent, formatPhone, formatFileSize } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref({})
const attachmentList = ref([])
const timelineItems = ref([])

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

const approvalStatusTagMap = {
  PENDING: { label: '待审批', type: 'warning' },
  APPROVING: { label: '审批中', type: 'primary' },
  APPROVED: { label: '已通过', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  WITHDRAWN: { label: '已撤回', type: 'info' }
}

const decorationType = ref('')

const uploadUrl = computed(() => {
  const id = route.params.id
  return `/api/contracts/${id}/attachments`
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getContractDetail(id)
    detail.value = res.data || {}
    decorationType.value = detail.value.decorationType
    attachmentList.value = detail.value.attachments || []
    timelineItems.value = detail.value.operationLogs || detail.value.timeline || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/contracts/${route.params.id}/edit`)
}

const handleAttachmentChange = (files) => {
  attachmentList.value = files
}

const handleDeleteAttachment = async (item) => {
  try {
    await ElMessageBox.confirm('确定删除该附件吗？', '提示', {
      type: 'warning'
    })
    if (item.id) {
      await deleteContractAttachment(route.params.id, item.id)
    }
    attachmentList.value = attachmentList.value.filter(
      att => att.id !== item.id && att.url !== item.url
    )
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.contract-detail {
  .content-row {
    margin-top: 16px;
  }

  .section-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

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

  .attachment-upload-wrapper {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }

  .attachment-list {
    .attachment-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .attachment-icon {
        font-size: 16px;
        color: #409eff;
        margin-right: 8px;
      }

      .attachment-name {
        flex: 1;
        color: #409eff;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
          text-decoration: underline;
        }
      }

      .attachment-size {
        color: #909399;
        font-size: 12px;
        margin-left: 8px;
        margin-right: 8px;
      }

      .delete-btn {
        margin-left: auto;
      }
    }
  }
}
</style>
