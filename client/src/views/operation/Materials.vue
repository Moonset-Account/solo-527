<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">采访素材</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>上传素材
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="素材标题" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">采访对象：</span>
          <el-input v-model="filters.interviewee" placeholder="姓名" style="width: 140px" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">采访日期：</span>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </div>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="title" label="素材标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="interviewee" label="采访对象" width="120" />
        <el-table-column label="采访日期" width="120">
          <template #default="{ row }">{{ formatDate(row.interviewDate, 'YYYY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="关键词" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="k in row.keywords" :key="k" size="small" style="margin-right: 4px">{{ k }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件数" width="80">
          <template #default="{ row }">{{ row.files?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="上传人" width="100">
          <template #default="{ row }">{{ getUserById(row.uploader).name }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑素材' : '上传素材'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="素材标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="采访对象">
          <el-input v-model="form.interviewee" />
        </el-form-item>
        <el-form-item label="采访日期">
          <el-date-picker v-model="form.interviewDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-select v-model="form.keywords" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入关键词回车添加">
          </el-select>
        </el-form-item>
        <el-form-item label="素材文件">
          <el-upload
            multiple
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary"><el-icon><Upload /></el-icon>选择文件</el-button>
          </el-upload>
          <div v-if="form.files?.length" style="margin-top: 8px">
            <div v-for="(f, i) in form.files" :key="i" style="font-size: 12px; color: #606266">
              {{ f.name }}
            </div>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '@/api'
import { USERS, getUserById, formatDate } from '@/utils/constants'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const filters = reactive({ keyword: '', interviewee: '', dateRange: [] })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  title: '',
  interviewee: '',
  interviewDate: '',
  location: '',
  keywords: [],
  files: [],
  uploader: 'u001',
  remark: ''
})
const rules = {
  title: [{ required: true, message: '请输入素材标题', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      interviewee: filters.interviewee || undefined,
      startDate: filters.dateRange?.[0] || undefined,
      endDate: filters.dateRange?.[1] || undefined
    }
    const res = await operationApi.materialList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { keyword: '', interviewee: '', dateRange: [] })
  pagination.page = 1
  loadList()
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    Object.assign(form, { ...row, interviewDate: row.interviewDate ? formatDate(row.interviewDate, 'YYYY-MM-DD') : '' })
  } else {
    editId.value = ''
    Object.assign(form, { title: '', interviewee: '', interviewDate: '', location: '', keywords: [], files: [], uploader: 'u001', remark: '' })
  }
  dialogVisible.value = true
}

function handleFileChange(uploadFile) {
  const file = uploadFile.raw || uploadFile
  form.files.push({ name: file.name, url: '', type: file.type || '', duration: 0 })
}

function handleFileRemove(uploadFile, uploadFiles) {
  form.files = uploadFiles.map(f => ({ name: f.name, url: '', type: '', duration: 0 }))
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await operationApi.updateMaterial(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await operationApi.createMaterial(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {}
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除素材"${row.title}"吗?`, '提示', { type: 'warning' }).then(async () => {
    await operationApi.removeMaterial(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(loadList)
</script>
