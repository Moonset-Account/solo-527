<template>
  <div class="admin-users">
    <div class="admin-card">
      <h3 style="margin-bottom: 16px;">用户管理</h3>
      <el-table :data="users" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="真实姓名" />
        <el-table-column prop="phone" label="手机号" v-if="userStore.isAdmin" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.verified ? 'success' : 'warning'">
              {{ row.verified ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" v-if="userStore.isAdmin" :formatter="formatBalance" />
        <el-table-column label="操作" width="120" v-if="userStore.isAdmin">
          <template #default="{ row }">
            <el-button 
              v-if="!row.verified" 
              type="success" 
              size="small" 
              @click="verifyUser(row.id)"
            >
              认证
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { authAPI } from '@/api';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const users = ref([]);

const getRoleText = (r) => {
  const m = { resident: '居民', volunteer: '志愿者', admin: '管理员' };
  return m[r] || r;
};
const getRoleType = (r) => {
  const m = { resident: 'info', volunteer: 'primary', admin: 'danger' };
  return m[r] || '';
};
const formatBalance = (row, col, v) => '¥' + v;

const verifyUser = async (id) => {
  try {
    await authAPI.verifyUser(id);
    ElMessage.success('认证成功');
    fetchUsers();
  } catch (e) {}
};

const fetchUsers = async () => {
  try {
    const res = await authAPI.getUsers();
    users.value = res.users;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchUsers();
});
</script>
