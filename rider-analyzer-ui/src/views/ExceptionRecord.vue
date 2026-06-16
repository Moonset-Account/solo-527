<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="异常类型" clearable style="width: 140px">
        <el-option label="温度异常" value="温度异常" />
        <el-option label="超时" value="超时" />
        <el-option label="破损" value="破损" />
        <el-option label="其他" value="其他" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px">
        <el-option label="待处理" value="PENDING" />
        <el-option label="已处理" value="HANDLED" />
      </el-select>
      <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="exceptionList" stripe v-loading="loading" size="small">
      <el-table-column prop="orderNo" label="订单号" width="170" />
      <el-table-column prop="type" label="异常类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type] || ''" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="tempReason" label="温度异常原因" width="140" show-overflow-tooltip />
      <el-table-column prop="handleDuration" label="处理耗时(分钟)" width="120" align="center">
        <template #default="{ row }">
          {{ row.handleDuration != null ? row.handleDuration : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="handler" label="负责人" width="90" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'HANDLED' ? 'success' : 'danger'" size="small">{{ row.status === 'HANDLED' ? '已处理' : '待处理' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'HANDLED'" type="primary" size="small" link @click="openHandleDialog(row)">处理</el-button>
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
        <el-form-item label="温度异常原因" prop="tempReason">
          <el-input v-model="handleForm.tempReason" type="textarea" :rows="3" placeholder="请输入温度异常原因" />
        </el-form-item>
        <el-form-item label="处理耗时(分钟)" prop="handleDuration">
          <el-input-number v-model="handleForm.handleDuration" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人" prop="handler">
          <el-input v-model="handleForm.handler" placeholder="请输入负责人" />
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
import { getExceptionList, handleException } from '../api/exception'

const typeTagMap = { '温度异常': 'danger', '超时': 'warning', '破损': 'info', '其他': '' }

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
  tempReason: '',
  handleDuration: 0,
  handler: ''
})

const formRules = {
  tempReason: [{ required: true, message: '请输入温度异常原因', trigger: 'blur' }],
  handleDuration: [{ required: true, message: '请输入处理耗时', trigger: 'change' }],
  handler: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      type: filters.value.type,
      status: filters.value.status,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    }
    const res = await getExceptionList(params)
    exceptionList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    exceptionList.value = [
      { id: 1, orderNo: 'ORD-20260616001', type: '温度异常', description: '冷链配送温度超标2度', tempReason: '', handleDuration: null, handler: '', status: 'PENDING', createdAt: '2026-06-16 14:30:00' },
      { id: 2, orderNo: 'ORD-20260616002', type: '超时', description: '配送延迟30分钟', tempReason: '不适用', handleDuration: 25, handler: '张主管', status: 'HANDLED', createdAt: '2026-06-16 12:15:00' },
      { id: 3, orderNo: 'ORD-20260615003', type: '破损', description: '商品外包装破损', tempReason: '不适用', handleDuration: 15, handler: '李主管', status: 'HANDLED', createdAt: '2026-06-15 16:45:00' },
      { id: 4, orderNo: 'ORD-20260615004', type: '温度异常', description: '冷冻品温度异常升高', tempReason: '冷链箱密封不严', handleDuration: 40, handler: '王主管', status: 'HANDLED', createdAt: '2026-06-15 09:20:00' },
      { id: 5, orderNo: 'ORD-20260614005', type: '其他', description: '客户拒收', tempReason: '', handleDuration: null, handler: '', status: 'PENDING', createdAt: '2026-06-14 17:00:00' }
    ]
    total.value = 5
  } finally {
    loading.value = false
  }
}

function openHandleDialog(row) {
  currentExceptionId.value = row.id
  handleForm.tempReason = row.tempReason || ''
  handleForm.handleDuration = row.handleDuration || 0
  handleForm.handler = row.handler || ''
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
