<template>
  <div class="customer-layout">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-text">美甲预约</span>
        </div>
        <nav class="nav">
          <router-link to="/customer/appointment" class="nav-item">
            <el-icon><Calendar /></el-icon>
            <span>在线预约</span>
          </router-link>
          <router-link to="/customer/services" class="nav-item">
            <el-icon><Goods /></el-icon>
            <span>服务项目</span>
          </router-link>
          <router-link to="/customer/technicians" class="nav-item">
            <el-icon><User /></el-icon>
            <span>技师团队</span>
          </router-link>
          <router-link to="/customer/my-appointments" class="nav-item">
            <el-icon><Tickets /></el-icon>
            <span>我的预约</span>
          </router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>© 2024 美甲店预约系统</p>
    </footer>
  </div>
</template>

<script setup>
import { Calendar, Goods, User, Tickets } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.customer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    height: 64px;
  }

  .logo {
    font-size: 24px;
    font-weight: bold;
    color: #e91e63;
    margin-right: 40px;

    .logo-text {
      background: linear-gradient(135deg, #e91e63, #ff6090);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .nav {
    display: flex;
    gap: 8px;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 20px;
      height: 64px;
      color: #666;
      text-decoration: none;
      transition: all 0.3s;
      font-size: 14px;

      &:hover {
        color: #e91e63;
      }

      &.router-link-active {
        color: #e91e63;
        border-bottom: 2px solid #e91e63;
      }
    }
  }
}

.main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.footer {
  background: #fff;
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 12px;

  p {
    margin: 0;
  }
}
</style>
