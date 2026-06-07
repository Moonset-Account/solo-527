
<template>
  <div class="simple-test">
    <h1>测试页面</h1>
    <p>如果能看到这个页面，说明基础框架正常工作。</p>
    <div v-if="dataLoaded">
      <p>注册数: {{ registrationCount }}</p>
      <p>事件数: {{ incidentCount }}</p>
    </div>
    <div v-else>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { mockData } from '@/data/mockData'

const dataLoaded = ref(false)
const registrationCount = ref(0)
const incidentCount = ref(0)

onMounted(() => {
  try {
    console.log('mockData:', mockData)
    registrationCount.value = mockData.registrations.length
    incidentCount.value = mockData.incidents.length
    dataLoaded.value = true
  } catch (error) {
    console.error('Error loading data:', error)
  }
})
</script>

<style scoped>
.simple-test {
  padding: 40px;
  font-family: Arial, sans-serif;
}
</style>
