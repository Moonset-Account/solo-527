<template>
  <div class="user-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-form :inline="true" :model="queryForm" class="query-form">
            <el-form-item label="关键词">
              <el-input
                v-model="queryForm.keyword"
                placeholder="用户名/昵称"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
          <div>
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
      @close="dialogFormRef?.resetFields()"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="dialogForm.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="dialogForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="dialogForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="dialogForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="dialogForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dialogForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { UserItem } from '@/api'

interface QueryForm {
  page: number
  pageSize: number
  keyword: string
  status: 0 | 1 | ''
}

interface DialogForm {
  id: number | null
  username: string
  nickname: string
  email: string
  phone: string
  password: string
  status: 0 | 1
}

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogFormRef = ref<FormInstance>()
const isEdit = ref(false)
const total = ref(0)

const mockUsers: UserItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  username: `user${i + 1}`,
  nickname: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `138${String(10000000 + i).padStart(8, '0')}`,
  status: i % 5 === 0 ? 0 : 1,
  createTime: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
  updateTime: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} 15:00:00`
}))

const tableData = ref<UserItem[]>([])

const queryForm = reactive<QueryForm>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: ''
})

const dialogForm = reactive<DialogForm>({
  id: null,
  username: '',
  nickname: '',
  email: '',
  phone: '',
  password: '',
  status: 1
})

const dialogRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: isEdit.value ? [] : [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

function fetchList() {
  loading.value = true
  setTimeout(() => {
    let list = [...mockUsers]
    if (queryForm.keyword) {
      list = list.filter(u =>
        u.username.includes(queryForm.keyword) ||
        u.nickname.includes(queryForm.keyword)
      )
    }
    if (queryForm.status !== '') {
      list = list.filter(u => u.status === queryForm.status)
    }
    total.value = list.length
    const start = (queryForm.page - 1) * queryForm.pageSize
    tableData.value = list.slice(start, start + queryForm.pageSize)
    loading.value = false
  }, 500)
}

function handleSearch() {
  queryForm.page = 1
  fetchList()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchList()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(dialogForm, {
    id: null,
    username: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: UserItem) {
  isEdit.value = true
  Object.assign(dialogForm, row, { password: '' })
  dialogVisible.value = true
}

function handleDelete(row: UserItem) {
  ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = mockUsers.findIndex(u => u.id === row.id)
    if (index > -1) mockUsers.splice(index, 1)
    fetchList()
    ElMessage.success('删除成功')
  })
}

async function handleSubmit() {
  if (!dialogFormRef.value) return
  await dialogFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      setTimeout(() => {
        if (isEdit.value && dialogForm.id) {
          const index = mockUsers.findIndex(u => u.id === dialogForm.id)
          if (index > -1) {
            mockUsers[index] = {
              ...mockUsers[index],
              nickname: dialogForm.nickname,
              email: dialogForm.email,
              phone: dialogForm.phone,
              status: dialogForm.status,
              updateTime: new Date().toLocaleString()
            }
          }
          ElMessage.success('编辑成功')
        } else {
          const newId = mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1
          mockUsers.unshift({
            id: newId,
            username: dialogForm.username,
            nickname: dialogForm.nickname,
            email: dialogForm.email,
            phone: dialogForm.phone,
            status: dialogForm.status,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          })
          ElMessage.success('新增成功')
        }
        submitLoading.value = false
        dialogVisible.value = false
        fetchList()
      }, 500)
    }
  })
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.query-form {
  margin: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
