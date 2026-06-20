<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="logo">汽车养护管理系统</div>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="user-name">
            <el-icon><User /></el-icon>
            管理员
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/detection">
            <el-icon><Search /></el-icon>
            <span>检测项目</span>
          </el-menu-item>
          <el-menu-item index="/package">
            <el-icon><Box /></el-icon>
            <span>套餐管理</span>
          </el-menu-item>
          <el-menu-item index="/repair">
            <el-icon><Tools /></el-icon>
            <span>维修管理</span>
          </el-menu-item>
          <el-menu-item index="/trace">
            <el-icon><Document /></el-icon>
            <span>溯源查询</span>
          </el-menu-item>
          <el-menu-item index="/report">
            <el-icon><DataAnalysis /></el-icon>
            <span>经营报表</span>
          </el-menu-item>
          <el-menu-item index="/system">
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    console.log('退出登录')
  }
}

const handleMenuSelect = (index) => {
  console.log('选择菜单:', index)
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #409eff;
  color: #fff;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  .user-name {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
}

.aside {
  background-color: #304156;
}

.menu {
  border-right: none;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
