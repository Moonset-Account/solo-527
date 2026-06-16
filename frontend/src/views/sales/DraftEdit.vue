<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="Back" circle @click="handleBack" />
        <div>
          <h2 class="page-title">编辑草稿</h2>
          <div class="draft-meta">
            <el-tag :type="getStatusType(draftInfo.status)" size="small">
              {{ getStatusText(draftInfo.status) }}
            </el-tag>
            <span class="meta-text">
              <el-icon><Clock /></el-icon>
              最后更新：{{ formatRelativeTime(draftInfo.updatedAt) }}
            </span>
          </div>
        </div>
      </div>
      <div>
        <el-button @click="handleSaveDraft">
          <el-icon><DocumentCopy /></el-icon>
          保存草稿
        </el-button>
      </div>
    </div>

    <div class="edit-wrapper">
      <div class="editor-section">
        <EmailEditor
          ref="editorRef"
          v-model="draftData"
          @save-version="handleSaveVersion"
          @submit="handleSubmit"
          @send="handleSend"
        />

        <div class="review-section" v-if="reviewRecords.length">
          <div class="section-title">
            <el-icon :size="18"><ChatDotRound /></el-icon>
            <span>复核记录</span>
          </div>
          <div class="review-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="record in reviewRecords"
                :key="record.id"
                :timestamp="formatDateTime(record.createdAt)"
                :type="record.type === 'approved' ? 'success' : record.type === 'rejected' ? 'danger' : 'warning'"
              >
                <div class="review-item">
                  <div class="review-header">
                    <span class="reviewer">{{ record.reviewer }}</span>
                    <el-tag size="small" :type="record.type === 'approved' ? 'success' : 'danger'">
                      {{ record.type === 'approved' ? '通过' : '驳回' }}
                    </el-tag>
                  </div>
                  <p class="review-comment" v-if="record.comment">{{ record.comment }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>

      <div class="version-section">
        <VersionHistory
          :versions="versions"
          :active-id="activeVersionId"
          @select="handleSelectVersion"
          @restore="handleRestoreVersion"
          @view="handleViewVersion"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import EmailEditor from '@/components/EmailEditor.vue'
import VersionHistory from '@/components/VersionHistory.vue'
import { formatRelativeTime, formatDateTime, getStatusText, getStatusType } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const editorRef = ref(null)
const activeVersionId = ref(null)

const draftInfo = reactive({
  id: route.params.id,
  status: 'draft',
  createdAt: new Date(Date.now() - 7 * 86400000),
  updatedAt: new Date()
})

const draftData = reactive({
  recipient: 'client@example.com',
  subject: '关于Q2季度产品报价的回复',
  cc: '',
  content: '<p>尊敬的客户：</p><p>&nbsp;</p><p>感谢您对我们产品的关注，以下是Q2季度的产品报价详情...</p>'
})

const versions = ref([
  { id: 1, note: '最新版本，已更新报价细节', createdAt: new Date(), createdBy: '当前用户' },
  { id: 2, note: '修改了价格计算方式', createdAt: new Date(Date.now() - 3600000), createdBy: '当前用户' },
  { id: 3, note: '初版草稿', createdAt: new Date(Date.now() - 2 * 86400000), createdBy: '当前用户' }
])

const reviewRecords = ref([
  {
    id: 1,
    reviewer: '张经理',
    type: 'rejected',
    comment: '报价折扣力度需要与商务组确认，请调整后重新提交。',
    createdAt: new Date(Date.now() - 86400000)
  }
])

function handleBack() {
  router.back()
}

function handleSaveDraft() {
  draftInfo.updatedAt = new Date()
  ElMessage.success('草稿保存成功')
}

function handleSaveVersion(data) {
  const newVersion = {
    id: Date.now(),
    note: data.versionNote,
    createdAt: new Date(),
    createdBy: '当前用户'
  }
  versions.value.unshift(newVersion)
  ElMessage.success('版本保存成功')
}

function handleSubmit(data) {
  draftInfo.status = 'pending'
  ElMessage.success('已提交复核')
}

function handleSend(data) {
  ElMessageBox.confirm('确定要发送此邮件吗？', '提示', {
    confirmButtonText: '发送',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    draftInfo.status = 'sent'
    ElMessage.success('邮件发送成功')
  }).catch(() => {})
}

function handleSelectVersion(version) {
  activeVersionId.value = version.id
}

async function handleRestoreVersion(version) {
  try {
    await ElMessageBox.confirm(`确定要恢复到「${version.note || '此版本'}」吗？当前未保存的修改将丢失。`, '提示', {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('版本恢复成功')
  } catch (e) {
  }
}

function handleViewVersion(version) {
  router.push(`/drafts/${draftInfo.id}/versions/${version.id}`)
}

onMounted(() => {
  activeVersionId.value = versions.value[0]?.id || null
})
</script>

<style lang="scss" scoped>
.page-header {
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      margin: 0;
    }

    .draft-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;

      .meta-text {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.edit-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  height: calc(100vh - 160px);

  .editor-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    padding-right: 4px;

    .review-section {
      background: #fff;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      padding: 16px 20px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #303133;
      }

      .review-item {
        .review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;

          .reviewer {
            font-weight: 500;
          }
        }

        .review-comment {
          color: #606266;
          margin: 0;
          line-height: 1.6;
        }
      }
    }
  }

  .version-section {
    height: 100%;
    min-height: 0;
  }
}

@media (max-width: 1200px) {
  .edit-wrapper {
    grid-template-columns: 1fr;
    height: auto;

    .version-section {
      height: 400px;
    }
  }
}
</style>
