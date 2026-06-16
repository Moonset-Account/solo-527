<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">复核看板</h2>
      <div>
        <el-button type="success" plain>
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <StatCard label="待复核" :value="stats.pending" icon="Clock" type="warning" suffix="封" />
      </el-col>
      <el-col :span="6">
        <StatCard label="今日已复核" :value="stats.todayReviewed" icon="Check" type="success" suffix="封" />
      </el-col>
      <el-col :span="6">
        <StatCard label="本月通过率" :value="stats.approvalRate" icon="DataAnalysis" type="primary" suffix="%" :format="false" />
      </el-col>
      <el-col :span="6">
        <StatCard label="平均复核时长" :value="stats.avgTime" icon="Timer" type="info" suffix="分钟" />
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="review-tabs">
      <el-tab-pane label="待复核" name="pending">
        <DataTable
          :data="pendingList"
          :loading="loading"
          :total="pendingList.length"
          :show-pagination="false"
          :show-selection="true"
        >
          <template #actions>
            <el-button type="success" plain :disabled="!selectedRows.length" @click="handleBatchApprove">
              <el-icon><CircleCheck /></el-icon>
              批量通过
            </el-button>
            <el-button type="danger" plain :disabled="!selectedRows.length" @click="handleBatchReject">
              <el-icon><CircleClose /></el-icon>
              批量驳回
            </el-button>
          </template>

          <el-table-column prop="subject" label="邮件主题" min-width="200" />
          <el-table-column prop="submitter" label="提交人" width="100" />
          <el-table-column prop="recipient" label="收件人" min-width="180" show-overflow-tooltip />
          <el-table-column prop="submittedAt" label="提交时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.submittedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleReview(row)">
                <el-icon><View /></el-icon>
                复核
              </el-button>
              <el-button type="success" link size="small" @click="handleQuickApprove(row)">
                <el-icon><CircleCheck /></el-icon>
                通过
              </el-button>
              <el-button type="danger" link size="small" @click="handleQuickReject(row)">
                <el-icon><CircleClose /></el-icon>
                驳回
              </el-button>
            </template>
          </el-table-column>
        </DataTable>
      </el-tab-pane>

      <el-tab-pane label="已复核" name="reviewed">
        <DataTable
          :data="reviewedList"
          :loading="loading"
          :total="reviewedList.length"
          :show-search="true"
          search-placeholder="搜索主题、提交人..."
        >
          <template #toolbar>
            <el-select v-model="filterResult" placeholder="复核结果" clearable style="width: 140px">
              <el-option label="已通过" value="approved" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
          </template>

          <el-table-column prop="subject" label="邮件主题" min-width="200" />
          <el-table-column prop="submitter" label="提交人" width="100" />
          <el-table-column label="复核结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 'approved' ? 'success' : 'danger'" size="small">
                {{ row.result === 'approved' ? '已通过' : '已驳回' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewer" label="复核人" width="100" />
          <el-table-column prop="reviewedAt" label="复核时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.reviewedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </template>
          </el-table-column>
        </DataTable>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="reviewDialogVisible" title="邮件复核" width="900px" destroy-on-close>
      <div v-if="currentReview" class="review-content">
        <div class="review-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="邮件主题">{{ currentReview.subject }}</el-descriptions-item>
            <el-descriptions-item label="提交人">{{ currentReview.submitter }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ currentReview.recipient }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDateTime(currentReview.submittedAt) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="email-preview">
          <div class="preview-label">邮件内容预览：</div>
          <div class="preview-content" v-html="currentReview.content"></div>
        </div>
        <div class="review-form">
          <el-form label-width="80px">
            <el-form-item label="复核意见">
              <el-input v-model="reviewComment" type="textarea" :rows="3" placeholder="请输入复核意见（驳回时必填）" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject">
          <el-icon><CircleClose /></el-icon>
          驳回
        </el-button>
        <el-button type="success" @click="handleApprove">
          <el-icon><CircleCheck /></el-icon>
          通过
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import DataTable from '@/components/DataTable.vue'
import StatCard from '@/components/StatCard.vue'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const activeTab = ref('pending')
const filterResult = ref('')
const selectedRows = ref([])
const reviewDialogVisible = ref(false)
const currentReview = ref(null)
const reviewComment = ref('')

const stats = reactive({
  pending: 23,
  todayReviewed: 45,
  approvalRate: '87.5',
  avgTime: 32
})

const pendingList = ref([
  { id: 1, subject: 'Q2季度产品报价确认', submitter: '张三', recipient: 'client@example.com', submittedAt: new Date(), content: '<p>尊敬的客户，以下是Q2产品报价...</p>' },
  { id: 2, subject: '合作意向确认回复', submitter: '李四', recipient: 'partner@company.com', submittedAt: new Date(Date.now() - 3600000), content: '<p>感谢您对我们的关注...</p>' },
  { id: 3, subject: '项目进度周报发送', submitter: '王五', recipient: 'team@company.com', submittedAt: new Date(Date.now() - 2 * 3600000), content: '<p>各位好，本周项目进度如下...</p>' },
  { id: 4, subject: '客户投诉跟进邮件', submitter: '赵六', recipient: 'support@example.com', submittedAt: new Date(Date.now() - 3 * 3600000), content: '<p>关于您反馈的问题...</p>' },
  { id: 5, subject: '年度续约邀请邮件', submitter: '孙七', recipient: 'vip@client.com', submittedAt: new Date(Date.now() - 4 * 3600000), content: '<p>尊敬的VIP客户...</p>' }
])

const reviewedList = ref([
  { id: 101, subject: '产品发布会邀请', submitter: '张三', result: 'approved', reviewer: '王经理', reviewedAt: new Date(), content: '<p>尊敬的客户...</p>' },
  { id: 102, subject: '促销活动通知', submitter: '李四', result: 'rejected', reviewer: '王经理', reviewedAt: new Date(Date.now() - 3600000), content: '<p>亲爱的客户...</p>' },
  { id: 103, subject: '合同条款确认', submitter: '王五', result: 'approved', reviewer: '李总监', reviewedAt: new Date(Date.now() - 2 * 3600000), content: '<p>关于合同条款...</p>' },
  { id: 104, subject: '售后服务回复', submitter: '赵六', result: 'approved', reviewer: '王经理', reviewedAt: new Date(Date.now() - 5 * 3600000), content: '<p>尊敬的用户...</p>' },
  { id: 105, subject: '新客户介绍邮件', submitter: '孙七', result: 'approved', reviewer: '李总监', reviewedAt: new Date(Date.now() - 8 * 3600000), content: '<p>您好，非常荣幸...</p>' }
])

function handleReview(row) {
  currentReview.value = row
  reviewComment.value = ''
  reviewDialogVisible.value = true
}

function handleViewDetail(row) {
  currentReview.value = row
  reviewDialogVisible.value = true
}

function handleQuickApprove(row) {
  ElMessage.success(`已通过：${row.subject}`)
}

function handleQuickReject(row) {
  ElMessageBox.prompt('请输入驳回原因', '驳回邮件', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '请详细说明驳回原因',
    type: 'warning'
  }).then(() => {
    ElMessage.success(`已驳回：${row.subject}`)
  }).catch(() => {})
}

function handleBatchApprove() {
  ElMessageBox.confirm(`确定要通过选中的 ${selectedRows.value.length} 封邮件吗？`, '提示', {
    confirmButtonText: '确认通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    ElMessage.success(`已批量通过 ${selectedRows.value.length} 封邮件`)
  }).catch(() => {})
}

function handleBatchReject() {
  ElMessageBox.prompt(`请输入批量驳回原因（${selectedRows.value.length} 封）`, '批量驳回', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入驳回原因',
    type: 'warning'
  }).then(() => {
    ElMessage.success(`已批量驳回 ${selectedRows.value.length} 封邮件`)
  }).catch(() => {})
}

function handleApprove() {
  ElMessage.success('复核通过')
  reviewDialogVisible.value = false
}

function handleReject() {
  if (!reviewComment.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  ElMessage.success('已驳回')
  reviewDialogVisible.value = false
}

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 20px;
}

.review-tabs {
  background: #fff;
  border-radius: 4px;
  padding: 0 20px;

  :deep(.el-tabs__content) {
    padding: 16px 0;
  }
}

.review-content {
  .review-info {
    margin-bottom: 16px;
  }

  .email-preview {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 16px;
    background: #fafbfc;
    margin-bottom: 16px;

    .preview-label {
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }

    .preview-content {
      line-height: 1.8;
      color: #606266;
      max-height: 300px;
      overflow-y: auto;
    }
  }
}
</style>
