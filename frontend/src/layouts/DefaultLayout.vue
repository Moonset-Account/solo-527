<template>
  <el-container class="default-layout">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <SidebarMenu />
    </el-aside>
    <el-container>
      <el-header class="header">
        <Navbar />
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores'
import SidebarMenu from './components/SidebarMenu.vue'
import Navbar from './components/Navbar.vue'

const appStore = useAppStore()
</script>

<style scoped>
.default-layout {
  width: 100%;
  height: 100%;
}

.sidebar {
  background-color: #304156;
  transition: width 0.28s;
  overflow: hidden;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  align-items: center;
  height: 60px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
