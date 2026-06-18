<template>
  <div class="error-page">
    <div class="error-box">
      <div class="error-code">404</div>
      <div class="error-title">页面不存在</div>
      <div class="error-desc">抱歉，您访问的页面不存在或已被移除</div>
      <el-button type="primary" size="large" @click="router.back()">
        返回上一页
      </el-button>
      <el-button size="large" @click="router.replace('/dashboard')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style lang="scss" scoped>
.error-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
}

.error-box {
  text-align: center;

  .error-code {
    font-size: 120px;
    font-weight: 700;
    color: $primary-color;
    line-height: 1;
    margin-bottom: 24px;
  }

  .error-title {
    font-size: 28px;
    color: $text-primary;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .error-desc {
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 32px;
  }

  .el-button + .el-button {
    margin-left: 12px;
  }
}
</style>
