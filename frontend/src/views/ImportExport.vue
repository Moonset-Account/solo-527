<template>
  <div class="import-export">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>导入导出</span>
          <div>
            <el-button type="primary" size="small" @click="openExportDialog">
              新建导出
            </el-button>
            <el-upload
              :show-file-list="false"
              :before-upload="handleImport"
              accept=".xlsx,.xls"
              style="display: inline-block; margin-left: 8px"
            >
              <el-button type="success" size="small">导入数据</el-button>
            </el-upload>
          </div>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="job_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="isExport(row.job_type) ? 'primary' : 'success'" size="small">
              {{ isExport(row.job_type) ? '导出' : '导入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="job_type" label="数据类型" width="120">
          <template #default="{ row }">
            {{ getJobTypeName(row.job_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="文件名" show-overflow-tooltip />
        <el-table-column prop="total_count" label="总数" width="80" />
        <el-table-column prop="processed_count" label="已处理" width="80" />
        <el-table-column prop="error_count" label="错误数" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.error_count > 0 ? '#f56c6c' : '' }">{{ row.error_count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ row.created_by?.real_name }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="isExport(row.job_type) && row.status === 'completed'"
              type="primary"
              size="small"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="exportVisible" title="新建导出任务" width="500px">
      <el-form :model="exportForm" :rules="exportRules" ref="exportFormRef" label-width="100px">
        <el-form-item label="数据类型" prop="model_type">
          <el-select v-model="exportForm.model_type" placeholder="请选择数据类型">
            <el-option label="人员" value="Person" />
            <el-option label="车辆" value="Vehicle" />
            <el-option label="通行证" value="Pass" />
            <el-option label="违规记录" value="Violation" />
            <el-option label="门岗记录" value="GateLog" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="exportForm.file_name" placeholder="留空则自动生成" />
        </el-form-item>
        <el-form-item label="筛选条件">
          <el-input v-model="exportForm.filters" type="textarea" :rows="3" placeholder="JSON格式筛选条件（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport">开始导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="任务详情" width="600px">
      <div v-if="currentJob">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务类型">{{ isExport(currentJob.job_type) ? '导出' : '导入' }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ getJobTypeName(currentJob.job_type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentJob.status)">{{ getStatusName(currentJob.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件名">{{ currentJob.file_name }}</el-descriptions-item>
          <el-descriptions-item label="总数">{{ currentJob.total_count }}</el-descriptions-item>
          <el-descriptions-item label="已处理">{{ currentJob.processed_count }}</el-descriptions-item>
          <el-descriptions-item label="错误数">{{ currentJob.error_count }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(currentJob.created_at) }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>错误信息</h4>
        <pre v-if="currentJob.error_messages" style="background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">{{ currentJob.error_messages }}</pre>
        <span v-else style="color: #909399">无错误信息</span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { importExportApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

const exportVisible = ref(false)
const exportFormRef = ref(null)
const exportForm = reactive({
  model_type: '',
  file_name: '',
  filters: ''
})

const exportRules = {
  model_type: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

const detailVisible = ref(false)
const currentJob = ref(null)

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value
    }
    const res = await importExportApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const isExport = (jobType) => {
  return jobType && jobType.startsWith('export_')
}

const getJobTypeName = (jobType) => {
  const map = {
    'export_people': '人员',
    'export_passes': '通行证',
    'export_violations': '违规记录',
    'export_gate_logs': '门岗记录',
    'import_people': '人员',
    'import_passes': '通行证'
  }
  return map[jobType] || jobType
}

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success', failed: 'danger' }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = { pending: '等待中', processing: '处理中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const openExportDialog = () => {
  exportForm.model_type = ''
  exportForm.file_name = ''
  exportForm.filters = ''
  exportVisible.value = true
}

const handleExport = async () => {
  try {
    await exportFormRef.value.validate()
    await importExportApi.createExport(exportForm)
    ElMessage.success('导出任务已创建')
    exportVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleImport = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model_type', 'Person')
    await importExportApi.createImport(formData)
    ElMessage.success('导入任务已创建')
    fetchList()
  } catch (e) {}
  return false
}

const handleDownload = async (row) => {
  try {
    const res = await importExportApi.download(row.id)
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', row.file_name)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e) {}
}

const viewDetail = async (row) => {
  try {
    const res = await importExportApi.detail(row.id)
    currentJob.value = res
    detailVisible.value = true
  } catch (e) {}
}

onMounted(() => {
  fetchList()
})
</script>
