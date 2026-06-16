<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">知识库管理</h2>
      <div>
        <el-upload
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          action="#"
          style="display: inline-block; margin-right: 8px;"
        >
          <el-button type="primary" plain :icon="Upload">
            上传文档
          </el-button>
        </el-upload>
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新建文档
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">128</div>
            <div class="stat-label">文档总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">45.2MB</div>
            <div class="stat-label">存储占用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">12</div>
            <div class="stat-label">分类数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">156</div>
            <div class="stat-label">引用次数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <DataTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :show-search="true"
      search-placeholder="搜索文档名称、内容..."
      @search="handleSearch"
      @refresh="fetchData"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 160px" @change="fetchData">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="TXT文本" value="txt" />
          <el-option label="PDF文档" value="pdf" />
          <el-option label="Word文档" value="doc" />
          <el-option label="Excel表格" value="xls" />
          <el-option label="Markdown" value="md" />
        </el-select>
      </template>

      <el-table-column prop="name" label="文档名称" min-width="220">
        <template #default="{ row }">
          <div class="file-cell">
            <el-icon :size="18" :class="getFileIconClass(row.type)"><Document /></el-icon>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <span class="file-type">{{ row.type.toUpperCase() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="大小" width="100" align="right" />
      <el-table-column label="索引状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.indexed ? 'success' : 'warning'" size="small">
            {{ row.indexed ? '已索引' : '索引中' }}
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
          <el-button type="primary" link size="small" @click="handleView(row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="primary" link size="small" @click="handleSync(row)">
            <el-icon><Refresh /></el-icon>
            重新索引
          </el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </DataTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="文档名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="所属分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="文档内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="10" placeholder="请输入文档内容" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签，回车添加"
            style="width: 100%"
          >
            <el-option label="产品资料" value="产品资料" />
            <el-option label="公司介绍" value="公司介绍" />
            <el-option label="价格政策" value="价格政策" />
            <el-option label="常见问题" value="常见问题" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Refresh } from '@element-plus/icons-vue'
import DataTable from '@/components/DataTable.vue'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const filterCategory = ref('')
const filterType = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const submitting = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新建文档')
const isEdit = ref(false)
const formRef = ref(null)

const categories = ['产品资料', '公司介绍', '价格政策', '客户案例', '常见问题', '行业资讯']

const mockData = [
  { id: 1, name: '2024产品目录及报价.pdf', category: '价格政策', type: 'pdf', size: '3.2MB', indexed: true, updatedAt: new Date() },
  { id: 2, name: '公司介绍手册.docx', category: '公司介绍', type: 'doc', size: '8.5MB', indexed: true, updatedAt: new Date(Date.now() - 86400000) },
  { id: 3, name: '客户常见问题FAQ.md', category: '常见问题', type: 'md', size: '45KB', indexed: true, updatedAt: new Date(Date.now() - 2 * 86400000) },
  { id: 4, name: '旗舰产品详细资料.pdf', category: '产品资料', type: 'pdf', size: '12.4MB', indexed: false, updatedAt: new Date(Date.now() - 3 * 86400000) },
  { id: 5, name: '成功客户案例集.pdf', category: '客户案例', type: 'pdf', size: '5.8MB', indexed: true, updatedAt: new Date(Date.now() - 5 * 86400000) },
  { id: 6, name: '行业分析报告.xlsx', category: '行业资讯', type: 'xls', size: '2.1MB', indexed: true, updatedAt: new Date(Date.now() - 7 * 86400000) },
  { id: 7, name: '售后服务政策.txt', category: '常见问题', type: 'txt', size: '8KB', indexed: true, updatedAt: new Date(Date.now() - 10 * 86400000) }
]

const formData = reactive({
  id: null,
  name: '',
  category: '',
  content: '',
  tags: []
})

const formRules = {
  name: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入文档内容', trigger: 'blur' }]
}

function fetchData() {
  loading.value = true
  setTimeout(() => {
    let data = [...mockData]
    if (filterCategory.value) {
      data = data.filter(item => item.category === filterCategory.value)
    }
    if (filterType.value) {
      data = data.filter(item => item.type === filterType.value)
    }
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      data = data.filter(item => item.name.toLowerCase().includes(keyword))
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
  dialogTitle.value = '新建文档'
  isEdit.value = false
  Object.assign(formData, { id: null, name: '', category: '', content: '', tags: [] })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑文档'
  isEdit.value = true
  Object.assign(formData, { ...row, content: '', tags: [] })
  dialogVisible.value = true
}

function handleView(row) {
  ElMessage.info(`查看文档：${row.name}`)
}

function handleSync(row) {
  ElMessage.success(`已开始重新索引：${row.name}`)
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

function handleBeforeUpload(file) {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx']
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!allowedTypes.includes(ext)) {
    ElMessage.error('不支持的文件类型')
    return false
  }
  ElMessage.success(`文件「${file.name}」上传成功，正在解析中...`)
  return false
}

function getFileIconClass(type) {
  const classes = {
    pdf: 'icon-pdf',
    doc: 'icon-doc',
    xls: 'icon-xls',
    md: 'icon-md',
    txt: 'icon-txt'
  }
  return classes[type] || 'icon-default'
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除文档「${row.name}」吗？`, '提示', {
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
.stat-row {
  margin-bottom: 20px;

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #409eff;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-type {
  font-family: monospace;
  font-weight: 600;
  color: #606266;
}

.icon-pdf { color: #f56c6c; }
.icon-doc { color: #409eff; }
.icon-xls { color: #67c23a; }
.icon-md { color: #909399; }
.icon-txt { color: #e6a23c; }
.icon-default { color: #909399; }
</style>
