<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h3>页面未找到</h3>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  text-align: center;
}

.content h1 {
  font-size: 120px;
  margin: 0;
  color: #409eff;
  font-weight: 700;
}

.content h3 {
  font-size: 24px;
  margin: 20px 0 10px;
  color: #303133;
}

.content p {
  color: #909399;
  margin-bottom: 30px;
}
</style>
