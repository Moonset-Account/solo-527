<template>
  <div class="page-container">
    <div class="page-header">
      <h2>账号管理</h2>
      <el-button type="primary" @click="showCreate = true" v-if="auth.isAdmin">
        <el-icon><Plus /></el-icon> 新建账号
      </el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.role" placeholder="角色" clearable @change="loadData" style="width:140px;">
        <el-option label="管理员" value="admin" />
        <el-option label="物业经理" value="manager" />
        <el-option label="客服" value="customer_service" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="active" />
        <el-option label="停用" value="inactive" />
        <el-option label="冻结" value="suspended" />
      </el-select>
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="roleTag[row.role]" size="small">{{ roleLabels[row.role] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy.realName" label="创建人" width="100" />
        <el-table-column label="最近登录" width="170">
          <template #default="{ row }">{{ row.lastLoginAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-dropdown v-if="auth.isAdmin" trigger="click" @command="(c) => handleStatusChange(row, c)">
              <el-button size="small" type="warning" link>切换状态<el-icon><CaretBottom /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="active">启用</el-dropdown-item>
                  <el-dropdown-item command="inactive">停用</el-dropdown-item>
                  <el-dropdown-item command="suspended">冻结</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button v-if="auth.isAdmin && row.username !== 'admin'" size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showCreate" title="新建账号" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="初始密码"><el-input v-model="form.password" show-password placeholder="至少6位" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="物业经理" value="manager" />
            <el-option label="客服" value="customer_service" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%;">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showEdit" title="编辑账号" width="480px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="账号"><el-input v-model="editForm.username" disabled /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="editForm.realName" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="editForm.email" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="editForm.password" show-password placeholder="留空则不修改" /></el-form-item>
        <el-form-item label="角色" v-if="auth.isAdmin">
          <el-select v-model="editForm.role" style="width:100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="物业经理" value="manager" />
            <el-option label="客服" value="customer_service" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="auth.isAdmin">
          <el-select v-model="editForm.status" style="width:100%;">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="冻结" value="suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser } from '@/api/user';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/types';

const auth = useAuthStore();
const loading = ref(false);
const list = ref<User[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ role: '', status: '' });

const roleLabels: Record<string, string> = { admin: '管理员', manager: '物业经理', customer_service: '客服' };
const roleTag: Record<string, any> = { admin: 'danger', manager: 'warning', customer_service: 'success' };
const statusLabels: Record<string, string> = { active: '启用', inactive: '停用', suspended: '冻结' };
const statusTag: Record<string, any> = { active: 'success', inactive: 'info', suspended: 'danger' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getUsers({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showCreate = ref(false);
const form = reactive<any>({ username: '', realName: '', email: '', phone: '', password: '', role: 'customer_service', status: 'active' });
async function handleCreate() {
  if (!form.username || !form.realName || !form.email || !form.password) { ElMessage.warning('请填写完整'); return; }
  try { await createUser(form); ElMessage.success('创建成功'); showCreate.value = false; loadData(); } catch (_) {}
}

const showEdit = ref(false);
const editForm = reactive<any>({});
function openEdit(row: User) {
  Object.assign(editForm, { ...row, password: '' });
  showEdit.value = true;
}
async function handleUpdate() {
  const data = { ...editForm };
  if (!data.password) delete data.password;
  try { await updateUser(editForm._id, data); ElMessage.success('更新成功'); showEdit.value = false; loadData(); } catch (_) {}
}

async function handleStatusChange(row: User, status: string) {
  try { await updateUserStatus(row._id, status); ElMessage.success('状态已更新'); loadData(); } catch (_) {}
}

async function handleDelete(row: User) {
  try {
    await ElMessageBox.confirm(`确定删除账号 ${row.username}?`, '确认', { type: 'warning' });
    await deleteUser(row._id);
    ElMessage.success('删除成功');
    loadData();
  } catch (_) {}
}
</script>
