<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">内容详情</h2>
      <div>
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <el-button type="primary" @click="goEdit" v-if="detail?.status === 'draft'">
          <el-icon><Edit /></el-icon>编辑
        </el-button>
        <el-button type="success" @click="handleSubmitReview" v-if="detail?.status === 'draft'">
          <el-icon><Promotion /></el-icon>提交审稿
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" v-if="detail">
      <el-col :span="16">
        <div class="card" style="margin-bottom: 16px">
          <div class="detail-header">
            <h3 style="margin: 0 0 12px 0">{{ detail.title }}</h3>
            <div class="detail-meta">
              <el-tag :type="getStatusType(detail.status)" size="large">{{ getStatusLabel(detail.status) }}</el-tag>
              <el-tag v-if="detail.isException" type="danger" size="large">异常</el-tag>
              <span class="meta-item">创建人：{{ getUserById(detail.creator).name }}</span>
              <span class="meta-item">负责人：{{ getUserById(detail.assignee).name }}</span>
              <span class="meta-item">创建时间：{{ formatDate(detail.createdAt) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">选题方向</div>
            <div class="detail-content">{{ detail.topic || '-' }}</div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">脚本内容</div>
            <div class="detail-content script-content">{{ detail.script || '-' }}</div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">目标平台</div>
            <div class="detail-content">
              <el-tag v-for="p in detail.targetPlatforms" :key="p" style="margin-right: 8px">
                {{ getPlatformLabel(p) }}
              </el-tag>
              <span v-if="!detail.targetPlatforms?.length">-</span>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">附件</div>
            <div class="detail-content" v-if="detail.attachments?.length">
              <el-space wrap>
                <div v-for="(f, i) in detail.attachments" :key="i" class="attachment-item">
                  <el-icon><Paperclip /></el-icon>
                  <a :href="f.url" target="_blank">{{ f.name }}</a>
                </div>
              </el-space>
            </div>
            <div class="detail-content" v-else>-</div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">备注</div>
            <div class="detail-content">{{ detail.remark || '-' }}</div>
          </div>

          <div class="detail-section" v-if="detail.isException">
            <div class="detail-section-title">异常信息</div>
            <div class="detail-content">
              <p><strong>异常原因：</strong>{{ detail.exceptionReason || '-' }}</p>
              <p><strong>处理结论：</strong>{{ detail.exceptionConclusion || '待处理' }}</p>
              <p><strong>处理人：</strong>{{ getUserById(detail.exceptionHandler).name }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="detail-section-title" style="margin-bottom: 16px">操作时间轴（修改历史）</div>
          <TimelineView :list="detail.history || []" />
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card" style="margin-bottom: 16px">
          <div class="detail-section-title" style="margin-bottom: 16px">审稿进度</div>
          <el-steps :active="activeStep" finish-status="success" direction="vertical">
            <el-step v-for="(n, i) in reviewNodes" :key="i" :title="n.name" :description="n.reviewers?.map(getUserName).join('、')" />
            <el-step title="发布完成" description="所有审稿通过后进入发布" />
          </el-steps>
        </div>

        <div class="card" style="margin-bottom: 16px" v-if="canReview">
          <div class="detail-section-title" style="margin-bottom: 16px">审稿操作</div>
          <el-form label-width="80px">
            <el-form-item label="操作">
              <el-radio-group v-model="reviewForm.action">
                <el-radio-button label="approve">通过</el-radio-button>
                <el-radio-button label="reject">驳回</el-radio-button>
                <el-radio-button label="transfer">转交</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="审核意见">
              <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitReview">提交审核</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <div class="detail-section-title" style="margin-bottom: 16px">关联信息</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="关联素材">{{ detail.materialId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布排期">{{ detail.scheduleId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ formatDate(detail.publishTime) }}</el-descriptions-item>
            <el-descriptions-item label="发布结果">{{ detail.publishResult || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi, reviewApi } from '@/api'
import { CONTENT_STATUS, PLATFORM_TYPE, USERS, getStatusLabel, getStatusType, formatDate, getUserById } from '@/utils/constants'
import TimelineView from '@/components/TimelineView.vue'

const route = useRoute()
const router = useRouter()
const contentId = route.params.id
const loading = ref(false)
const detail = ref(null)
const reviewNodes = ref([])
const activeStep = ref(0)
const canReview = computed(() => ['submitted', 'reviewing'].includes(detail.value?.status))
const reviewForm = reactive({
  action: 'approve',
  comment: ''
})

function getPlatformLabel(p) {
  if (typeof p === 'object') return p.name || p.platform
  return PLATFORM_TYPE[p]?.label || p
}

function getUserName(id) {
  return getUserById(id).name
}

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await contentApi.detail(contentId)
    if (detail.value.reviewFlowId) {
      const flow = await reviewApi.flowDetail(detail.value.reviewFlowId)
      reviewNodes.value = flow.nodes || []
      activeStep.value = detail.value.currentReviewNodeIndex || 0
      if (detail.value.status === 'approved' || detail.value.status === 'published') {
        activeStep.value = reviewNodes.value.length
      }
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function goEdit() {
  router.push(`/contents/create?id=${contentId}`)
}

function handleSubmitReview() {
  ElMessageBox.confirm('确定要提交进入审稿流程吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await contentApi.submitReview(contentId, { operator: 'u001' })
    ElMessage.success('已提交审稿')
    loadDetail()
  }).catch(() => {})
}

async function submitReview() {
  if (!detail.value.reviewFlowId) return
  try {
    await reviewApi.createRecord({
      contentId,
      flowId: detail.value.reviewFlowId,
      nodeName: reviewNodes.value[detail.value.currentReviewNodeIndex]?.name || '审稿',
      nodeIndex: detail.value.currentReviewNodeIndex,
      reviewer: 'u001',
      action: reviewForm.action,
      comment: reviewForm.comment
    })
    ElMessage.success('审核提交成功')
    loadDetail()
  } catch (e) {}
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.detail-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
  .detail-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    .meta-item {
      font-size: 13px;
      color: #606266;
    }
  }
}
.detail-content {
  color: #606266;
  line-height: 1.8;
}
.script-content {
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}
.attachment-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  a {
    color: #409EFF;
    text-decoration: none;
  }
}
</style>
