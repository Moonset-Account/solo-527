<script setup>
import { ref, onMounted } from 'vue'
import { getElderDetail } from '../../api'

const conflicts = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getElderDetail('dietary-conflicts')
    conflicts.value = res
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">饮食冲突预警</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!conflicts.length" class="empty-state">暂无饮食冲突</div>
    <div v-else class="conflict-list">
      <div v-for="c in conflicts" :key="c.id" class="conflict-card alert">
        <div class="conflict-header">
          <span class="elder-name">{{ c.elder_name }}</span>
          <span class="conflict-level">{{ c.level }}</span>
        </div>
        <div class="conflict-detail">
          <p>禁忌：{{ c.restriction }}</p>
          <p>冲突餐品：{{ c.conflict_item }}</p>
          <p>建议替代：{{ c.suggestion }}</p>
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
.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.conflict-card {
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #cf1322;
  background: #fff2f0;
}
.conflict-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.elder-name {
  font-weight: 600;
  color: #1a3a5c;
}
.conflict-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #cf1322;
  color: #fff;
}
.conflict-detail p {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}
</style>
