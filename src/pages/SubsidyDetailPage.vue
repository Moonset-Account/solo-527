<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Subsidy } from '@/types'
import { subsidyApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref<Subsidy | null>(null)

async function fetchDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    detail.value = await subsidyApi.getById(id)
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push('/subsidies')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
  }
  return map[status] || status
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

async function handleApprove() {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm('确认通过该补贴申请？', '审批确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })
    await subsidyApi.approve(detail.value.id, { approved: true })
    ElMessage.success('审批通过')
    fetchDetail()
  } catch {}
}

async function handleReject() {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm('确认驳回该补贴申请？', '审批确认', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await subsidyApi.approve(detail.value.id, { approved: false })
    ElMessage.success('已驳回')
    fetchDetail()
  } catch {}
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-loading="loading" class="subsidy-detail-page">
    <template v-if="detail">
      <div class="page-header">
        <div class="header-left">
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2>补贴详情</h2>
          <el-tag :type="getStatusType(detail.status)" size="large">
            {{ getStatusLabel(detail.status) }}
          </el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="补贴类型">{{ detail.type }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatAmount(detail.amount) }}</el-descriptions-item>
        <el-descriptions-item label="来源单据">
          <span class="link-text">{{ detail.sourceDocumentNo }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="补充说明">{{ detail.remark }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ detail.approvedBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ detail.approvedAt || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-card class="source-document-card" shadow="never">
        <template #header>
          <span>来源单据</span>
        </template>
        <div class="source-document-content">
          <span class="source-doc-no">{{ detail.sourceDocumentNo }}</span>
          <el-link
            v-if="detail.sourceDocumentUrl"
            :href="detail.sourceDocumentUrl"
            type="primary"
            target="_blank"
          >
            查看单据
          </el-link>
        </div>
      </el-card>

      <div v-if="detail.status === 'pending'" class="action-bar">
        <el-button type="success" @click="handleApprove">通过</el-button>
        <el-button type="danger" @click="handleReject">驳回</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.subsidy-detail-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.detail-descriptions {
  margin-bottom: 20px;
}

.source-document-card {
  margin-bottom: 20px;
}

.source-document-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.source-doc-no {
  font-size: 14px;
  color: #606266;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
