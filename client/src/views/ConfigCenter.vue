<template>
  <div class="config-center">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="通知回执" name="通知回执" />
        <el-tab-pane label="社团活动" name="社团活动" />
        <el-tab-pane label="二手交易" name="二手交易" />
      </el-tabs>

      <div class="tab-actions">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>新增配置
        </el-button>
      </div>

      <el-table :data="configStore.list" v-loading="configStore.loading" stripe style="width: 100%">
        <el-table-column prop="key" label="配置键" min-width="160" />
        <el-table-column prop="value" label="配置值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updatedBy" label="最后修改人" width="140" />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="configStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-card shadow="never" class="log-card">
      <template #header>
        <span>操作日志</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="log in operationLogs"
          :key="log._id"
          :timestamp="formatDate(log.createdAt)"
          placement="top"
        >
          <el-card shadow="never" class="log-item">
            <p class="log-operator">操作人：{{ log.operator }}</p>
            <p class="log-action">{{ log.action }}</p>
            <p class="log-detail">{{ log.detail }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="operationLogs.length === 0" description="暂无操作日志" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '新增配置'" width="520">
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item label="配置键">
          <el-input v-model="dialogForm.key" placeholder="请输入配置键" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="dialogForm.value" placeholder="请输入配置值" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="dialogForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDialog">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const activeTab = ref('通知回执')
const pagination = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const dialogForm = reactive({
  key: '',
  value: '',
  description: ''
})

const operationLogs = ref<any[]>([])

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const fetchData = () => {
  configStore.fetchList({
    category: activeTab.value,
    page: pagination.page,
    pageSize: pagination.pageSize
  })
}

const handleTabChange = () => {
  pagination.page = 1
  fetchData()
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = ''
  dialogForm.key = ''
  dialogForm.value = ''
  dialogForm.description = ''
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  editId.value = row._id
  dialogForm.key = row.key
  dialogForm.value = row.value
  dialogForm.description = row.description
  dialogVisible.value = true
}

const submitDialog = async () => {
  if (!dialogForm.key || !dialogForm.value) {
    ElMessage.warning('请填写配置键和配置值')
    return
  }
  try {
    if (isEdit.value) {
      await configStore.update(editId.value, {
        key: dialogForm.key,
        value: dialogForm.value,
        description: dialogForm.description
      })
      ElMessage.success('配置已更新')
    } else {
      await configStore.create({
        category: activeTab.value as any,
        key: dialogForm.key,
        value: dialogForm.value,
        description: dialogForm.description
      })
      ElMessage.success('配置已创建')
    }
    dialogVisible.value = false
    fetchData()
  } catch {}
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.config-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.log-card {
  margin-top: 8px;
}

.log-item {
  padding: 0;
}

.log-item :deep(.el-card__body) {
  padding: 12px 16px;
}

.log-operator {
  font-weight: 600;
  margin: 0 0 4px 0;
  font-size: 14px;
}

.log-action {
  margin: 0 0 4px 0;
  color: #409eff;
  font-size: 13px;
}

.log-detail {
  margin: 0;
  color: #606266;
  font-size: 13px;
}
</style>
