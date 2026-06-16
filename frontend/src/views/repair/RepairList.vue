<template>
  <div class="repair-list">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="设备ID">
            <el-input v-model="searchForm.equipmentId" placeholder="请输入设备ID" clearable />
          </el-form-item>
          <el-form-item label="维修员ID">
            <el-input v-model="searchForm.repairerId" placeholder="请输入维修员ID" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待分配" :value="0" />
              <el-option label="待维修" :value="1" />
              <el-option label="维修中" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="searchForm.priority" placeholder="请选择优先级" clearable>
              <el-option label="低" :value="1" />
              <el-option label="中" :value="2" />
              <el-option label="高" :value="3" />
              <el-option label="紧急" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">创建维修单</el-button>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="repairNo" label="维修单号" width="140" />
        <el-table-column prop="equipmentId" label="设备ID" width="100" />
        <el-table-column prop="reporterId" label="报修人ID" width="100" />
        <el-table-column prop="repairerId" label="维修员ID" width="100" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="faultDesc" label="故障描述" show-overflow-tooltip />
        <el-table-column prop="cost" label="费用(元)" width="100" />
        <el-table-column prop="reportTime" label="报修时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.reportTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link @click="handleAssign(row)">分配</el-button>
            <el-button v-if="row.status === 1 || row.status === 2" type="success" link @click="handleUpdateStatus(row)">更新状态</el-button>
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="创建维修单" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="设备ID" prop="equipmentId">
          <el-input v-model="createForm.equipmentId" placeholder="请输入设备ID" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
            <el-option label="紧急" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述" prop="faultDesc">
          <el-input v-model="createForm.faultDesc" type="textarea" :rows="3" placeholder="请输入故障描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignDialogVisible" title="分配维修员" width="500px">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="100px">
        <el-form-item label="维修员ID" prop="repairerId">
          <el-input v-model="assignForm.repairerId" placeholder="请输入维修员ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="更新维修状态" width="600px">
      <el-form :model="statusForm" :rules="statusRules" ref="statusFormRef" label-width="100px">
        <el-form-item label="状态" prop="status">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="维修中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修描述" prop="repairDesc">
          <el-input v-model="statusForm.repairDesc" type="textarea" :rows="3" placeholder="请输入维修描述" />
        </el-form-item>
        <el-form-item label="费用(元)" prop="cost">
          <el-input v-model="statusForm.cost" placeholder="请输入维修费用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="维修单详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="维修单号">{{ detailData.repairNo }}</el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ detailData.equipmentId }}</el-descriptions-item>
        <el-descriptions-item label="报修人ID">{{ detailData.reporterId }}</el-descriptions-item>
        <el-descriptions-item label="维修员ID">{{ detailData.repairerId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(detailData.priority)">{{ getPriorityText(detailData.priority) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ detailData.faultDesc }}</el-descriptions-item>
        <el-descriptions-item label="维修描述" :span="2">{{ detailData.repairDesc || '-' }}</el-descriptions-item>
        <el-descriptions-item label="费用">{{ detailData.cost ? detailData.cost + '元' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="报修时间" :span="2">{{ formatDate(detailData.reportTime) }}</el-descriptions-item>
        <el-descriptions-item label="开始时间" :span="2">{{ formatDate(detailData.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">{{ formatDate(detailData.finishTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRepairPage, createRepair, assignRepairer, updateRepairStatus, getRepairById } from '@/api/repair'

const searchForm = reactive({
  equipmentId: '',
  repairerId: '',
  status: null,
  priority: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const createDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const createFormRef = ref(null)
const assignFormRef = ref(null)
const statusFormRef = ref(null)
const currentId = ref(null)
const detailData = ref({})

const createForm = reactive({
  equipmentId: '',
  priority: 2,
  faultDesc: ''
})

const assignForm = reactive({
  repairerId: ''
})

const statusForm = reactive({
  status: 2,
  repairDesc: '',
  cost: ''
})

const createRules = {
  equipmentId: [{ required: true, message: '请输入设备ID', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  faultDesc: [{ required: true, message: '请输入故障描述', trigger: 'blur' }]
}

const assignRules = {
  repairerId: [{ required: true, message: '请输入维修员ID', trigger: 'blur' }]
}

const statusRules = {
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待分配', 1: '待维修', 2: '维修中', 3: '已完成', 4: '已取消' }
  return map[status] || '未知'
}

const getPriorityType = (priority) => {
  const map = { 1: 'info', 2: 'warning', 3: 'danger', 4: 'danger' }
  return map[priority] || 'info'
}

const getPriorityText = (priority) => {
  const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  return map[priority] || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  return date
}

const fetchData = async () => {
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    if (searchForm.equipmentId) params.equipmentId = searchForm.equipmentId
    if (searchForm.repairerId) params.repairerId = searchForm.repairerId
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.priority !== null && searchForm.priority !== '') params.priority = searchForm.priority
    const res = await getRepairPage(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch (error) {
    console.error('获取维修列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.equipmentId = ''
  searchForm.repairerId = ''
  searchForm.status = null
  searchForm.priority = null
  handleSearch()
}

const handleCreate = () => {
  createForm.equipmentId = ''
  createForm.priority = 2
  createForm.faultDesc = ''
  createDialogVisible.value = true
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createRepair(createForm)
        ElMessage.success('创建成功')
        createDialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('创建失败:', error)
      }
    }
  })
}

const handleAssign = (row) => {
  currentId.value = row.id
  assignForm.repairerId = ''
  assignDialogVisible.value = true
}

const handleAssignSubmit = async () => {
  if (!assignFormRef.value) return
  await assignFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await assignRepairer(currentId.value, assignForm.repairerId)
        ElMessage.success('分配成功')
        assignDialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('分配失败:', error)
      }
    }
  })
}

const handleUpdateStatus = (row) => {
  currentId.value = row.id
  statusForm.status = row.status === 1 ? 2 : row.status
  statusForm.repairDesc = row.repairDesc || ''
  statusForm.cost = row.cost || ''
  statusDialogVisible.value = true
}

const handleStatusSubmit = async () => {
  if (!statusFormRef.value) return
  await statusFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await updateRepairStatus(currentId.value, statusForm.status, statusForm)
        ElMessage.success('更新成功')
        statusDialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('更新失败:', error)
      }
    }
  })
}

const handleView = async (row) => {
  try {
    const res = await getRepairById(row.id)
    detailData.value = res
    viewDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.repair-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
