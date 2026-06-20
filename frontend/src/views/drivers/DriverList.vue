<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/电话/车牌号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在岗" value="on_duty" />
            <el-option label="离岗" value="off_duty" />
            <el-option label="休息" value="rest" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="flex-between mb-16">
        <div class="section-title" style="margin-bottom: 0">司机列表</div>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增司机
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="licenseNumber" label="驾照编号" width="140" />
        <el-table-column prop="vehiclePlate" label="车牌号" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="延误次数" width="100">
          <template #default="{ row }">
            <el-badge :value="row.delayCount" :max="99" :type="row.delayCount > 2 ? 'danger' : 'primary'">
              <span style="padding: 0 8px">{{ row.delayCount }}</span>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button text type="warning" @click="handleDelay(row)">
              记延误
            </el-button>
            <el-button text type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑司机' : '新增司机'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="驾照编号">
          <el-input v-model="form.licenseNumber" placeholder="请输入驾照编号" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="form.vehiclePlate" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="在岗" value="on_duty" />
            <el-option label="离岗" value="off_duty" />
            <el-option label="休息" value="rest" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/api/drivers'
import { triggerDriverDelay } from '@/api/reminders'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  keyword: '',
  status: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = reactive({
  id: null,
  name: '',
  phone: '',
  licenseNumber: '',
  vehiclePlate: '',
  status: 'off_duty',
  remark: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDrivers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    phone: '',
    licenseNumber: '',
    vehiclePlate: '',
    status: 'off_duty',
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    licenseNumber: row.licenseNumber,
    vehiclePlate: row.vehiclePlate,
    status: row.status,
    remark: row.remark
  })
  dialogVisible.value = true
}

const handleDelay = async (row) => {
  try {
    const { value: delayMinutes } = await ElMessageBox.prompt(
      `记录司机"${row.name}"的延误时长（分钟）`,
      '记录延误',
      {
        inputType: 'number',
        inputPlaceholder: '请输入延误分钟数',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: (val) => {
          if (!val || val <= 0) return '请输入有效的分钟数'
          return true
        }
      }
    )
    await triggerDriverDelay(null, parseInt(delayMinutes))
    ElMessage.success('延误已记录')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除司机"${row.name}"吗？`, '提示', { type: 'warning' })
    await deleteDriver(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateDriver(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createDriver(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    // handled
  } finally {
    submitting.value = false
  }
}

const formatStatus = (status) => {
  const map = { on_duty: '在岗', off_duty: '离岗', rest: '休息' }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = { on_duty: 'success', off_duty: 'info', rest: 'warning' }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
