<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">食材库存</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增记录</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.logType" placeholder="类型" clearable style="width: 140px" @change="loadData">
        <el-option label="入库" value="inbound" />
        <el-option label="出库" value="outbound" />
        <el-option label="盘点" value="check" />
        <el-option label="调整" value="adjust" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="logTypeTagMap[getLogType(row)] || 'info'">
              {{ logTypeMap[getLogType(row)] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="store.name" label="门店" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="操作人" width="100" />
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
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

    <el-dialog v-model="dialogVisible" title="新增库存记录" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="logType">
          <el-select v-model="form.logType" style="width: 100%">
            <el-option label="入库" value="inbound" />
            <el-option label="出库" value="outbound" />
            <el-option label="盘点" value="check" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="明细">
          <div style="width: 100%">
            <div v-for="(item, index) in form.items" :key="index" class="item-row">
              <el-select v-model="item.ingredientId" placeholder="选择食材" style="width: 150px" @change="onIngredientChange(index)">
                <el-option v-for="ing in ingredientList" :key="ing.id" :label="ing.name" :value="ing.id" />
              </el-select>
              <el-input-number v-model="item.quantity" :min="0" :precision="2" style="width: 120px; margin: 0 8px" placeholder="数量" />
              <el-input v-model="item.unit" placeholder="单位" style="width: 80px" />
              <el-input v-model="item.remark" placeholder="备注" style="flex: 1; margin: 0 8px" />
              <el-button type="danger" text @click="removeItem(index)">删除</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addItem">添加明细</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="库存记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="标题" :span="2">{{ currentRecord.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ logTypeMap[getLogType(currentRecord)] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentRecord.status]">{{ statusMap[currentRecord.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentRecord.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRecord.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="明细" :span="2">
          <el-table :data="currentRecord.data?.items || []" size="small" border>
            <el-table-column prop="ingredientName" label="食材" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)
const currentRecord = ref(null)

const list = ref([])
const storeList = ref([])
const ingredientList = ref([])

const filters = reactive({ logType: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

const form = reactive({
  storeId: null,
  logType: 'inbound',
  title: '',
  description: '',
  items: [{ ingredientId: null, ingredientName: '', quantity: 0, unit: '', remark: '' }]
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  logType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const statusMap = { pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'info' }

const logTypeMap = { inbound: '入库', outbound: '出库', check: '盘点', adjust: '调整' }
const logTypeTagMap = { inbound: 'success', outbound: 'danger', check: 'primary', adjust: 'warning' }

const getLogType = (row) => row.data?.logType || 'check'
const formatDateTime = (dt) => dt ? dayjs(dt).format('YYYY-MM-DD HH:mm') : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/process/inventory-logs', {
      params: { page: pagination.page, limit: pagination.limit }
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
  form.storeId = null
  form.logType = 'inbound'
  form.title = ''
  form.description = ''
  form.items = [{ ingredientId: null, ingredientName: '', quantity: 0, unit: '', remark: '' }]
  dialogVisible.value = true
}

const addItem = () => {
  form.items.push({ ingredientId: null, ingredientName: '', quantity: 0, unit: '', remark: '' })
}

const removeItem = (index) => {
  form.items.splice(index, 1)
}

const onIngredientChange = (index) => {
  const item = form.items[index]
  const ing = ingredientList.value.find(i => i.id === item.ingredientId)
  if (ing) {
    item.ingredientName = ing.name
    item.unit = ing.unit
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.post('/process/inventory-logs', form)
        ElMessage.success('提交成功')
        dialogVisible.value = false
        loadData()
      } finally {
        submitting.value = false
      }
    }
  })
}

const viewDetail = async (row) => {
  try {
    const res = await api.get(`/process/records/${row.id}`)
    currentRecord.value = res
    detailVisible.value = true
  } catch (e) {}
}

const resetFilters = () => {
  filters.logType = ''
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadStores()
  loadIngredients()
})
</script>

<style scoped>
.item-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
