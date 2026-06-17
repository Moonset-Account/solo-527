<template>
  <div class="not-found-page">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="message">页面不存在</p>
      <p class="description">您访问的页面可能已被删除或链接错误</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;

  .content {
    text-align: center;

    .code {
      font-size: 120px;
      font-weight: 700;
      color: #409eff;
      margin: 0;
      line-height: 1;
    }

    .message {
      font-size: 24px;
      color: #303133;
      margin: 20px 0 10px;
    }

    .description {
      color: #909399;
      margin-bottom: 30px;
    }
  }
}
</style>
