<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #304156">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 700; border-bottom: 1px solid #3a4a5e">
        骑手时效分析器
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>看板</span>
        </el-menu-item>
        <el-sub-menu index="orders">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>接单管理</span>
          </template>
          <el-menu-item index="/orders/accept">接单</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="timeliness">
          <template #title>
            <el-icon><Timer /></el-icon>
            <span>时效分析</span>
          </template>
          <el-menu-item index="/timeliness/analysis">超时节点</el-menu-item>
          <el-menu-item index="/timeliness/fulfillment">履约数据</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常记录</span>
        </el-menu-item>
        <el-menu-item index="/batch">
          <el-icon><Upload /></el-icon>
          <span>批量操作</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="height: 60px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e6e6e6; background: #fff">
        <span style="font-size: 16px; font-weight: 600; color: #303133">{{ currentTitle }}</span>
        <div style="display: flex; align-items: center; gap: 12px">
          <el-tag type="info" size="small">同城配送系统</el-tag>
        </div>
      </el-header>
      <el-main style="background-color: #f0f2f5; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => {
  if (route.path.startsWith('/orders/route') || route.path.startsWith('/orders/todo')) {
    return '/orders/accept'
  }
  return route.path
})

const currentTitle = computed(() => route.meta?.title || '同城骑手时效分析器')
</script>

<style scoped>
.el-aside {
  overflow-y: auto;
}

.el-menu-item.is-active {
  background-color: #263445 !important;
}
</style>
