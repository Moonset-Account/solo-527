<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">现金流水</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增流水</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px" @change="loadData">
        <el-option label="待处理" value="pending" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="amount" label="金额" width="140">
          <template #default="{ row }">
            <span :style="{ color: getFlowType(row) === 'income' ? '#67c23a' : '#f56c6c' }">
              {{ getFlowType(row) === 'income' ? '+' : '-' }}¥{{ Number(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getFlowType(row) === 'income' ? 'success' : 'danger'">
              {{ getFlowType(row) === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="store.name" label="门店" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="录入人" width="100" />
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

    <el-dialog v-model="dialogVisible" title="新增现金流水" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="flowType">
          <el-radio-group v-model="form.flowType">
            <el-radio value="income">收入</el-radio>
            <el-radio value="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="form.category" style="width: 100%" placeholder="请选择类别">
            <el-option label="营业收入" value="sales" />
            <el-option label="食材采购" value="purchase" />
            <el-option label="水电费" value="utility" />
            <el-option label="员工工资" value="salary" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="流水详情" width="500px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="标题" :span="2">{{ currentRecord.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small" :type="getFlowType(currentRecord) === 'income' ? 'success' : 'danger'">
            {{ getFlowType(currentRecord) === 'income' ? '收入' : '支出' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额">
          <span :style="{ color: getFlowType(currentRecord) === 'income' ? '#67c23a' : '#f56c6c' }">
            ¥{{ Number(currentRecord.amount).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentRecord.status]">
            {{ statusMap[currentRecord.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="录入人">{{ currentRecord.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRecord.description || '-' }}</el-descriptions-item>
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

const filters = reactive({ status: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

const form = reactive({
  storeId: null,
  flowType: 'income',
  title: '',
  amount: 0,
  category: '',
  description: ''
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  flowType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const statusMap = { pending: '待处理', completed: '已完成' }
const statusTagMap = { pending: 'warning', completed: 'success' }

const getFlowType = (row) => row.data?.flowType || 'income'
const formatDateTime = (dt) => dt ? dayjs(dt).format('YYYY-MM-DD HH:mm') : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/process/cash-flows', {
      params: { page: pagination.page, limit: pagination.limit, status: filters.status || undefined }
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

const openCreateDialog = () => {
  form.storeId = null
  form.flowType = 'income'
  form.title = ''
  form.amount = 0
  form.category = ''
  form.description = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.post('/process/cash-flows', form)
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
  filters.status = ''
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadStores()
})
</script>
