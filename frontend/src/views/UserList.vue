<template>
  <div class="user-list">
    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名/邮箱"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles || []"
              :key="role.id"
              style="margin-right: 5px"
            >
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="showRoleDialog(row)">分配角色</el-button>
            <el-button
              :type="row.status === 'active' ? 'danger' : 'success'"
              link
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showFormDialog" :title="editMode ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item v-if="!editMode" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item v-if="editMode" label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRoleDialogVisible" title="分配角色" width="500px">
      <el-form label-width="80px">
        <el-form-item label="用户">
          <span>{{ currentUser?.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.id"
              style="margin-right: 20px"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleLoading" @click="handleAssignRoles">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, assignUserRoles } from '../api/users'
import { getRoleList } from '../api/roles'

const loading = ref(false)
const submitLoading = ref(false)
const roleLoading = ref(false)
const showFormDialog = ref(false)
const showRoleDialogVisible = ref(false)
const editMode = ref(false)
const userFormRef = ref(null)
const currentUser = ref(null)
const searchKeyword = ref('')

const tableData = ref([])
const total = ref(0)
const roleOptions = ref([])
const selectedRoleIds = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const userForm = reactive({
  id: null,
  username: '',
  email: '',
  name: '',
  password: '',
  status: 'active'
})

const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value
    }
    const res = await getUserList(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const res = await getRoleList({ pageSize: 100 })
    roleOptions.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  editMode.value = false
  userForm.id = null
  userForm.username = ''
  userForm.email = ''
  userForm.name = ''
  userForm.password = ''
  userForm.status = 'active'
  showFormDialog.value = true
}

const handleEdit = (row) => {
  editMode.value = true
  userForm.id = row.id
  userForm.username = row.username
  userForm.email = row.email
  userForm.name = row.name
  userForm.password = ''
  userForm.status = row.status
  showFormDialog.value = true
}

const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    submitLoading.value = true
    if (editMode.value) {
      const { password, ...updateData } = userForm
      await updateUser(userForm.id, updateData)
      ElMessage.success('编辑成功')
    } else {
      await createUser(userForm)
      ElMessage.success('新增成功')
    }
    showFormDialog.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    submitLoading.value = false
  }
}

const showRoleDialog = (row) => {
  currentUser.value = row
  selectedRoleIds.value = (row.roles || []).map(r => r.id)
  showRoleDialogVisible.value = true
}

const handleAssignRoles = async () => {
  roleLoading.value = true
  try {
    await assignUserRoles(currentUser.value.id, { roleIds: selectedRoleIds.value })
    ElMessage.success('分配成功')
    showRoleDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    roleLoading.value = false
  }
}

const handleToggleStatus = async (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}该用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateUser(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadRoles()
  loadData()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
