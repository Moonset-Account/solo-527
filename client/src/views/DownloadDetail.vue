<template>
  <div class="download-detail">
    <el-card shadow="never">
      <div class="detail-header">
        <div class="env-toggle">
          <span class="env-label">环境切换：</span>
          <el-radio-group v-model="environment" @change="handleEnvChange">
            <el-radio-button value="sandbox">沙箱环境</el-radio-button>
            <el-radio-button value="production">生产环境</el-radio-button>
          </el-radio-group>
        </div>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>导出报表
        </el-button>
      </div>

      <el-table :data="downloadStore.list" v-loading="downloadStore.loading" stripe style="width: 100%">
        <el-table-column label="交易安全" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.transactionSecurity === '已保障' ? 'success' : 'warning'" size="small">
              {{ row.transactionSecurity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报修超时" width="120" align="center">
          <template #default="{ row }">
            <span :class="{ 'timeout-warn': row.repairTimeout === '超时' }">
              {{ row.repairTimeout }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最近操作人" width="120">
          <template #default="{ row }">
            {{ row.lastOperation?.operator || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="最近操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastOperation?.operatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="环境" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.environment === 'production' ? 'success' : 'info'" size="small">
              {{ row.environment === 'production' ? '生产' : '沙箱' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="note-bar">
        <el-icon color="#e6a23c"><WarningFilled /></el-icon>
        <span class="note-text">正式报表仅显示生产环境记录</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, WarningFilled } from '@element-plus/icons-vue'
import { useDownloadStore } from '../stores/download'

const downloadStore = useDownloadStore()

const environment = ref<'sandbox' | 'production'>('sandbox')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const fetchData = () => {
  downloadStore.fetchList({
    environment: environment.value
  })
}

const handleEnvChange = () => {
  fetchData()
}

const handleExport = async () => {
  try {
    const res = await downloadStore.exportFile({
      environment: environment.value
    })
    const blob = new Blob([res as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `交易明细_${environment.value === 'production' ? '生产' : '沙箱'}_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.download-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.env-toggle {
  display: flex;
  align-items: center;
}

.env-label {
  font-size: 14px;
  color: #606266;
  margin-right: 12px;
}

.timeout-warn {
  color: #f56c6c;
  font-weight: 600;
}

.note-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #fdf6ec;
  border-radius: 4px;
}

.note-text {
  font-size: 13px;
  color: #e6a23c;
}
</style>
