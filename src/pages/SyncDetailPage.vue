<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { SyncTask } from '@/types'
import { syncApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const retrying = ref(false)
const detail = ref<SyncTask | null>(null)

async function fetchDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    detail.value = await syncApi.getTaskById(id)
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push('/sync')
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    meter_reading: '读数同步',
    meter_config: '配置同步',
    alarm_sync: '告警同步',
  }
  return map[type] || type
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    running: 'warning',
    pending: 'info',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    success: '成功',
    failed: '失败',
    running: '运行中',
    pending: '待执行',
  }
  return map[status] || status
}

function getFailCategoryLabel(category: string) {
  const map: Record<string, string> = {
    network: '网络',
    data: '数据',
    config: '配置',
    unknown: '未知',
  }
  return map[category] || category
}

async function handleRetry() {
  if (!detail.value) return
  retrying.value = true
  try {
    detail.value = await syncApi.retry(detail.value.id)
    ElMessage.success(detail.value.status === 'success' ? '重试成功' : '重试失败，请再次尝试')
  } catch {
    ElMessage.error('重试请求失败')
  } finally {
    retrying.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-loading="loading" class="sync-detail-page">
    <template v-if="detail">
      <div class="page-header">
        <div class="header-left">
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2>同步任务详情</h2>
          <el-tag :type="getStatusType(detail.status)" size="large">
            {{ getStatusLabel(detail.status) }}
          </el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="任务类型">{{ getTypeLabel(detail.type) }}</el-descriptions-item>
        <el-descriptions-item label="目标电表">{{ detail.meterNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detail.status)" size="small">
            {{ getStatusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ detail.triggeredAt }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detail.completedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.duration !== null ? `${detail.duration} ms` : '-' }}</el-descriptions-item>
      </el-descriptions>

      <template v-if="detail.status === 'failed'">
        <el-alert type="error" :closable="false" class="fail-section">
          <template #title>
            <span class="fail-section-title">失败原因</span>
          </template>
          <div class="fail-content">
            <div class="fail-category">
              <span class="fail-label">失败分类：</span>
              <el-tag type="danger" size="small">
                {{ getFailCategoryLabel(detail.failCategory || 'unknown') }}
              </el-tag>
            </div>
            <div class="friendly-reason">
              <span class="fail-label">友好描述：</span>
              <div class="friendly-reason-box">{{ detail.friendlyFailReason }}</div>
            </div>
            <el-collapse class="raw-error-collapse">
              <el-collapse-item title="查看原始错误信息" name="raw">
                <pre class="raw-error-text">{{ detail.failReason }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-alert>

        <el-card shadow="never" class="retry-card">
          <template #header>
            <span>重试操作</span>
          </template>
          <el-button type="primary" :loading="retrying" @click="handleRetry">
            重新同步
          </el-button>
        </el-card>

        <el-card v-if="detail.retryResults.length > 0" shadow="never" class="retry-record-card">
          <template #header>
            <span>重试记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(retry, index) in detail.retryResults"
              :key="index"
              :type="retry.success ? 'success' : 'danger'"
              :icon="retry.success ? 'CircleCheck' : 'CircleClose'"
              :timestamp="retry.retryAt"
              placement="top"
            >
              {{ retry.message }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </template>

      <template v-if="detail.status === 'success'">
        <el-alert type="success" :closable="false" class="success-section">
          <template #title>同步成功</template>
          该同步任务已成功完成，数据已正常写入。
        </el-alert>
      </template>
    </template>
  </div>
</template>

<style scoped>
.sync-detail-page {
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

.detail-descriptions {
  margin-bottom: 20px;
}

.fail-section {
  margin-bottom: 20px;
}

.fail-section-title {
  font-weight: 600;
  font-size: 15px;
}

.fail-content {
  margin-top: 8px;
}

.fail-category {
  margin-bottom: 12px;
}

.fail-label {
  font-size: 13px;
  color: #606266;
  margin-right: 4px;
}

.friendly-reason {
  margin-bottom: 12px;
}

.friendly-reason-box {
  margin-top: 6px;
  padding: 12px 16px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.raw-error-collapse {
  margin-top: 8px;
}

.raw-error-text {
  margin: 0;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

.retry-card {
  margin-bottom: 20px;
}

.retry-record-card {
  margin-bottom: 20px;
}

.success-section {
  margin-bottom: 20px;
}
</style>
