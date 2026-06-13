<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统配置</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新增配置
      </el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6" v-for="(g, idx) in configGroups" :key="idx">
        <el-card shadow="hover" class="config-group-card" @click="filters.configGroup = g; loadList()">
          <div class="group-title">{{ getGroupName(g) }}</div>
          <div class="group-count">共 {{ getGroupCount(g) }} 项配置</div>
        </el-card>
      </el-col>
    </el-row>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">配置分组：</span>
          <el-select v-model="filters.configGroup" placeholder="全部" style="width: 200px" clearable>
            <el-option v-for="g in configGroups" :key="g" :label="getGroupName(g)" :value="g" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="配置键/描述" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="configGroup" label="分组" width="140">
          <template #default="{ row }">{{ getGroupName(row.configGroup) }}</template>
        </el-table-column>
        <el-table-column prop="configKey" label="配置键" width="200" />
        <el-table-column prop="configValue" label="配置值" min-width="180">
          <template #default="{ row }">
            <el-tooltip v-if="row.configValue?.length > 40" :content="row.configValue" placement="top">
              <span>{{ row.configValue.slice(0, 40) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.configValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="valueType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.valueType || 'string' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '新增配置'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="配置分组" prop="configGroup">
          <el-select v-model="form.configGroup" filterable allow-create default-first-option style="width: 100%" placeholder="选择或输入分组">
            <el-option v-for="g in configGroups" :key="g" :label="getGroupName(g)" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置键" prop="configKey">
          <el-input v-model="form.configKey" placeholder="如：default_reviewer" />
        </el-form-item>
        <el-form-item label="配置值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="配置值" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select v-model="form.valueType" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settingsApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const configGroups = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const filters = reactive({ configGroup: '', keyword: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  configKey: '',
  configValue: '',
  valueType: 'string',
  description: '',
  configGroup: 'threshold'
})
const rules = {
  configGroup: [{ required: true, message: '请选择配置分组', trigger: 'change' }],
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const groupNameMap = {
  threshold: '提醒阈值',
  default_owner: '默认负责人',
  publish: '发布设置',
  review: '审稿设置',
  notification: '通知设置',
  other: '其他设置'
}

function getGroupName(g) {
  return groupNameMap[g] || g
}

function getGroupCount(g) {
  return tableData.value.filter(c => c.configGroup === g).length
}

async function loadConfigGroups() {
  try {
    configGroups.value = await settingsApi.configGroups()
    if (!configGroups.value.includes('threshold')) configGroups.value.push('threshold')
    if (!configGroups.value.includes('default_owner')) configGroups.value.push('default_owner')
  } catch (e) {
    configGroups.value = ['threshold', 'default_owner', 'publish', 'review', 'notification', 'other']
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      configGroup: filters.configGroup || undefined
    }
    const res = await settingsApi.configList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { configGroup: '', keyword: '' })
  pagination.page = 1
  loadList()
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    Object.assign(form, { ...row })
  } else {
    editId.value = ''
    Object.assign(form, { configKey: '', configValue: '', valueType: 'string', description: '', configGroup: 'threshold' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await settingsApi.updateConfig(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await settingsApi.createConfig(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadConfigGroups()
    loadList()
  } catch (e) {}
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除配置"${row.configKey}"吗?`, '提示', { type: 'warning' }).then(async () => {
    await settingsApi.removeConfig(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(() => {
  loadConfigGroups()
  loadList()
})
</script>

<style scoped lang="scss">
.config-group-card {
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    transform: translateY(-2px);
    .group-title {
      color: #409EFF;
    }
  }
  .group-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    transition: color 0.3s;
  }
  .group-count {
    color: #909399;
    font-size: 13px;
  }
}
</style>
