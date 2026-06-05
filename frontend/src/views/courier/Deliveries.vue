<script setup>
import { ref, onMounted } from 'vue'
import { getCourierDeliveries, signDelivery, failDelivery, updateExceptionNote } from '../../api'

const deliveries = ref([])
const loading = ref(false)
const noteVisible = ref(null)
const noteText = ref('')

async function loadData() {
  loading.value = true
  try {
    deliveries.value = await getCourierDeliveries()
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

async function handleFail(item) {
  try {
    await failDelivery(item.id, { action: 'fail' })
    await loadData()
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

function openNote(item) {
  noteVisible.value = item.id
  noteText.value = item.exception_note || ''
}

async function saveNote(item) {
  try {
    await updateExceptionNote(item.id, { note: noteText.value })
    noteVisible.value = null
    await loadData()
  } catch (e) {
    alert('保存失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">今日配送</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!deliveries.length" class="empty-state">暂无配送任务</div>
    <div v-else class="delivery-list">
      <div v-for="d in deliveries" :key="d.id" class="delivery-card">
        <div class="delivery-header">
          <span class="elder-name">{{ d.elder_name }}</span>
          <span :class="['status-tag', d.status]">{{ d.status_label }}</span>
        </div>
        <div class="delivery-body">
          <div class="delivery-info">
            <span class="info-label">地址：</span>{{ d.building }} {{ d.room }}
          </div>
          <div class="delivery-info">
            <span class="info-label">电话：</span>{{ maskPhone(d.phone) }}
          </div>
          <div class="delivery-info">
            <span class="info-label">餐类：</span>{{ d.meal_type }}
          </div>
        </div>
        <div v-if="noteVisible === d.id" class="note-edit">
          <textarea v-model="noteText" placeholder="输入异常备注..." class="note-input"></textarea>
          <div class="note-actions">
            <button class="btn-sm btn-primary" @click="saveNote(d)">保存</button>
            <button class="btn-sm" @click="noteVisible = null">取消</button>
          </div>
        </div>
        <div v-else class="delivery-actions">
          <button v-if="d.status === 'pending'" class="btn-sign" @click="handleSign(d)">签收</button>
          <button v-if="d.status === 'pending'" class="btn-fail" @click="handleFail(d)">配送失败</button>
          <button class="btn-note" @click="openNote(d)">异常备注</button>
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
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.signed { background: #f6ffed; color: #389e0d; }
.status-tag.failed { background: #fff2f0; color: #cf1322; }
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
  padding: 4px 16px;
  border: 1px solid #389e0d;
  border-radius: 4px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 13px;
  cursor: pointer;
}
.btn-sign:hover { background: #389e0d; color: #fff; }
.btn-fail {
  padding: 4px 16px;
  border: 1px solid #cf1322;
  border-radius: 4px;
  background: #fff2f0;
  color: #cf1322;
  font-size: 13px;
  cursor: pointer;
}
.btn-fail:hover { background: #cf1322; color: #fff; }
.btn-note {
  padding: 4px 16px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #fff;
  color: #e8912d;
  font-size: 13px;
  cursor: pointer;
}
.btn-note:hover { background: #e8912d; color: #fff; }
.note-edit {
  margin-top: 8px;
}
.note-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  outline: none;
}
.note-input:focus { border-color: #e8912d; }
.note-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.btn-sm {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.btn-sm.btn-primary {
  background: #e8912d;
  border-color: #e8912d;
  color: #fff;
}
</style>
