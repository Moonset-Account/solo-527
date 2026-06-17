<template>
  <div class="trace-query">
    <div class="page-card">
      <div class="page-title">
        <el-icon :size="20" color="#409EFF"><Search /></el-icon>
        事后追踪查询
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="人工复核记录" name="review">
          <el-form :inline="true" class="search-form">
            <el-form-item label="草稿编号">
              <el-input v-model="reviewQuery.draftNo" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="来源单据号">
              <el-input v-model="reviewQuery.sourceOrderNo" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="审核类型">
              <el-select v-model="reviewQuery.reviewType" placeholder="全部" clearable style="width: 140px">
                <el-option label="AI审核" value="AI" />
                <el-option label="人工复核" value="MANUAL" />
              </el-select>
            </el-form-item>
            <el-form-item label="审核结果">
              <el-select v-model="reviewQuery.reviewResult" placeholder="全部" clearable style="width: 140px">
                <el-option label="通过" value="PASS" />
                <el-option label="需修改" value="MODIFY" />
                <el-option label="驳回" value="REJECT" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="reviewQuery.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadReviewList">查询</el-button>
              <el-button @click="resetReviewQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="reviewList" border stripe style="width: 100%">
            <el-table-column prop="draftNo" label="草稿编号" width="180" />
            <el-table-column prop="version" label="版本" width="70" align="center">
              <template #default="{ row }">v{{ row.version }}</template>
            </el-table-column>
            <el-table-column prop="reviewType" label="审核类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.reviewType === 'AI' ? 'primary' : 'success'">
                  {{ row.reviewType === 'AI' ? 'AI审核' : '人工复核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reviewerName" label="审核人" width="100" />
            <el-table-column prop="reviewResult" label="审核结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getResultTagType(row.reviewResult)">
                  {{ getResultLabel(row.reviewResult) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="aiRiskScore" label="AI评分" width="90" align="center" />
            <el-table-column prop="reviewComment" label="审核意见" min-width="180" show-overflow-tooltip />
            <el-table-column prop="sourceOrderNo" label="来源单据号" width="150" />
            <el-table-column prop="operatorRemark" label="操作备注" width="150" show-overflow-tooltip />
            <el-table-column label="提醒状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.reminderSent" size="small" type="success">已发送</el-tag>
                <el-tag v-else size="small" type="info">未发送</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="审核时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDraft(row.draftId)">查看草稿</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 16px; text-align: right"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="reviewTotal"
            :page-sizes="[10, 20, 50]"
            v-model:current-page="reviewQuery.pageNum"
            v-model:page-size="reviewQuery.pageSize"
            @size-change="loadReviewList"
            @current-change="loadReviewList" />
        </el-tab-pane>

        <el-tab-pane label="禁用词命中记录" name="forbidden">
          <el-form :inline="true" class="search-form">
            <el-form-item label="草稿编号">
              <el-input v-model="hitQuery.draftNo" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="来源单据号">
              <el-input v-model="hitQuery.sourceOrderNo" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="禁用词">
              <el-input v-model="hitQuery.word" placeholder="请输入" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="hitQuery.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadHitList">查询</el-button>
              <el-button @click="resetHitQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="hitList" border stripe style="width: 100%">
            <el-table-column prop="draftNo" label="草稿编号" width="180" />
            <el-table-column prop="version" label="版本" width="70" align="center">
              <template #default="{ row }">v{{ row.version }}</template>
            </el-table-column>
            <el-table-column prop="word" label="命中禁用词" width="120">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.word }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hitCount" label="命中次数" width="90" align="center" />
            <el-table-column prop="sourceOrderNo" label="来源单据号" width="150" />
            <el-table-column prop="operatorRemark" label="操作备注" width="150" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="命中时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDraft(row.draftId)">查看草稿</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 16px; text-align: right"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="hitTotal"
            :page-sizes="[10, 20, 50]"
            v-model:current-page="hitQuery.pageNum"
            v-model:page-size="hitQuery.pageSize"
            @size-change="loadHitList"
            @current-change="loadHitList" />
        </el-tab-pane>

        <el-tab-pane label="提示词版本追溯" name="prompt">
          <el-form :inline="true" class="search-form">
            <el-form-item label="提示词模板">
              <el-select v-model="promptQuery.templateId" placeholder="全部" clearable style="width: 200px" @change="loadPromptVersions">
                <el-option
                  v-for="t in templateList"
                  :key="t.id"
                  :label="t.templateName"
                  :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源单据号">
              <el-input v-model="promptQuery.sourceOrderNo" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="filterPromptVersions">查询</el-button>
              <el-button @click="loadTemplateList">刷新</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="16">
            <el-col :span="8">
              <div class="template-list">
                <div class="list-title">提示词模板</div>
                <div
                  v-for="t in templateList"
                  :key="t.id"
                  class="template-item"
                  :class="{ active: promptQuery.templateId === t.id }"
                  @click="selectTemplate(t)">
                  <div class="tpl-name">{{ t.templateName }}</div>
                  <div class="tpl-code">{{ t.templateCode }}</div>
                  <div class="tpl-scene">
                    <el-tag size="small" :type="getSceneTagType(t.sceneType)">
                      {{ getSceneLabel(t.sceneType) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="16">
              <div class="version-list" v-if="currentTemplate">
                <div class="list-title">
                  版本历史 - {{ currentTemplate.templateName }}
                  <el-button type="primary" size="small" style="margin-left: 16px" @click="showAddVersion">
                    新增版本
                  </el-button>
                </div>
                <el-table :data="versionList" border stripe>
                  <el-table-column prop="version" label="版本" width="80" align="center">
                    <template #default="{ row }">v{{ row.version }}</template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag size="small" :type="row.status === 'ACTIVE' ? 'success' : row.status === 'DEPRECATED' ? 'info' : 'warning'">
                        {{ getPromptStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operatorName" label="操作人" width="100" />
                  <el-table-column prop="operatorRemark" label="操作备注" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="sourceOrderNo" label="来源单据" width="140" />
                  <el-table-column prop="createdAt" label="创建时间" width="170" />
                  <el-table-column label="操作" width="180" align="center">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="viewPromptVersion(row)">查看</el-button>
                      <el-button
                        v-if="row.status !== 'ACTIVE'"
                        type="success"
                        link
                        @click="activateVersion(row)">
                        启用
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else description="请选择左侧模板查看版本历史" />
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showVersionDetail" :title="`提示词版本 v${viewingPromptVersion?.version}`" width="700px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="版本">v{{ viewingPromptVersion?.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewingPromptVersion?.status === 'ACTIVE' ? 'success' : 'info'">
            {{ getPromptStatusLabel(viewingPromptVersion?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ viewingPromptVersion?.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="来源单据">{{ viewingPromptVersion?.sourceOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作备注" :span="2">{{ viewingPromptVersion?.operatorRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px">
        <div class="detail-label">提示词内容:</div>
        <div class="prompt-content">{{ viewingPromptVersion?.promptContent }}</div>
      </div>
    </el-dialog>

    <el-dialog v-model="showAddVersionDialog" title="新增提示词版本" width="600px">
      <el-form :model="newVersionForm" label-width="90px">
        <el-form-item label="提示词内容" required>
          <el-input
            v-model="newVersionForm.promptContent"
            type="textarea"
            :rows="8"
            placeholder="请输入提示词内容" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="newVersionForm.status">
            <el-radio value="DRAFT">草稿</el-radio>
            <el-radio value="ACTIVE">生效</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="newVersionForm.operatorRemark" placeholder="请输入变更说明" />
        </el-form-item>
        <el-form-item label="来源单据号">
          <el-input v-model="newVersionForm.sourceOrderNo" placeholder="请输入关联来源单据号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddVersionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitNewVersion">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewApi, forbiddenWordApi, promptApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('review')

const reviewQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  draftNo: '',
  sourceOrderNo: '',
  reviewType: '',
  reviewResult: '',
  dateRange: []
})
const reviewList = ref([])
const reviewTotal = ref(0)

const hitQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  draftNo: '',
  sourceOrderNo: '',
  word: '',
  dateRange: []
})
const hitList = ref([])
const hitTotal = ref(0)

const promptQuery = reactive({ templateId: null, sourceOrderNo: '' })
const templateList = ref([])
const allVersionList = ref([])
const versionList = ref([])
const currentTemplate = ref(null)

const showVersionDetail = ref(false)
const viewingPromptVersion = ref(null)
const showAddVersionDialog = ref(false)
const newVersionForm = reactive({
  promptContent: '',
  status: 'DRAFT',
  operatorRemark: '',
  sourceOrderNo: ''
})

onMounted(() => {
  loadReviewList()
  loadTemplateList()
})

async function loadReviewList() {
  const params = {
    pageNum: reviewQuery.pageNum,
    pageSize: reviewQuery.pageSize,
    reviewType: reviewQuery.reviewType || undefined,
    reviewResult: reviewQuery.reviewResult || undefined,
    sourceOrderNo: reviewQuery.sourceOrderNo || undefined,
    startDate: reviewQuery.dateRange?.[0],
    endDate: reviewQuery.dateRange?.[1]
  }
  try {
    const res = await reviewApi.queryReviews(params)
    if (res.success) {
      reviewList.value = res.data.records
      reviewTotal.value = res.data.total
    }
  } catch (e) {}
}

function resetReviewQuery() {
  reviewQuery.pageNum = 1
  reviewQuery.draftNo = ''
  reviewQuery.sourceOrderNo = ''
  reviewQuery.reviewType = ''
  reviewQuery.reviewResult = ''
  reviewQuery.dateRange = []
  loadReviewList()
}

async function loadHitList() {
  const params = {
    pageNum: hitQuery.pageNum,
    pageSize: hitQuery.pageSize,
    sourceOrderNo: hitQuery.sourceOrderNo || undefined,
    word: hitQuery.word || undefined,
    startDate: hitQuery.dateRange?.[0],
    endDate: hitQuery.dateRange?.[1]
  }
  try {
    const res = await forbiddenWordApi.queryWordHits(params)
    if (res.success) {
      hitList.value = res.data.records
      hitTotal.value = res.data.total
    }
  } catch (e) {}
}

function resetHitQuery() {
  hitQuery.pageNum = 1
  hitQuery.draftNo = ''
  hitQuery.sourceOrderNo = ''
  hitQuery.word = ''
  hitQuery.dateRange = []
  loadHitList()
}

async function loadTemplateList() {
  try {
    const res = await promptApi.getAllTemplates()
    if (res.success) {
      templateList.value = res.data
    }
  } catch (e) {}
}

async function selectTemplate(tpl) {
  promptQuery.templateId = tpl.id
  currentTemplate.value = tpl
  await loadPromptVersions()
}

async function loadPromptVersions() {
  if (!promptQuery.templateId) return
  try {
    const res = await promptApi.getTemplateVersions(promptQuery.templateId)
    if (res.success) {
      allVersionList.value = res.data
      filterPromptVersions()
    }
  } catch (e) {}
}

function filterPromptVersions() {
  let filtered = allVersionList.value
  if (promptQuery.sourceOrderNo) {
    filtered = filtered.filter(v =>
      v.sourceOrderNo && v.sourceOrderNo.includes(promptQuery.sourceOrderNo)
    )
  }
  versionList.value = filtered
}

function viewDraft(draftId) {
  if (draftId) {
    router.push(`/draft/${draftId}`)
  }
}

function viewPromptVersion(version) {
  viewingPromptVersion.value = version
  showVersionDetail.value = true
}

async function activateVersion(version) {
  try {
    await ElMessageBox.confirm(`确定将版本 v${version.version} 设为当前生效版本？`, '确认启用', { type: 'warning' })
    const user = userStore.currentUser
    const res = await promptApi.updateVersionStatus(version.id, {
      status: 'ACTIVE',
      operatorId: user.id,
      operatorName: user.realName,
      remark: '设为生效版本'
    })
    if (res.success) {
      ElMessage.success('启用成功')
      loadPromptVersions()
    }
  } catch (e) {}
}

function showAddVersion() {
  newVersionForm.promptContent = ''
  newVersionForm.status = 'DRAFT'
  newVersionForm.operatorRemark = ''
  newVersionForm.sourceOrderNo = ''
  showAddVersionDialog.value = true
}

async function submitNewVersion() {
  if (!newVersionForm.promptContent) {
    ElMessage.warning('请输入提示词内容')
    return
  }
  try {
    const user = userStore.currentUser
    const res = await promptApi.addVersion({
      templateId: currentTemplate.value.id,
      templateCode: currentTemplate.value.templateCode,
      promptContent: newVersionForm.promptContent,
      status: newVersionForm.status,
      operatorId: user.id,
      operatorName: user.realName,
      operatorRemark: newVersionForm.operatorRemark,
      sourceOrderNo: newVersionForm.sourceOrderNo
    })
    if (res.success) {
      ElMessage.success('新增成功')
      showAddVersionDialog.value = false
      loadPromptVersions()
    }
  } catch (e) {}
}

function getResultLabel(r) {
  const map = { PASS: '通过', MODIFY: '需修改', REJECT: '驳回' }
  return map[r] || r
}
function getResultTagType(r) {
  const map = { PASS: 'success', MODIFY: 'warning', REJECT: 'danger' }
  return map[r] || 'info'
}
function getSceneLabel(t) {
  const map = { CUSTOMER_COMPLAINT: '客诉回复', ORDER_FOLLOWUP: '订单跟进', PROMOTION: '营销推广' }
  return map[t] || t
}
function getSceneTagType(t) {
  const map = { CUSTOMER_COMPLAINT: 'danger', ORDER_FOLLOWUP: 'warning', PROMOTION: 'primary' }
  return map[t] || 'info'
}
function getPromptStatusLabel(s) {
  const map = { DRAFT: '草稿', ACTIVE: '生效中', DEPRECATED: '已弃用' }
  return map[s] || s
}
</script>

<style lang="scss" scoped>
.template-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  .list-title {
    padding: 12px 16px;
    font-weight: 600;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
  }
  .template-item {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f2f5;
    transition: background 0.2s;
    &:hover { background: #f5f7fa; }
    &.active { background: #ecf5ff; border-left: 3px solid #409EFF; }
    .tpl-name { font-weight: 600; margin-bottom: 4px; }
    .tpl-code { font-size: 12px; color: #909399; margin-bottom: 6px; }
  }
}
.version-list {
  .list-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }
}
.detail-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #606266;
}
.prompt-content {
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
</style>
