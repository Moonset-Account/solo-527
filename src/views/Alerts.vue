<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEnergyStore } from '@/stores/energy'
import { formatDateTime, getAlertLevelLabel, getAlertTypeLabel, getStatusLabel } from '@/utils'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  Check,
  X,
  MessageSquare
} from 'lucide-vue-next'
import type { AlertLevel, AlertStatus } from '@/types'

const energyStore = useEnergyStore()

const selectedLevel = ref<AlertLevel | 'all'>('all')
const selectedStatus = ref<AlertStatus | 'all'>('all')
const selectedAlert = ref<string | null>(null)
const handleNote = ref('')

const levels = [
  { value: 'all', label: '全部级别' },
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '提示' }
]

const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'acknowledged', label: '已确认' },
  { value: 'resolved', label: '已解决' }
]

const filteredAlerts = computed(() => {
  return energyStore.alerts.filter(alert => {
    const levelMatch = selectedLevel.value === 'all' || alert.level === selectedLevel.value
    const statusMatch = selectedStatus.value === 'all' || alert.status === selectedStatus.value
    return levelMatch && statusMatch
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const alertStats = computed(() => ({
  total: energyStore.alerts.length,
  open: energyStore.openAlerts.length,
  acknowledged: energyStore.acknowledgedAlerts.length,
  resolved: energyStore.resolvedAlerts.length
}))

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-status-danger text-status-danger border-status-danger/30',
    warning: 'bg-status-warning text-status-warning border-status-warning/30',
    info: 'bg-status-info text-status-info border-status-info/30'
  }
  return colors[level] || ''
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-status-danger/20 text-status-danger',
    acknowledged: 'bg-status-warning/20 text-status-warning',
    resolved: 'bg-status-success/20 text-status-success'
  }
  return colors[status] || ''
}

function getLevelBg(level: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-status-danger/10 border-status-danger/20',
    warning: 'bg-status-warning/10 border-status-warning/20',
    info: 'bg-status-info/10 border-status-info/20'
  }
  return colors[level] || ''
}

function acknowledgeAlert(alertId: string) {
  if (handleNote.value.trim()) {
    energyStore.acknowledgeAlert(alertId, handleNote.value)
    handleNote.value = ''
    selectedAlert.value = null
  }
}

function resolveAlert(alertId: string) {
  if (handleNote.value.trim()) {
    energyStore.resolveAlert(alertId, handleNote.value)
    handleNote.value = ''
    selectedAlert.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p class="text-2xl font-mono font-bold text-white">{{ alertStats.total }}</p>
            <p class="text-xs text-slate-400">告警总数</p>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-status-danger/10 rounded-lg flex items-center justify-center">
            <Clock class="w-5 h-5 text-status-danger" />
          </div>
          <div>
            <p class="text-2xl font-mono font-bold text-status-danger">{{ alertStats.open }}</p>
            <p class="text-xs text-slate-400">待处理</p>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-status-warning/10 rounded-lg flex items-center justify-center">
            <AlertCircle class="w-5 h-5 text-status-warning" />
          </div>
          <div>
            <p class="text-2xl font-mono font-bold text-status-warning">{{ alertStats.acknowledged }}</p>
            <p class="text-xs text-slate-400">处理中</p>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-status-success/10 rounded-lg flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-status-success" />
          </div>
          <div>
            <p class="text-2xl font-mono font-bold text-status-success">{{ alertStats.resolved }}</p>
            <p class="text-xs text-slate-400">已解决</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 class="font-medium text-white">告警列表</h3>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedLevel"
            class="bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
          >
            <option v-for="level in levels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
          <select
            v-model="selectedStatus"
            class="bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
          >
            <option v-for="status in statuses" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="border rounded-xl overflow-hidden transition-all"
          :class="getLevelBg(alert.level)"
        >
          <div
            class="p-4 cursor-pointer"
            @click="selectedAlert = selectedAlert === alert.id ? null : alert.id"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1">
                <div
                  class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  :class="{
                    'bg-status-danger': alert.level === 'critical',
                    'bg-status-warning': alert.level === 'warning',
                    'bg-status-info': alert.level === 'info'
                  }"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium border"
                      :class="getLevelColor(alert.level)"
                    >
                      {{ getAlertLevelLabel(alert.level) }}
                    </span>
                    <span class="text-xs text-slate-400">{{ getAlertTypeLabel(alert.type) }}</span>
                  </div>
                  <p class="text-sm text-slate-200">{{ alert.message }}</p>
                  <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{{ alert.deviceName }}</span>
                    <span>{{ formatDateTime(alert.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusColor(alert.status)"
                >
                  {{ getStatusLabel(alert.status) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedAlert === alert.id" class="border-t border-slate-700/50 p-4 bg-bg-tertiary/30">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-xs text-slate-400 mb-1">告警设备</p>
                <p class="text-sm text-slate-200">{{ alert.deviceName }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-1">告警时间</p>
                <p class="text-sm text-slate-200 font-mono">{{ formatDateTime(alert.createdAt) }}</p>
              </div>
              <div v-if="alert.handledAt">
                <p class="text-xs text-slate-400 mb-1">处理时间</p>
                <p class="text-sm text-slate-200 font-mono">{{ formatDateTime(alert.handledAt) }}</p>
              </div>
              <div v-if="alert.handledBy">
                <p class="text-xs text-slate-400 mb-1">处理人</p>
                <p class="text-sm text-slate-200">{{ alert.handledBy }}</p>
              </div>
            </div>

            <div v-if="alert.note" class="mb-4">
              <p class="text-xs text-slate-400 mb-1">处理备注</p>
              <p class="text-sm text-slate-300 p-3 bg-bg-primary/50 rounded-lg">{{ alert.note }}</p>
            </div>

            <div v-if="alert.status === 'open' || alert.status === 'acknowledged'" class="space-y-3">
              <div>
                <label class="text-xs text-slate-400 mb-1 block">处理备注</label>
                <textarea
                  v-model="handleNote"
                  rows="2"
                  class="w-full bg-bg-primary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500 resize-none"
                  placeholder="请输入处理备注..."
                ></textarea>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="alert.status === 'open'"
                  @click="acknowledgeAlert(alert.id)"
                  class="flex items-center gap-2 px-4 py-2 bg-status-warning/20 text-status-warning hover:bg-status-warning/30 rounded-lg text-sm transition-colors"
                >
                  <Clock class="w-4 h-4" />
                  确认告警
                </button>
                <button
                  @click="resolveAlert(alert.id)"
                  class="flex items-center gap-2 px-4 py-2 bg-status-success/20 text-status-success hover:bg-status-success/30 rounded-lg text-sm transition-colors"
                >
                  <Check class="w-4 h-4" />
                  标记已解决
                </button>
              </div>
            </div>

            <div class="mt-4 p-3 bg-bg-primary/50 rounded-lg">
              <p class="text-xs text-slate-400">
                <strong class="text-status-warning">注意：</strong>
                设备离线时段的数据已自动排除，不参与峰谷统计和分摊计算，避免因数据缺失导致的统计偏差。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
