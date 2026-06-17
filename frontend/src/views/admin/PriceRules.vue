<template>
  <div class="price-rules-page">
    <div class="page-header">
      <h2>价格规则</h2>
    </div>

    <el-card class="filter-card">
      <el-form :model="filterForm" inline @submit.prevent>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.deviceType" placeholder="全部设备" clearable style="width: 180px">
            <el-option
              v-for="item in deviceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>价格规则列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="规则名称" width="150" />
        <el-table-column prop="deviceType" label="设备类型" width="120" />
        <el-table-column prop="basePrice" label="基础价格" width="120">
          <template #default="{ row }">
            <span class="price">¥{{ row.basePrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'active'" type="warning" link @click="toggleStatus(row)">禁用</el-button>
            <el-button v-else type="success" link @click="toggleStatus(row)">启用</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑价格规则' : '新增价格规则'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%">
            <el-option
              v-for="item in deviceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="基础价格" prop="basePrice">
          <el-input-number v-model="form.basePrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import { useAppStore } from '@/stores/app'
import { DEVICE_TYPES } from '@/utils/constants'
import type { PriceRule } from '@/api/priceRule'

const appStore = useAppStore()

const loading = ref(false)
const tableData = ref<PriceRule[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const deviceTypes = DEVICE_TYPES

const deviceTypeMap: Record<string, string> = {}
DEVICE_TYPES.forEach(item => {
  deviceTypeMap[item.value] = item.label
})

const filterForm = reactive({
  deviceType: '',
  status: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  deviceType: '',
  basePrice: 0,
  description: '',
  status: 'active'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入基础价格', trigger: 'blur' }]
}

function handleSearch() {
  page.value = 1
  fetchList()
}

function handleReset() {
  filterForm.deviceType = ''
  filterForm.status = ''
  page.value = 1
  fetchList()
}

function handlePageChange() {
  fetchList()
}

async function fetchList() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      tableData.value = generateDemoData()
      total.value = 30
      loading.value = false
    }, 500)
    return
  }

  loading.value = false
}

function generateDemoData(): PriceRule[] {
  const data: PriceRule[] = []
  const names = ['上门检测费', '基础维修费', '深度清洗费', '配件更换费', '紧急服务费']

  for (let i = 0; i < pageSize.value; i++) {
    const idx = (page.value - 1) * pageSize.value + i
    if (idx >= 30) break
    
    const deviceType = deviceTypes[idx % deviceTypes.length]
    
    data.push({
      id: idx + 1,
      name: names[idx % names.length],
      deviceType: deviceType.label,
      basePrice: 50 + idx * 15,
      description: `${deviceType.label}${names[idx % names.length]}，包含上门检测和基础维修服务`,
      status: idx % 10 === 9 ? 'inactive' : 'active',
      createdAt: `2024-01-${String(1 + idx).padStart(2, '0')} 09:00:00`,
      updatedAt: `2024-01-${String(5 + idx).padStart(2, '0')} 10:00:00`
    })
  }

  return data
}

function handleAdd() {
  isEdit.value = false
  form.name = ''
  form.deviceType = ''
  form.basePrice = 0
  form.description = ''
  form.status = 'active'
  dialogVisible.value = true
}

function handleEdit(row: PriceRule) {
  isEdit.value = true
  form.name = row.name
  
  const deviceTypeValue = deviceTypes.find(d => d.label === row.deviceType)?.value || ''
  form.deviceType = deviceTypeValue
  
  form.basePrice = row.basePrice
  form.description = row.description || ''
  form.status = row.status
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

async function toggleStatus(row: PriceRule) {
  const action = row.status === 'active' ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该价格规则吗？`, '提示', {
      type: 'warning',
      confirmButtonText: `确定${action}`,
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`${action}成功`)
    return
  }

  // TODO: call API
}

async function handleDelete(row: PriceRule) {
  try {
    await ElMessageBox.confirm(`确定要删除价格规则 "${row.name}" 吗？`, '提示', {
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

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.price-rules-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price {
      color: #f56c6c;
      font-weight: 600;
    }
  }
}
</style>
