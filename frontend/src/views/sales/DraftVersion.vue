<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="Back" circle @click="handleBack" />
        <div>
          <h2 class="page-title">查看历史版本</h2>
          <div class="version-meta">
            <el-tag type="info" size="small">版本 V{{ versionNumber }}</el-tag>
            <span class="meta-text">
              <el-icon><User /></el-icon>
              {{ versionInfo.createdBy }}
            </span>
            <span class="meta-text">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(versionInfo.createdAt) }}
            </span>
          </div>
        </div>
      </div>
      <div>
        <el-button @click="handleCompare">
          <el-icon><Connection /></el-icon>
          对比当前版本
        </el-button>
        <el-button type="primary" @click="handleRestore">
          <el-icon><RefreshLeft /></el-icon>
          恢复此版本
        </el-button>
      </div>
    </div>

    <div v-if="versionInfo.note" class="version-note card">
      <div class="note-label">版本备注：</div>
      <div class="note-content">{{ versionInfo.note }}</div>
    </div>

    <el-alert v-if="showCompare" type="info" show-icon class="compare-alert" :closable="false">
      当前显示的是历史版本内容，您可以与最新版本进行对比，或恢复到此版本。
    </el-alert>

    <div class="version-viewer card">
      <div class="viewer-header">
        <div class="viewer-info">
          <div class="info-row">
            <span class="info-label">收件人：</span>
            <span class="info-value">{{ versionData.recipient || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">抄送：</span>
            <span class="info-value">{{ versionData.cc || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">主题：</span>
            <span class="info-value">{{ versionData.subject || '(无主题)' }}</span>
          </div>
        </div>
      </div>
      <div class="viewer-content">
        <div class="content-label">邮件正文：</div>
        <div class="content-html" v-html="versionData.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const showCompare = ref(false)
const versionNumber = ref(2)

const versionInfo = reactive({
  id: route.params.vid,
  draftId: route.params.id,
  note: '修改了价格计算方式，调整了折扣政策的描述',
  createdAt: new Date(Date.now() - 3600000),
  createdBy: '演示销售'
})

const versionData = reactive({
  recipient: 'client@example.com',
  subject: '关于Q2季度产品报价的回复（历史版本）',
  cc: 'manager@company.com',
  content: `
<p>尊敬的客户：</p>
<p>&nbsp;</p>
<p>感谢您对我们产品的关注。关于Q2季度的产品报价，经过内部讨论，我们提供以下方案：</p>
<p>&nbsp;</p>
<p><strong>产品报价明细：</strong></p>
<p>1. 基础版套餐：原价 ¥9,800/年，Q2优惠价 ¥7,800/年</p>
<p>2. 专业版套餐：原价 ¥29,800/年，Q2优惠价 ¥23,800/年</p>
<p>3. 企业版套餐：原价 ¥99,800/年，Q2优惠价 ¥79,800/年</p>
<p>&nbsp;</p>
<p>以上价格为初步报价，具体折扣可根据采购量进一步协商。</p>
<p>&nbsp;</p>
<p>期待您的反馈，如有疑问请随时联系。</p>
<p>&nbsp;</p>
<p>顺祝商祺</p>
<p>演示销售</p>
  `.trim()
})

function handleBack() {
  router.back()
}

function handleCompare() {
  showCompare.value = !showCompare.value
  ElMessage.info(showCompare.value ? '已开启对比模式' : '已关闭对比模式')
}

async function handleRestore() {
  try {
    await ElMessageBox.confirm('确定要将草稿恢复到此版本吗？当前最新版本会被覆盖。', '提示', {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('版本恢复成功')
    router.push(`/drafts/${versionInfo.draftId}/edit`)
  } catch (e) {
  }
}

onMounted(() => {
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

    .version-meta {
      display: flex;
      align-items: center;
      gap: 16px;
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

.version-note {
  padding: 16px 20px;
  margin-bottom: 16px;

  .note-label {
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .note-content {
    color: #606266;
    line-height: 1.6;
  }
}

.compare-alert {
  margin-bottom: 16px;
}

.version-viewer {
  padding: 0;
  overflow: hidden;

  .viewer-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    background-color: #fafbfc;

    .viewer-info {
      .info-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          width: 70px;
          color: #909399;
          flex-shrink: 0;
        }

        .info-value {
          color: #303133;
          flex: 1;
          word-break: break-all;
        }
      }
    }
  }

  .viewer-content {
    padding: 20px;

    .content-label {
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
    }

    .content-html {
      line-height: 1.8;
      color: #303133;
      padding: 20px;
      background-color: #fafbfc;
      border-radius: 4px;
      min-height: 300px;

      :deep(p) {
        margin: 0 0 8px;
      }

      :deep(strong) {
        color: #303133;
      }
    }
  }
}
</style>
