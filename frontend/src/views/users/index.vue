<template>
  <div class="users-page page-container">
    <div class="card-wrapper">
      <div class="card-header">
        <span class="title"><el-icon><UserFilled /></el-icon> 用户管理</span>
        <el-button type="primary" :icon="Plus" @click="showCreate = true">新建用户</el-button>
      </div>

      <el-form :inline="true" :model="filters" class="filter-form" style="margin-bottom: 16px;">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="用户名/姓名/邮箱" clearable style="width: 220px" @change="loadData(1)" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="全部" clearable style="width: 140px" @change="loadData(1)">
            <el-option label="超级管理员" value="admin" />
            <el-option label="运营经理" value="manager" />
            <el-option label="运营专员" value="operator" />
            <el-option label="查看员" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="正常" value="active" />
            <el-option label="已禁用" value="disabled" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-avatar :size="36" style="background: #409eff;">
                {{ row.name?.[0] }}
              </el-avatar>
              <div>
                <div style="font-weight: 500; color: $text-primary;">{{ row.name }}</div>
                <div style="font-size: 12px; color: $text-secondary;">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.role === 'admin' ? 'danger' : row.role === 'manager' ? 'success' : row.role === 'operator' ? 'primary' : 'info'"
              effect="plain"
              size="small"
            >
              {{ roleMap[row.role]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="110" />
        <el-table-column label="联系方式" min-width="200">
          <template #default="{ row }">
            <div>邮箱: {{ row.email || '-' }}</div>
            <div style="font-size: 12px; color: $text-secondary; margin-top: 2px;">
              手机: {{ row.phone || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.status === 'active'"
              size="small"
              type="success"
              effect="dark"
              style="border: none;"
            >
              正常
            </el-tag>
            <el-tag v-else-if="row.status === 'expired'" size="small" type="danger">已过期</el-tag>
            <el-tag v-else size="small" type="info">已禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限有效期" width="170">
          <template #default="{ row }">
            <template v-if="row.permissionExpireAt">
              {{ formatDateShort(row.permissionExpireAt) }}
              <el-tag
                v-if="getDaysLeft(row.permissionExpireAt) <= 7"
                type="danger"
                size="small"
                style="margin-left: 4px;"
              >
                {{ getDaysLeft(row.permissionExpireAt) }}天
              </el-tag>
              <el-tag
                v-else-if="getDaysLeft(row.permissionExpireAt) <= 30"
                type="warning"
                size="small"
                style="margin-left: 4px;"
              >
                {{ getDaysLeft(row.permissionExpireAt) }}天
              </el-tag>
            </template>
            <span v-else style="color: $text-secondary;">永久有效</span>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="170">
          <template #default="{ row }">
            <span v-if="row.lastLoginAt">{{ formatDate(row.lastLoginAt) }}</span>
            <span v-else style="color: $text-secondary;">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editUser(row)">编辑</el-button>
            <el-button
              v-if="row._id !== currentUserId"
              link
              type="danger"
              @click="deleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>

    <el-dialog
      v-model="showCreate"
      :title="formType === 'create' ? '新建用户' : '编辑用户'"
      width="520px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="formType === 'edit'" />
        </el-form-item>
        <el-form-item v-if="formType === 'create'" label="密码" required>
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%;">
            <el-option label="超级管理员" value="admin" />
            <el-option label="运营经理" value="manager" />
            <el-option label="运营专员" value="operator" />
            <el-option label="查看员" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item v-if="formType === 'edit'" label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
            <el-option label="过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限有效期">
          <el-date-picker
            v-model="form.permissionExpireAt"
            type="date"
            placeholder="留空表示永久有效"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          {{ formType === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUsers, createUser, updateUser, deleteUser as _deleteUser
} from '@/api/users'
import { useUserStore } from '@/stores/user'
import { formatDate, formatDateShort, roleMap } from '@/utils'
import { UserFilled, Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const currentUserId = userStore.userInfo?.id

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', role: '', status: '' })

const showCreate = ref(false)
const formType = ref<'create' | 'edit'>('create')
const editingId = ref('')
const saving = ref(false)
const form = reactive({
  username: '', password: '', name: '', email: '', phone: '',
  role: 'viewer' as any, department: '', status: 'active' as any,
  permissionExpireAt: '' as any
})

function resetForm() {
  Object.assign(form, {
    username: '', password: '', name: '', email: '', phone: '',
    role: 'viewer', department: '', status: 'active', permissionExpireAt: ''
  })
}

function getDaysLeft(d: any) {
  if (!d) return 9999
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const res = await getUsers({
      ...filters, page: page.value, pageSize: pageSize.value
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  loadData(1)
}

function editUser(row: any) {
  formType.value = 'edit'
  editingId.value = row._id
  Object.assign(form, {
    username: row.username,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    role: row.role,
    department: row.department || '',
    status: row.status,
    permissionExpireAt: row.permissionExpireAt || ''
  })
  showCreate.value = true
}

async function submitForm() {
  if (!form.username || !form.name) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (formType.value === 'create' && !form.password) {
    ElMessage.warning('请设置密码')
    return
  }
  saving.value = true
  try {
    if (formType.value === 'create') {
      await createUser({ ...form })
      ElMessage.success('创建成功')
    } else {
      await updateUser(editingId.value, { ...form })
      ElMessage.success('修改成功')
    }
    showCreate.value = false
    resetForm()
    loadData()
  } finally {
    saving.value = false
  }
}

async function deleteUser(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除用户【${row.name}】？`, '提示', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await _deleteUser(row._id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

onMounted(() => {
  loadData()
  showCreate.value = false
})
</script>

<style lang="scss" scoped>
.filter-form {
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  :deep(.el-form-item) { margin-bottom: 10px; margin-right: 12px; }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
