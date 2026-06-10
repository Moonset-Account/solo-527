<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>页面不存在</p>
      <el-button type="primary" @click="$router.replace('/dashboard')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.content {
  text-align: center;
}
h1 {
  font-size: 120px;
  margin: 0;
  color: #2ab99f;
  line-height: 1;
}
p {
  font-size: 18px;
  color: #606266;
  margin: 20px 0 30px;
}
</style>
