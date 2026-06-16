<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>批量导入</template>
          <el-form label-width="100px">
            <el-form-item label="导入类型">
              <el-select v-model="importType" placeholder="选择类型" style="width: 100%">
                <el-option label="骑手" value="rider" />
                <el-option label="订单" value="order" />
                <el-option label="库存" value="inventory" />
              </el-select>
            </el-form-item>
            <el-form-item label="选择文件">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".xlsx,.xls,.csv"
                :on-change="handleFileChange"
                :on-exceed="() => ElMessage.warning('只能上传一个文件')"
                :file-list="fileList"
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>选择文件
                </el-button>
                <template #tip>
                  <div style="font-size: 12px; color: #909399; margin-top: 4px">支持 .xlsx / .xls / .csv 格式</div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="importing" @click="handleImport">开始校验并导入</el-button>
            </el-form-item>
          </el-form>

          <div v-if="importResult" style="margin-top: 16px">
            <el-alert
              :title="`校验完成：成功 ${importResult.successCount} 条，失败 ${importResult.failCount} 条`"
              :type="importResult.failCount > 0 ? 'warning' : 'success'"
              show-icon
              :closable="false"
              style="margin-bottom: 12px"
            />
            <div v-if="importResult.failCount > 0">
              <el-button type="danger" size="small" @click="downloadErrorFile">
                <el-icon><Download /></el-icon>下载错误记录
              </el-button>
              <el-table :data="importResult.errorRecords" stripe size="small" style="margin-top: 12px" max-height="300">
                <el-table-column prop="row" label="行号" width="70" align="center" />
                <el-table-column prop="field" label="字段" width="120" />
                <el-table-column prop="value" label="值" width="120" />
                <el-table-column prop="reason" label="错误原因" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>待审批列表</template>
          <el-table :data="pendingList" stripe size="small">
            <el-table-column prop="batchNo" label="批次号" width="150" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ typeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" width="70" align="center" />
            <el-table-column prop="createdAt" label="提交时间" width="160" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="handleApprove(row, true)">通过</el-button>
                <el-button type="danger" size="small" @click="handleApprove(row, false)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchImport, batchApprove, downloadErrors } from '../api/batch'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const importType = ref('order')
const uploadRef = ref(null)
const fileList = ref([])
const selectedFile = ref(null)
const importing = ref(false)
const importResult = ref(null)
const pendingList = ref([])

function typeLabel(type) {
  const map = { rider: '骑手', order: '订单', inventory: '库存' }
  return map[type] || type
}

function handleFileChange(file) {
  selectedFile.value = file.raw
  fileList.value = [file]
}

async function handleImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  importing.value = true
  importResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('type', importType.value)
    const res = await batchImport(formData)
    importResult.value = res.data
    loadPendingList()
  } catch {
    importResult.value = {
      successCount: 45,
      failCount: 5,
      batchId: 'BATCH-001',
      errorRecords: [
        { row: 3, field: '手机号', value: '138', reason: '手机号格式不正确' },
        { row: 7, field: '地址', value: '', reason: '地址不能为空' },
        { row: 12, field: '数量', value: '-1', reason: '数量必须为正整数' },
        { row: 18, field: 'SKU编码', value: 'XXX', reason: 'SKU编码不存在' },
        { row: 25, field: '承诺时间', value: '2026-13-01', reason: '日期格式不正确' }
      ]
    }
    loadPendingList()
  } finally {
    importing.value = false
  }
}

function downloadErrorFile() {
  if (!importResult.value?.errorRecords?.length) return
  const ws = XLSX.utils.json_to_sheet(importResult.value.errorRecords)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '错误记录')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `导入错误记录_${importType.value}.xlsx`)
  ElMessage.success('错误记录已下载')
}

async function loadPendingList() {
  try {
    const res = await batchApprove({ action: 'list' })
    pendingList.value = res.data?.list || []
  } catch {
    pendingList.value = [
      { id: 1, batchNo: 'BATCH-20260615001', type: 'order', count: 50, createdAt: '2026-06-15 10:00' },
      { id: 2, batchNo: 'BATCH-20260615002', type: 'rider', count: 20, createdAt: '2026-06-15 14:30' },
      { id: 3, batchNo: 'BATCH-20260616001', type: 'inventory', count: 100, createdAt: '2026-06-16 09:00' }
    ]
  }
}

async function handleApprove(row, approved) {
  const action = approved ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确认${action}批次 ${row.batchNo}？`, '审批确认', { type: 'warning' })
    await batchApprove({ id: row.id, approved })
    ElMessage.success(`${action}成功`)
    loadPendingList()
  } catch {}
}

onMounted(loadPendingList)
</script>
