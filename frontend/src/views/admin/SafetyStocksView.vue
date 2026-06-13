<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">安全库存设置</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增设置</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.storeId" placeholder="选择门店" clearable style="width: 200px" @change="loadData">
        <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="搜索食材" style="width: 200px" clearable @clear="loadData">
        <template #append>
          <el-button :icon="Search" @click="loadData" />
        </template>
      </el-input>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="ingredient.name" label="食材名称" width="150" />
        <el-table-column prop="ingredient.code" label="食材编码" width="120" />
        <el-table-column prop="ingredient.category" label="分类" width="100" />
        <el-table-column prop="ingredient.unit" label="单位" width="80" />
        <el-table-column prop="store.name" label="门店" width="140" />
        <el-table-column prop="minQuantity" label="最低库存" width="120">
          <template #default="{ row }">{{ row.minQuantity }} {{ row.ingredient?.unit }}</template>
        </el-table-column>
        <el-table-column prop="warningQuantity" label="预警库存" width="120">
          <template #default="{ row }">{{ row.warningQuantity }} {{ row.ingredient?.unit }}</template>
        </el-table-column>
        <el-table-column prop="maxQuantity" label="最高库存" width="120">
          <template #default="{ row }">{{ row.maxQuantity }} {{ row.ingredient?.unit }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑安全库存' : '新增安全库存'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%" :disabled="isEdit">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="食材" prop="ingredientId">
          <el-select v-model="form.ingredientId" style="width: 100%" filterable :disabled="isEdit">
            <el-option v-for="ing in ingredientList" :key="ing.id" :label="`${ing.name} (${ing.code})`" :value="ing.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低库存" prop="minQuantity">
          <el-input-number v-model="form.minQuantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预警库存" prop="warningQuantity">
          <el-input-number v-model="form.warningQuantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最高库存" prop="maxQuantity">
          <el-input-number v-model="form.maxQuantity" :min="0" :precision="2" style="width: 100%" />
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
const storeList = ref([])
const ingredientList = ref([])

const filters = reactive({
  storeId: null,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const form = reactive({
  storeId: null,
  ingredientId: null,
  minQuantity: 0,
  warningQuantity: 0,
  maxQuantity: 0
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  ingredientId: [{ required: true, message: '请选择食材', trigger: 'change' }],
  minQuantity: [{ required: true, message: '请输入最低库存', trigger: 'blur' }],
  warningQuantity: [{ required: true, message: '请输入预警库存', trigger: 'blur' }],
  maxQuantity: [{ required: true, message: '请输入最高库存', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/safety-stocks', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        store_id: filters.storeId || undefined
      }
    })
    list.value = res.data || []
    pagination.total = res.meta?.total || 0
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  try {
    const res = await api.get('/stores', { params: { limit: 100 } })
    storeList.value = res.data || []
  } catch (e) {}
}

const loadIngredients = async () => {
  try {
    const res = await api.get('/admin/ingredients', { params: { limit: 100, is_active: true } })
    ingredientList.value = res.data || []
  } catch (e) {}
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  form.storeId = null
  form.ingredientId = null
  form.minQuantity = 0
  form.warningQuantity = 0
  form.maxQuantity = 0
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.storeId = row.storeId
  form.ingredientId = row.ingredientId
  form.minQuantity = row.minQuantity
  form.warningQuantity = row.warningQuantity
  form.maxQuantity = row.maxQuantity
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该安全库存设置吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/admin/safety-stocks/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      // error handled by interceptor
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
          await api.put(`/admin/safety-stocks/${editId.value}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/admin/safety-stocks', form)
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

onMounted(() => {
  loadData()
  loadStores()
  loadIngredients()
})
</script>
