<template>
  <div class="configs-page">
    <div class="page-header">
      <h2>配置管理</h2>
      <p class="subtitle">系统全局配置项管理</p>
    </div>

    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>系统配置列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增配置</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="key" label="配置键" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="value" label="配置值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewHistory(row)">变更历史</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '新增配置'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="!isEdit" label="配置键" prop="key">
          <el-input v-model="form.key" placeholder="请输入配置键" />
        </el-form-item>
        <el-form-item label="配置值" prop="value">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="3"
            placeholder="请输入配置值"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="请输入配置描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="historyDrawerVisible" title="变更历史" size="600px">
      <div class="history-info">
        <p><strong>配置键：</strong>{{ currentConfig?.key }}</p>
        <p><strong>描述：</strong>{{ currentConfig?.description }}</p>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in historyList"
          :key="item.id"
          :timestamp="item.createdAt"
          placement="top"
          :type="index === 0 ? 'primary' : ''"
        >
          <div class="history-item">
            <div class="history-operator">操作人：{{ item.operator }}</div>
            <div class="history-values">
              <div class="old-value">
                <span class="label">变更前：</span>
                <span class="value">{{ item.oldValue }}</span>
              </div>
              <el-icon class="arrow"><Right /></el-icon>
              <div class="new-value">
                <span class="label">变更后：</span>
                <span class="value">{{ item.newValue }}</span>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Right } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import { useAppStore } from '@/stores/app'
import type { Config, ConfigHistory } from '@/api/config'

const appStore = useAppStore()

const loading = ref(false)
const tableData = ref<Config[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  key: '',
  value: '',
  description: ''
})

const rules: FormRules = {
  key: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const historyDrawerVisible = ref(false)
const currentConfig = ref<Config | null>(null)
const historyList = ref<ConfigHistory[]>([])

function handlePageChange() {
  fetchList()
}

async function fetchList() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      tableData.value = generateDemoData()
      total.value = 12
      loading.value = false
    }, 500)
    return
  }

  loading.value = false
}

function generateDemoData(): Config[] {
  const configs = [
    { key: 'service_phone', value: '400-888-8888', desc: '客服电话' },
    { key: 'service_time', value: '周一至周日 8:00-20:00', desc: '服务时间' },
    { key: 'service_areas', value: '朝阳区,海淀区,东城区,西城区', desc: '服务区域' },
    { key: 'door_fee', value: '30', desc: '上门费' },
    { key: 'inspect_fee', value: '50', desc: '检测费' },
    { key: 'min_order_amount', value: '80', desc: '最低消费' },
    { key: 'cancel_deadline_hours', value: '2', desc: '取消订单截止时间(小时)' },
    { key: 'review_days', value: '30', desc: '可评价天数' },
    { key: 'technician_count', value: '20', desc: '师傅数量' },
    { key: 'auto_assign', value: 'true', desc: '是否自动派单' },
    { key: 'max_daily_orders', value: '8', desc: '师傅每日最大接单量' },
    { key: 'app_name', value: '家电维修服务平台', desc: '应用名称' }
  ]

  return configs.map((c, i) => ({
    id: i + 1,
    key: c.key,
    value: c.value,
    description: c.desc,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: `2024-01-${String(5 + i).padStart(2, '0')} 10:00:00`
  }))
}

function handleAdd() {
  isEdit.value = false
  form.key = ''
  form.value = ''
  form.description = ''
  dialogVisible.value = true
}

function handleEdit(row: Config) {
  isEdit.value = true
  form.key = row.key
  form.value = row.value
  form.description = row.description || ''
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchList()
    return
  }

  // TODO: call API
  dialogVisible.value = false
}

async function handleDelete(row: Config) {
  try {
    await ElMessageBox.confirm(`确定要删除配置 "${row.key}" 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('删除成功')
    fetchList()
    return
  }

  // TODO: call API
}

function viewHistory(row: Config) {
  currentConfig.value = row
  historyList.value = generateHistoryData(row)
  historyDrawerVisible.value = true
}

function generateHistoryData(config: Config): ConfigHistory[] {
  const history: ConfigHistory[] = []
  const operators = ['管理员', '系统管理员', '超级管理员']
  
  for (let i = 0; i < 5; i++) {
    history.push({
      id: i + 1,
      configId: config.id,
      oldValue: i === 4 ? '(初始值)' : config.value + `_v${4 - i}`,
      newValue: config.value + (i === 0 ? '' : `_v${5 - i}`),
      operator: operators[i % 3],
      createdAt: `2024-01-${String(10 + i).padStart(2, '0')} ${String(10 + i).padStart(2, '0')}:30:00`
    })
  }
  
  return history.reverse()
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.configs-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: #303133;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .config-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .history-info {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 20px;

    p {
      margin: 6px 0;
    }
  }

  .history-item {
    .history-operator {
      font-size: 13px;
      color: #606266;
      margin-bottom: 8px;
    }

    .history-values {
      display: flex;
      align-items: center;
      gap: 10px;

      .label {
        font-size: 12px;
        color: #909399;
      }

      .value {
        font-size: 13px;
        color: #303133;
        word-break: break-all;
      }

      .old-value {
        flex: 1;
        padding: 8px;
        background: #fef0f0;
        border-radius: 4px;
        text-decoration: line-through;
      }

      .arrow {
        color: #c0c4cc;
        flex-shrink: 0;
      }

      .new-value {
        flex: 1;
        padding: 8px;
        background: #f0f9eb;
        border-radius: 4px;
      }
    }
  }
}
</style>
