<template>
  <div class="seat-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="席位编码/客户名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="searchForm.planId" placeholder="全部" clearable>
            <el-option v-for="plan in plans" :key="plan.id" :label="plan.name" :value="plan.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否闲置">
          <el-select v-model="searchForm.isIdle" placeholder="全部" clearable>
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
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
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增席位
          </el-button>
          <el-button @click="showBatchDialog = true">批量查询</el-button>
        </div>
        <div class="header-right">
          <span>共 {{ total }} 条</span>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="seatCode" label="席位编码" width="150" />
        <el-table-column prop="customerName" label="客户名称" min-width="150" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiUsage" label="API用量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.apiUsage) }}
          </template>
        </el-table-column>
        <el-table-column prop="isIdle" label="是否闲置" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isIdle ? 'warning' : 'success'">
              {{ row.isIdle ? '是' : '否' }}
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
            <el-button type="primary" link @click="goToDetail(row.id)">查看详情</el-button>
            <el-button type="warning" link @click="openNoteDialog(row)">添加备注</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

    <el-dialog v-model="showAddDialog" :title="editMode ? '编辑席位' : '新增席位'" width="500px">
      <el-form :model="seatForm" :rules="seatRules" ref="seatFormRef" label-width="80px">
        <el-form-item label="席位编码" prop="seatCode">
          <el-input v-model="seatForm.seatCode" placeholder="请输入席位编码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="seatForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="套餐" prop="planId">
          <el-select v-model="seatForm.planId" placeholder="请选择套餐" style="width: 100%">
            <el-option v-for="plan in plans" :key="plan.id" :label="plan.name" :value="plan.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="seatForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchDialog" title="批量查询" width="500px">
      <el-form label-width="100px">
        <el-form-item label="客户ID列表">
          <el-input
            v-model="batchIds"
            type="textarea"
            :rows="5"
            placeholder="请输入客户ID，多个用逗号或换行分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchQuery">查询</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showNoteDialogRef" title="添加备注" width="500px">
      <el-form :model="noteForm" :rules="noteRules" ref="noteFormRef" label-width="80px">
        <el-form-item label="备注内容" prop="content">
          <el-input v-model="noteForm.content" type="textarea" :rows="4" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNoteDialogRef = false">取消</el-button>
        <el-button type="primary" :loading="noteLoading" @click="handleAddNote">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSeatList, createSeat, updateSeat, addSeatNote, batchQuerySeats } from '../api/seats'
import { getPlanList } from '../api/plans'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const noteLoading = ref(false)
const batchLoading = ref(false)
const showAddDialog = ref(false)
const showNoteDialogRef = ref(false)
const showBatchDialog = ref(false)
const editMode = ref(false)
const seatFormRef = ref(null)
const noteFormRef = ref(null)
const currentSeatId = ref(null)

const tableData = ref([])
const total = ref(0)
const plans = ref([])

const searchForm = reactive({
  keyword: '',
  status: '',
  planId: '',
  isIdle: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const seatForm = reactive({
  id: null,
  seatCode: '',
  customerName: '',
  planId: '',
  status: 'active'
})

const seatRules = {
  seatCode: [{ required: true, message: '请输入席位编码', trigger: 'blur' }],
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  planId: [{ required: true, message: '请选择套餐', trigger: 'change' }]
}

const noteForm = reactive({
  content: ''
})

const noteRules = {
  content: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

const batchIds = ref('')

const loadPlans = async () => {
  try {
    const res = await getPlanList({ pageSize: 100 })
    plans.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getSeatList(params)
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
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.planId = ''
  searchForm.isIdle = ''
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

const goToDetail = (id) => {
  router.push(`/seats/${id}`)
}

const handleEdit = (row) => {
  editMode.value = true
  seatForm.id = row.id
  seatForm.seatCode = row.seatCode
  seatForm.customerName = row.customerName
  seatForm.planId = row.planId
  seatForm.status = row.status
  showAddDialog.value = true
}

const handleSubmit = async () => {
  try {
    await seatFormRef.value.validate()
    submitLoading.value = true
    if (editMode.value) {
      await updateSeat(seatForm.id, seatForm)
      ElMessage.success('编辑成功')
    } else {
      await createSeat(seatForm)
      ElMessage.success('新增成功')
    }
    showAddDialog.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    submitLoading.value = false
  }
}

const openNoteDialog = (row) => {
  currentSeatId.value = row.id
  noteForm.content = ''
  showNoteDialogRef.value = true
}

const handleAddNote = async () => {
  try {
    await noteFormRef.value.validate()
    noteLoading.value = true
    await addSeatNote(currentSeatId.value, noteForm)
    ElMessage.success('添加成功')
    showNoteDialogRef.value = false
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    noteLoading.value = false
  }
}

const handleBatchQuery = async () => {
  if (!batchIds.value.trim()) {
    ElMessage.warning('请输入客户ID')
    return
  }
  batchLoading.value = true
  try {
    const ids = batchIds.value.split(/[,\n\s]+/).filter(Boolean)
    const res = await batchQuerySeats({ ids: ids.join(',') })
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || tableData.value.length
    showBatchDialog.value = false
  } catch (e) {
    console.error(e)
  } finally {
    batchLoading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    active: 'success',
    inactive: 'info',
    expired: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    active: '启用',
    inactive: '停用',
    expired: '已过期'
  }
  return map[status] || status
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
  loadPlans()
  loadData()
})
</script>

<style scoped>
.seat-list {
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
