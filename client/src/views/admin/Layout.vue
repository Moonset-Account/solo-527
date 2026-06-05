<template>
  <div class="admin-layout">
    <div class="admin-sidebar">
      <h2>🔧 社区工具管理</h2>
      <router-link to="/admin">数据概览</router-link>
      <router-link to="/admin/borrows">借用管理</router-link>
      <router-link to="/admin/tools">工具管理</router-link>
      <router-link to="/admin/calendar">库存日历</router-link>
      <router-link to="/admin/maintenances">维修管理</router-link>
      <router-link v-if="userStore.isAdmin" to="/admin/users">用户管理</router-link>
      <router-link v-if="userStore.isAdmin" to="/admin/audit">审计日志</router-link>
      <div style="margin-top: auto; padding: 20px;">
        <router-link to="/" style="color: rgba(255,255,255,0.5);">← 返回移动端</router-link>
      </div>
    </div>
    <div class="admin-content">
      <div class="admin-header">
        <span>欢迎，{{ userStore.user?.realName || userStore.user?.username }} ({{ getRoleText() }})</span>
        <el-button type="primary" size="small" @click="logout">退出登录</el-button>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const getRoleText = () => {
  const map = { resident: '居民', volunteer: '志愿者', admin: '管理员' };
  return map[userStore.user?.role] || '';
};

const logout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}
.admin-sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.admin-sidebar h2 {
  padding: 20px 16px;
  margin: 0;
  font-size: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.admin-sidebar a {
  display: block;
  padding: 12px 20px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
}
.admin-sidebar a:hover,
.admin-sidebar a.router-link-active {
  background: #1890ff;
  color: #fff;
}
.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.admin-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
</style>
