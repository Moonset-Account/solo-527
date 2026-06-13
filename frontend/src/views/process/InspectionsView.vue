<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">巡店任务</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增巡店</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px" @change="loadData">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="store.name" label="门店" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="创建人" width="100" />
        <el-table-column prop="handler.fullName" label="处理人" width="100">
          <template #default="{ row }">{{ row.handler?.fullName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
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

    <el-dialog v-model="dialogVisible" title="新增巡店记录" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="检查项">
          <div style="width: 100%">
            <div v-for="(item, index) in form.inspectionItems" :key="index" class="inspection-item">
              <el-input v-model="item.name" placeholder="检查项名称" style="width: 200px" />
              <el-select v-model="item.result" style="width: 120px; margin: 0 8px">
                <el-option label="通过" value="pass" />
                <el-option label="不通过" value="fail" />
                <el-option label="不适用" value="na" />
              </el-select>
              <el-input v-model="item.remark" placeholder="备注" style="flex: 1" />
              <el-button type="danger" text @click="removeItem(index)">删除</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addItem">添加检查项</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="巡店详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="标题" :span="2">{{ currentRecord.title }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentRecord.status]">
            {{ statusMap[currentRecord.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRecord.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRecord.handler?.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatDateTime(currentRecord.handledAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRecord.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检查项" :span="2">
          <div v-if="currentRecord.data?.inspectionItems?.length">
            <div v-for="(item, i) in currentRecord.data.inspectionItems" :key="i" class="detail-item">
              <span>{{ item.name }}</span>
              <el-tag size="small" :type="item.result === 'pass' ? 'success' : item.result === 'fail' ? 'danger' : 'info'">
                {{ item.result === 'pass' ? '通过' : item.result === 'fail' ? '不通过' : '不适用' }}
              </el-tag>
              <span v-if="item.remark" style="color: #909399; margin-left: 8px">{{ item.remark }}</span>
            </div>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
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
  title: '',
  description: '',
  inspectionItems: [{ name: '', result: 'pass', remark: '' }]
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const statusMap = { pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }
const statusTagMap = { pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'info' }

const formatDateTime = (dt) => dt ? dayjs(dt).format('YYYY-MM-DD HH:mm') : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/process/inspections', {
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
  form.title = ''
  form.description = ''
  form.inspectionItems = [{ name: '', result: 'pass', remark: '' }]
  dialogVisible.value = true
}

const addItem = () => {
  form.inspectionItems.push({ name: '', result: 'pass', remark: '' })
}

const removeItem = (index) => {
  form.inspectionItems.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.post('/process/inspections', form)
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

<style scoped>
.inspection-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.detail-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  gap: 8px;
}
</style>
