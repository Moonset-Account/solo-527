<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="card p-6">
        <h3 class="font-semibold text-lg mb-4">✋ 快速签到核销</h3>
        <div class="space-y-4">
          <div>
            <label class="label">核销码 / 订单号</label>
            <input v-model="code" class="input text-xl !py-4 !text-center tracking-widest font-mono"
              placeholder="请输入6位核销码或订单号" maxlength="20" @keyup.enter="doCheckin" />
          </div>
          <button class="btn-primary w-full !py-3 text-lg" :disabled="!code || loading" @click="doCheckin">
            {{ loading ? '处理中...' : '确认签到' }}
          </button>
          <div v-if="result" class="rounded-xl p-4 text-center"
            :class="result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="text-2xl mb-2">{{ result.ok ? '✅' : '❌' }}</div>
            <div class="font-medium" :class="result.ok ? 'text-green-800' : 'text-red-800'">{{ result.msg }}</div>
            <div v-if="result.ok && result.data" class="mt-3 text-sm text-left bg-white rounded-lg p-3 space-y-1">
              <div class="flex justify-between"><span class="text-gray-500">客户:</span><span>{{ result.data.user?.realName }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">场地:</span><span>{{ result.data.court?.name }}</span></div>
              <div v-if="result.data.booking" class="flex justify-between"><span class="text-gray-500">时段:</span><span>{{ result.data.booking.startTime }} - {{ result.data.booking.endTime }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="font-semibold text-lg mb-4">📝 今日签到概览</h3>
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="bg-blue-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ todayCount.checkedIn }}</div>
            <div class="text-xs text-blue-700 mt-1">已签到</div>
          </div>
          <div class="bg-green-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ todayCount.checkedOut }}</div>
            <div class="text-xs text-green-700 mt-1">已完成</div>
          </div>
          <div class="bg-orange-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-600">{{ todayCount.late || 0 }}</div>
            <div class="text-xs text-orange-700 mt-1">迟到</div>
          </div>
        </div>
        <h4 class="font-medium text-sm text-gray-600 mb-2">最近签到</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="c in recent" :key="c.id" class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
              {{ (c.user?.realName || 'U').charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-800 truncate">{{ c.user?.realName }}</div>
              <div class="text-xs text-gray-500 truncate">{{ c.court?.name || c.booking?.orderNo || '手动签到' }}</div>
            </div>
            <span class="badge text-[10px]" :class="statusColor(c.status)">{{ statusText(c.status) }}</span>
          </div>
          <div v-if="!recent.length" class="text-center text-gray-400 text-sm py-6">暂无签到记录</div>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">签到记录</h3>
        <button class="btn-secondary" @click="exportData">📥 导出</button>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-xs">
          <tr>
            <th class="text-left px-4 py-2">签到号</th>
            <th class="text-left px-4 py-2">用户</th>
            <th class="text-left px-4 py-2">关联</th>
            <th class="text-left px-4 py-2">时间</th>
            <th class="text-center px-4 py-2">状态</th>
            <th class="text-left px-4 py-2">方式</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="c in list" :key="c.id" class="hover:bg-gray-50/50">
            <td class="px-4 py-2 font-mono text-xs">{{ c.checkInNo }}</td>
            <td class="px-4 py-2">
              <div class="font-medium">{{ c.user?.realName }}</div>
              <div class="text-xs text-gray-500">{{ c.user?.phone }}</div>
            </td>
            <td class="px-4 py-2 text-xs text-gray-600">
              <div v-if="c.bookingId">预约: {{ c.booking?.orderNo }}</div>
              <div v-if="c.tournamentId">赛事: {{ c.tournament?.name }}</div>
              <div v-if="c.courtId">场地: {{ c.court?.name }}</div>
              <div v-if="!c.bookingId && !c.tournamentId && !c.courtId">-</div>
            </td>
            <td class="px-4 py-2 text-xs">
              <div>{{ c.checkInTime ? formatDate(c.checkInTime, 'HH:mm') : '-' }}</div>
              <div v-if="c.checkOutTime" class="text-gray-500">{{ c.checkOutTime ? formatDate(c.checkOutTime, 'HH:mm') : '-' }}</div>
            </td>
            <td class="px-4 py-2 text-center"><span class="badge" :class="statusColor(c.status)">{{ statusText(c.status) }}</span></td>
            <td class="px-4 py-2 text-xs">{{ c.method || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
const { get, post } = useApi()
const code = ref('')
const loading = ref(false)
const result = ref<any>(null)
const list = ref<any[]>([])
const recent = ref<any[]>([])
const todayCount = reactive({ checkedIn: 0, checkedOut: 0 })

async function doCheckin() {
  if (!code.value) return alert('请输入核销码')
  loading.value = true; result.value = null
  try {
    const r = await post('/api/checkins', { type: 'CODE', code: code.value.trim() })
    if (r.code === 0) { result.value = { ok: true, msg: '签到成功', data: r.data }; code.value = ''; loadData() }
    else result.value = { ok: false, msg: r.message }
  } catch (e: any) { result.value = { ok: false, msg: e.message || '签到失败' } }
  finally { loading.value = false }
}

async function loadData() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const r = await get('/api/checkins', { date: today, pageSize: 100 })
    if (r.code === 0) {
      list.value = r.data.list
      recent.value = list.value.slice(0, 10)
      todayCount.checkedIn = list.value.filter(c => c.status === 'CHECKED_IN').length
      todayCount.checkedOut = list.value.filter(c => c.status === 'CHECKED_OUT').length
    }
  } catch {}
}

async function exportData() {
  try {
    const r = await post('/api/downloads', { type: 'checkins', name: '签到记录导出' })
    if (r.code === 0 && r.data.fileUrl) { window.open(r.data.fileUrl, '_blank') }
    else alert(r.message || '导出中，请在下载中心查看')
  } catch (e) { alert('导出失败') }
}

onMounted(loadData)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
