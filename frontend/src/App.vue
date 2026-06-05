<script setup>
import { computed } from 'vue'
import { useAppStore } from './stores/app'

const store = useAppStore()

const stationMenus = [
  { path: '/station/overview', label: '路线总览' },
  { path: '/station/building', label: '楼栋概览' },
  { path: '/station/meal-count', label: '餐量统计' },
  { path: '/station/dietary', label: '饮食冲突' },
  { path: '/station/cold-box', label: '保温箱异常' },
  { path: '/station/unsigned', label: '未签收列表' },
  { path: '/station/elders', label: '长者管理' },
  { path: '/station/subsidy', label: '补贴核查' },
  { path: '/station/reconciliation', label: '对账管理' },
  { path: '/station/notifications', label: '通知管理' },
  { path: '/station/review', label: '审核任务' }
]

const courierMenus = [
  { path: '/courier/routes', label: '配送路线' },
  { path: '/courier/deliveries', label: '今日配送' },
  { path: '/courier/unsigned', label: '待签收' }
]

const menus = computed(() => store.mode === 'station' ? stationMenus : courierMenus)
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">长者助餐</h1>
        <p class="app-subtitle">社区配送平台</p>
      </div>
      <div class="mode-switch">
        <button
          :class="['mode-btn', { active: store.mode === 'station' }]"
          @click="store.setMode('station')"
        >站长端</button>
        <button
          :class="['mode-btn', { active: store.mode === 'courier' }]"
          @click="store.setMode('courier')"
        >配送员端</button>
      </div>
      <nav class="nav-menu">
        <router-link
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >{{ item.label }}</router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <span class="page-title">{{ $route.meta.title || '' }}</span>
        <div class="top-bar-right">
          <span v-if="store.loading" class="loading-indicator">加载中...</span>
        </div>
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>



<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: #f0f2f5;
  color: #333;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1a3a5c 0%, #0d2137 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.app-subtitle {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.mode-switch {
  display: flex;
  padding: 12px 16px;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #e8912d;
  border-color: #e8912d;
  color: #fff;
  font-weight: 600;
}

.mode-btn:hover:not(.active) {
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: block;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item--active {
  background: rgba(232, 145, 45, 0.2);
  color: #e8912d;
  font-weight: 500;
}

.nav-item--active:hover {
  background: rgba(232, 145, 45, 0.25);
  color: #e8912d;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
}

.loading-indicator {
  font-size: 13px;
  color: #e8912d;
}

.page-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}
</style>
