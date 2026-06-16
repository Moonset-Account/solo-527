<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="异常类型" clearable style="width: 140px">
        <el-option label="温度异常" value="TEMPERATURE" />
        <el-option label="超时" value="DELAY" />
        <el-option label="破损" value="DAMAGE" />
        <el-option label="其他" value="OTHER" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px">
        <el-option label="待处理" value="PENDING" />
        <el-option label="已处理" value="RESOLVED" />
      </el-select>
      <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期"
        value-format="YYYY-MM-DD" style="width: 280px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="exceptionList" stripe v-loading="loading" size="small">
      <el-table-column prop="orderNo" label="订单号" width="190" />
      <el-table-column label="异常类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type] || ''" size="small">{{ row.typeLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="tempAnomalyReason" label="温度异常原因" width="150" show-overflow-tooltip />
      <el-table-column label="处理耗时(分钟)" width="120" align="center">
        <template #default="{ row }">
          {{ row.handleDurationMin != null ? row.handleDurationMin : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="handlerName" label="负责人" width="100" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'danger'" size="small">{{ row.statusLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'RESOLVED'" type="primary" size="small" link @click="openHandleDialog(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="fetchData"
      @size-change="fetchData"
    />

    <el-dialog v-model="dialogVisible" title="处理异常" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="handleForm" :rules="formRules" label-width="120px">
        <el-form-item label="温度异常原因" prop="tempAnomalyReason">
          <el-input v-model="handleForm.tempAnomalyReason" type="textarea" :rows="3" placeholder="请输入温度异常原因" />
        </el-form-item>
        <el-form-item label="处理耗时(分钟)" prop="handleDurationMin">
          <el-input-number v-model="handleForm.handleDurationMin" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人" prop="handlerName">
          <el-input v-model="handleForm.handlerName" placeholder="请输入负责人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getExceptionList, handleException } from '../api/exception'
import dayjs from 'dayjs'

const typeTagMap = { TEMPERATURE: 'danger', DELAY: 'warning', DAMAGE: 'info', OTHER: '' }

const loading = ref(false)
const exceptionList = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const currentExceptionId = ref(null)

const filters = ref({
  type: '',
  status: '',
  dateRange: null
})

const handleForm = reactive({
  tempAnomalyReason: '',
  handleDurationMin: 0,
  handlerName: ''
})

const formRules = {
  tempAnomalyReason: [{ required: true, message: '请输入温度异常原因', trigger: 'blur' }],
  handleDurationMin: [{ required: true, message: '请输入处理耗时', trigger: 'change' }],
  handlerName: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      type: filters.value.type || undefined,
      status: filters.value.status || undefined
    }
    const res = await getExceptionList(params)
    exceptionList.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function openHandleDialog(row) {
  currentExceptionId.value = row.id
  handleForm.tempAnomalyReason = row.tempAnomalyReason || ''
  handleForm.handleDurationMin = row.handleDurationMin || 0
  handleForm.handlerName = row.handlerName || ''
  dialogVisible.value = true
}

async function submitHandle() {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await handleException(currentExceptionId.value, { ...handleForm })
    ElMessage.success('处理成功')
    dialogVisible.value = false
    fetchData()
  } catch {}
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  filters.value = { type: '', status: '', dateRange: null }
  page.value = 1
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.el-pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}
</style>
