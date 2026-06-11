<template>
  <div class="not-found">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="title">页面不存在</p>
      <p class="desc">抱歉，您访问的页面不存在或已被移除。</p>
      <div class="actions">
        <el-button type="primary" :icon="House" @click="goHome">返回首页</el-button>
        <el-button :icon="Back" @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { House, Back } from '@element-plus/icons-vue'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.not-found {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.content {
  text-align: center;
}

.code {
  font-size: 160px;
  font-weight: 700;
  color: #409EFF;
  line-height: 1;
  margin: 0;
  text-shadow: 4px 4px 0 rgba(64, 158, 255, 0.1);
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}

.desc {
  font-size: 16px;
  color: #909399;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
