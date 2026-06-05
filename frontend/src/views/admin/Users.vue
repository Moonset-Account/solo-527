<template>
  <div class="admin-users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" icon="Plus" @click="openDialog()">新增用户</el-button>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" stripe border>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column label="姓名" width="120">
          <template #default="{ row }">{{ row.first_name }}{{ row.last_name }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)">{{ row.role_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="resetPassword(row)">重置密码</el-button>
            <el-button :type="row.is_active ? 'danger' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="姓名" prop="first_name">
          <el-input v-model="form.first_name" placeholder="名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%;">
            <el-option label="系统管理员" value="admin" />
            <el-option label="店长" value="manager" />
            <el-option label="普通员工" value="staff" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const users = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null, username: '', first_name: '', role: 'staff', email: '', phone: '', password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  first_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
}

const roleTagType = (role) => {
  const types = { admin: 'danger', manager: 'warning', staff: 'primary' }
  return types[role] || 'info'
}

const loadUsers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/auth/users/', { params: { page_size: 100 } })
    users.value = data.results
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, { ...row, password: '' })
  } else {
    Object.assign(form, { id: null, username: '', first_name: '', role: 'staff', email: '', phone: '', password: '' })
  }
  dialogVisible.value = true
}

const saveUser = async () => {
  await formRef.value.validate()
  try {
    if (form.id) {
      await api.patch(`/auth/users/${form.id}/`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/auth/users/', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadUsers()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const resetPassword = async (row) => {
  try {
    const { value: password } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
      inputPattern: /.{6,}/,
      inputErrorMessage: '密码至少6位'
    })
    await api.post(`/auth/users/${row.id}/set_password/`, { password })
    ElMessage.success('密码重置成功')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = !row.is_active
    await api.patch(`/auth/users/${row.id}/`, { is_active: newStatus })
    ElMessage.success('操作成功')
    loadUsers()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(loadUsers)
</script>

<style lang="scss" scoped>
.admin-users {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
