<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="用户名/姓名/邮箱" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="filters.department" placeholder="部门名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="管理员" value="admin" />
            <el-option label="版房负责人" value="workshop_manager" />
            <el-option label="计划员" value="planner" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              size="small"
              style="margin-right: 5px"
              :type="roleType(role.slug)"
            >
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该用户吗？" @confirm="deleteUser(row)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="formData.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="formData.department" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="formData.roleIds" multiple style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-switch v-model="formData.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { userApi } from '@/api/modules'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const roleList = ref([
  { id: 1, name: '管理员', slug: 'admin' },
  { id: 2, name: '版房负责人', slug: 'workshop_manager' },
  { id: 3, name: '计划员', slug: 'planner' },
])

const filters = reactive({
  keyword: '',
  department: '',
  role: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑用户' : '新增用户'))
const isEdit = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  realName: '',
  phone: '',
  department: '',
  roleIds: [],
  isActive: true,
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function roleType(slug) {
  const map = {
    admin: 'danger',
    workshop_manager: 'warning',
    planner: 'primary',
  }
  return map[slug] || 'info'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
    }
    const res = await userApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.department = ''
  filters.role = ''
  pagination.page = 1
  loadData()
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    username: '',
    email: '',
    password: '',
    realName: '',
    phone: '',
    department: '',
    roleIds: [],
    isActive: true,
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    email: row.email,
    realName: row.realName,
    phone: row.phone || '',
    department: row.department || '',
    roleIds: row.roles?.map((r) => r.id) || [],
    isActive: row.isActive,
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await userApi.update(formData.id, formData)
      ElMessage.success('用户更新成功')
    } else {
      await userApi.create(formData)
      ElMessage.success('用户创建成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

async function deleteUser(row) {
  try {
    await userApi.delete(row.id)
    ElMessage.success('用户删除成功')
    loadData()
  } catch (e) {}
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
