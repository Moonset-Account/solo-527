<template>
  <div class="not-found">
    <div class="content">
      <div class="code">404</div>
      <div class="title">页面未找到</div>
      <div class="desc">您访问的页面不存在或已被移除</div>
      <el-button type="primary" @click="goBack">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.replace('/')
}
</script>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  
  .content {
    text-align: center;
    
    .code {
      font-size: 120px;
      font-weight: bold;
      color: #409eff;
      line-height: 1;
    }
    
    .title {
      font-size: 24px;
      color: #303133;
      margin: 20px 0 10px;
    }
    
    .desc {
      font-size: 14px;
      color: #909399;
      margin-bottom: 30px;
    }
  }
}
</style>
