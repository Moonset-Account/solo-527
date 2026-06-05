<script setup>
import { ref, onMounted } from 'vue'
import { getTodayRoutes, getCourierDeliveries, signDelivery, failDelivery, updateExceptionNote } from '../../api'

const routes = ref([])
const deliveries = ref([])
const loading = ref(false)
const currentCourierId = ref(null)
const currentRouteId = ref(null)
const noteVisible = ref(null)
const noteText = ref('')
const failVisible = ref(null)
const failNote = ref('')
const photoInput = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    routes.value = await getTodayRoutes()
    if (routes.value.length > 0 && routes.value[0].courier_id) {
      currentCourierId.value = routes.value[0].courier_id
      currentRouteId.value = routes.value[0].id
      await loadDeliveries()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function selectRouteAndLoad(route) {
  currentCourierId.value = route.courier_id
  currentRouteId.value = route.id
  await loadDeliveries()
}

async function loadDeliveries() {
  if (!currentCourierId.value || !currentRouteId.value) return
  loading.value = true
  try {
    deliveries.value = await getCourierDeliveries(currentCourierId.value, currentRouteId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleSign(item) {
  try {
    const formData = new FormData()
    if (photoInput.value?.files?.[0]) {
      formData.append('photo', photoInput.value.files[0])
    }
    await signDelivery(item.id, formData)
    await loadDeliveries()
  } catch (e) {
    alert('签收失败: ' + e.message)
  }
}

function openFail(item) {
  failVisible.value = item.id
  failNote.value = ''
}

async function confirmFail(item) {
  try {
    await failDelivery(item.id, { exception_note: failNote.value || '配送失败' })
    failVisible.value = null
    await loadDeliveries()
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
    await updateExceptionNote(item.id, { exception_note: noteText.value })
    noteVisible.value = null
    await loadDeliveries()
  } catch (e) {
    alert('保存失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">今日配送</h2>

    <div v-if="!currentCourierId" class="route-select">
      <p class="hint">请选择路线开始配送</p>
      <div v-for="r in routes" :key="r.id" class="route-pick" @click="selectRouteAndLoad(r)">
        <span>{{ r.name }}</span>
        <span class="courier-name">{{ r.courier_name || '未分配' }}</span>
      </div>
    </div>

    <template v-else>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!deliveries.length" class="empty-state">暂无配送任务</div>
      <div v-else class="delivery-list">
        <div v-for="d in deliveries" :key="d.id" class="delivery-card">
          <div class="delivery-header">
            <span class="elder-name">{{ d.elder_name }}</span>
            <span :class="['status-tag', d.status]">{{ d.status === 'pending' ? '待签收' : d.status === 'signed' ? '已签收' : '失败' }}</span>
          </div>
          <div class="delivery-body">
            <div class="delivery-info"><span class="info-label">地址：</span>{{ d.elder_building }} {{ d.elder_room }}</div>
            <div class="delivery-info"><span class="info-label">电话：</span>{{ d.elder_phone_masked }}</div>
          </div>

          <div v-if="noteVisible === d.id" class="note-edit">
            <textarea v-model="noteText" placeholder="输入异常备注..." class="note-input"></textarea>
            <div class="note-actions">
              <button class="btn-sm btn-primary" @click="saveNote(d)">保存</button>
              <button class="btn-sm" @click="noteVisible = null">取消</button>
            </div>
          </div>

          <div v-if="failVisible === d.id" class="note-edit">
            <textarea v-model="failNote" placeholder="请输入配送失败原因..." class="note-input"></textarea>
            <div class="note-actions">
              <button class="btn-sm btn-danger" @click="confirmFail(d)">确认失败</button>
              <button class="btn-sm" @click="failVisible = null">取消</button>
            </div>
          </div>

          <div v-if="!noteVisible && !failVisible" class="delivery-actions">
            <template v-if="d.status === 'pending'">
              <input ref="photoInput" type="file" accept="image/*" class="photo-input" />
              <button class="btn-sign" @click="handleSign(d)">签收</button>
              <button class="btn-fail" @click="openFail(d)">配送失败</button>
            </template>
            <button class="btn-note" @click="openNote(d)">异常备注</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-card { background: #fff; border-radius: 8px; padding: 24px; }
.card-title { font-size: 16px; font-weight: 600; color: #1a3a5c; margin-bottom: 16px; }
.empty-state { text-align: center; padding: 40px 0; color: #999; font-size: 14px; }
.hint { font-size: 14px; color: #666; margin-bottom: 12px; }
.route-select { display: flex; flex-direction: column; gap: 8px; }
.route-pick { display: flex; justify-content: space-between; padding: 12px 16px; background: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0; cursor: pointer; font-size: 14px; }
.route-pick:hover { border-color: #e8912d; }
.courier-name { color: #999; }
.delivery-list { display: flex; flex-direction: column; gap: 12px; }
.delivery-card { background: #fafafa; border-radius: 8px; padding: 16px; border: 1px solid #f0f0f0; }
.delivery-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.elder-name { font-weight: 600; color: #1a3a5c; }
.status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.signed { background: #f6ffed; color: #389e0d; }
.status-tag.failed { background: #fff2f0; color: #cf1322; }
.delivery-body { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.delivery-info { font-size: 13px; color: #666; }
.info-label { color: #999; }
.delivery-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.photo-input { font-size: 12px; }
.btn-sign { padding: 4px 16px; border: 1px solid #389e0d; border-radius: 4px; background: #f6ffed; color: #389e0d; font-size: 13px; cursor: pointer; }
.btn-sign:hover { background: #389e0d; color: #fff; }
.btn-fail { padding: 4px 16px; border: 1px solid #cf1322; border-radius: 4px; background: #fff2f0; color: #cf1322; font-size: 13px; cursor: pointer; }
.btn-fail:hover { background: #cf1322; color: #fff; }
.btn-note { padding: 4px 16px; border: 1px solid #e8912d; border-radius: 4px; background: #fff; color: #e8912d; font-size: 13px; cursor: pointer; }
.btn-note:hover { background: #e8912d; color: #fff; }
.note-edit { margin-top: 8px; }
.note-input { width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; resize: vertical; min-height: 60px; outline: none; }
.note-input:focus { border-color: #e8912d; }
.note-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn-sm { padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; font-size: 13px; cursor: pointer; }
.btn-sm.btn-primary { background: #e8912d; border-color: #e8912d; color: #fff; }
.btn-sm.btn-danger { background: #cf1322; border-color: #cf1322; color: #fff; }
</style>
