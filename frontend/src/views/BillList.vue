<template>
  <div class="bill-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="客户">
          <el-input v-model="searchForm.customerName" placeholder="客户名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已逾期" value="overdue" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="账期">
          <el-date-picker
            v-model="searchForm.period"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <el-button type="primary" @click="handleGenerate">
            <el-icon><DocumentAdd /></el-icon>
            生成账单
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
        <div class="header-right">
          <span>共 {{ total }} 条</span>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="billNo" label="账单编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" min-width="150" />
        <el-table-column prop="period" label="账期" width="120" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日" width="120">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="账单详情" width="600px">
      <el-descriptions :column="2" border v-loading="detailLoading">
        <el-descriptions-item label="账单编号">{{ billDetail.billNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ billDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="账期">{{ billDetail.period }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(billDetail.status)">{{ getStatusText(billDetail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ billDetail.amount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="到期日">{{ formatDate(billDetail.dueDate) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(billDetail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDate(billDetail.paidAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ billDetail.remark }}</el-descriptions-item>
      </el-descriptions>

      <el-table :data="billDetail.items || []" style="margin-top: 20px">
        <el-table-column prop="itemName" label="项目" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="120">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="showGenerateDialog" title="生成账单" width="500px">
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-form-item label="账期" prop="period">
          <el-date-picker
            v-model="generateForm.period"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="生成方式" prop="type">
          <el-radio-group v-model="generateForm.type">
            <el-radio label="all">全部客户</el-radio>
            <el-radio label="selected">指定客户</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" :loading="generateLoading" @click="handleGenerateSubmit">
          生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentAdd, Download } from '@element-plus/icons-vue'
import { getBillList, getBillDetail, generateBills, exportBills } from '../api/bills'

const loading = ref(false)
const detailLoading = ref(false)
const generateLoading = ref(false)
const showDetailDialog = ref(false)
const showGenerateDialog = ref(false)
const generateFormRef = ref(null)

const tableData = ref([])
const total = ref(0)
const billDetail = reactive({})

const searchForm = reactive({
  customerName: '',
  status: '',
  period: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const generateForm = reactive({
  period: '',
  type: 'all'
})

const generateRules = {
  period: [{ required: true, message: '请选择账期', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getBillList(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.customerName = ''
  searchForm.status = ''
  searchForm.period = ''
  pagination.page = 1
  loadData()
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

const handleViewDetail = async (row) => {
  showDetailDialog.value = true
  detailLoading.value = true
  try {
    const res = await getBillDetail(row.id)
    const data = res.data || res
    Object.assign(billDetail, data)
  } catch (e) {
    console.error(e)
  } finally {
    detailLoading.value = false
  }
}

const handleGenerate = () => {
  generateForm.period = ''
  generateForm.type = 'all'
  showGenerateDialog.value = true
}

const handleGenerateSubmit = async () => {
  try {
    await generateFormRef.value.validate()
    generateLoading.value = true
    await generateBills(generateForm)
    ElMessage.success('账单生成成功')
    showGenerateDialog.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    generateLoading.value = false
  }
}

const handleExport = async () => {
  try {
    const res = await exportBills(searchForm)
    const blob = new Blob([res])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bills_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
  }
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待支付',
    paid: '已支付',
    overdue: '已逾期',
    cancelled: '已取消'
  }
  return map[status] || status || '-'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.bill-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-card .header-left {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
