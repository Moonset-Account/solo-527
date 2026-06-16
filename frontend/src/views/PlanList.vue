<template>
  <div class="plan-list">
    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <h3 class="title">套餐管理</h3>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增套餐
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="套餐名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="callLimit" label="调用限额" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.callLimit) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ row.durationDays || row.duration || 30 }}天
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              link
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDialog" :title="editMode ? '编辑套餐' : '新增套餐'" width="500px">
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="100px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="planForm.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="planForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="调用限额" prop="callLimit">
          <el-input-number v-model="planForm.callLimit" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="planForm.price" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(天)" prop="durationDays">
          <el-input-number v-model="planForm.durationDays" :min="1" :max="365" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="planForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPlanList, createPlan, updatePlan } from '../api/plans'

const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const editMode = ref(false)
const planFormRef = ref(null)

const tableData = ref([])
const total = ref(0)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const planForm = reactive({
  id: null,
  name: '',
  description: '',
  callLimit: 0,
  price: 0,
  durationDays: 30,
  status: 'active'
})

const planRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  callLimit: [{ required: true, message: '请输入调用限额', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  durationDays: [{ required: true, message: '请输入时长', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getPlanList(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  editMode.value = false
  planForm.id = null
  planForm.name = ''
  planForm.description = ''
  planForm.callLimit = 0
  planForm.price = 0
  planForm.durationDays = 30
  planForm.status = 'active'
  showDialog.value = true
}

const handleEdit = (row) => {
  editMode.value = true
  planForm.id = row.id
  planForm.name = row.name
  planForm.description = row.description
  planForm.callLimit = row.callLimit
  planForm.price = row.price
  planForm.durationDays = row.durationDays || row.duration || 30
  planForm.status = row.status
  showDialog.value = true
}

const handleSubmit = async () => {
  try {
    await planFormRef.value.validate()
    submitLoading.value = true
    if (editMode.value) {
      await updatePlan(planForm.id, planForm)
      ElMessage.success('编辑成功')
    } else {
      await createPlan(planForm)
      ElMessage.success('新增成功')
    }
    showDialog.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}该套餐吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updatePlan(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '-'
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.plan-list {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
