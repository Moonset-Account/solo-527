<template>
  <div class="course-manage-page">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="课程名称">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入课程名称"
            clearable
            style="width: 220px"
            @keyup.enter="loadCourseList"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="已上架" value="published" />
            <el-option label="已下架" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filterForm.category" placeholder="全部分类" clearable style="width: 160px">
            <el-option label="前端开发" value="frontend" />
            <el-option label="后端开发" value="backend" />
            <el-option label="数据分析" value="data" />
            <el-option label="移动开发" value="mobile" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCourseList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增课程
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="courseList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="课程信息" min-width="300">
          <template #default="{ row }">
            <div class="course-info-cell">
              <el-image :src="row.cover" class="course-thumb" fit="cover" />
              <div class="course-info-text">
                <div class="course-name" :title="row.title">{{ row.title }}</div>
                <div class="course-meta-text">
                  <span>讲师：{{ row.teacher }}</span>
                  <span class="meta-divider">|</span>
                  <span>{{ row.chapterCount }}章</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.price > 0" class="price-text">¥{{ row.price }}</span>
            <el-tag v-else type="success" effect="plain">免费</el-tag>
            <div>
              <el-tag v-if="row.isMemberOnly" type="warning" size="small" effect="dark">
                <el-icon><Crown /></el-icon>会员
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentCount" label="学员数" width="100" align="center" />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.statusSwitch"
              active-text="上架"
              inactive-text="下架"
              :active-value="true"
              :inactive-value="false"
              @change="(val) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" align="center" />
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleManageChapters(row)">
              <el-icon><IconList /></el-icon>章节管理
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-popconfirm
              title="确定删除该课程吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadCourseList"
          @current-change="loadCourseList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑课程' : '新增课程'"
      width="680px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="课程名称" prop="title">
              <el-input v-model="formData.title" placeholder="请输入课程名称" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="讲师" prop="teacher">
              <el-input v-model="formData.teacher" placeholder="请输入讲师姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option label="前端开发" :value="1" />
                <el-option label="后端开发" :value="2" />
                <el-option label="数据分析" :value="3" />
                <el-option label="移动开发" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格(元)" prop="price">
              <el-input-number
                v-model="formData.price"
                :min="0"
                :step="10"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员专属">
              <el-switch
                v-model="formData.isMemberOnly"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="课程封面" prop="cover">
              <div class="cover-uploader">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeCoverUpload"
                  :on-success="handleCoverSuccess"
                  action="#"
                >
                  <el-image
                    v-if="formData.cover"
                    :src="formData.cover"
                    class="cover-preview"
                    fit="cover"
                  />
                  <el-icon v-else :size="28" class="uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div class="uploader-tip">建议尺寸 16:9，支持 jpg/png 格式</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="课程简介" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="请输入课程简介"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshLeft,
  Plus,
  List as IconList,
  Edit,
  Delete,
  StarFilled
} from '@element-plus/icons-vue'
import {
  adminGetCourseList,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminToggleCourseStatus
} from '@/api/course'

const router = useRouter()

const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  keyword: '',
  status: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const courseList = ref([])

const formData = reactive({
  title: '',
  teacher: '',
  categoryId: null,
  price: 0,
  isMemberOnly: false,
  cover: '',
  description: ''
})

const formRules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传课程封面', trigger: 'change' }],
  description: [{ required: true, message: '请输入课程简介', trigger: 'blur' }]
}

const loadCourseList = async () => {
  loading.value = true
  try {
    const res = await adminGetCourseList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword,
      status: filterForm.status,
      category: filterForm.category
    })
    const list = res.data?.list || mockCourseList()
    courseList.value = list.map(item => ({
      ...item,
      statusSwitch: item.status === 'published'
    }))
    pagination.total = res.data?.total || 56
  } catch (e) {
    courseList.value = mockCourseList()
    pagination.total = 56
  } finally {
    loading.value = false
  }
}

const mockCourseList = () => [
  {
    id: 1,
    title: 'Vue 3 + Vite 企业级项目实战从入门到精通全套教程',
    teacher: '张老师',
    category: '前端开发',
    price: 299,
    isMemberOnly: false,
    cover: 'https://picsum.photos/seed/vue/400/225',
    studentCount: 3256,
    chapterCount: 68,
    status: 'published',
    updatedAt: '2026-06-08 14:30'
  },
  {
    id: 2,
    title: 'Python 数据分析与可视化实战',
    teacher: '李老师',
    category: '数据分析',
    price: 0,
    isMemberOnly: true,
    cover: 'https://picsum.photos/seed/python/400/225',
    studentCount: 5821,
    chapterCount: 42,
    status: 'published',
    updatedAt: '2026-06-07 10:15'
  },
  {
    id: 3,
    title: 'Node.js 后端开发进阶',
    teacher: '王老师',
    category: '后端开发',
    price: 399,
    isMemberOnly: false,
    cover: 'https://picsum.photos/seed/node/400/225',
    studentCount: 1843,
    chapterCount: 56,
    status: 'draft',
    updatedAt: '2026-06-06 16:45'
  }
]

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.category = ''
  pagination.page = 1
  loadCourseList()
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    title: '',
    teacher: '',
    categoryId: null,
    price: 0,
    isMemberOnly: false,
    cover: '',
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    title: row.title,
    teacher: row.teacher,
    categoryId: 1,
    price: row.price,
    isMemberOnly: row.isMemberOnly,
    cover: row.cover,
    description: row.description || ''
  })
  dialogVisible.value = true
}

const handleManageChapters = (row) => {
  router.push({ path: '/admin/chapters', query: { courseId: row.id } })
}

const toggleStatus = async (row, val) => {
  const oldVal = row.status
  try {
    await adminToggleCourseStatus(row.id, val ? 1 : 0)
    row.status = val ? 1 : 0
    ElMessage.success(val ? '课程已上架' : '课程已下架')
  } catch (e) {
    row.status = oldVal
    const msg = e?.response?.data?.message || e?.message || '操作失败'
    ElMessage.error(msg)
  }
}

const handleDelete = async (row) => {
  try {
    await adminDeleteCourse(row.id)
    ElMessage.success('删除成功')
    loadCourseList()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

const beforeCoverUpload = (file) => {
  const isImg = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImg) {
    ElMessage.error('只能上传 jpg/png 格式的图片!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleCoverSuccess = (_, file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.cover = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    if (isEdit.value) {
      await adminUpdateCourse(editingId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await adminCreateCourse(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadCourseList()
  } catch (e) {
    if (e !== false) {
      ElMessage.error(e.message || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCourseList()
})
</script>

<style scoped>
.course-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-form {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}

.table-card {
  border-radius: 12px;
}

.course-info-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.course-thumb {
  width: 80px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
}

.course-info-text {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-meta-text {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-divider {
  color: #e4e7ed;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.cover-uploader {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
  background: #fafafa;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.cover-preview {
  width: 200px;
  height: 112px;
  display: block;
}

.uploader-icon {
  width: 200px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.uploader-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  padding-top: 8px;
}
</style>
