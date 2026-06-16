<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">提示词管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建提示词
      </el-button>
    </div>

    <DataTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :show-search="true"
      search-placeholder="搜索提示词名称、分类..."
      @search="handleSearch"
      @refresh="fetchData"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 160px" @change="fetchData">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px" @change="fetchData">
          <el-option label="启用" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" plain :icon="Upload" @click="handleBatchImport">
          批量导入
        </el-button>
      </template>

      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="version" label="版本" width="80" align="center" />
      <el-table-column label="默认" width="80" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.isDefault" color="#67c23a"><StarFilled /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="primary" link size="small" @click="handleTest(row)">
            <el-icon><VideoPlay /></el-icon>
            测试
          </el-button>
          <el-button v-if="!row.isDefault" type="primary" link size="small" @click="handleSetDefault(row)">
            <el-icon><Star /></el-icon>
            设为默认
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </DataTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入提示词名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入提示词描述" />
        </el-form-item>
        <el-form-item label="提示词内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="8" placeholder="请输入提示词内容，支持 {{变量}} 占位符" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" title="测试提示词" width="680px">
      <el-form label-width="90px">
        <el-form-item label="测试输入">
          <el-input v-model="testInput" type="textarea" :rows="4" placeholder="请输入测试参数" />
        </el-form-item>
        <el-form-item label="生成结果">
          <div class="test-result">{{ testResult || '点击开始测试查看生成结果' }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="handleRunTest">开始测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import DataTable from '@/components/DataTable.vue'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const filterCategory = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const submitting = ref(false)
const testing = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新建提示词')
const isEdit = ref(false)
const formRef = ref(null)

const testDialogVisible = ref(false)
const testInput = ref('')
const testResult = ref('')

const categories = ['商务开发', '客户跟进', '问题回复', '会议邀约', '报价发送', '通用']

const mockData = [
  { id: 1, name: '商务开发邮件模板', category: '商务开发', description: '用于初次联系潜在客户的标准模板', version: 'v2.1', isDefault: true, status: 'active', updatedAt: new Date(), content: '你是一个资深销售，请根据以下信息撰写一封商务开发邮件...' },
  { id: 2, name: '客户跟进回复模板', category: '客户跟进', description: '用于跟进客户咨询的邮件模板', version: 'v1.3', isDefault: false, status: 'active', updatedAt: new Date(Date.now() - 86400000), content: '你是一个客户经理，请根据客户的问题撰写专业的回复...' },
  { id: 3, name: '会议邀约邮件', category: '会议邀约', description: '用于邀请客户参加会议或演示', version: 'v1.0', isDefault: false, status: 'active', updatedAt: new Date(Date.now() - 2 * 86400000), content: '请撰写一封礼貌的会议邀约邮件...' },
  { id: 4, name: '报价单发送模板', category: '报价发送', description: '用于向客户发送产品报价', version: 'v1.5', isDefault: false, status: 'inactive', updatedAt: new Date(Date.now() - 3 * 86400000), content: '请根据以下产品信息撰写报价邮件...' },
  { id: 5, name: '通用感谢邮件', category: '通用', description: '感谢客户合作或咨询的通用模板', version: 'v1.0', isDefault: false, status: 'active', updatedAt: new Date(Date.now() - 5 * 86400000), content: '请撰写一封真诚的感谢邮件...' }
]

const formData = reactive({
  id: null,
  name: '',
  category: '',
  description: '',
  content: '',
  status: 'active'
})

const formRules = {
  name: [{ required: true, message: '请输入提示词名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入提示词内容', trigger: 'blur' }]
}

function fetchData() {
  loading.value = true
  setTimeout(() => {
    let data = [...mockData]
    if (filterCategory.value) {
      data = data.filter(item => item.category === filterCategory.value)
    }
    if (filterStatus.value) {
      data = data.filter(item => item.status === filterStatus.value)
    }
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      data = data.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
      )
    }
    total.value = data.length
    const start = (currentPage.value - 1) * pageSize.value
    tableData.value = data.slice(start, start + pageSize.value)
    loading.value = false
  }, 300)
}

function handleSearch(keyword) {
  searchKeyword.value = keyword
  currentPage.value = 1
  fetchData()
}

function handlePageChange({ page, size }) {
  currentPage.value = page
  pageSize.value = size
  fetchData()
}

function handleCreate() {
  dialogTitle.value = '新建提示词'
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    name: '',
    category: '',
    description: '',
    content: '',
    status: 'active'
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑提示词'
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    setTimeout(() => {
      submitting.value = false
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
      fetchData()
    }, 500)
  } catch (e) {
    submitting.value = false
  }
}

function handleTest(row) {
  testInput.value = ''
  testResult.value = ''
  testDialogVisible.value = true
}

function handleRunTest() {
  testing.value = true
  setTimeout(() => {
    testing.value = false
    testResult.value = '这是基于测试输入生成的模拟邮件内容。在实际使用中，这里会调用AI接口生成结果。\n\n尊敬的客户：\n\n感谢您的咨询...'
  }, 1000)
}

function handleSetDefault(row) {
  ElMessage.success(`已将「${row.name}」设为默认提示词`)
  fetchData()
}

function handleBatchImport() {
  ElMessage.info('批量导入功能开发中')
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除提示词「${row.name}」吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.test-result {
  min-height: 150px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #606266;
}
</style>
