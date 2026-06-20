<template>
  <div class="not-found">
    <el-result
      status="404"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
      :extra="extraButton"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const router = useRouter();

const extraButton = [
  h(
    ElButton,
    { type: 'primary', onClick: () => router.push('/dashboard') },
    { default: () => '返回首页' }
  ),
];
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
</style>
