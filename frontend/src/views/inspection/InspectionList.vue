<template>
  <div class="inspection-list">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="设备ID">
            <el-input v-model="searchForm.equipmentId" placeholder="请输入设备ID" clearable />
          </el-form-item>
          <el-form-item label="巡检员ID">
            <el-input v-model="searchForm.inspectorId" placeholder="请输入巡检员ID" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待分配" :value="0" />
              <el-option label="待巡检" :value="1" />
              <el-option label="巡检中" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">创建巡检</el-button>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="inspectionNo" label="巡检单号" width="140" />
        <el-table-column prop="equipmentId" label="设备ID" width="100" />
        <el-table-column prop="inspectorId" label="巡检员ID" width="100" />
        <el-table-column prop="planTime" label="计划时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.planTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualTime" label="实际时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.actualTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="巡检结果" show-overflow-tooltip />
        <el-table-column prop="abnormalDesc" label="异常描述" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link @click="handleAssign(row)">分配</el-button>
            <el-button v-if="row.status === 1 || row.status === 2" type="success" link @click="handleSubmit(row)">提交结果</el-button>
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

    <el-dialog v-model="createDialogVisible" title="创建巡检" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="设备ID" prop="equipmentId">
          <el-input v-model="createForm.equipmentId" placeholder="请输入设备ID" />
        </el-form-item>
        <el-form-item label="计划时间" prop="planTime">
          <el-date-picker
            v-model="createForm.planTime"
            type="datetime"
            placeholder="选择计划巡检时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignDialogVisible" title="分配巡检员" width="500px">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="100px">
        <el-form-item label="巡检员ID" prop="inspectorId">
          <el-input v-model="assignForm.inspectorId" placeholder="请输入巡检员ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitDialogVisible" title="提交巡检结果" width="600px">
      <el-form :model="submitForm" :rules="submitRules" ref="submitFormRef" label-width="100px">
        <el-form-item label="巡检结果" prop="result">
          <el-radio-group v-model="submitForm.result">
            <el-radio label="正常">正常</el-radio>
            <el-radio label="异常">异常</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="异常描述" prop="abnormalDesc">
          <el-input v-model="submitForm.abnormalDesc" type="textarea" :rows="3" placeholder="请输入异常描述" />
        </el-form-item>
        <el-form-item label="实际时间" prop="actualTime">
          <el-date-picker
            v-model="submitForm.actualTime"
            type="datetime"
            placeholder="选择实际巡检时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitResult">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="巡检详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="巡检单号">{{ detailData.inspectionNo }}</el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ detailData.equipmentId }}</el-descriptions-item>
        <el-descriptions-item label="巡检员ID">{{ detailData.inspectorId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="计划时间" :span="2">{{ formatDate(detailData.planTime) }}</el-descriptions-item>
        <el-descriptions-item label="实际时间" :span="2">{{ formatDate(detailData.actualTime) }}</el-descriptions-item>
        <el-descriptions-item label="巡检结果" :span="2">{{ detailData.result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">{{ detailData.abnormalDesc || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getInspectionPage, createInspection, assignInspector, submitInspectionResult, getInspectionById } from '@/api/inspection'

const searchForm = reactive({
  equipmentId: '',
  inspectorId: '',
  status: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const createDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const submitDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const createFormRef = ref(null)
const assignFormRef = ref(null)
const submitFormRef = ref(null)
const currentId = ref(null)
const detailData = ref({})

const createForm = reactive({
  equipmentId: '',
  planTime: ''
})

const assignForm = reactive({
  inspectorId: ''
})

const submitForm = reactive({
  result: '正常',
  abnormalDesc: '',
  actualTime: ''
})

const createRules = {
  equipmentId: [{ required: true, message: '请输入设备ID', trigger: 'blur' }],
  planTime: [{ required: true, message: '请选择计划时间', trigger: 'change' }]
}

const assignRules = {
  inspectorId: [{ required: true, message: '请输入巡检员ID', trigger: 'blur' }]
}

const submitRules = {
  result: [{ required: true, message: '请选择巡检结果', trigger: 'change' }]
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待分配', 1: '待巡检', 2: '巡检中', 3: '已完成', 4: '已取消' }
  return map[status] || '未知'
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
    if (searchForm.inspectorId) params.inspectorId = searchForm.inspectorId
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    const res = await getInspectionPage(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch (error) {
    console.error('获取巡检列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.equipmentId = ''
  searchForm.inspectorId = ''
  searchForm.status = null
  handleSearch()
}

const handleCreate = () => {
  createForm.equipmentId = ''
  createForm.planTime = ''
  createDialogVisible.value = true
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createInspection(createForm)
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
  assignForm.inspectorId = ''
  assignDialogVisible.value = true
}

const handleAssignSubmit = async () => {
  if (!assignFormRef.value) return
  await assignFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await assignInspector(currentId.value, assignForm.inspectorId)
        ElMessage.success('分配成功')
        assignDialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('分配失败:', error)
      }
    }
  })
}

const handleSubmit = (row) => {
  currentId.value = row.id
  submitForm.result = '正常'
  submitForm.abnormalDesc = ''
  submitForm.actualTime = ''
  submitDialogVisible.value = true
}

const handleSubmitResult = async () => {
  if (!submitFormRef.value) return
  await submitFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await submitInspectionResult(currentId.value, submitForm)
        ElMessage.success('提交成功')
        submitDialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }
  })
}

const handleView = async (row) => {
  try {
    const res = await getInspectionById(row.id)
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
.inspection-list {
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
