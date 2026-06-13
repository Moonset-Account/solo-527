<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">异常录入</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增异常</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="异常类型" clearable style="width: 140px" @change="loadExceptions">
        <el-option label="报损" value="loss" />
        <el-option label="损坏" value="damage" />
        <el-option label="投诉" value="complaint" />
        <el-option label="设备" value="equipment" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px" @change="loadExceptions">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-button type="primary" @click="loadExceptions">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="exceptionList" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagMap[row.type]">{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lossAmount" label="损失金额" width="110">
          <template #default="{ row }">
            <span v-if="row.lossAmount">¥{{ Number(row.lossAmount).toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="录入人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="success" link size="small" v-if="row.status === 'pending'" @click="handleProcess(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadExceptions"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增异常记录" width="600px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%" placeholder="请选择门店">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型" prop="type">
          <el-select v-model="form.type" style="width: 100%" placeholder="请选择类型">
            <el-option label="食材报损" value="loss" />
            <el-option label="物品损坏" value="damage" />
            <el-option label="顾客投诉" value="complaint" />
            <el-option label="设备故障" value="equipment" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="报损原因" prop="lossReasonId" v-if="form.type === 'loss'">
          <el-select v-model="form.lossReasonId" style="width: 100%" placeholder="请选择报损原因">
            <el-option v-for="reason in lossReasonList" :key="reason.id" :label="reason.name" :value="reason.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述异常情况" />
        </el-form-item>
        <el-form-item label="损失金额" prop="lossAmount">
          <el-input-number v-model="form.lossAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="涉及食材" v-if="form.type === 'loss'">
          <el-select v-model="form.ingredientId" style="width: 100%" placeholder="请选择食材" clearable>
            <el-option v-for="ing in ingredientList" :key="ing.id" :label="ing.name" :value="ing.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" v-if="form.type === 'loss' && form.ingredientId">
          <el-input-number v-model="form.ingredientQuantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="异常详情" width="600px">
      <el-descriptions :column="2" border v-if="currentException">
        <el-descriptions-item label="标题" :span="2">{{ currentException.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ typeMap[currentException.type] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentException.status]">
            {{ statusMap[currentException.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentException.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="损失金额">
          {{ currentException.lossAmount ? '¥' + Number(currentException.lossAmount).toFixed(2) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="录入人">{{ currentException.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentException.handler?.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentException.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentException.description }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">
          {{ currentException.handlingResult || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="processVisible" title="处理异常" width="500px">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理结果">
          <el-input v-model="processForm.handlingResult" type="textarea" :rows="4" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认处理</el-button>
      </template>
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
const processVisible = ref(false)
const formRef = ref(null)
const currentException = ref(null)
const currentProcessId = ref(null)

const exceptionList = ref([])
const storeList = ref([])
const lossReasonList = ref([])
const ingredientList = ref([])

const filters = reactive({
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const form = reactive({
  storeId: null,
  type: '',
  lossReasonId: null,
  title: '',
  description: '',
  lossAmount: 0,
  ingredientId: null,
  ingredientQuantity: null
})

const processForm = reactive({
  handlingResult: ''
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const typeMap = {
  loss: '报损',
  damage: '损坏',
  complaint: '投诉',
  equipment: '设备',
  other: '其他'
}

const typeTagMap = {
  loss: 'danger',
  damage: 'warning',
  complaint: 'warning',
  equipment: 'info',
  other: 'info'
}

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
}

const statusTagMap = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success',
  closed: 'info'
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return dayjs(dt).format('YYYY-MM-DD HH:mm')
}

const loadExceptions = async () => {
  loading.value = true
  try {
    const res = await api.get('/operations/exceptions', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type || undefined,
        status: filters.status || undefined
      }
    })
    exceptionList.value = res.data || []
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

const loadLossReasons = async () => {
  try {
    const res = await api.get('/admin/loss-reasons', { params: { limit: 100, is_active: true } })
    lossReasonList.value = res.data || []
  } catch (e) {}
}

const loadIngredients = async () => {
  try {
    const res = await api.get('/admin/ingredients', { params: { limit: 100, is_active: true } })
    ingredientList.value = res.data || []
  } catch (e) {}
}

const openCreateDialog = () => {
  dialogVisible.value = true
}

const resetForm = () => {
  form.storeId = null
  form.type = ''
  form.lossReasonId = null
  form.title = ''
  form.description = ''
  form.lossAmount = 0
  form.ingredientId = null
  form.ingredientQuantity = null
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.post('/operations/exceptions', form)
        ElMessage.success('录入成功')
        dialogVisible.value = false
        loadExceptions()
      } finally {
        submitting.value = false
      }
    }
  })
}

const viewDetail = async (row) => {
  try {
    const res = await api.get(`/operations/exceptions/${row.id}`)
    currentException.value = res
    detailVisible.value = true
  } catch (e) {}
}

const handleProcess = (row) => {
  currentProcessId.value = row.id
  processForm.handlingResult = ''
  processVisible.value = true
}

const submitProcess = async () => {
  if (!processForm.handlingResult) {
    ElMessage.warning('请输入处理结果')
    return
  }
  try {
    await api.put(`/operations/exceptions/${currentProcessId.value}`, {
      status: 'resolved',
      handlingResult: processForm.handlingResult
    })
    ElMessage.success('处理成功')
    processVisible.value = false
    loadExceptions()
  } catch (e) {}
}

const resetFilters = () => {
  filters.type = ''
  filters.status = ''
  pagination.page = 1
  loadExceptions()
}

onMounted(() => {
  loadExceptions()
  loadStores()
  loadLossReasons()
  loadIngredients()
})
</script>
