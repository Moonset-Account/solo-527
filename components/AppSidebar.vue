<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-icon">🚚</span>
      <span class="logo-text">青禾配送</span>
    </div>

    <nav class="sidebar-nav">
      <div v-for="group in menuGroups" :key="group.title" class="nav-group">
        <div v-if="group.title" class="nav-group-title">{{ group.title }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface MenuItem {
  path: string
  label: string
  icon: string
  badge?: string
}

interface MenuGroup {
  title?: string
  items: MenuItem[]
}

const menuGroups = ref<MenuGroup[]>([
  {
    items: [
      { path: '/', label: '工作台', icon: '📊' },
    ],
  },
  {
    title: '订单管理',
    items: [
      { path: '/orders', label: '订单列表', icon: '📋' },
      { path: '/orders/pending', label: '待接单', icon: '⏳', badge: '新' },
    ],
  },
  {
    title: '调度管理',
    items: [
      { path: '/dispatch', label: '调度中心', icon: '🎯' },
      { path: '/riders', label: '骑手管理', icon: '🏍️' },
      { path: '/routes', label: '路线规划', icon: '🗺️' },
    ],
  },
  {
    title: '监控中心',
    items: [
      { path: '/tracking', label: '轨迹回放', icon: '📍' },
      { path: '/temperature', label: '温控监控', icon: '🌡️' },
      { path: '/alerts', label: '告警中心', icon: '🔔', badge: '!' },
    ],
  },
  {
    title: '运营管理',
    items: [
      { path: '/claims', label: '赔付工单', icon: '💰' },
      { path: '/reports', label: '安全报表', icon: '📑' },
      { path: '/exceptions', label: '异常日志', icon: '⚠️' },
    ],
  },
  {
    title: '工单中心',
    items: [
      { path: '/processing', label: '处理视图', icon: '📌' },
    ],
  },
])
</script>

<style lang="scss" scoped>
.sidebar {
  width: $sidebar-width;
  height: 100vh;
  background: #001529;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-logo {
  height: $header-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-title {
  padding: 8px 20px 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: all 0.2s;
  gap: 10px;
  position: relative;
  text-decoration: none;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
  }

  &.active {
    color: #fff;
    background: $primary;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #fff;
    }
  }

  .nav-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }

  .nav-label {
    flex: 1;
    font-size: 14px;
  }

  .nav-badge {
    background: $error;
    color: #fff;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 500;
  }
}
</style>
