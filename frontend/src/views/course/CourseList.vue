<template>
  <div class="course-list">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="课程名称">
            <el-input v-model="searchForm.name" placeholder="请输入课程名称" clearable />
          </el-form-item>
          <el-form-item label="课程类型">
            <el-select v-model="searchForm.courseType" placeholder="请选择类型" clearable>
              <el-option label="少儿班" value="少儿班" />
              <el-option label="成人班" value="成人班" />
              <el-option label="私教课" value="私教课" />
              <el-option label="团体课" value="团体课" />
            </el-select>
          </el-form-item>
          <el-form-item label="教练ID">
            <el-input v-model="searchForm.coachId" placeholder="请输入教练ID" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增课程</el-button>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="courseNo" label="课程编号" width="120" />
        <el-table-column prop="name" label="课程名称" width="150" />
        <el-table-column prop="courseType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.courseType)">{{ row.courseType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="coachId" label="教练ID" width="100" />
        <el-table-column prop="courtId" label="场地ID" width="100" />
        <el-table-column prop="maxStudents" label="最大人数" width="100" />
        <el-table-column prop="currentStudents" label="当前人数" width="100" />
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="price" label="价格(元)" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="课程编号" prop="courseNo">
          <el-input v-model="form.courseNo" placeholder="请输入课程编号" />
        </el-form-item>
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程类型" prop="courseType">
          <el-select v-model="form.courseType" placeholder="请选择类型" style="width: 100%">
            <el-option label="少儿班" value="少儿班" />
            <el-option label="成人班" value="成人班" />
            <el-option label="私教课" value="私教课" />
            <el-option label="团体课" value="团体课" />
          </el-select>
        </el-form-item>
        <el-form-item label="教练ID" prop="coachId">
          <el-input v-model="form.coachId" placeholder="请输入教练ID" />
        </el-form-item>
        <el-form-item label="场地ID" prop="courtId">
          <el-input v-model="form.courtId" placeholder="请输入场地ID" />
        </el-form-item>
        <el-form-item label="最大人数" prop="maxStudents">
          <el-input v-model="form.maxStudents" placeholder="请输入最大人数" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input v-model="form.duration" placeholder="请输入课程时长" />
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input v-model="form.price" placeholder="请输入价格" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCoursePage, addCourse, updateCourse, deleteCourse } from '@/api/course'

const searchForm = reactive({
  name: '',
  courseType: '',
  coachId: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const isEdit = ref(false)

const form = reactive({
  id: null,
  courseNo: '',
  name: '',
  courseType: '',
  coachId: '',
  courtId: '',
  maxStudents: '',
  currentStudents: 0,
  duration: '',
  price: '',
  status: 1,
  description: ''
})

const rules = {
  courseNo: [{ required: true, message: '请输入课程编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  courseType: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
  coachId: [{ required: true, message: '请输入教练ID', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getTypeTagType = (type) => {
  const map = { '少儿班': 'warning', '成人班': 'primary', '私教课': 'success', '团体课': 'info' }
  return map[type] || 'info'
}

const fetchData = async () => {
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.courseType) params.courseType = searchForm.courseType
    if (searchForm.coachId) params.coachId = searchForm.coachId
    const res = await getCoursePage(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.courseType = ''
  searchForm.coachId = ''
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增课程'
  Object.assign(form, {
    id: null,
    courseNo: '',
    name: '',
    courseType: '',
    coachId: '',
    courtId: '',
    maxStudents: '',
    currentStudents: 0,
    duration: '',
    price: '',
    status: 1,
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑课程'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该课程吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteCourse(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateCourse(form)
        } else {
          await addCourse(form)
        }
        ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.course-list {
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
