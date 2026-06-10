<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">工单管理</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建工单
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="工单号/产品/客户" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待排产" value="pending" />
            <el-option label="已排产" value="scheduled" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已完成" value="completed" />
            <el-option label="已延期" value="delayed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="全部优先级" clearable style="width: 140px">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任人">
          <el-select v-model="filters.assignedTo" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="工单号" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="140" />
        <el-table-column prop="productModel" label="规格型号" width="120" />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="completedQuantity" label="已完成" width="80" align="right" />
        <el-table-column label="完成率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.completionRate || 0" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="`status-tag status-${row.status}`">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <span :class="`priority-${row.priority}`">{{ priorityText(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="交期" width="110">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.isDelayed }">
              {{ formatDate(row.deliveryDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="责任人" width="100">
          <template #default="{ row }">
            {{ row.assignee?.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link v-if="canManage" @click="openEditDialog(row)">编辑</el-button>
            <el-dropdown v-if="canManage" @command="(cmd) => handleStatusChange(row, cmd)">
              <el-button type="primary" link>状态变更</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="scheduled">已排产</el-dropdown-item>
                  <el-dropdown-item command="in_production">生产中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="delayed">已延期</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="工单号" prop="orderNo">
          <el-input v-model="formData.orderNo" />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="formData.productName" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="formData.productModel" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="formData.customerName" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待排产" value="pending" />
            <el-option label="已排产" value="scheduled" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已完成" value="completed" />
            <el-option label="已延期" value="delayed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="formData.plannedStartDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="计划结束">
          <el-date-picker v-model="formData.plannedEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="交期">
          <el-date-picker v-model="formData.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="责任人">
          <el-select v-model="formData.assignedTo" placeholder="请选择" clearable style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { workOrderApi, userApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const userList = ref([])
const dateRange = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  priority: '',
  assignedTo: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑工单' : '新建工单'))
const isEdit = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  orderNo: '',
  productName: '',
  productModel: '',
  quantity: 1,
  customerName: '',
  priority: 'medium',
  status: 'pending',
  plannedStartDate: '',
  plannedEndDate: '',
  deliveryDate: '',
  assignedTo: null,
  remarks: '',
})

const formRules = {
  orderNo: [{ required: true, message: '请输入工单号', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

function statusText(status) {
  const map = {
    pending: '待排产',
    scheduled: '已排产',
    in_production: '生产中',
    completed: '已完成',
    delayed: '已延期',
    cancelled: '已取消',
  }
  return map[status] || status
}

function priorityText(priority) {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

async function loadUsers() {
  try {
    const res = await userApi.userList()
    userList.value = res.data
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await workOrderApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.priority = ''
  filters.assignedTo = ''
  dateRange.value = []
  pagination.page = 1
  loadData()
}

function viewDetail(row) {
  router.push(`/work-orders/${row.id}`)
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    orderNo: '',
    productName: '',
    productModel: '',
    quantity: 1,
    customerName: '',
    priority: 'medium',
    status: 'pending',
    plannedStartDate: '',
    plannedEndDate: '',
    deliveryDate: '',
    assignedTo: null,
    remarks: '',
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    orderNo: row.orderNo,
    productName: row.productName,
    productModel: row.productModel || '',
    quantity: row.quantity,
    customerName: row.customerName || '',
    priority: row.priority,
    status: row.status,
    plannedStartDate: row.plannedStartDate ? dayjs(row.plannedStartDate).format('YYYY-MM-DD') : '',
    plannedEndDate: row.plannedEndDate ? dayjs(row.plannedEndDate).format('YYYY-MM-DD') : '',
    deliveryDate: row.deliveryDate ? dayjs(row.deliveryDate).format('YYYY-MM-DD') : '',
    assignedTo: row.assignedTo,
    remarks: row.remarks || '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await workOrderApi.update(formData.id, formData)
      ElMessage.success('工单更新成功')
    } else {
      await workOrderApi.create(formData)
      ElMessage.success('工单创建成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row, status) {
  try {
    await ElMessageBox.confirm(
      `确定将工单 ${row.orderNo} 状态变更为「${statusText(status)}」吗？`,
      '确认',
      { type: 'warning' }
    )
    await workOrderApi.updateStatus(row.id, { status })
    ElMessage.success('状态更新成功')
    loadData()
  } catch (e) {}
}

onMounted(() => {
  loadUsers()
  loadData()
})
</script>

<style scoped>
.text-danger {
  color: #f56c6c;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
