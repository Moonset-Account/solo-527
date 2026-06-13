<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">平台账号</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新建账号
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="账号名称" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">平台：</span>
          <el-select v-model="filters.platform" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="(v, k) in PLATFORM_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">运营人：</span>
          <el-select v-model="filters.operator" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">状态：</span>
          <el-select v-model="filters.isActive" placeholder="全部" style="width: 120px" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </div>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="name" label="账号名称" min-width="160" />
        <el-table-column label="平台" width="120">
          <template #default="{ row }">
            <el-tag>{{ PLATFORM_TYPE[row.platform]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="accountId" label="账号ID" width="160" />
        <el-table-column prop="followers" label="粉丝数" width="120">
          <template #default="{ row }">{{ (row.followers || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="运营人" width="100">
          <template #default="{ row }">{{ getUserById(row.operator).name }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账号' : '新建账号'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账号名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" style="width: 100%">
            <el-option v-for="(v, k) in PLATFORM_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号ID">
          <el-input v-model="form.accountId" />
        </el-form-item>
        <el-form-item label="粉丝数">
          <el-input-number v-model="form.followers" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="运营人" prop="operator">
          <el-select v-model="form.operator" style="width: 100%">
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" />
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
import { PLATFORM_TYPE, USERS, getUserById } from '@/utils/constants'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const filters = reactive({
  keyword: '',
  platform: '',
  operator: '',
  isActive: null
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  name: '',
  platform: 'douyin',
  accountId: '',
  followers: 0,
  isActive: true,
  operator: '',
  remark: ''
})
const rules = {
  name: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  operator: [{ required: true, message: '请选择运营人', trigger: 'change' }]
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      platform: filters.platform || undefined,
      operator: filters.operator || undefined,
      isActive: filters.isActive === null ? undefined : filters.isActive
    }
    const res = await operationApi.platformAccountList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { keyword: '', platform: '', operator: '', isActive: null })
  pagination.page = 1
  loadList()
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    Object.assign(form, { ...row })
  } else {
    editId.value = ''
    Object.assign(form, { name: '', platform: 'douyin', accountId: '', followers: 0, isActive: true, operator: '', remark: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await operationApi.updatePlatformAccount(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await operationApi.createPlatformAccount(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {}
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除账号"${row.name}"吗?`, '提示', { type: 'warning' }).then(async () => {
    await operationApi.removePlatformAccount(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(loadList)
</script>
