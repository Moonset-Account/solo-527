<template>
  <div class="services-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="分类">
          <el-select v-model="filterForm.category" placeholder="全部" clearable style="width: 140px">
            <el-option label="美甲" value="美甲" />
            <el-option label="美睫" value="美睫" />
            <el-option label="手足护理" value="手足护理" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadServices">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务项目</span>
          <el-button type="primary" @click="handleAdd">新增项目</el-button>
        </div>
      </template>

      <el-table :data="services" v-loading="loading" stripe>
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <div class="service-thumb">
              <img v-if="row.images?.length" :src="row.images[0]" />
              <el-icon v-else :size="32" color="#ccc"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="serviceForm" label-width="100px">
        <el-form-item label="项目名称" required>
          <el-input v-model="serviceForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="serviceForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="美甲" value="美甲" />
            <el-option label="美睫" value="美睫" />
            <el-option label="手足护理" value="手足护理" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="serviceForm.price" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="serviceForm.duration" :min="0" :step="15" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="serviceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="作品图">
          <el-upload
            :auto-upload="false"
            list-type="picture-card"
            :file-list="fileList"
            :on-change="handleFileChange"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="serviceForm.status">
            <el-radio value="active">上架</el-radio>
            <el-radio value="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="serviceForm.sort" :min="0" style="width: 100%" />
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
import { Picture, Plus } from '@element-plus/icons-vue'
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/api/services'

const loading = ref(false)
const services = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增项目')
const submitting = ref(false)
const editingId = ref('')
const fileList = ref([])

const filterForm = reactive({
  category: '',
  status: '',
})

const serviceForm = reactive({
  name: '',
  category: '',
  price: 0,
  duration: 60,
  description: '',
  images: [],
  status: 'active',
  sort: 0,
})

async function loadServices() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.category) params.category = filterForm.category
    if (filterForm.status) params.status = filterForm.status
    const data = await getServices(params)
    services.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.category = ''
  filterForm.status = ''
  loadServices()
}

function handleAdd() {
  dialogTitle.value = '新增项目'
  editingId.value = ''
  serviceForm.name = ''
  serviceForm.category = ''
  serviceForm.price = 0
  serviceForm.duration = 60
  serviceForm.description = ''
  serviceForm.images = []
  serviceForm.status = 'active'
  serviceForm.sort = 0
  fileList.value = []
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑项目'
  editingId.value = row._id
  serviceForm.name = row.name
  serviceForm.category = row.category || ''
  serviceForm.price = row.price
  serviceForm.duration = row.duration || 60
  serviceForm.description = row.description || ''
  serviceForm.images = row.images || []
  serviceForm.status = row.status
  serviceForm.sort = row.sort || 0
  fileList.value = (row.images || []).map((url, index) => ({
    name: `image-${index}`,
    url,
  }))
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!serviceForm.name) {
    ElMessage.warning('请输入项目名称')
    return
  }

  submitting.value = true
  try {
    const data = { ...serviceForm }
    if (editingId.value) {
      await updateService(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createService(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadServices()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteService(row._id)
      ElMessage.success('删除成功')
      loadServices()
    } catch (e) {}
  }).catch(() => {})
}

function handleFileChange(file, fileList) {
  // 文件上传处理，实际项目中应该上传到服务器
  // 这里只做本地演示
  const images = fileList.map(f => f.url || URL.createObjectURL(f.raw))
  serviceForm.images = images
}

onMounted(() => {
  loadServices()
})
</script>

<style scoped lang="scss">
.services-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .service-thumb {
    width: 60px;
    height: 60px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .price {
    color: #e91e63;
    font-weight: bold;
  }
}
</style>
