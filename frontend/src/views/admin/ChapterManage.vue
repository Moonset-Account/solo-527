<template>
  <div class="chapter-manage-page">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="选择课程">
          <el-select
            v-model="selectedCourseId"
            placeholder="请选择要管理的课程"
            filterable
            style="width: 320px"
            @change="loadChapters"
          >
            <el-option
              v-for="course in courseOptions"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item style="margin-left: auto">
          <el-button type="primary" :disabled="!selectedCourseId" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增章节
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="selectedCourseId" class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><IconList /></el-icon>
            章节列表
            <el-tag type="info" size="small" class="count-tag">共{{ chapterList.length }}章</el-tag>
          </span>
          <div class="header-tip">
            <el-icon><Sort /></el-icon>
            拖拽可调整章节顺序
          </div>
        </div>
      </template>

      <div v-if="chapterList.length === 0" class="empty-wrapper">
        <el-empty description="暂无章节，点击右上角'新增章节'按钮添加" />
      </div>

      <draggable
        v-else
        v-model="chapterList"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-item"
        animation="200"
        @end="onDragEnd"
      >
        <template #item="{ element, index }">
          <div class="chapter-row" :class="{ completed: element.completed }">
            <div class="chapter-row-left">
              <el-icon class="drag-handle"><Sort /></el-icon>
              <span class="chapter-index">{{ index + 1 }}</span>
              <div class="chapter-main-info">
                <h4 class="chapter-row-title">{{ element.title }}</h4>
                <div class="chapter-row-meta">
                  <span>
                    <el-icon><Clock /></el-icon>
                    {{ element.duration }}分钟
                  </span>
                  <span v-if="element.isFree">
                    <el-tag type="success" effect="plain" size="small">免费</el-tag>
                  </span>
                  <span v-if="element.isTrial">
                    <el-tag type="warning" effect="light" size="small">
                      试看{{ element.trialDuration }}分钟
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>

            <div class="chapter-row-right">
              <div class="trial-setting">
                <el-switch
                  v-model="element.isTrial"
                  active-text="试看"
                  @change="(val) => handleTrialToggle(element, val)"
                />
                <el-input-number
                  v-if="element.isTrial"
                  v-model="element.trialDuration"
                  :min="1"
                  :max="element.duration"
                  size="small"
                  :controls="false"
                  style="width: 100px; margin-left: 8px"
                  @change="() => updateTrialDuration(element)"
                />
              </div>
              <div class="row-actions">
                <el-button type="primary" link size="small" @click="handleEdit(element)">
                  <el-icon><Edit /></el-icon>编辑
                </el-button>
                <el-popconfirm
                  title="确定删除该章节吗？"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="handleDelete(element)"
                >
                  <template #reference>
                    <el-button type="danger" link size="small">
                      <el-icon><Delete /></el-icon>删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </el-card>

    <el-card v-else class="empty-card" shadow="never">
      <el-empty description="请先选择要管理的课程" :image-size="120">
        <template #image>
          <el-icon :size="80" style="color: #c0c4cc"><ChatLineRound /></el-icon>
        </template>
      </el-empty>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑章节' : '新增章节'"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入章节标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="章节时长" prop="duration">
          <el-input-number
            v-model="formData.duration"
            :min="1"
            :max="500"
            label="分钟"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="是否免费">
          <el-switch
            v-model="formData.isFree"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="设置试看">
          <div class="trial-form-row">
            <el-switch
              v-model="formData.isTrial"
              active-text="开启试看"
              inactive-text="关闭试看"
            />
            <el-input-number
              v-if="formData.isTrial"
              v-model="formData.trialDuration"
              :min="1"
              :max="formData.duration"
              label="试看分钟"
              size="small"
              :controls="false"
              style="width: 140px; margin-left: 12px"
            />
          </div>
        </el-form-item>
        <el-form-item label="视频URL" prop="videoUrl">
          <el-input v-model="formData.videoUrl" placeholder="请输入视频地址" />
        </el-form-item>
        <el-form-item label="章节简介">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入章节简介（可选）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus,
  List as IconList,
  Sort,
  Clock,
  Edit,
  Delete,
  ChatLineRound
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import {
  adminGetCourseList,
  adminGetChapters,
  adminCreateChapter,
  adminUpdateChapter,
  adminDeleteChapter,
  adminSortChapters,
  adminSetTrialChapter
} from '@/api/course'

const route = useRoute()

const selectedCourseId = ref(null)
const courseOptions = ref([])
const chapterList = ref([])
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const formData = reactive({
  title: '',
  duration: 10,
  isFree: false,
  isTrial: false,
  trialDuration: 5,
  videoUrl: '',
  description: ''
})

const formRules = {
  title: [{ required: true, message: '请输入章节标题', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入章节时长', trigger: 'blur' }],
  videoUrl: [{ required: true, message: '请输入视频地址', trigger: 'blur' }]
}

const loadCourseOptions = async () => {
  try {
    const res = await adminGetCourseList({ page: 1, pageSize: 100 })
    courseOptions.value = res.data?.list || mockCourses()
  } catch (e) {
    courseOptions.value = mockCourses()
  }
}

const mockCourses = () => [
  { id: 1, title: 'Vue 3 + Vite 企业级项目实战从入门到精通全套教程' },
  { id: 2, title: 'Python 数据分析与可视化实战' },
  { id: 3, title: 'Node.js 后端开发进阶' },
  { id: 4, title: '算法与数据结构系统课' }
]

const loadChapters = async () => {
  if (!selectedCourseId.value) {
    chapterList.value = []
    return
  }
  try {
    const res = await adminGetChapters(selectedCourseId.value)
    chapterList.value = res.data || mockChapters()
  } catch (e) {
    chapterList.value = mockChapters()
  }
}

const mockChapters = () => [
  { id: 101, title: '01. 课程介绍与环境搭建', duration: 15, isFree: true, isTrial: true, trialDuration: 10, completed: true, description: '' },
  { id: 102, title: '02. Vue 3 基础语法详解', duration: 45, isFree: false, isTrial: true, trialDuration: 8, completed: true, description: '' },
  { id: 103, title: '03. Composition API 深入理解', duration: 50, isFree: false, isTrial: false, trialDuration: 0, completed: true, description: '' },
  { id: 104, title: '04. 响应式原理与源码分析', duration: 65, isFree: false, isTrial: true, trialDuration: 15, completed: false, description: '' },
  { id: 105, title: '05. Vue Router 4 路由管理', duration: 40, isFree: false, isTrial: false, trialDuration: 0, completed: false, description: '' },
  { id: 106, title: '06. Pinia 状态管理最佳实践', duration: 35, isFree: false, isTrial: false, trialDuration: 0, completed: false, description: '' },
  { id: 107, title: '07. 项目实战：电商后台系统', duration: 120, isFree: false, isTrial: false, trialDuration: 0, completed: false, description: '' },
  { id: 108, title: '08. 课程总结与就业指导', duration: 20, isFree: false, isTrial: false, trialDuration: 0, completed: false, description: '' }
]

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    title: '',
    duration: 10,
    isFree: false,
    isTrial: false,
    trialDuration: 5,
    videoUrl: '',
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    title: row.title,
    duration: row.duration,
    isFree: row.isFree,
    isTrial: row.isTrial,
    trialDuration: row.trialDuration || 5,
    videoUrl: row.videoUrl || '',
    description: row.description || ''
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await adminDeleteChapter(selectedCourseId.value, row.id)
    chapterList.value = chapterList.value.filter(c => c.id !== row.id)
    ElMessage.success('删除成功')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '删除失败'
    ElMessage.error(msg)
  }
}

const handleTrialToggle = async (element, val) => {
  const oldVal = !val
  if (val && !element.trialDuration) {
    element.trialDuration = Math.min(5, element.duration)
  }
  try {
    await adminSetTrialChapter(selectedCourseId.value, element.id, {
      isTrial: val,
      trialDuration: val ? element.trialDuration : 0
    })
    ElMessage.success(val ? '已开启试看' : '已关闭试看')
  } catch (e) {
    element.isTrial = oldVal
    const msg = e?.response?.data?.message || e?.message || '试看设置失败'
    ElMessage.error(msg)
  }
}

const updateTrialDuration = async (element) => {
  try {
    await adminSetTrialChapter(selectedCourseId.value, element.id, {
      isTrial: true,
      trialDuration: element.trialDuration
    })
    ElMessage.success('试看时长已更新')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '更新失败'
    ElMessage.error(msg)
  }
}

const onDragEnd = async () => {
  try {
    const orderIds = chapterList.value.map(c => c.id)
    await adminSortChapters(selectedCourseId.value, { orderIds })
    ElMessage.success('排序已更新')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '排序更新失败'
    ElMessage.error(msg)
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    if (isEdit.value) {
      await adminUpdateChapter(selectedCourseId.value, editingId.value, formData)
      ElMessage.success('更新成功')
    } else {
      const res = await adminCreateChapter(selectedCourseId.value, formData)
      chapterList.value.push({
        id: res.data?.id || Date.now(),
        ...formData,
        completed: false
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadChapters()
  } catch (e) {
    if (e !== false) {
      ElMessage.error(e.message || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCourseOptions()
  const queryCourseId = route.query.courseId
  if (queryCourseId) {
    selectedCourseId.value = Number(queryCourseId)
    loadChapters()
  }
})
</script>

<style scoped>
.chapter-manage-page {
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
}

.table-card,
.empty-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .el-icon {
  color: #409eff;
}

.count-tag {
  margin-left: 8px;
}

.header-tip {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-wrapper {
  padding: 40px 0;
}

.chapter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 10px;
  transition: all 0.2s;
  border: 1px solid transparent;
  user-select: none;
}

.chapter-row:hover {
  background: #f0f2f5;
  border-color: #dcdfe6;
}

.chapter-row.completed {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.08) 0%, transparent 100%);
}

.chapter-row-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.drag-handle {
  color: #c0c4cc;
  cursor: move;
  font-size: 18px;
  padding: 4px;
}

.drag-handle:hover {
  color: #409eff;
}

.chapter-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e4e7ed;
  color: #606266;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.chapter-main-info {
  flex: 1;
  min-width: 0;
}

.chapter-row-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-row-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
}

.chapter-row-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chapter-row-right {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.trial-setting {
  display: flex;
  align-items: center;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ghost-item {
  opacity: 0.5;
  background: #ecf5ff;
  border: 1px dashed #409eff;
}

.trial-form-row {
  display: flex;
  align-items: center;
}
</style>
