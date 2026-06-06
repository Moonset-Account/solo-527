<template>
  <el-config-provider :locale="zhCn">
    <div id="app-wrapper">
      <router-view v-if="!loading" />
      <div v-else class="loading-container">
        <el-icon class="is-loading" :size="48"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAuthStore } from '@/stores/auth'
import { Loading } from '@element-plus/icons-vue'

const loading = ref(true)
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.initAuth()
  } catch (e) {
    console.error('Auth init error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style>
#app-wrapper {
  min-height: 100vh;
  background: #f5f7fa;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
