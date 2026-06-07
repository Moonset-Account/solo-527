<template>
  <div class="update-time-banner" :class="{ stale: isStale }">
    <span class="banner-icon">{{ isStale ? '🔴' : '🟢' }}</span>
    <span v-if="updateTime">数据更新时间: {{ formattedTime }}</span>
    <span v-else>正在获取数据更新时间...</span>
    <span v-if="isStale" class="stale-warning">（数据已过期，超过1小时未更新）</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../utils/api'
import { formatDatetime } from '../utils/format'

const updateTime = ref(null)
let timer = null

const formattedTime = computed(() => formatDatetime(updateTime.value))

const isStale = computed(() => {
  if (!updateTime.value) return false
  const diff = Date.now() - new Date(updateTime.value).getTime()
  return diff > 3600000
})

async function fetchStatus() {
  try {
    const res = await api.get('/etl/status')
    updateTime.value = res.data?.last_updated || res.data?.updated_at || res.updated_at || null
  } catch {
    updateTime.value = null
  }
}

onMounted(() => {
  fetchStatus()
  timer = setInterval(fetchStatus, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
