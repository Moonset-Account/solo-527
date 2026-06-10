<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="s in stats" :key="s.label" class="card p-5">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-gray-500 text-sm">{{ s.label }}</div>
            <div class="text-2xl font-bold mt-1" :class="s.color">{{ s.value }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ s.sub }}</div>
          </div>
          <div class="text-3xl">{{ s.icon }}</div>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">教练产能报表</h3>
        <div class="flex gap-2">
          <select v-model="filter.coachId" class="input !w-auto">
            <option value="">全部教练</option>
            <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.user?.realName }}</option>
          </select>
          <button class="btn-secondary" @click="exportExcel">📥 导出</button>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-xs">
          <tr>
            <th class="text-left px-4 py-3">教练</th>
            <th class="text-left px-4 py-3">周次</th>
            <th class="text-right px-4 py-3">计划产能(h)</th>
            <th class="text-right px-4 py-3">实际使用(h)</th>
            <th class="text-right px-4 py-3">培训时长</th>
            <th class="text-right px-4 py-3">学员数</th>
            <th class="text-right px-4 py-3">收入</th>
            <th class="text-right px-4 py-3">故障影响</th>
            <th class="text-right px-4 py-3">利用率</th>
            <th class="text-left px-4 py-3">备注</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="r in list" :key="r.id" class="hover:bg-gray-50/50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {{ r.coach?.user?.realName?.charAt(0) }}
                </div>
                <div>
                  <div class="font-medium">{{ r.coach?.user?.realName }}</div>
                  <div class="text-xs text-gray-500">{{ r.coach?.level }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatDate(r.weekStart, 'MM-DD') }} ~ {{ formatDate(r.weekEnd, 'MM-DD') }}</td>
            <td class="px-4 py-3 text-right">{{ r.plannedCapacity }}</td>
            <td class="px-4 py-3 text-right font-medium">{{ r.actualUsed }}</td>
            <td class="px-4 py-3 text-right">{{ Number(r.trainingHours).toFixed(1) }}h</td>
            <td class="px-4 py-3 text-right">{{ r.studentCount }}人</td>
            <td class="px-4 py-3 text-right font-semibold text-green-600">¥{{ Number(r.revenue).toFixed(0) }}</td>
            <td class="px-4 py-3 text-right">
              <span v-if="r.faultAffectHours > 0" class="badge bg-orange-100 text-orange-700">{{ r.faultAffectHours }}h</span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center gap-2">
                <div class="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-primary-500 h-full" :style="{ width: r.utilizationRate + '%' }"></div>
                </div>
                <span class="text-xs font-medium">{{ r.utilizationRate }}%</span>
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate" :title="r.deviceFaults || r.remark">
              <span v-if="r.deviceFaults" class="badge bg-orange-100 text-orange-700 mr-1">🔧</span>
              {{ r.remark || '-' }}
            </td>
          </tr>
          <tr v-if="!list.length"><td colspan="10" class="text-center text-gray-400 py-12">暂无产能数据</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
const { get, post } = useApi()
const filter = reactive({ coachId: '' })
const list = ref<any[]>([])
const coaches = ref<any[]>([])

const stats = computed(() => {
  const totalPlanned = list.value.reduce((s, r) => s + r.plannedCapacity, 0)
  const totalUsed = list.value.reduce((s, r) => s + r.actualUsed, 0)
  const totalRevenue = list.value.reduce((s, r) => s + Number(r.revenue), 0)
  const avgUtil = list.value.length ? Math.round(list.value.reduce((s, r) => s + Number(r.utilizationRate), 0) / list.value.length : 0
  return [
    { label: '总计划产能', value: totalPlanned + 'h', sub: `${list.value.length}位教练`, color: 'text-blue-600', icon: '📋' },
    { label: '实际使用', value: totalUsed + 'h', sub: '已落实', color: 'text-teal-600', icon: '✅' },
    { label: '总收入', value: '¥' + totalRevenue.toFixed(0), sub: '教练培训产出', color: 'text-green-600', icon: '💰' },
    { label: '平均利用率', value: avgUtil + '%', sub: '产能利用', color: 'text-purple-600', icon: '📈' }
  ]
})

async function loadList() {
  try {
    const params: any = { pageSize: 100 }
    if (filter.coachId) params.coachId = filter.coachId
    const r = await get('/api/reports/capacity', params)
    if (r.code === 0) list.value = r.data.list
  } catch {}
}

async function loadCoaches() {
  try {
    const r = await get('/api/users', { role: 'COACH', pageSize: 50 })
    if (r.code === 0) coaches.value = r.data.list
  } catch {}
}

async function exportExcel() {
  try {
    const r = await post('/api/downloads', { type: 'capacity', name: '教练产能报表' })
    if (r.code === 0 && r.data.fileUrl) window.open(r.data.fileUrl, '_blank')
    else alert(r.message || '导出中')
  } catch (e) { alert('导出失败') }
}

onMounted(async () => { await loadCoaches(); loadList() })
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
