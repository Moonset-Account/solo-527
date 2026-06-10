<template>
  <div>
    <template v-if="authStore.isCandidate">
      <n-card title="欢迎回来，{{ authStore.user?.full_name || authStore.user?.username }}">
        <p>查看最新校招职位，投递你的理想岗位。</p>
        <n-button type="primary" @click="navigateTo('/positions')">
          浏览职位
        </n-button>
      </n-card>
      <n-grid :cols="2" :x-gap="20" style="margin-top: 20px">
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-value">{{ myApps.length }}</div>
              <div class="stat-label">我的投递</div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-value">{{ interviewCount }}</div>
              <div class="stat-label">待面试</div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </template>
    <template v-else>
      <redirect to="/dashboard" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import api from '~/utils/api'
import type { Application } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const authStore = useAuthStore()
const myApps = ref<Application[]>([])
const interviewCount = ref(0)

onMounted(async () => {
  if (authStore.isCandidate) {
    try {
      const res = await api.get('/applications/my')
      myApps.value = res.data
    } catch (e) {
      // ignore
    }
  }
})
</script>

<style scoped>
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #18a058;
}
.stat-label {
  color: #999;
  margin-top: 8px;
}
</style>
