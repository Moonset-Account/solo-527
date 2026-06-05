<script setup>
import { ref, onMounted } from 'vue'
import { getAbnormalColdBoxes, updateColdBoxTemp } from '../../api'

const boxes = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    boxes.value = await getAbnormalColdBoxes()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function handleUpdateTemp(box) {
  const temp = prompt('请输入新温度(℃):')
  if (temp === null) return
  try {
    await updateColdBoxTemp(box.id, { temperature: parseFloat(temp) })
    await loadData()
  } catch (e) {
    alert('更新失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">保温箱温度异常</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!boxes.length" class="empty-state">暂无异常保温箱</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>箱号</th>
          <th>当前温度</th>
          <th>标准范围</th>
          <th>异常时长</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in boxes" :key="b.id">
          <td>{{ b.box_no }}</td>
          <td class="temp-abnormal">{{ b.temperature }}℃</td>
          <td>{{ b.temp_min }}℃ ~ {{ b.temp_max }}℃</td>
          <td>{{ b.abnormal_duration }}</td>
          <td>
            <button class="action-btn" @click="handleUpdateTemp(b)">更新温度</button>
          </td>
        </tr>
      </tbody>
    </table>
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
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
}
.temp-abnormal {
  color: #cf1322;
  font-weight: 600;
}
.action-btn {
  padding: 4px 12px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #fff;
  color: #e8912d;
  font-size: 13px;
  cursor: pointer;
}
.action-btn:hover {
  background: #e8912d;
  color: #fff;
}
</style>
