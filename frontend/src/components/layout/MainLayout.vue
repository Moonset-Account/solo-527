<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid #1f2d3d;">
    公寓账单管理系统
  </div>
      <el-menu
        :default-active="$route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffd04b"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-sub-menu index="bills-group">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>账单中心</span>
          </template>
          <el-menu-item index="/bills">账单列表</el-menu-item>
          <el-menu-item index="/bills/create" v-if="auth.isManager">生成账单</el-menu-item>
          <el-menu-item index="/bills/statistics">收费统计</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="config-group">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>配置管理</span>
          </template>
          <el-menu-item index="/maintenance">工程报修</el-menu-item>
          <el-menu-item index="/inspection">巡检任务</el-menu-item>
          <el-menu-item index="/room-pricing">房态价格</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/access-exceptions">
          <el-icon><Warning /></el-icon>
          <span>通行异常</span>
        </el-menu-item>
        <el-menu-item index="/system-config" v-if="auth.isManager">
          <el-icon><Tools /></el-icon>
          <span>系统配置</span>
        </el-menu-item>
        <el-menu-item index="/users" v-if="auth.isManager">
          <el-icon><User /></el-icon>
          <span>账号管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center; padding: 0 24px;">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.meta.title || '' }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div style="display: flex; align-items: center; gap: 16px;">
          <el-dropdown @command="handleCommand">
            <span style="display: flex; align-items: center; cursor: pointer;">
              <el-avatar :size="32" style="background: #409EFF;">
                {{ auth.userInfo?.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <span style="margin-left: 8px;">{{ auth.userInfo?.realName }}</span>
              <el-tag :type="roleTagType" size="small" style="margin-left: 8px;">
                {{ roleLabel }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main style="background: #f0f2f5; overflow: auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const auth = useAuthStore();
const router = useRouter();

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员', manager: '物业经理', customer_service: '客服',
  };
  return map[auth.role || ''] || '未知';
});

const roleTagType = computed(() => {
  const map: Record<string, any> = {
    admin: 'danger', manager: 'warning', customer_service: 'success',
  };
  return map[auth.role || ''] || 'info';
});

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    auth.logout();
    router.push('/login');
  }
}
</script>
