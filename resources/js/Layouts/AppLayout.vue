<template>
  <el-container class="layout-container">
    <el-header class="app-header" height="64px">
      <div class="header-inner">
        <div class="logo">
          <el-icon :size="28" color="#2563eb"><Tooth /></el-icon>
          <span class="logo-title">{{ appName }}</span>
        </div>
        <el-menu mode="horizontal" :default-active="activeMenu" class="header-menu" @select="onMenuSelect">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>看板</span>
          </el-menu-item>
          <el-menu-item index="/leads">
            <el-icon><User /></el-icon>
            <span>线索管理</span>
          </el-menu-item>
          <el-sub-menu index="ref">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>参考资料</span>
            </template>
            <el-menu-item index="/quote-versions">报价版本</el-menu-item>
            <el-menu-item index="/ocean-rules">公海规则</el-menu-item>
            <el-menu-item index="/churn-reasons">流失原因</el-menu-item>
          </el-sub-menu>
        </el-menu>
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-trigger">
              <el-avatar :size="32" class="user-avatar">
                {{ user?.name?.charAt(0) ?? 'U' }}
              </el-avatar>
              <span class="user-name">{{ user?.name }}</span>
              <el-tag size="small" :type="user?.role === 'admin' ? 'danger' : 'success'" effect="plain">
                {{ user?.role === 'admin' ? '管理员' : '运营' }}
              </el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-main class="page-main">
      <slot />
    </el-main>

    <el-footer height="40px" class="app-footer">
      <span>牙科诊所客户转化管理台 © {{ year }} - 让每一条线索都有价值</span>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePage, router } from '@inertiajs/vue3';

defineProps<{ title?: string }>();

const page = usePage<any>();
const appName = import.meta.env.VITE_APP_NAME || '牙科诊所管理台';
const year = new Date().getFullYear();

const user = computed(() => page.props.auth?.user);
const currentPath = computed(() => page.url.split('?')[0]);

const activeMenu = computed(() => {
  const p = currentPath.value;
  if (p.startsWith('/leads')) return '/leads';
  if (p.startsWith('/quote-versions') || p.startsWith('/ocean-rules') || p.startsWith('/churn-reasons')) return 'ref';
  return '/dashboard';
});

const onMenuSelect = (index: string) => {
  if (index && index !== 'ref') {
    router.get(index);
  }
};

const logout = () => {
  router.post('/logout', {}, { onSuccess: () => window.location.href = '/login' });
};
</script>

<style scoped>
.layout-container { min-height: 100vh; }
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e4e7eb;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 1600px;
  margin: 0 auto;
}
.logo { display: flex; align-items: center; gap: 10px; }
.logo-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  letter-spacing: 0.3px;
}
.header-menu { flex: 1; border-bottom: none !important; }
.header-right { display: flex; align-items: center; }
.user-trigger { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.user-trigger:hover { background: #f3f4f6; }
.user-name { color: #374151; font-weight: 500; font-size: 14px; }
.page-main { background: #f5f7fa; padding: 24px; max-width: 1600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.app-footer {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  border-top: 1px solid #e4e7eb;
}
</style>
