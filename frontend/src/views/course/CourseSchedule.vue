<template>
  <div class="course-schedule">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="课程ID">
            <el-input v-model="searchForm.courseId" placeholder="请输入课程ID" clearable />
          </el-form-item>
          <el-form-item label="教练ID">
            <el-input v-model="searchForm.coachId" placeholder="请输入教练ID" clearable />
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="searchForm.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增排班</el-button>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="id" label="排班ID" width="80" />
        <el-table-column prop="courseId" label="课程ID" width="100" />
        <el-table-column prop="coachId" label="教练ID" width="100" />
        <el-table-column prop="courtId" label="场地ID" width="100" />
        <el-table-column prop="scheduleDate" label="日期" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="100" />
        <el-table-column prop="endTime" label="结束时间" width="100" />
        <el-table-column prop="maxStudents" label="最大人数" width="100" />
        <el-table-column prop="enrolledCount" label="已报名" width="100">
          <template #default="{ row }">
            <el-progress :percentage="getEnrollPercent(row)" :status="getEnrollStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleEnroll(row)">报名</el-button>
            <el-button type="warning" link @click="handleCancelEnroll(row)">取消报名</el-button>
            <el-button type="primary" link @click="handleWaitlist(row)">候补</el-button>
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

    <el-dialog v-model="dialogVisible" title="新增排班" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="课程ID" prop="courseId">
          <el-input v-model="form.courseId" placeholder="请输入课程ID" />
        </el-form-item>
        <el-form-item label="教练ID" prop="coachId">
          <el-input v-model="form.coachId" placeholder="请输入教练ID" />
        </el-form-item>
        <el-form-item label="场地ID" prop="courtId">
          <el-input v-model="form.courtId" placeholder="请输入场地ID" />
        </el-form-item>
        <el-form-item label="日期" prop="scheduleDate">
          <el-date-picker
            v-model="form.scheduleDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="form.startTime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="form.endTime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="最大人数" prop="maxStudents">
          <el-input v-model="form.maxStudents" placeholder="请输入最大人数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="waitlistDialogVisible" title="候补名单" width="600px">
      <el-table :data="waitlistData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="waitOrder" label="候补顺序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'warning' : 'info'">
              {{ row.status === 1 ? '候补中' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="waitlistDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSchedulePage, addSchedule, enrollSchedule, cancelEnrollSchedule } from '@/api/course'
import { getWaitlistBySchedule } from '@/api/waitlist'

const searchForm = reactive({
  courseId: '',
  coachId: '',
  date: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const dialogVisible = ref(false)
const waitlistDialogVisible = ref(false)
const formRef = ref(null)
const currentScheduleId = ref(null)
const waitlistData = ref([])

const form = reactive({
  courseId: '',
  coachId: '',
  courtId: '',
  scheduleDate: '',
  startTime: '',
  endTime: '',
  maxStudents: ''
})

const rules = {
  courseId: [{ required: true, message: '请输入课程ID', trigger: 'blur' }],
  coachId: [{ required: true, message: '请输入教练ID', trigger: 'blur' }],
  scheduleDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  maxStudents: [{ required: true, message: '请输入最大人数', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '未开始', 1: '进行中', 2: '已满员', 3: '已结束' }
  return map[status] || '未知'
}

const getEnrollPercent = (row) => {
  if (!row.maxStudents || row.maxStudents === 0) return 0
  return Math.round((row.enrolledCount / row.maxStudents) * 100)
}

const getEnrollStatus = (row) => {
  const percent = getEnrollPercent(row)
  if (percent >= 100) return 'exception'
  if (percent >= 80) return 'warning'
  return 'success'
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
    if (searchForm.courseId) params.courseId = searchForm.courseId
    if (searchForm.coachId) params.coachId = searchForm.coachId
    const res = await getSchedulePage(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch (error) {
    console.error('获取课程排班失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.courseId = ''
  searchForm.coachId = ''
  searchForm.date = ''
  handleSearch()
}

const handleAdd = () => {
  Object.assign(form, {
    courseId: '',
    coachId: '',
    courtId: '',
    scheduleDate: '',
    startTime: '',
    endTime: '',
    maxStudents: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await addSchedule(form)
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }
  })
}

const handleEnroll = async (row) => {
  try {
    await enrollSchedule(row.id)
    ElMessage.success('报名成功')
    fetchData()
  } catch (error) {
    console.error('报名失败:', error)
  }
}

const handleCancelEnroll = async (row) => {
  try {
    await cancelEnrollSchedule(row.id)
    ElMessage.success('取消报名成功')
    fetchData()
  } catch (error) {
    console.error('取消报名失败:', error)
  }
}

const handleWaitlist = async (row) => {
  currentScheduleId.value = row.id
  try {
    const res = await getWaitlistBySchedule(row.id)
    waitlistData.value = res
    waitlistDialogVisible.value = true
  } catch (error) {
    console.error('获取候补名单失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.course-schedule {
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
