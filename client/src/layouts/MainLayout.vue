<template>
  <a-layout class="h-screen">
    <a-layout-sider
      v-model:collapsed="appStore.sidebarCollapsed"
      collapsible
      :trigger="null"
      width="240"
      class="sidebar"
    >
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed">汽修管理系统</span>
        <span v-else>汽修</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        theme="dark"
        @click="handleMenuClick"
      >
        <a-menu-item key="/">
          <DashboardOutlined />
          <span>首页仪表盘</span>
        </a-menu-item>
        <a-sub-menu key="reception">
          <template #icon>
            <CarOutlined />
          </template>
          <template #title>接待管理</template>
          <a-menu-item key="/reception/inspection">检测项目查看</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="leads">
          <template #icon>
            <UserOutlined />
          </template>
          <template #title>线索管理</template>
          <a-menu-item key="/leads">线索列表</a-menu-item>
          <a-menu-item key="/leads/assign">线索分配</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="followup">
          <template #icon>
            <PhoneOutlined />
          </template>
          <template #title>回访管理</template>
          <a-menu-item key="/followup/tasks">回访任务</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="quality">
          <template #icon>
            <SafetyOutlined />
          </template>
          <template #title>维修质量</template>
          <a-menu-item key="/quality/status">质量状态</a-menu-item>
          <a-menu-item key="/quality/report">质量报表</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="config">
          <template #icon>
            <SettingOutlined />
          </template>
          <template #title>配置管理</template>
          <a-menu-item key="/config/vehicles">车辆档案</a-menu-item>
          <a-menu-item key="/config/templates">检测模板</a-menu-item>
          <a-menu-item key="/config/parts">配件报价</a-menu-item>
          <a-menu-item key="/config/rules">规则管理</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <MenuFoldOutlined
          v-if="!appStore.sidebarCollapsed"
          class="trigger"
          @click="appStore.toggleSidebar()"
        />
        <MenuUnfoldOutlined
          v-else
          class="trigger"
          @click="appStore.toggleSidebar()"
        />
        <div class="header-right">
          <a-dropdown>
            <div class="user-info">
              <a-avatar :size="32">
                {{ userStore.userInfo?.name?.charAt(0) || 'U' }}
              </a-avatar>
              <span class="username">{{ userStore.userInfo?.name || '用户' }}</span>
            </div>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item key="profile">
                  <UserOutlined /> 个人中心
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout">
                  <LogoutOutlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  PhoneOutlined,
  SafetyOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const selectedKeys = ref<string[]>([route.path])

onMounted(() => {
  userStore.loadUserInfo()
})

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

const handleUserMenuClick = ({ key }: { key: string }) => {
  if (key === 'logout') {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onOk: async () => {
        await userStore.logout()
        message.success('已退出登录')
        router.push('/login')
      },
    })
  }
}
</script>

<style scoped>
.sidebar {
  background: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  height: 64px;
}

.trigger {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #165dff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #333;
}

.content {
  background: #f5f7fa;
  padding: 24px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
