<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">食材管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增食材</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索名称/编码" style="width: 200px" clearable>
        <template #append>
          <el-button :icon="Search" @click="loadData" />
        </template>
      </el-input>
      <el-select v-model="filters.category" placeholder="分类" clearable style="width: 140px" @change="loadData">
        <el-option label="茶底" value="茶底" />
        <el-option label="乳制品" value="乳制品" />
        <el-option label="配料" value="配料" />
        <el-option label="糖类" value="糖类" />
        <el-option label="水果" value="水果" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="食材名称" width="150" />
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="120">
          <template #default="{ row }">¥{{ Number(row.unitPrice).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleToggle(row)">
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑食材' : '新增食材'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="食材名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" maxlength="50" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%" filterable allow-create default-first-option>
            <el-option label="茶底" value="茶底" />
            <el-option label="乳制品" value="乳制品" />
            <el-option label="配料" value="配料" />
            <el-option label="糖类" value="糖类" />
            <el-option label="水果" value="水果" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" maxlength="20" placeholder="如：g、ml、个" />
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number v-model="form.unitPrice" :min="0" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" maxlength="100" placeholder="如：500g/包" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const list = ref([])

const filters = reactive({
  keyword: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const form = reactive({
  name: '',
  code: '',
  category: '',
  unit: '',
  unitPrice: 0,
  specification: '',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/ingredients', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        keyword: filters.keyword || undefined,
        category: filters.category || undefined
      }
    })
    list.value = res.data || []
    pagination.total = res.meta?.total || 0
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.code = ''
  form.category = ''
  form.unit = ''
  form.unitPrice = 0
  form.specification = ''
  form.remark = ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.code = row.code
  form.category = row.category
  form.unit = row.unit
  form.unitPrice = row.unitPrice
  form.specification = row.specification
  form.remark = row.remark
  dialogVisible.value = true
}

const handleToggle = async (row) => {
  const action = row.isActive ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}该食材吗？`, '提示', {
      type: 'warning'
    })
    await api.put(`/admin/ingredients/${row.id}`, { isActive: !row.isActive })
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      // error handled
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.put(`/admin/ingredients/${editId.value}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/admin/ingredients', form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetFilters = () => {
  filters.keyword = ''
  filters.category = ''
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
