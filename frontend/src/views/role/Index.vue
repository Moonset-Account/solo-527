<template>
  <div class="role-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>角色权限管理</span>
          <el-button type="primary" @click="openDialog()">新建角色</el-button>
        </div>
      </template>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="总经办角色" name="GENERAL_OFFICE" />
        <el-tab-pane label="管理员角色" name="ADMIN" />
      </el-tabs>
      <el-table :data="roles" stripe style="width: 100%">
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column prop="roleCode" label="角色代码" min-width="120" />
        <el-table-column prop="roleType" label="角色类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.roleType === 'GENERAL_OFFICE' ? 'primary' : 'warning'" size="small">
              {{ row.roleType === 'GENERAL_OFFICE' ? '总经办' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限列表" min-width="280">
          <template #default="{ row }">
            <el-tag
              v-for="perm in parsePermissions(row.permissions)"
              :key="perm"
              size="small"
              class="perm-tag"
            >
              {{ permissionLabel(perm) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确认删除?" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新建角色'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="角色名称">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="角色代码">
          <el-input v-model="form.roleCode" />
        </el-form-item>
        <el-form-item label="角色类型">
          <el-select v-model="form.roleType" placeholder="请选择角色类型" style="width: 100%">
            <el-option label="总经办" value="GENERAL_OFFICE" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="权限配置">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox
              v-for="item in permissionOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRolesByType, createRole, updateRole, deleteRole } from '@/api/role'

const activeTab = ref('GENERAL_OFFICE')
const roles = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)

const form = ref({
  roleName: '',
  roleCode: '',
  roleType: 'GENERAL_OFFICE',
  description: '',
  permissions: []
})

const permissionOptions = [
  { label: '需求管理', value: 'REQUIREMENT_MANAGE' },
  { label: '流程配置', value: 'PROCESS_CONFIG' },
  { label: '角色管理', value: 'ROLE_MANAGE' },
  { label: '待办管理', value: 'TODO_MANAGE' },
  { label: '会议管理', value: 'MEETING_MANAGE' },
  { label: '提醒配置', value: 'REMINDER_CONFIG' },
  { label: '报表查看', value: 'REPORT_VIEW' },
  { label: '导入导出', value: 'IMPORT_EXPORT' },
  { label: '审计日志', value: 'AUDIT_LOG' }
]

const permissionLabelMap = Object.fromEntries(
  permissionOptions.map(item => [item.value, item.label])
)

function permissionLabel(value) {
  return permissionLabelMap[value] || value
}

function parsePermissions(permissions) {
  if (!permissions) return []
  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions)
    } catch (e) {
      return []
    }
  }
  return permissions
}

async function fetchRoles() {
  try {
    const res = await getRolesByType(activeTab.value)
    roles.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

function handleTabChange() {
  fetchRoles()
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    form.value = {
      roleName: row.roleName,
      roleCode: row.roleCode,
      roleType: row.roleType,
      description: row.description || '',
      permissions: parsePermissions(row.permissions)
    }
  } else {
    editingId.value = null
    form.value = {
      roleName: '',
      roleCode: '',
      roleType: activeTab.value,
      description: '',
      permissions: []
    }
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    const payload = { ...form.value }
    if (editingId.value) {
      await updateRole(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createRole(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchRoles()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(id) {
  try {
    await deleteRole(id)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.role-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.perm-tag {
  margin: 2px 4px;
}
</style>
