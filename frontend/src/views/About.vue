<template>
  <div class="about-page">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="info-card">
          <div class="avatar-section">
            <el-avatar :size="100" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
            <h3 class="name">{{ userStore.userInfo.nickname || '超级管理员' }}</h3>
            <p class="role">系统管理员</p>
          </div>
          <el-divider />
          <div class="info-list">
            <div class="info-item">
              <el-icon color="#409EFF"><User /></el-icon>
              <span class="label">用户名</span>
              <span class="value">{{ userStore.userInfo.username || 'admin' }}</span>
            </div>
            <div class="info-item">
              <el-icon color="#67C23A"><Message /></el-icon>
              <span class="label">邮箱</span>
              <span class="value">admin@example.com</span>
            </div>
            <div class="info-item">
              <el-icon color="#E6A23C"><Phone /></el-icon>
              <span class="label">手机号</span>
              <span class="value">138****8888</span>
            </div>
            <div class="info-item">
              <el-icon color="#F56C6C"><Location /></el-icon>
              <span class="label">部门</span>
              <span class="value">技术部</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">项目信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目名称">Vue3 Admin</el-descriptions-item>
            <el-descriptions-item label="版本号">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="Vue 版本">3.4.21</el-descriptions-item>
            <el-descriptions-item label="Vite 版本">5.2.6</el-descriptions-item>
            <el-descriptions-item label="UI 框架">Element Plus 2.6.3</el-descriptions-item>
            <el-descriptions-item label="状态管理">Pinia 2.1.7</el-descriptions-item>
            <el-descriptions-item label="路由">Vue Router 4.3.0</el-descriptions-item>
            <el-descriptions-item label="图表库">ECharts 5.5.0</el-descriptions-item>
            <el-descriptions-item label="HTTP 请求">Axios 1.6.8</el-descriptions-item>
            <el-descriptions-item label="开发端口">5173</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span class="card-title">技术栈说明</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in techStack"
              :key="index"
              :timestamp="item.title"
              :color="item.color"
              :type="item.type"
              placement="top"
            >
              <el-card shadow="never">
                <h4>{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores'

const userStore = useUserStore()

const techStack = [
  {
    title: 'Vue 3',
    desc: '使用 Composition API 和 Script Setup 语法，提供更好的类型支持和更灵活的代码组织方式。',
    color: '#409EFF',
    type: 'primary'
  },
  {
    title: 'Vite',
    desc: '新一代前端构建工具，基于原生 ES 模块提供极速的冷启动和热更新体验。',
    color: '#67C23A',
    type: 'success'
  },
  {
    title: 'TypeScript',
    desc: 'JavaScript 的超集，提供静态类型检查，有助于提高代码质量和可维护性。',
    color: '#E6A23C',
    type: 'warning'
  },
  {
    title: 'Element Plus',
    desc: '基于 Vue 3 的组件库，提供丰富的 UI 组件和中文本地化支持。',
    color: '#F56C6C',
    type: 'danger'
  },
  {
    title: 'Pinia',
    desc: 'Vue 3 官方推荐的状态管理库，支持 TypeScript、热更新和状态持久化。',
    color: '#909399',
    type: 'info'
  },
  {
    title: 'ECharts',
    desc: '百度开源的数据可视化图表库，提供丰富的图表类型和强大的交互能力。',
    color: '#409EFF',
    type: 'primary'
  }
]
</script>

<style scoped>
.info-card {
  text-align: center;
}

.avatar-section {
  padding: 20px 0;
}

.name {
  margin: 12px 0 4px;
  font-size: 20px;
  color: #303133;
}

.role {
  font-size: 14px;
  color: #909399;
}

.info-list {
  padding: 0 10px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
}

.info-item .label {
  width: 80px;
  color: #909399;
  margin-left: 10px;
}

.info-item .value {
  flex: 1;
  color: #303133;
  text-align: right;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

:deep(.el-timeline-item__content) {
  padding-left: 0;
}

:deep(.el-timeline-item__card) {
  margin: 0;
}

h4 {
  margin-bottom: 8px;
  color: #303133;
}

p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
