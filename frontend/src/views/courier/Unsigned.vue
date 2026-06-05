<script setup>
import { ref, onMounted } from 'vue'
import { getCourierDeliveries, signDelivery } from '../../api'

const unsignedList = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await getCourierDeliveries()
    unsignedList.value = res.filter(d => d.status === 'pending')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function maskPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

async function handleSign(item) {
  try {
    await signDelivery(item.id, { action: 'sign' })
    await loadData()
  } catch (e) {
    alert('签收失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">待签收</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!unsignedList.length" class="empty-state">全部已签收</div>
    <div v-else class="delivery-list">
      <div v-for="d in unsignedList" :key="d.id" class="delivery-card">
        <div class="delivery-header">
          <span class="elder-name">{{ d.elder_name }}</span>
          <span class="status-pending">待签收</span>
        </div>
        <div class="delivery-body">
          <div class="delivery-info">
            <span class="info-label">地址：</span>{{ d.building }} {{ d.room }}
          </div>
          <div class="delivery-info">
            <span class="info-label">电话：</span>{{ maskPhone(d.phone) }}
          </div>
        </div>
        <div class="delivery-actions">
          <button class="btn-sign" @click="handleSign(d)">确认签收</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 16px;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
.delivery-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.delivery-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}
.delivery-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.elder-name {
  font-weight: 600;
  color: #1a3a5c;
}
.status-pending {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff7e6;
  color: #d48806;
}
.delivery-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.delivery-info {
  font-size: 13px;
  color: #666;
}
.info-label { color: #999; }
.delivery-actions {
  display: flex;
  gap: 8px;
}
.btn-sign {
  padding: 6px 20px;
  border: 1px solid #389e0d;
  border-radius: 6px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 14px;
  cursor: pointer;
}
.btn-sign:hover { background: #389e0d; color: #fff; }
</style>
