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
                accept=".csv"
                :on-change="handleFileChange"
                :on-exceed="() => ElMessage.warning('只能上传一个文件')"
                :file-list="fileList"
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>选择文件
                </el-button>
                <template #tip>
                  <div style="font-size: 12px; color: #909399; margin-top: 4px">支持 .csv 格式</div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="importing" @click="handleImport">开始校验并导入</el-button>
            </el-form-item>
          </el-form>

          <div v-if="importResult" style="margin-top: 16px">
            <el-alert
              :title="`校验完成：共 ${importResult.totalCount} 条，成功 ${importResult.successCount} 条，失败 ${importResult.failCount} 条`"
              :type="importResult.failCount > 0 ? 'warning' : 'success'"
              show-icon
              :closable="false"
              style="margin-bottom: 12px"
            />
            <div style="margin-bottom: 8px">
              <el-tag type="info" size="small">批次号：{{ importResult.batchNo }}</el-tag>
              <el-tag size="small" style="margin-left: 8px">状态：{{ statusLabel(importResult.status) }}</el-tag>
            </div>
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
          <template #header>
            <span>审批列表</span>
            <el-select v-model="listStatus" placeholder="状态筛选" clearable size="small" style="width: 120px; margin-left: 12px" @change="loadBatchList">
              <el-option label="待审批" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已拒绝" value="REJECTED" />
            </el-select>
          </template>
          <el-table :data="batchList" stripe size="small" v-loading="listLoading">
            <el-table-column prop="batchNo" label="批次号" width="170" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ typeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalCount" label="总数" width="70" align="center" />
            <el-table-column prop="successCount" label="成功" width="70" align="center" />
            <el-table-column prop="failCount" label="失败" width="70" align="center" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="提交时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'PENDING'" type="success" size="small" link @click="handleApprove(row, true)">通过</el-button>
                <el-button v-if="row.status === 'PENDING'" type="danger" size="small" link @click="handleApprove(row, false)">拒绝</el-button>
                <el-button v-if="row.failCount > 0" type="primary" size="small" link @click="downloadErrors(row.batchNo)">下载错误</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            style="margin-top: 16px; justify-content: flex-end; display: flex"
            @current-change="loadBatchList"
            @size-change="loadBatchList"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'
import { batchImport, batchApprove, getBatchList, downloadErrors as downloadErrorsApi } from '../api/batch'
import dayjs from 'dayjs'

const importType = ref('order')
const uploadRef = ref(null)
const fileList = ref([])
const selectedFile = ref(null)
const importing = ref(false)
const importResult = ref(null)

const listLoading = ref(false)
const listStatus = ref('')
const batchList = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

function typeLabel(type) {
  const map = { rider: '骑手', order: '订单', inventory: '库存' }
  return map[type] || type
}

function statusLabel(status) {
  const map = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' }
  return map[status] || status
}

function statusTagType(status) {
  const map = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }
  return map[status] || ''
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
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
    ElMessage.success('校验完成')
    loadBatchList()
  } catch (e) {
    console.error('导入失败', e)
  } finally {
    importing.value = false
  }
}

async function downloadErrorFile() {
  if (!importResult.value?.batchNo) return
  try {
    const res = await downloadErrorsApi(importResult.value.batchNo)
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `errors_${importResult.value.batchNo}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    ElMessage.success('下载成功')
  } catch (e) {
    console.error('下载失败', e)
  }
}

async function downloadErrors(batchNo) {
  try {
    const res = await downloadErrorsApi(batchNo)
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `errors_${batchNo}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    ElMessage.success('下载成功')
  } catch (e) {
    console.error('下载失败', e)
  }
}

async function loadBatchList() {
  listLoading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      status: listStatus.value || undefined
    }
    const res = await getBatchList(params)
    batchList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e) {
    console.error('列表加载失败', e)
  } finally {
    listLoading.value = false
  }
}

async function handleApprove(row, approved) {
  const action = approved ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确认${action}批次 ${row.batchNo}？`, '审批确认', { type: 'warning' })
    await batchApprove(row.batchNo, approved)
    ElMessage.success(`${action}成功`)
    loadBatchList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('审批失败', e)
    }
  }
}

onMounted(loadBatchList)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
</style>
