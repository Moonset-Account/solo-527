<template>
  <div class="role-list">
    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <h3 class="title">角色管理</h3>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增角色
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="权限数量" width="120">
          <template #default="{ row }">
            {{ (row.permissions || []).length }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="showPermissionDialog(row)">分配权限</el-button>
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

    <el-dialog v-model="showFormDialog" :title="editMode ? '编辑角色' : '新增角色'" width="500px">
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPermDialog" title="分配权限" width="600px">
      <div class="perm-header">
        <span>角色：{{ currentRole?.name }}</span>
      </div>
      <el-tree
        ref="treeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="checkedPermIds"
        :props="treeProps"
      />
      <template #footer>
        <el-button @click="showPermDialog = false">取消</el-button>
        <el-button type="primary" :loading="permLoading" @click="handleAssignPerms">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, assignRolePermissions } from '../api/roles'

const loading = ref(false)
const submitLoading = ref(false)
const permLoading = ref(false)
const showFormDialog = ref(false)
const showPermDialog = ref(false)
const editMode = ref(false)
const roleFormRef = ref(null)
const treeRef = ref(null)
const currentRole = ref(null)

const tableData = ref([])
const total = ref(0)
const checkedPermIds = ref([])

const permTree = ref([
  {
    id: 'seats',
    label: '席位管理',
    children: [
      { id: 'seats:view', label: '查看' },
      { id: 'seats:edit', label: '编辑' },
      { id: 'seats:delete', label: '删除' }
    ]
  },
  {
    id: 'plans',
    label: '套餐管理',
    children: [
      { id: 'plans:view', label: '查看' },
      { id: 'plans:edit', label: '编辑' },
      { id: 'plans:delete', label: '删除' }
    ]
  },
  {
    id: 'bills',
    label: '账单管理',
    children: [
      { id: 'bills:view', label: '查看' },
      { id: 'bills:create', label: '生成' },
      { id: 'bills:export', label: '导出' }
    ]
  },
  {
    id: 'renewal',
    label: '续费管理',
    children: [
      { id: 'renewal:view', label: '查看' },
      { id: 'renewal:edit', label: '编辑' },
      { id: 'renewal:follow', label: '跟进' }
    ]
  },
  {
    id: 'users',
    label: '用户管理',
    children: [
      { id: 'users:view', label: '查看' },
      { id: 'users:edit', label: '编辑' },
      { id: 'users:delete', label: '删除' }
    ]
  },
  {
    id: 'roles',
    label: '角色管理',
    children: [
      { id: 'roles:view', label: '查看' },
      { id: 'roles:edit', label: '编辑' },
      { id: 'roles:delete', label: '删除' }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const roleForm = reactive({
  id: null,
  name: '',
  description: ''
})

const roleRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getRoleList(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
  roleForm.id = null
  roleForm.name = ''
  roleForm.description = ''
  showFormDialog.value = true
}

const handleEdit = (row) => {
  editMode.value = true
  roleForm.id = row.id
  roleForm.name = row.name
  roleForm.description = row.description
  showFormDialog.value = true
}

const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate()
    submitLoading.value = true
    if (editMode.value) {
      await updateRole(roleForm.id, roleForm)
      ElMessage.success('编辑成功')
    } else {
      await createRole(roleForm)
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

const showPermissionDialog = (row) => {
  currentRole.value = row
  checkedPermIds.value = (row.permissions || []).map(p => p.id || p.name)
  showPermDialog.value = true
}

const handleAssignPerms = async () => {
  if (!treeRef.value) return
  const checkedKeys = treeRef.value.getCheckedKeys()
  const halfCheckedKeys = treeRef.value.getHalfCheckedKeys()
  const allKeys = [...checkedKeys, ...halfCheckedKeys]
  
  permLoading.value = true
  try {
    await assignRolePermissions(currentRole.value.id, { permissionIds: allKeys })
    ElMessage.success('分配成功')
    showPermDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    permLoading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.role-list {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.perm-header {
  margin-bottom: 20px;
  font-weight: 500;
  color: #303133;
}
</style>
