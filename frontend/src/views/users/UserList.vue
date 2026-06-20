<template>
  <div class="user-list">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        添加用户
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/邮箱/部门"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable style="width: 120px">
            <el-option label="管理员" value="admin" />
            <el-option label="面试官" value="interviewer" />
            <el-option label="HR" value="hr" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isActive" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-container">
      <el-table :data="users" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">{{ RoleLabel[row.role as keyof typeof RoleLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.isActive ? 'warning' : 'success'"
              link
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog v-model="showCreateDialog" :title="editingId ? '编辑用户' : '添加用户'" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="面试官" value="interviewer" />
            <el-option label="HR" value="hr" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="formData.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="formData.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="formData.phone" placeholder="请输入电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
import * as usersApi from '../../api/users';
import { RoleLabel, type User } from '../../types';

const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const users = ref<User[]>([]);
const showCreateDialog = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<string | null>(null);

const searchForm = reactive({
  keyword: '',
  role: '',
  isActive: undefined as boolean | undefined,
});

const formData = reactive({
  name: '',
  email: '',
  username: '',
  password: '',
  role: '',
  department: '',
  position: '',
  phone: '',
  isActive: true,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

function getRoleTagType(role: string) {
  const map: Record<string, string> = {
    admin: 'danger',
    interviewer: 'primary',
    hr: 'success',
  };
  return map[role] || 'info';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (searchForm.keyword) params.keyword = searchForm.keyword;
    if (searchForm.role) params.role = searchForm.role;
    if (searchForm.isActive !== undefined) params.isActive = searchForm.isActive;

    const result = await usersApi.getUsers(params);
    users.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.role = '';
  searchForm.isActive = undefined;
  handleSearch();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
  fetchData();
}

function handleEdit(row: User) {
  editingId.value = row._id;
  Object.assign(formData, {
    name: row.name,
    email: row.email,
    username: row.username,
    password: '',
    role: row.role,
    department: row.department || '',
    position: row.position || '',
    phone: row.phone || '',
    isActive: row.isActive,
  });
  showCreateDialog.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        if (editingId.value) {
          const updateData = { ...formData };
          if (!updateData.password) delete (updateData as any).password;
          await usersApi.updateUser(editingId.value, updateData);
          ElMessage.success('更新成功');
        } else {
          await usersApi.createUser(formData);
          ElMessage.success('创建成功');
        }
        showCreateDialog.value = false;
        editingId.value = null;
        Object.assign(formData, {
          name: '',
          email: '',
          username: '',
          password: '',
          role: '',
          department: '',
          position: '',
          phone: '',
          isActive: true,
        });
        await fetchData();
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
}

async function toggleStatus(row: User) {
  const action = row.isActive ? '禁用' : '启用';
  ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await usersApi.updateUser(row._id, { isActive: !row.isActive });
      ElMessage.success(`${action}成功`);
      await fetchData();
    } catch (e: any) {
      ElMessage.error(e.response?.data?.message || '操作失败');
    }
  }).catch(() => {});
}

async function handleDelete(row: User) {
  ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await usersApi.deleteUser(row._id);
      ElMessage.success('删除成功');
      await fetchData();
    } catch (e: any) {
      ElMessage.error(e.response?.data?.message || '删除失败');
    }
  }).catch(() => {});
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.user-list {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.page-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
</style>
