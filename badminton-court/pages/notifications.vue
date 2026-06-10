<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between">
      <h3 class="font-semibold">通知中心</h3>
      <div class="flex gap-2">
        <select v-model="filter.type" class="input !w-auto" @change="loadList">
          <option value="">全部类型</option>
          <option value="DEVICE_FAULT">设备故障</option>
          <option value="PAYMENT_SUCCESS">支付</option>
          <option value="BOOKING_CONFIRM">预约</option>
          <option value="SYSTEM_NOTICE">系统</option>
        </select>
        <button class="btn-secondary" @click="markAllRead">全部已读</button>
      </div>
    </div>

    <div class="space-y-2">
      <div v-for="n in list" :key="n.id"
        class="card p-4 cursor-pointer hover:shadow-md transition"
        :class="!n.isRead ? 'border-l-4 border-primary-300' : ''"
        @click="handleClick(n)">
        <div class="flex items-start gap-4">
          <div class="text-2xl">{{ notifIcon(n.type) }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-medium" :class="!n.isRead ? 'text-gray-800' : 'text-gray-500'">{{ n.title }}</div>
                <div class="text-sm text-gray-600 mt-0.5">{{ n.content }}</div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="n.canDownload" class="badge bg-blue-100 text-blue-700">📥 可下载</span>
                <span class="badge" :class="notifTypeClass(n.type)">{{ notifTypeText(n.type) }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(n.createdAt, 'MM-DD HH:mm') }}</span>
              </div>
            </div>
            <div v-if="n.canDownload && n.downloadId" class="mt-3 pt-3 border-t flex justify-end">
              <button class="btn-primary !py-1.5 !text-xs" @click.stop="downloadFile(n)">📥 下载附件</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!list.length" class="card p-16 text-center text-gray-400">
        <div class="text-5xl mb-3">🔔</div>
        <div>暂无通知</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
const { get, put } = useApi()
const router = useRouter()
const filter = reactive({ type: '' })
const list = ref<any[]>([])

function notifIcon(t: string) {
  return { BOOKING_CONFIRM: '📅', BOOKING_REMIND: '⏰', PAYMENT_SUCCESS: '💵', DEVICE_FAULT: '🔧', TOURNAMENT_NOTICE: '🏆', SYSTEM_NOTICE: '📢' }[t] || '📢'
}
function notifTypeClass(t: string) {
  return { PAYMENT_SUCCESS: 'bg-green-100 text-green-700', DEVICE_FAULT: 'bg-red-100 text-red-700', BOOKING_CONFIRM: 'bg-blue-100 text-blue-700', TOURNAMENT_NOTICE: 'bg-purple-100 text-purple-700', SYSTEM_NOTICE: 'bg-gray-100 text-gray-700' }[t] || 'bg-gray-100 text-gray-700'
}
function notifTypeText(t: string) {
  return { BOOKING_CONFIRM: '预约', BOOKING_REMIND: '提醒', PAYMENT_SUCCESS: '支付', DEVICE_FAULT: '设备', TOURNAMENT_NOTICE: '赛事', SYSTEM_NOTICE: '系统' }[t] || t
}

async function loadList() {
  try {
    const r = await get('/api/notifications', { ...filter, pageSize: 50 })
    if (r.code === 0) list.value = r.data.list
  } catch {}
}

async function handleClick(n: any) {
  if (!n.isRead) {
    try { await put('/api/notifications', { id: n.id }) } catch {}
    loadList()
  }
  if (n.relatedType === 'Booking' && n.relatedId) router.push('/todos?type=booking')
  else if (n.relatedType === 'DeviceFault' && n.relatedId) router.push('/devices/faults')
  else if (n.relatedType === 'DownloadTask' && n.canDownload) downloadFile(n)
}

async function downloadFile(n: any) {
  try {
    const r = await get('/api/downloads')
    if (r.code === 0) {
      const list = r.data.list || r.data
      const dl = list.find((d: any) => d.id === n.downloadId)
      if (dl?.fileUrl) window.open(dl.fileUrl, '_blank')
    }
  } catch {}
}

async function markAllRead() {
  try { await put('/api/notifications', { markAll: true }); loadList() } catch {}
}

onMounted(loadList)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
