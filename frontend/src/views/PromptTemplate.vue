<template>
  <div class="prompt-template">
    <div class="page-card">
      <div class="toolbar">
        <div class="page-title" style="margin-bottom: 0">
          <el-icon :size="20" color="#409EFF"><MagicStick /></el-icon>
          提示词模板与版本管理
        </div>
        <el-button type="primary" @click="showAddTemplate">
          <el-icon><Plus /></el-icon>
          新增模板
        </el-button>
      </div>

      <el-row :gutter="16">
        <el-col :span="8">
          <div class="template-panel">
            <div class="panel-title">模板列表</div>
            <div class="template-list">
              <div
                v-for="t in templateList"
                :key="t.id"
                class="template-item"
                :class="{ active: selectedTemplate?.id === t.id }"
                @click="selectTemplate(t)">
                <div class="tpl-header">
                  <span class="tpl-name">{{ t.templateName }}</span>
                  <el-tag size="small" :type="getSceneTagType(t.sceneType)">
                    {{ getSceneLabel(t.sceneType) }}
                  </el-tag>
                </div>
                <div class="tpl-code">{{ t.templateCode }}</div>
                <div class="tpl-desc">{{ t.description }}</div>
                <div class="tpl-footer">
                  <span>共 {{ getVersionCount(t.id) }} 个版本</span>
                  <span v-if="getActiveVersion(t.id)">
                    生效: v{{ getActiveVersion(t.id)?.version }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="16">
          <div v-if="selectedTemplate" class="version-panel">
            <div class="panel-header">
              <div class="panel-title">
                {{ selectedTemplate.templateName }} - 版本历史
              </div>
              <el-button type="primary" size="small" @click="showAddVersion">
                <el-icon><Plus /></el-icon>
                新增版本
              </el-button>
            </div>

            <el-table :data="currentVersions" border stripe style="width: 100%">
              <el-table-column prop="version" label="版本" width="80" align="center">
                <template #default="{ row }">
                  <strong>v{{ row.version }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                  <el-tag v-if="row.status === 'ACTIVE'" type="success" size="small" effect="dark" style="margin-left: 4px">
                    当前
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="promptContent" label="提示词预览" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  <div style="font-family: monospace; font-size: 12px; line-height: 1.6">
                    {{ row.promptContent.substring(0, 100) }}{{ row.promptContent.length > 100 ? '...' : '' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="operatorName" label="操作人" width="90" />
              <el-table-column prop="operatorRemark" label="操作备注" min-width="140" show-overflow-tooltip />
              <el-table-column prop="sourceOrderNo" label="来源单据" width="120" show-overflow-tooltip />
              <el-table-column prop="createdAt" label="创建时间" width="160" />
              <el-table-column label="操作" width="200" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link @click="viewVersion(row)">查看</el-button>
                  <el-button
                    v-if="row.status !== 'ACTIVE'"
                    type="success"
                    link
                    @click="activateVersion(row)">
                    设为生效
                  </el-button>
                  <el-button
                    v-if="row.status === 'ACTIVE'"
                    type="info"
                    link
                    @click="deprecateVersion(row)">
                    弃用
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="请选择左侧模板查看版本详情" />
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showAddTemplateDialog" title="新增提示词模板" width="550px">
      <el-form :model="newTemplateForm" label-width="100px">
        <el-form-item label="模板编码" required>
          <el-input v-model="newTemplateForm.templateCode" placeholder="请输入模板编码，如 COMPLAINT_REPLY" />
        </el-form-item>
        <el-form-item label="模板名称" required>
          <el-input v-model="newTemplateForm.templateName" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="适用场景" required>
          <el-select v-model="newTemplateForm.sceneType" style="width: 100%">
            <el-option label="客诉回复" value="CUSTOMER_COMPLAINT" />
            <el-option label="订单跟进" value="ORDER_FOLLOWUP" />
            <el-option label="营销推广" value="PROMOTION" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newTemplateForm.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTemplate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddVersionDialog" title="新增提示词版本" width="650px" top="5vh">
      <el-form :model="newVersionForm" label-width="100px">
        <el-form-item label="提示词内容" required>
          <el-input
            v-model="newVersionForm.promptContent"
            type="textarea"
            :rows="12"
            placeholder="请输入完整的提示词内容，可用 {{变量名}} 作为占位符" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="newVersionForm.status">
            <el-radio value="DRAFT">
              <el-tag type="warning">草稿</el-tag>
            </el-radio>
            <el-radio value="ACTIVE">
              <el-tag type="success">生效（将替换当前生效版本）</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="newVersionForm.operatorRemark" placeholder="请输入变更说明，用于版本追踪" />
        </el-form-item>
        <el-form-item label="来源单据号">
          <el-input v-model="newVersionForm.sourceOrderNo" placeholder="请输入关联来源单据号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddVersionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitVersion">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVersionDetail" :title="`版本详情 - v${viewingVersion?.version}`" width="700px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="版本">v{{ viewingVersion?.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(viewingVersion?.status)">
            {{ getStatusLabel(viewingVersion?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ viewingVersion?.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewingVersion?.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="来源单据" :span="2">
          {{ viewingVersion?.sourceOrderNo || '（无）' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作备注" :span="2">
          {{ viewingVersion?.operatorRemark || '（无）' }}
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px">
        <div class="detail-title">提示词完整内容:</div>
        <div class="prompt-content">{{ viewingVersion?.promptContent }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { promptApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const templateList = ref([])
const selectedTemplate = ref(null)
const versionMap = ref({})

const showAddTemplateDialog = ref(false)
const newTemplateForm = reactive({
  templateCode: '',
  templateName: '',
  sceneType: 'CUSTOMER_COMPLAINT',
  description: ''
})

const showAddVersionDialog = ref(false)
const newVersionForm = reactive({
  promptContent: '',
  status: 'DRAFT',
  operatorRemark: '',
  sourceOrderNo: ''
})

const showVersionDetail = ref(false)
const viewingVersion = ref(null)

const currentVersions = computed(() => {
  if (!selectedTemplate.value) return []
  return versionMap.value[selectedTemplate.value.id] || []
})

onMounted(() => {
  loadTemplates()
})

async function loadTemplates() {
  try {
    const res = await promptApi.getAllTemplates()
    if (res.success) {
      templateList.value = res.data
      for (const tpl of res.data) {
        loadVersions(tpl.id)
      }
    }
  } catch (e) {}
}

async function loadVersions(templateId) {
  try {
    const res = await promptApi.getTemplateVersions(templateId)
    if (res.success) {
      versionMap.value[templateId] = res.data
    }
  } catch (e) {}
}

function selectTemplate(tpl) {
  selectedTemplate.value = tpl
}

function getVersionCount(templateId) {
  return (versionMap.value[templateId] || []).length
}

function getActiveVersion(templateId) {
  return (versionMap.value[templateId] || []).find(v => v.status === 'ACTIVE')
}

function showAddTemplate() {
  Object.assign(newTemplateForm, {
    templateCode: '',
    templateName: '',
    sceneType: 'CUSTOMER_COMPLAINT',
    description: ''
  })
  showAddTemplateDialog.value = true
}

async function submitTemplate() {
  if (!newTemplateForm.templateCode || !newTemplateForm.templateName) {
    ElMessage.warning('请填写必要信息')
    return
  }
  try {
    const user = userStore.currentUser
    const res = await promptApi.addTemplate(newTemplateForm, {
      operatorId: user.id,
      operatorName: user.realName
    })
    if (res.success) {
      ElMessage.success('模板创建成功')
      showAddTemplateDialog.value = false
      loadTemplates()
    }
  } catch (e) {}
}

function showAddVersion() {
  Object.assign(newVersionForm, {
    promptContent: '',
    status: 'DRAFT',
    operatorRemark: '',
    sourceOrderNo: ''
  })
  showAddVersionDialog.value = true
}

async function submitVersion() {
  if (!newVersionForm.promptContent) {
    ElMessage.warning('请输入提示词内容')
    return
  }
  try {
    const user = userStore.currentUser
    const res = await promptApi.addVersion({
      templateId: selectedTemplate.value.id,
      templateCode: selectedTemplate.value.templateCode,
      promptContent: newVersionForm.promptContent,
      status: newVersionForm.status,
      operatorId: user.id,
      operatorName: user.realName,
      operatorRemark: newVersionForm.operatorRemark,
      sourceOrderNo: newVersionForm.sourceOrderNo
    })
    if (res.success) {
      ElMessage.success('版本创建成功')
      showAddVersionDialog.value = false
      loadVersions(selectedTemplate.value.id)
    }
  } catch (e) {}
}

function viewVersion(version) {
  viewingVersion.value = version
  showVersionDetail.value = true
}

async function activateVersion(version) {
  try {
    await ElMessageBox.confirm(
      `确定将版本 v${version.version} 设为生效版本？当前生效版本将被标记为已弃用。`,
      '确认启用',
      { type: 'warning' }
    )
    const user = userStore.currentUser
    const res = await promptApi.updateVersionStatus(version.id, {
      status: 'ACTIVE',
      operatorId: user.id,
      operatorName: user.realName,
      remark: '设置为生效版本'
    })
    if (res.success) {
      ElMessage.success('已设为生效版本')
      loadVersions(selectedTemplate.value.id)
    }
  } catch (e) {}
}

async function deprecateVersion(version) {
  try {
    await ElMessageBox.confirm(`确定弃用版本 v${version.version}？`, '确认弃用', { type: 'warning' })
    const user = userStore.currentUser
    const res = await promptApi.updateVersionStatus(version.id, {
      status: 'DEPRECATED',
      operatorId: user.id,
      operatorName: user.realName,
      remark: '弃用版本'
    })
    if (res.success) {
      ElMessage.success('已弃用')
      loadVersions(selectedTemplate.value.id)
    }
  } catch (e) {}
}

function getSceneLabel(t) {
  const map = { CUSTOMER_COMPLAINT: '客诉回复', ORDER_FOLLOWUP: '订单跟进', PROMOTION: '营销推广' }
  return map[t] || t
}
function getSceneTagType(t) {
  const map = { CUSTOMER_COMPLAINT: 'danger', ORDER_FOLLOWUP: 'warning', PROMOTION: 'primary' }
  return map[t] || 'info'
}
function getStatusLabel(s) {
  const map = { DRAFT: '草稿', ACTIVE: '生效中', DEPRECATED: '已弃用' }
  return map[s] || s
}
function getStatusTagType(s) {
  const map = { DRAFT: 'warning', ACTIVE: 'success', DEPRECATED: 'info' }
  return map[s] || 'info'
}
</script>

<style lang="scss" scoped>
.template-panel, .version-panel {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}
.panel-title {
  padding: 12px 16px;
  font-weight: 600;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  .panel-title {
    padding: 0;
    background: transparent;
    border-bottom: none;
  }
}
.template-list {
  max-height: 600px;
  overflow-y: auto;
}
.template-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #fafafa; }
  &.active {
    background: #ecf5ff;
    border-left: 3px solid #409EFF;
  }
  .tpl-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    .tpl-name { font-weight: 600; font-size: 15px; }
  }
  .tpl-code {
    font-family: monospace;
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
  .tpl-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .tpl-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
  }
}
.detail-title {
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
  max-height: 350px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
</style>
