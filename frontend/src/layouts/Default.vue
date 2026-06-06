<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="layout-aside">
      <div class="logo">
        <h2>仓库履约系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="layout-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        
        <el-sub-menu index="order">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/orders">订单列表</el-menu-item>
          <el-menu-item index="/orders/create" v-if="userStore.hasPermission('order.create')">新建订单</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="picking" v-if="userStore.hasPermission('picking.view')">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>拣货管理</span>
          </template>
          <el-menu-item index="/picking">拣货列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="return" v-if="userStore.hasPermission('return.view')">
          <template #title>
            <el-icon><RefreshLeft /></el-icon>
            <span>退货管理</span>
          </template>
          <el-menu-item index="/returns">退货列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="base" v-if="userStore.hasPermission('customer.view') || userStore.hasPermission('product.view')">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>基础资料</span>
          </template>
          <el-menu-item index="/customers" v-if="userStore.hasPermission('customer.view')">客户管理</el-menu-item>
          <el-menu-item index="/products" v-if="userStore.hasPermission('product.view')">商品管理</el-menu-item>
          <el-menu-item index="/locations" v-if="userStore.hasPermission('location.view')">仓位管理</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="finance" v-if="userStore.hasPermission('debt.view') || userStore.hasPermission('statement.view')">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>财务管理</span>
          </template>
          <el-menu-item index="/debts" v-if="userStore.hasPermission('debt.view')">欠款管理</el-menu-item>
          <el-menu-item index="/statements" v-if="userStore.hasPermission('statement.view')">对账单</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/audit" v-if="userStore.hasPermission('audit.view')">
          <el-icon><DocumentCopy /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
        
        <el-menu-item index="/import-export" v-if="userStore.hasPermission('import_export.view')">
          <el-icon><Download /></el-icon>
          <span>导入导出</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.userInfo?.name }}
              <el-icon><ArrowDown /></el-icon>
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
      
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    name: item.meta.title || item.name,
  }))
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await userStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人信息页面开发中')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  overflow: hidden;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    
    h2 {
      margin: 0;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .layout-menu {
    border: none;
    height: calc(100vh - 60px);
    overflow-y: auto;
  }
}

.layout-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #606266;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
