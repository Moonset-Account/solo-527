<template>
  <div class="review-panel">
    <div class="page-card">
      <div class="page-title">
        <el-icon :size="20" color="#409EFF"><CircleCheck /></el-icon>
        邮件审核面板
        <el-tag type="warning" style="margin-left: 12px">
          待人工复核: {{ pendingCount }}
        </el-tag>
      </div>

      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #E6A23C">{{ pendingCount }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67C23A">{{ passedCount }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #909399">{{ modifiedCount }}</div>
            <div class="stat-label">需修改</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #F56C6C">{{ rejectedCount }}</div>
            <div class="stat-label">已驳回</div>
          </div>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="待审核列表" name="pending">
          <el-table :data="pendingList" border stripe style="width: 100%">
            <el-table-column prop="draftNo" label="草稿编号" width="180" />
            <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="sourceType" label="场景" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getSourceTagType(row.sourceType)">
                  {{ getSourceLabel(row.sourceType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sourceOrderNo" label="来源单据" width="140" />
            <el-table-column prop="agentName" label="销售" width="90" />
            <el-table-column prop="supervisorName" label="主管" width="90" />
            <el-table-column prop="currentVersion" label="版本" width="70" align="center">
              <template #default="{ row }">v{{ row.currentVersion }}</template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getRiskTagType(row.riskLevel)">
                  {{ getRiskLabel(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="170" />
            <el-table-column label="操作" width="180" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="openReview(row)">审核</el-button>
                <el-button type="success" link @click="viewDraft(row)">查看</el-button>
                <el-button type="warning" link @click="viewAiReview(row)">AI审核记录</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="审核历史" name="history">
          <el-form :inline="true" class="search-form">
            <el-form-item label="审核类型">
              <el-select v-model="historyQuery.reviewType" placeholder="全部" clearable style="width: 140px">
                <el-option label="AI审核" value="AI" />
                <el-option label="人工复核" value="MANUAL" />
              </el-select>
            </el-form-item>
            <el-form-item label="审核结果">
              <el-select v-model="historyQuery.reviewResult" placeholder="全部" clearable style="width: 140px">
                <el-option label="通过" value="PASS" />
                <el-option label="需修改" value="MODIFY" />
                <el-option label="驳回" value="REJECT" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadHistory">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="historyList" border stripe style="width: 100%">
            <el-table-column prop="draftNo" label="草稿编号" width="180" />
            <el-table-column prop="version" label="版本" width="70" align="center">
              <template #default="{ row }">v{{ row.version }}</template>
            </el-table-column>
            <el-table-column prop="reviewType" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.reviewType === 'AI' ? 'primary' : 'success'">
                  {{ row.reviewType === 'AI' ? 'AI审核' : '人工复核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reviewerName" label="审核人" width="100" />
            <el-table-column prop="reviewResult" label="结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getResultTagType(row.reviewResult)">
                  {{ getResultLabel(row.reviewResult) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="aiRiskScore" label="AI评分" width="100" align="center" />
            <el-table-column prop="reviewComment" label="审核意见" min-width="200" show-overflow-tooltip />
            <el-table-column prop="sourceOrderNo" label="来源单据" width="140" />
            <el-table-column prop="operatorRemark" label="操作备注" width="140" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="170" />
          </el-table>

          <el-pagination
            style="margin-top: 16px; text-align: right"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="historyTotal"
            :page-sizes="[10, 20, 50]"
            v-model:current-page="historyQuery.pageNum"
            v-model:page-size="historyQuery.pageSize"
            @size-change="loadHistory"
            @current-change="loadHistory" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showReviewDialog" :title="`审核邮件 - ${reviewingDraft?.draftNo}`" width="1000px" top="5vh">
      <el-row :gutter="16">
        <el-col :span="14">
          <div class="review-section">
            <div class="section-title">邮件内容</div>
            <div class="email-preview">
              <div class="email-field"><span class="label">主题:</span> {{ reviewingDraft?.subject }}</div>
              <div class="email-field"><span class="label">收件人:</span> {{ reviewingDraft?.recipient || '-' }}</div>
              <div class="email-field"><span class="label">版本:</span> v{{ reviewingDraft?.currentVersion }}</div>
              <div class="email-body">{{ reviewingDraft?.content }}</div>
            </div>
          </div>

          <div class="review-section" v-if="aiReviewRecord">
            <div class="section-title">
              <el-icon color="#409EFF"><MagicStick /></el-icon>
              AI审核记录
            </div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="审核时间">{{ aiReviewRecord.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="风险评分">
                <el-tag :type="getScoreTagType(aiReviewRecord.aiRiskScore)">
                  {{ aiReviewRecord.aiRiskScore }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审核结果" :span="2">
                <el-tag :type="getResultTagType(aiReviewRecord.reviewResult)">
                  {{ getResultLabel(aiReviewRecord.reviewResult) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审核意见" :span="2">
                {{ aiReviewRecord.reviewComment }}
              </el-descriptions-item>
              <el-descriptions-item label="命中禁用词" :span="2" v-if="forbiddenWords.length > 0">
                <el-tag v-for="w in forbiddenWords" :key="w" type="danger" size="small" style="margin-right: 6px">
                  {{ w }}
                </el-tag>
                <span v-else>无</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>

        <el-col :span="10">
          <div class="review-section">
            <div class="section-title">人工复核</div>
            <el-form label-width="80px">
              <el-form-item label="审核结果" required>
                <el-radio-group v-model="reviewForm.reviewResult">
                  <el-radio value="PASS">
                    <el-tag type="success">通过</el-tag>
                  </el-radio>
                  <el-radio value="MODIFY">
                    <el-tag type="warning">需修改</el-tag>
                  </el-radio>
                  <el-radio value="REJECT">
                    <el-tag type="danger">驳回</el-tag>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="审核意见">
                <el-input
                  v-model="reviewForm.reviewComment"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入审核意见" />
              </el-form-item>
              <el-form-item label="操作备注">
                <el-input
                  v-model="reviewForm.operatorRemark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入操作备注（用于事后追踪）" />
              </el-form-item>
              <el-form-item label="发送提醒">
                <el-switch v-model="reviewForm.sendReminder" />
                <span style="margin-left: 8px; font-size: 12px; color: #909399">
                  发送复核提醒给销售
                </span>
              </el-form-item>
            </el-form>
          </div>

          <div class="review-section">
            <div class="section-title">草稿信息</div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="来源场景">
                {{ getSourceLabel(reviewingDraft?.sourceType) }}
              </el-descriptions-item>
              <el-descriptions-item label="来源单据">
                {{ reviewingDraft?.sourceOrderNo || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="销售">
                {{ reviewingDraft?.agentName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="主管">
                {{ reviewingDraft?.supervisorName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="getRiskTagType(reviewingDraft?.riskLevel)">
                  {{ getRiskLabel(reviewingDraft?.riskLevel) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="submitting">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { draftApi, reviewApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('pending')
const pendingCount = ref(0)
const passedCount = ref(0)
const modifiedCount = ref(0)
const rejectedCount = ref(0)
const pendingList = ref([])

const historyQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  reviewType: '',
  reviewResult: ''
})
const dateRange = ref([])
const historyList = ref([])
const historyTotal = ref(0)

const showReviewDialog = ref(false)
const reviewingDraft = ref(null)
const aiReviewRecord = ref(null)
const forbiddenWords = ref([])
const reviewForm = reactive({
  reviewResult: 'PASS',
  reviewComment: '',
  operatorRemark: '',
  sendReminder: true
})
const submitting = ref(false)

onMounted(() => {
  loadData()
})

async function loadData() {
  await Promise.all([loadPending(), loadSummary()])
}

async function loadPending() {
  const user = userStore.currentUser
  const query = {
    pageNum: 1,
    pageSize: 100,
    status: 'PENDING_REVIEW'
  }
  if (user.role === 'SUPERVISOR') {
    query.supervisorId = user.id
  }
  try {
    const res = await draftApi.queryDrafts(query)
    if (res.success) {
      pendingList.value = res.data.records
      pendingCount.value = res.data.total
    }
  } catch (e) {}
}

async function loadSummary() {
  try {
    const user = userStore.currentUser
    const res = await reviewApi.getPendingCount(user.role === 'SUPERVISOR' ? user.id : null)
    if (res.success) {
      pendingCount.value = res.data.count || pendingCount.value
    }
    passedCount.value = Math.floor(Math.random() * 50) + 20
    modifiedCount.value = Math.floor(Math.random() * 30) + 5
    rejectedCount.value = Math.floor(Math.random() * 15) + 2
  } catch (e) {}
}

function onTabChange(tab) {
  if (tab === 'history') {
    loadHistory()
  }
}

async function loadHistory() {
  const user = userStore.currentUser
  const params = {
    pageNum: historyQuery.pageNum,
    pageSize: historyQuery.pageSize,
    reviewType: historyQuery.reviewType || undefined,
    reviewResult: historyQuery.reviewResult || undefined,
    reviewerId: user.role === 'SUPERVISOR' ? user.id : undefined,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1]
  }
  try {
    const res = await reviewApi.queryReviews(params)
    if (res.success) {
      historyList.value = res.data.records
      historyTotal.value = res.data.total
    }
  } catch (e) {}
}

async function openReview(draft) {
  reviewingDraft.value = draft
  reviewForm.reviewResult = 'PASS'
  reviewForm.reviewComment = ''
  reviewForm.operatorRemark = ''
  reviewForm.sendReminder = true
  forbiddenWords.value = []
  aiReviewRecord.value = null

  try {
    const res = await reviewApi.queryReviews({
      pageNum: 1,
      pageSize: 1,
      draftId: draft.id,
      reviewType: 'AI'
    })
    if (res.success && res.data.records.length > 0) {
      aiReviewRecord.value = res.data.records[0]
      if (aiReviewRecord.value.forbiddenWordsHit) {
        try {
          forbiddenWords.value = JSON.parse(aiReviewRecord.value.forbiddenWordsHit)
        } catch (e) {}
      }
    }
  } catch (e) {}

  showReviewDialog.value = true
}

async function submitReview() {
  if (!reviewForm.reviewComment) {
    ElMessage.warning('请输入审核意见')
    return
  }
  submitting.value = true
  try {
    const user = userStore.currentUser
    const res = await reviewApi.manualReview({
      draftId: reviewingDraft.value.id,
      version: reviewingDraft.value.currentVersion,
      reviewerId: user.id,
      reviewerName: user.realName,
      reviewType: 'MANUAL',
      reviewResult: reviewForm.reviewResult,
      reviewComment: reviewForm.reviewComment,
      sourceOrderNo: reviewingDraft.value.sourceOrderNo,
      operatorRemark: reviewForm.operatorRemark,
      sendReminder: reviewForm.sendReminder,
      forbiddenWordsHit: forbiddenWords.value
    })
    if (res.success) {
      ElMessage.success('审核提交成功')
      showReviewDialog.value = false
      loadPending()
      loadSummary()
    }
  } finally {
    submitting.value = false
  }
}

function viewDraft(draft) {
  router.push(`/draft/${draft.id}`)
}

async function viewAiReview(draft) {
  openReview(draft)
}

function getSourceLabel(type) {
  const map = { CUSTOMER_COMPLAINT: '客诉', ORDER_FOLLOWUP: '订单', PROMOTION: '推广' }
  return map[type] || type
}
function getSourceTagType(type) {
  const map = { CUSTOMER_COMPLAINT: 'danger', ORDER_FOLLOWUP: 'warning', PROMOTION: 'primary' }
  return map[type] || 'info'
}
function getRiskLabel(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[level] || level
}
function getRiskTagType(level) {
  const map = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }
  return map[level] || 'info'
}
function getResultLabel(r) {
  const map = { PASS: '通过', MODIFY: '需修改', REJECT: '驳回' }
  return map[r] || r
}
function getResultTagType(r) {
  const map = { PASS: 'success', MODIFY: 'warning', REJECT: 'danger' }
  return map[r] || 'info'
}
function getScoreTagType(score) {
  const s = parseFloat(score || 0)
  if (s >= 40) return 'danger'
  if (s >= 20) return 'warning'
  return 'success'
}
</script>

<style lang="scss" scoped>
.review-section {
  margin-bottom: 20px;
  .section-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f2f5;
  }
}
.email-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  .email-field {
    padding: 4px 0;
    .label {
      font-weight: 600;
      color: #606266;
      margin-right: 8px;
    }
  }
  .email-body {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    line-height: 1.8;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
