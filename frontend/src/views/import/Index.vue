<template>
  <div class="import-page">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="需求导入" name="import">
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              class="upload-dragger"
              drag
              action=""
              :auto-upload="false"
              accept=".xlsx,.xls"
              :limit="1"
              :on-change="handleFileChange"
              :on-exceed="handleExceed"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">仅支持 .xlsx / .xls 文件</div>
              </template>
            </el-upload>
            <div class="upload-actions">
              <el-button @click="handleDownloadTemplate">下载导入模板</el-button>
              <el-button type="primary" :disabled="!selectedFile" @click="handleImport">开始导入</el-button>
            </div>
          </div>

          <div v-if="importResult" class="import-result">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="成功数">
                <span class="result-success">{{ importResult.successCount }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="失败数">
                <span class="result-fail">{{ importResult.errorCount }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="errorRecords.length > 0" class="error-section">
            <div class="error-header">
              <span>失败记录</span>
              <el-button type="warning" size="small" @click="handleDownloadErrors">下载错误记录</el-button>
            </div>
            <el-table :data="errorRecords" stripe style="width: 100%">
              <el-table-column prop="rowNumber" label="行号" width="80" />
              <el-table-column prop="rawData" label="原始数据" min-width="200" />
              <el-table-column prop="errorMessage" label="错误信息" min-width="200" />
              <el-table-column label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'FIXED' ? 'success' : 'warning'" size="small">
                    {{ row.status === 'FIXED' ? '已修复' : '待修复' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="批量审批" name="approve">
          <div class="approve-actions">
            <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchApprove">
              批量审批
            </el-button>
          </div>
          <el-table
            ref="approveTableRef"
            :data="pendingRequirements"
            stripe
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="需求标题" min-width="180" />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityTag(row.priority)" size="small">{{ row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitterName" label="提交人" width="100" />
            <el-table-column prop="createdAt" label="提交时间" width="170" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="approveResultVisible" title="审批结果" width="400px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="成功数">
          <span class="result-success">{{ approveResult.successCount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="失败数">
          <span class="result-fail">{{ approveResult.errorCount }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="approveResultVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { batchImport, batchApprove, getImportErrors, downloadErrorTemplate } from '@/api/import'
import { pageRequirements } from '@/api/requirement'
import { getPriorityTag, getStatusTag } from '@/utils'

const activeTab = ref('import')
const uploadRef = ref(null)
const approveTableRef = ref(null)
const selectedFile = ref(null)
const importResult = ref(null)
const batchNo = ref('')
const errorRecords = ref([])
const pendingRequirements = ref([])
const selectedRows = ref([])
const approveResultVisible = ref(false)
const approveResult = ref({ successCount: 0, errorCount: 0 })

function handleFileChange(file) {
  selectedFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件，请先移除已选文件')
}

async function handleDownloadTemplate() {
  const headers = ['需求标题', '优先级(URGENT/HIGH/MEDIUM/LOW)', '描述', '负责人', '截止日期']
  const ws = XLSX.utils.aoa_to_sheet([headers])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '需求导入模板')
  ws['!cols'] = headers.map(() => ({ wch: 30 }))
  XLSX.writeFile(wb, '需求导入模板.xlsx')
}

async function handleImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  try {
    const res = await batchImport(formData)
    importResult.value = {
      successCount: res.data?.successCount || 0,
      errorCount: res.data?.errorCount || 0
    }
    batchNo.value = res.data?.batchNo || ''
    if (res.data?.errorCount > 0) {
      fetchErrors()
    } else {
      errorRecords.value = []
    }
    ElMessage.success('导入完成')
    selectedFile.value = null
    uploadRef.value?.clearFiles()
  } catch (e) {
    console.error(e)
  }
}

async function fetchErrors() {
  try {
    const res = await getImportErrors(batchNo.value)
    errorRecords.value = res.data?.records || res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function handleDownloadErrors() {
  if (!batchNo.value) {
    ElMessage.warning('没有可下载的错误记录')
    return
  }
  try {
    const res = await downloadErrorTemplate(batchNo.value)
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `import_errors_${batchNo.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  }
}

async function fetchPendingRequirements() {
  try {
    const res = await pageRequirements({ page: 1, size: 500, status: 'SUBMITTED' })
    pendingRequirements.value = res.data?.records || res.data || []
  } catch (e) {
    console.error(e)
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleBatchApprove() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需求')
    return
  }
  const invalidItems = selectedRows.value.filter(r => r.status !== 'SUBMITTED')
  if (invalidItems.length > 0) {
    ElMessage.error(`选中需求中存在非"已提交"状态的需求，请检查后重试`)
    return
  }
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchApprove(ids)
    approveResult.value = {
      successCount: res.data?.successCount || 0,
      errorCount: res.data?.errorCount || 0
    }
    approveResultVisible.value = true
    fetchPendingRequirements()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchPendingRequirements()
})
</script>

<style scoped>
.import-page {
  padding: 20px;
}

.upload-area {
  margin-bottom: 24px;
}

.upload-dragger {
  width: 100%;
}

.upload-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.import-result {
  margin-bottom: 20px;
}

.result-success {
  color: #67c23a;
  font-weight: 700;
  font-size: 18px;
}

.result-fail {
  color: #f56c6c;
  font-weight: 700;
  font-size: 18px;
}

.error-section {
  margin-top: 20px;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 15px;
}

.approve-actions {
  margin-bottom: 16px;
}
</style>
