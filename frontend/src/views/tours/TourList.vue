<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="路线名称/编码/描述"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的地">
          <el-input
            v-model="searchForm.destination"
            placeholder="目的地"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
            v-model="searchForm.operator"
            placeholder="负责人"
            clearable
            style="width: 120px"
          />
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
        <div class="section-title" style="margin-bottom: 0">导览路线列表</div>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建路线
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="code" label="路线编码" width="120" />
        <el-table-column prop="name" label="路线名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="destination" label="目的地" width="100" />
        <el-table-column label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            ¥{{ Number(row.price).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="80" />
        <el-table-column label="负责人" width="120">
          <template #default="{ row }">
            {{ row.operator?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row.id)">
              详情
            </el-button>
            <el-button text type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button text type="danger" @click="handleDelete(row)">
              归档
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑路线' : '新建路线'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="路线名称">
          <el-input v-model="form.name" placeholder="请输入路线名称" />
        </el-form-item>
        <el-form-item label="路线编码">
          <el-input v-model="form.code" placeholder="请输入路线编码" />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="form.destination" placeholder="请输入目的地" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="form.duration" :min="0" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="form.capacity" :min="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="集合点">
          <el-input v-model="form.meetingPoint" placeholder="请输入集合点" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input v-model="form.changeLog" type="textarea" :rows="2" />
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
import { useRouter } from 'vue-router'
import { getTours, createTour, updateTour, deleteTour } from '@/api/tours'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  keyword: '',
  status: '',
  destination: '',
  operator: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = reactive({
  id: null,
  name: '',
  code: '',
  destination: '',
  duration: 120,
  price: 0,
  capacity: 30,
  status: 'draft',
  meetingPoint: '',
  description: '',
  changeLog: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTours({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      destination: searchForm.destination || undefined
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
  searchForm.destination = ''
  searchForm.operator = ''
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

const handleDetail = (id) => {
  router.push(`/tours/${id}`)
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    destination: '',
    duration: 120,
    price: 0,
    capacity: 30,
    status: 'draft',
    meetingPoint: '',
    description: '',
    changeLog: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    destination: row.destination,
    duration: row.duration,
    price: row.price,
    capacity: row.capacity,
    status: row.status,
    meetingPoint: row.meetingPoint,
    description: row.description,
    changeLog: ''
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要归档路线"${row.name}"吗？`, '提示', {
      type: 'warning'
    })
    await deleteTour(row.id)
    ElMessage.success('归档成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateTour(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createTour(form)
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

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins > 0 ? mins + '分' : ''}` : `${mins}分钟`
}

const formatStatus = (status) => {
  const map = { draft: '草稿', published: '已发布', archived: '已归档' }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = { draft: 'info', published: 'success', archived: 'danger' }
  return map[status] || 'info'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
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
