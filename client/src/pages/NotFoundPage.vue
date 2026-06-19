<template>
  <div class="not-found">
    <h1 class="code">404</h1>
    <p class="message">页面不存在</p>
    <a-button type="primary" @click="$router.push('/')">返回首页</a-button>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f5f7fa;
}

.code {
  font-size: 72px;
  font-weight: 700;
  color: #165dff;
  margin: 0;
}

.message {
  font-size: 18px;
  color: #595959;
  margin: 0;
}
</style>
