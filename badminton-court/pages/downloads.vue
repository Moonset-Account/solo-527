<template>
  <div class="space-y-5">
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <h3 class="font-semibold">下载中心</h3>
      <div class="flex gap-2 flex-wrap">
        <button v-for="e in exportTypes" :key="e.t" class="btn-secondary !py-1.5 text-xs" @click="requestExport(e)">{{ e.icon }} 导出{{ e.label }}</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th class="text-left px-4 py-3">文件名</th>
            <th class="text-left px-4 py-3">类型</th>
            <th class="text-left px-4 py-3">状态</th>
            <th class="text-right px-4 py-3">创建时间</th>
            <th class="text-left px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="d in list" :key="d.id" class="hover:bg-gray-50/50">
            <td class="px-4 py-3">
              <span class="font-medium">{{ d.name }}</span>
              <span class="text-xs text-gray-400 ml-2 font-mono">{{ d.taskNo }}</span>
            </td>
            <td class="px-4 py-3"><span class="badge" :class="typeClass(d.type)">{{ typeName(d.type) }}</span></td>
            <td class="px-4 py-3">
              <span class="badge" :class="statusClass(d.status)">{{ statusText(d.status) }}</span>
              <span v-if="d.errorMsg" class="text-xs text-red-500 ml-2">{{ d.errorMsg }}</span>
            </td>
            <td class="px-4 py-3 text-right text-xs text-gray-500">
              {{ formatDate(d.createdAt, 'YYYY-MM-DD HH:mm') }}
              <div v-if="d.expireAt" class="mt-1">有效期至 {{ formatDate(d.expireAt, 'MM-DD') }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <a v-if="d.status==='READY' && d.fileUrl" :href="d.fileUrl" target="_blank"
                  class="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">📥 下载</a>
                <button v-if="d.status==='READY'" @click="requestAgain(d)" class="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition">🔄 重新生成</button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length"><td colspan="5" class="text-center text-gray-400 py-12">暂无下载任务，点击上方按钮开始导出</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { get, post } = useApi()
const list = ref<any[]>([])

const exportTypes = [
  { t: 'bookings', label: '预约数据', icon: '📅' },
  { t: 'checkins', label: '签到记录', icon: '✋' },
  { t: 'tournaments', label: '赛事数据', icon: '🏆' },
  { t: 'capacity', label: '教练产能', icon: '📈' },
  { t: 'revenue', label: '收入流水', icon: '💵' },
  { t: 'faults', label: '设备故障', icon: '🔧' }
]

function typeClass(t: string) {
  return { bookings: 'bg-blue-100 text-blue-700', checkins: 'bg-teal-100 text-teal-700', tournaments: 'bg-purple-100 text-purple-700',
    capacity: 'bg-green-100 text-green-700', revenue: 'bg-yellow-100 text-yellow-700', faults: 'bg-orange-100 text-orange-700' }[t] || 'bg-gray-100 text-gray-700'
}
function typeName(t: string) { return { bookings: '预约', checkins: '签到', tournaments: '赛事', capacity: '教练产能', revenue: '收入流水', faults: '设备故障'}[t] || t }
function statusClass(s: string) {
  return { READY: 'bg-green-100 text-green-700', FAILED: 'bg-red-100 text-red-700', PROCESSING: 'bg-blue-100 text-blue-700', PENDING: 'bg-gray-100 text-gray-700' }[s] || 'bg-gray-100 text-gray-700'
}
function statusText(s: string) { return { READY: '✅ 就绪', PROCESSING: '⏳ 处理中', FAILED: '❌ 失败', PENDING: '⏸ 等待' }[s] || s }

async function loadList() {
  try {
    const r = await get('/api/downloads', { pageSize: 100 })
    if (r.code === 0) list.value = r.data.list || r.data
  } catch {}
}

async function requestExport(e: any) {
  try {
    const r = await post('/api/downloads', { type: e.t, name: `${e.label}-${new Date().toLocaleDateString()}` })
    if (r.code === 0) { alert('任务已提交'); setTimeout(loadList, 1000) } else alert(r.message)
  } catch (e: any) { alert(e.message || '导出失败') }
}

function requestAgain(d: any) {
  const exp = exportTypes.find(x => x.t === d.type)
  if (exp) requestExport(exp)
}

onMounted(loadList)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
