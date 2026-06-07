<script setup lang="ts">
import { ref, computed } from 'vue'
import { AlertCircle, Clock, CheckCircle, Filter, Calendar } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import type { FullAlert, AlertStatus, AlertLevel } from '@/types'

const dataStore = useDataStore()

const selectedStatus = ref<AlertStatus | 'all'>('all')
const selectedLevel = ref<AlertLevel | 'all'>('all')
const selectedCommunity = ref<string>('all')

const statusOptions: Array<{ value: AlertStatus | 'all'; label: string; color: string }> = [
  { value: 'all', label: '全部状态', color: 'gray' },
  { value: 'pending', label: '待处理', color: 'red' },
  { value: 'processing', label: '处理中', color: 'amber' },
  { value: 'resolved', label: '已处理', color: 'green' }
]

const levelOptions: Array<{ value: AlertLevel | 'all'; label: string; color: string }> = [
  { value: 'all', label: '全部级别', color: 'gray' },
  { value: 'high', label: '紧急', color: 'red' },
  { value: 'medium', label: '一般', color: 'amber' },
  { value: 'low', label: '轻微', color: 'blue' }
]

const filteredAlerts = computed(() => {
  let alerts = dataStore.fullAlerts

  if (selectedStatus.value !== 'all') {
    alerts = alerts.filter(a => a.status === selectedStatus.value)
  }

  if (selectedLevel.value !== 'all') {
    alerts = alerts.filter(a => a.level === selectedLevel.value)
  }

  if (selectedCommunity.value !== 'all') {
    const binIds = new Set(
      dataStore.getBinPointsByCommunity(selectedCommunity.value).map(b => b.id)
    )
    alerts = alerts.filter(a => binIds.has(a.binPointId))
  }

  return alerts.sort((a, b) => new Date(b.alertTime).getTime() - new Date(a.alertTime).getTime())
})

const stats = computed(() => {
  const alerts = dataStore.fullAlerts
  const pending = alerts.filter(a => a.status !== 'resolved')
  const resolved = alerts.filter(a => a.status === 'resolved')

  const avgResponseTime = resolved.length > 0
    ? resolved.reduce((sum, a) => {
        if (a.handleTime) {
          const diff = new Date(a.handleTime).getTime() - new Date(a.alertTime).getTime()
          return sum + diff / 60000
        }
        return sum
      }, 0) / resolved.length
    : 0

  return {
    total: alerts.length,
    pending: pending.length,
    resolved: resolved.length,
    avgResponseTime: avgResponseTime.toFixed(0)
  }
})

function getAlertBin(alert: FullAlert) {
  return dataStore.getBinPointById(alert.binPointId)
}

function getAlertCommunity(alert: FullAlert) {
  const bin = getAlertBin(alert)
  return bin ? dataStore.getCommunityById(bin.communityId) : undefined
}

function getStatusBadge(status: AlertStatus) {
  const map: Record<AlertStatus, { class: string; label: string }> = {
    pending: { class: 'badge-danger', label: '待处理' },
    processing: { class: 'badge-warning', label: '处理中' },
    resolved: { class: 'badge-success', label: '已处理' }
  }
  return map[status]
}

function getLevelBadge(level: AlertLevel) {
  const map: Record<AlertLevel, { class: string; label: string }> = {
    high: { class: 'badge-danger', label: '紧急' },
    medium: { class: 'badge-warning', label: '一般' },
    low: { class: 'badge-info', label: '轻微' }
  }
  return map[level]
}

function formatDuration(alert: FullAlert) {
  if (!alert.handleTime) return '-'
  const diff = new Date(alert.handleTime).getTime() - new Date(alert.alertTime).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} 小时 ${mins} 分`
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle class="w-7 h-7 text-red-500" />
          桶满报警监控
        </h1>
        <p class="text-gray-500 mt-1">实时监控垃圾桶满溢情况</p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 border-l-4 border-l-gray-400">
        <p class="text-sm text-gray-500 mb-1">总报警数</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
      </div>
      <div class="card p-4 border-l-4 border-l-red-500">
        <p class="text-sm text-gray-500 mb-1">待处理</p>
        <p class="text-2xl font-bold text-red-600">{{ stats.pending }}</p>
      </div>
      <div class="card p-4 border-l-4 border-l-green-500">
        <p class="text-sm text-gray-500 mb-1">已处理</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.resolved }}</p>
      </div>
      <div class="card p-4 border-l-4 border-l-blue-500">
        <p class="text-sm text-gray-500 mb-1">平均响应时间</p>
        <p class="text-2xl font-bold text-blue-600">{{ stats.avgResponseTime }} 分</p>
      </div>
    </div>

    <div class="card p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-600">状态</span>
          <div class="flex gap-1">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                selectedStatus === opt.value
                  ? `bg-${opt.color}-100 text-${opt.color}-700 font-medium`
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
              @click="selectedStatus = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">级别</span>
          <div class="flex gap-1">
            <button
              v-for="opt in levelOptions"
              :key="opt.value"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                selectedLevel === opt.value
                  ? `bg-${opt.color}-100 text-${opt.color}-700 font-medium`
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
              @click="selectedLevel = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <select v-model="selectedCommunity" class="select !py-1 !text-sm !w-40 ml-auto">
          <option value="all">全部社区</option>
          <option v-for="c in dataStore.communities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">级别</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">桶点</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">社区</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">
                <Clock class="w-4 h-4 inline mr-1" />
                报警时间
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">处理时长</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">处理人</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="alert in filteredAlerts" :key="alert.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span :class="getStatusBadge(alert.status).class">
                  {{ getStatusBadge(alert.status).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="getLevelBadge(alert.level).class">
                  {{ getLevelBadge(alert.level).label }}
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-900">
                {{ getAlertBin(alert)?.name || '未知' }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ getAlertCommunity(alert)?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ new Date(alert.alertTime).toLocaleString('zh-CN') }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ formatDuration(alert) }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ alert.handler || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredAlerts.length === 0" class="p-12 text-center">
        <CheckCircle class="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p class="text-gray-500">暂无报警记录</p>
      </div>
    </div>
  </div>
</template>
