<template>
  <div class="draft-editor">
    <div class="page-card">
      <div class="toolbar">
        <div class="page-title" style="margin-bottom: 0">
          <el-button link @click="$router.back()" style="padding: 0; margin-right: 8px">
            <el-icon :size="20"><ArrowLeft /></el-icon>
          </el-button>
          <el-icon :size="20" color="#409EFF"><EditPen /></el-icon>
          编辑邮件 - {{ draft?.draftNo || '新建' }}
          <el-tag v-if="draft" :type="getStatusTagType(draft.status)" style="margin-left: 12px">
            {{ getStatusLabel(draft.status) }}
          </el-tag>
          <el-tag v-if="draft && draft.riskLevel !== 'LOW'" :type="getRiskTagType(draft.riskLevel)" style="margin-left: 8px">
            风险: {{ getRiskLabel(draft.riskLevel) }}
          </el-tag>
          <span v-if="draft" style="margin-left: 12px; font-size: 13px; color: #909399">
            当前版本: v{{ draft.currentVersion }}
          </span>
        </div>
        <div>
          <el-button @click="showHistory">
            <el-icon><Clock /></el-icon>
            历史版本
          </el-button>
          <el-button type="warning" @click="checkForbidden">
            <el-icon><Warning /></el-icon>
            禁用词检测
          </el-button>
          <el-button type="success" @click="aiGenerate" :loading="aiLoading">
            <el-icon><MagicStick /></el-icon>
            AI生成
          </el-button>
          <el-button type="primary" @click="saveDraft" :loading="saving">
            <el-icon><Document /></el-icon>
            保存版本
          </el-button>
          <el-button type="danger" @click="submitReview" v-if="canSubmit">
            <el-icon><CircleCheck /></el-icon>
            提交审核
          </el-button>
        </div>
      </div>

      <el-row :gutter="16">
        <el-col :span="18">
          <el-form :model="form" label-width="80px">
            <el-form-item label="主题">
              <el-input v-model="form.subject" placeholder="请输入邮件主题" />
            </el-form-item>
            <el-form-item label="收件人">
              <el-input v-model="form.recipient" placeholder="多个邮箱用逗号分隔" />
            </el-form-item>
            <el-form-item label="抄送">
              <el-input v-model="form.cc" placeholder="多个邮箱用逗号分隔" />
            </el-form-item>
            <el-form-item label="密送">
              <el-input v-model="form.bcc" placeholder="多个邮箱用逗号分隔" />
            </el-form-item>
            <el-form-item label="正文">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="20"
                placeholder="请输入邮件正文，或点击AI生成按钮自动撰写" />
            </el-form-item>
            <el-form-item label="变更说明">
              <el-input v-model="form.changeSummary" placeholder="请描述本次变更内容，用于版本记录" />
            </el-form-item>
          </el-form>
        </el-col>

        <el-col :span="6">
          <div class="side-panel">
            <div class="side-title">草稿信息</div>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="来源场景">
                {{ getSourceLabel(draft?.sourceType) }}
              </el-descriptions-item>
              <el-descriptions-item label="来源单据">
                {{ draft?.sourceOrderNo || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="销售">
                {{ draft?.agentName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="主管">
                {{ draft?.supervisorName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="提示词版本">
                <el-select
                  v-model="form.promptVersionId"
                  style="width: 100%"
                  placeholder="选择提示词版本">
                  <el-option
                    v-for="v in promptVersions"
                    :key="v.id"
                    :label="`v${v.version} - ${v.status === 'ACTIVE' ? '生效中' : v.status}`"
                    :value="v.id" />
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ draft?.createdAt || '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="side-title" style="margin-top: 20px">AI生成参数</div>
            <el-form label-width="70px" size="small">
              <el-form-item label="客户姓名">
                <el-input v-model="aiParams.customerName" placeholder="请输入" />
              </el-form-item>
              <el-form-item label="订单号">
                <el-input v-model="aiParams.orderNo" placeholder="请输入" />
              </el-form-item>
              <el-form-item label="内容摘要">
                <el-input
                  v-model="aiParams.content"
                  type="textarea"
                  :rows="4"
                  placeholder="简述需要AI处理的内容" />
              </el-form-item>
            </el-form>

            <div v-if="forbiddenHits.length > 0" class="side-title" style="margin-top: 20px; color: #F56C6C">
              <el-icon><Warning /></el-icon>
              命中禁用词 ({{ forbiddenHits.length }})
            </div>
            <div v-if="forbiddenHits.length > 0" class="forbidden-list">
              <div v-for="(w, i) in forbiddenHits" :key="i" class="forbidden-item">
                <el-tag type="danger" size="small">{{ w.word }}</el-tag>
                <span class="forbidden-cat">{{ getCategoryLabel(w.category) }}</span>
                <span class="forbidden-rep" v-if="w.replacement">建议: {{ w.replacement }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showHistoryDialog" title="版本历史" width="900px">
      <el-table :data="versionList" border stripe>
        <el-table-column prop="version" label="版本" width="80" align="center">
          <template #default="{ row }">v{{ row.version }}</template>
        </el-table-column>
        <el-table-column prop="subject" label="主题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contentSource" label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.contentSource === 'AI_GENERATED' ? 'primary' : 'info'">
              {{ getContentSourceLabel(row.contentSource) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="promptVersionId" label="提示词版本" width="120" align="center">
          <template #default="{ row }">{{ row.promptVersionId ? 'v' + row.promptVersionId : '-' }}</template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="changeSummary" label="变更说明" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="170" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="compareWithCurrent(row)">对比</el-button>
            <el-button type="success" link @click="viewVersion(row)">查看</el-button>
            <el-button type="warning" link @click="revertVersion(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="showCompareDialog" title="版本对比" width="1000px">
      <el-row :gutter="16">
        <el-col :span="12">
          <div class="compare-title">当前版本 v{{ draft?.currentVersion }}</div>
          <div class="compare-content">{{ form.content }}</div>
          <div class="compare-subject">主题: {{ form.subject }}</div>
        </el-col>
        <el-col :span="12">
          <div class="compare-title">对比版本 v{{ compareTarget?.version }}</div>
          <div class="compare-content">{{ compareTarget?.content }}</div>
          <div class="compare-subject">主题: {{ compareTarget?.subject }}</div>
        </el-col>
      </el-row>
    </el-dialog>

    <el-dialog v-model="showVersionContent" :title="`版本 v${viewingVersion?.version} 详情`" width="700px">
      <div class="version-detail">
        <div class="detail-row"><span class="label">主题:</span> {{ viewingVersion?.subject }}</div>
        <div class="detail-row"><span class="label">收件人:</span> {{ viewingVersion?.recipient || '-' }}</div>
        <div class="detail-row"><span class="label">操作人:</span> {{ viewingVersion?.operatorName }}</div>
        <div class="detail-row"><span class="label">变更说明:</span> {{ viewingVersion?.changeSummary }}</div>
        <div class="detail-row"><span class="label">创建时间:</span> {{ viewingVersion?.createdAt }}</div>
        <div class="detail-content">
          <div class="label">正文内容:</div>
          <div class="content-text">{{ viewingVersion?.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { draftApi, forbiddenWordApi, promptApi } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const draftId = computed(() => route.params.id)

const draft = ref(null)
const form = reactive({
  subject: '',
  recipient: '',
  cc: '',
  bcc: '',
  content: '',
  promptVersionId: null,
  changeSummary: ''
})
const aiParams = reactive({
  customerName: '',
  orderNo: '',
  content: ''
})
const saving = ref(false)
const aiLoading = ref(false)
const forbiddenHits = ref([])
const promptVersions = ref([])

const showHistoryDialog = ref(false)
const versionList = ref([])
const showCompareDialog = ref(false)
const compareTarget = ref(null)
const showVersionContent = ref(false)
const viewingVersion = ref(null)

const canSubmit = computed(() => {
  return draft.value && ['DRAFT', 'AI_GENERATED', 'REJECTED'].includes(draft.value.status)
})

onMounted(async () => {
  await Promise.all([loadDraft(), loadPromptVersions()])
})

async function loadDraft() {
  try {
    const res = await draftApi.getDraftById(draftId.value)
    if (res.success) {
      draft.value = res.data
      form.subject = res.data.subject || ''
      form.recipient = res.data.recipient || ''
      form.cc = res.data.cc || ''
      form.bcc = res.data.bcc || ''
      form.content = res.data.content || ''
      form.promptVersionId = res.data.promptVersionId
    }
  } catch (e) {}
}

async function loadPromptVersions() {
  try {
    const tplRes = await promptApi.getAllTemplates()
    if (tplRes.success && tplRes.data.length > 0) {
      const vRes = await promptApi.getTemplateVersions(tplRes.data[0].id)
      if (vRes.success) {
        promptVersions.value = vRes.data
      }
    }
  } catch (e) {}
}

async function saveDraft() {
  saving.value = true
  try {
    const user = userStore.currentUser
    const res = await draftApi.saveDraft(draftId.value, {
      ...form,
      agentId: user.id,
      agentName: user.realName
    })
    if (res.success) {
      ElMessage.success(`保存成功，新版本 v${res.data.currentVersion}`)
      draft.value = res.data
      form.changeSummary = ''
    }
  } finally {
    saving.value = false
  }
}

async function aiGenerate() {
  if (!form.promptVersionId) {
    ElMessage.warning('请先选择提示词版本')
    return
  }
  aiLoading.value = true
  try {
    const user = userStore.currentUser
    const res = await draftApi.generateByAI(draftId.value, {
      ...form,
      agentId: user.id,
      agentName: user.realName
    })
    if (res.success) {
      ElMessage.success('AI生成完成')
      draft.value = res.data
      form.subject = res.data.subject
      form.content = res.data.content
      await checkForbidden()
    }
  } finally {
    aiLoading.value = false
  }
}

async function checkForbidden() {
  if (!form.content) {
    ElMessage.warning('请先输入正文内容')
    return
  }
  try {
    const res = await forbiddenWordApi.checkContent({ content: form.content })
    if (res.success) {
      forbiddenHits.value = res.data
      if (res.data.length > 0) {
        ElMessage.warning(`检测到 ${res.data.length} 个禁用词，请及时修改`)
      } else {
        ElMessage.success('未检测到禁用词')
      }
    }
  } catch (e) {}
}

async function submitReview() {
  try {
    await ElMessageBox.confirm('确定提交审核吗？提交后将进入审核流程。', '确认提交', { type: 'warning' })
    const res = await draftApi.updateStatus(draftId.value, { status: 'PENDING_REVIEW', remark: '提交审核' })
    if (res.success) {
      ElMessage.success('已提交审核')
      loadDraft()
    }
  } catch (e) {}
}

async function showHistory() {
  try {
    const res = await draftApi.getDraftVersions(draftId.value)
    if (res.success) {
      versionList.value = res.data
      showHistoryDialog.value = true
    }
  } catch (e) {}
}

function compareWithCurrent(version) {
  compareTarget.value = version
  showCompareDialog.value = true
}

function viewVersion(version) {
  viewingVersion.value = version
  showVersionContent.value = true
}

async function revertVersion(version) {
  try {
    await ElMessageBox.confirm(
      `确定回滚到版本 v${version.version}？将创建新版本保存当前内容后再回滚。`,
      '确认回滚',
      { type: 'warning' }
    )
    const user = userStore.currentUser
    const res = await draftApi.revertToVersion(draftId.value, version.version, {
      operatorId: user.id,
      operatorName: user.realName
    })
    if (res.success) {
      ElMessage.success('回滚成功')
      draft.value = res.data
      form.subject = res.data.subject
      form.content = res.data.content
      showHistoryDialog.value = false
    }
  } catch (e) {}
}

function getSourceLabel(type) {
  const map = { CUSTOMER_COMPLAINT: '客诉回复', ORDER_FOLLOWUP: '订单跟进', PROMOTION: '营销推广' }
  return map[type] || type || '-'
}
function getStatusLabel(status) {
  const map = {
    DRAFT: '草稿', AI_GENERATED: 'AI已生成', PENDING_REVIEW: '待审核',
    REVIEWED: '已审核', APPROVED: '已通过', REJECTED: '已驳回', SENT: '已发送'
  }
  return map[status] || status
}
function getStatusTagType(status) {
  const map = {
    DRAFT: 'info', AI_GENERATED: 'primary', PENDING_REVIEW: 'warning',
    REVIEWED: '', APPROVED: 'success', REJECTED: 'danger', SENT: 'success'
  }
  return map[status] || 'info'
}
function getRiskLabel(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[level] || level
}
function getRiskTagType(level) {
  const map = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }
  return map[level] || 'info'
}
function getContentSourceLabel(source) {
  const map = { MANUAL: '人工', AI_GENERATED: 'AI生成', AI_MODIFIED: 'AI修改' }
  return map[source] || source
}
function getCategoryLabel(cat) {
  const map = { LEGAL: '法律合规', SENSITIVE: '敏感词', PROMISE: '过度承诺', OTHER: '其他' }
  return map[cat] || cat
}
</script>

<style lang="scss" scoped>
.side-panel {
  .side-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
.forbidden-list {
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  padding: 8px;
  background: #fef0f0;
  max-height: 200px;
  overflow-y: auto;
  .forbidden-item {
    padding: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px dashed #fbc4c4;
    &:last-child { border-bottom: none; }
    .forbidden-cat { font-size: 12px; color: #909399; }
    .forbidden-rep { font-size: 12px; color: #67c23a; }
  }
}
.compare-title {
  font-weight: 600;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}
.compare-content {
  line-height: 1.8;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
}
.compare-subject {
  font-size: 13px;
  color: #909399;
}
.version-detail {
  .detail-row {
    padding: 6px 0;
    border-bottom: 1px solid #f5f7fa;
    .label {
      font-weight: 600;
      margin-right: 8px;
      color: #606266;
    }
  }
  .detail-content {
    margin-top: 12px;
    .label {
      font-weight: 600;
      color: #606266;
      margin-bottom: 8px;
    }
    .content-text {
      line-height: 1.8;
      white-space: pre-wrap;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
  }
}
</style>
