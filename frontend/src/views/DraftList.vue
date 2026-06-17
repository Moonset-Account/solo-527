<template>
  <div class="draft-list">
    <div class="page-card">
      <div class="toolbar">
        <div class="page-title" style="margin-bottom: 0">
          <el-icon :size="20" color="#409EFF"><Edit /></el-icon>
          邮件草稿管理
        </div>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建草稿
        </el-button>
      </div>

      <el-form :inline="true" class="search-form">
        <el-form-item label="草稿编号">
          <el-input v-model="query.draftNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="主题">
          <el-input v-model="query.subject" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="来源单号">
          <el-input v-model="query.sourceOrderNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="场景">
          <el-select v-model="query.sourceType" placeholder="全部" clearable style="width: 150px">
            <el-option label="客诉回复" value="CUSTOMER_COMPLAINT" />
            <el-option label="订单跟进" value="ORDER_FOLLOWUP" />
            <el-option label="营销推广" value="PROMOTION" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="AI已生成" value="AI_GENERATED" />
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="已审核" value="REVIEWED" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已发送" value="SENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="query.riskLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="width: 100%" @row-dblclick="goToEdit">
        <el-table-column prop="draftNo" label="草稿编号" width="180" />
        <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sourceType" label="场景" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getSourceTagType(row.sourceType)">
              {{ getSourceLabel(row.sourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sourceOrderNo" label="来源单据号" width="150" />
        <el-table-column prop="agentName" label="销售" width="100" />
        <el-table-column prop="supervisorName" label="主管" width="100" />
        <el-table-column prop="currentVersion" label="版本" width="70" align="center">
          <template #default="{ row }">v{{ row.currentVersion }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getRiskTagType(row.riskLevel)">
              {{ getRiskLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToEdit(row)">编辑</el-button>
            <el-button type="success" link @click="viewVersions(row)">版本</el-button>
            <el-button type="warning" link @click="submitReview(row)" v-if="row.status === 'DRAFT' || row.status === 'AI_GENERATED'">
              提交审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; text-align: right"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        @size-change="loadList"
        @current-change="loadList" />
    </div>

    <el-dialog v-model="showCreate" title="新建邮件草稿" width="600px">
      <el-form :model="createForm" label-width="100px" ref="createFormRef">
        <el-form-item label="邮件主题" prop="subject" required>
          <el-input v-model="createForm.subject" placeholder="请输入邮件主题" />
        </el-form-item>
        <el-form-item label="收件人">
          <el-input v-model="createForm.recipient" placeholder="多个邮箱用逗号分隔" />
        </el-form-item>
        <el-form-item label="场景类型" required>
          <el-select v-model="createForm.sourceType" style="width: 100%">
            <el-option label="客诉回复" value="CUSTOMER_COMPLAINT" />
            <el-option label="订单跟进" value="ORDER_FOLLOWUP" />
            <el-option label="营销推广" value="PROMOTION" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源单据号">
          <el-input v-model="createForm.sourceOrderNo" placeholder="请输入来源单据号" />
        </el-form-item>
        <el-form-item label="销售">
          <el-select v-model="createForm.agentId" style="width: 100%" @change="onAgentChange">
            <el-option
              v-for="a in agentList"
              :key="a.id"
              :label="`${a.realName} (${a.department})`"
              :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确定创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVersions" title="版本历史" width="900px">
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
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="changeSummary" label="变更说明" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="compareVersion(row)">对比</el-button>
            <el-button type="success" link @click="viewVersionContent(row)">查看</el-button>
            <el-button type="warning" link @click="revertToVersion(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="showContent" :title="`版本 v${currentVersion?.version} 内容`" width="700px">
      <div style="line-height: 1.8; white-space: pre-wrap; max-height: 400px; overflow-y: auto">
        {{ currentVersion?.content || '（无内容）' }}
      </div>
    </el-dialog>

    <el-dialog v-model="showCompare" title="版本对比" width="1000px">
      <el-row :gutter="16">
        <el-col :span="12">
          <div class="compare-title">当前版本 v{{ currentDraft?.currentVersion }}</div>
          <div class="compare-content">{{ currentDraft?.content }}</div>
        </el-col>
        <el-col :span="12">
          <div class="compare-title">历史版本 v{{ compareVersionData?.version }}</div>
          <div class="compare-content">{{ compareVersionData?.content }}</div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { draftApi, userApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  draftNo: '',
  subject: '',
  sourceOrderNo: '',
  sourceType: '',
  agentId: null,
  supervisorId: null,
  status: '',
  riskLevel: '',
  startDate: '',
  endDate: ''
})
const dateRange = ref([])
const tableData = ref([])
const total = ref(0)
const agentList = ref([])
const supervisorList = ref([])

const showCreate = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  subject: '',
  recipient: '',
  sourceType: '',
  sourceOrderNo: '',
  agentId: null,
  agentName: '',
  supervisorId: null,
  supervisorName: '',
  remark: ''
})

const showVersions = ref(false)
const versionList = ref([])
const currentDraft = ref(null)
const showContent = ref(false)
const currentVersion = ref(null)
const showCompare = ref(false)
const compareVersionData = ref(null)

onMounted(async () => {
  await loadUsers()
  loadList()
})

async function loadUsers() {
  try {
    const [aRes, sRes] = await Promise.all([
      userApi.getUsersByRole('AGENT'),
      userApi.getUsersByRole('SUPERVISOR')
    ])
    if (aRes.success) agentList.value = aRes.data
    if (sRes.success) supervisorList.value = sRes.data
  } catch (e) {}
}

async function loadList() {
  const params = { ...query }
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  const user = userStore.currentUser
  if (user.role === 'AGENT') {
    params.agentId = user.id
  } else if (user.role === 'SUPERVISOR') {
    params.supervisorId = user.id
  }
  try {
    const res = await draftApi.queryDrafts(params)
    if (res.success) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {}
}

function resetQuery() {
  query.draftNo = ''
  query.subject = ''
  query.sourceOrderNo = ''
  query.sourceType = ''
  query.status = ''
  query.riskLevel = ''
  query.pageNum = 1
  dateRange.value = []
  loadList()
}

function showCreateDialog() {
  const user = userStore.currentUser
  createForm.agentId = user.id
  createForm.agentName = user.realName
  if (user.role === 'AGENT') {
    const supervisor = supervisorList.value.find(s => true)
    if (supervisor) {
      createForm.supervisorId = supervisor.id
      createForm.supervisorName = supervisor.realName
    }
  }
  showCreate.value = true
}

function onAgentChange(val) {
  const agent = agentList.value.find(a => a.id === val)
  if (agent) {
    createForm.agentName = agent.realName
  }
}

async function submitCreate() {
  if (!createForm.subject || !createForm.sourceType) {
    ElMessage.warning('请填写必要信息')
    return
  }
  try {
    const res = await draftApi.createDraft(createForm)
    if (res.success) {
      ElMessage.success('创建成功')
      showCreate.value = false
      goToEdit(res.data)
    }
  } catch (e) {}
}

function goToEdit(row) {
  router.push(`/draft/${row.id}`)
}

async function viewVersions(row) {
  currentDraft.value = row
  try {
    const res = await draftApi.getDraftVersions(row.id)
    if (res.success) {
      versionList.value = res.data
      showVersions.value = true
    }
  } catch (e) {}
}

function viewVersionContent(version) {
  currentVersion.value = version
  showContent.value = true
}

function compareVersion(version) {
  compareVersionData.value = version
  showCompare.value = true
}

async function revertToVersion(version) {
  try {
    await ElMessageBox.confirm(
      `确定回滚到版本 v${version.version}？此操作将创建新版本`,
      '确认回滚',
      { type: 'warning' }
    )
    const user = userStore.currentUser
    const res = await draftApi.revertToVersion(currentDraft.value.id, version.version, {
      operatorId: user.id,
      operatorName: user.realName
    })
    if (res.success) {
      ElMessage.success('回滚成功')
      loadList()
      showVersions.value = false
    }
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

async function submitReview(row) {
  try {
    await ElMessageBox.confirm(
      '确定提交审核？提交后将自动触发AI审核，生成禁用词命中记录，如需人工复核将发送提醒。',
      '确认提交审核',
      { type: 'warning' }
    )
    const user = userStore.currentUser
    const res = await draftApi.submitForReview(row.id, {
      operatorId: user.id,
      operatorName: user.realName
    })
    if (res.success) {
      const aiReview = res.data.aiReview
      const needManual = res.data.needManualReview
      if (needManual) {
        ElMessageBox.alert(
          `<div style="line-height: 2">
            <p><strong>AI审核已完成</strong></p>
            <p>审核结果：<el-tag type="${aiReview.reviewResult === 'PASS' ? 'success' : 'warning'}">${aiReview.reviewResult === 'PASS' ? '通过' : '需修改'}</el-tag></p>
            <p>风险评分：${aiReview.aiRiskScore}</p>
            <p>审核意见：${aiReview.reviewComment}</p>
            <p style="color: #E6A23C">已进入人工复核流程，等待主管审核</p>
          </div>`,
          '提交审核成功',
          { dangerouslyUseHTMLString: true, type: 'warning' }
        )
      } else {
        ElMessage.success('AI审核通过，无需人工复核')
      }
      loadList()
    }
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

function getSourceLabel(type) {
  const map = { CUSTOMER_COMPLAINT: '客诉', ORDER_FOLLOWUP: '订单', PROMOTION: '推广' }
  return map[type] || type
}
function getSourceTagType(type) {
  const map = { CUSTOMER_COMPLAINT: 'danger', ORDER_FOLLOWUP: 'warning', PROMOTION: 'primary' }
  return map[type] || 'info'
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
</script>

<style lang="scss" scoped>
.compare-title {
  font-weight: 600;
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}
.compare-content {
  line-height: 1.8;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
