<script setup lang="ts">
import { computed } from 'vue'
import { mockSensorStatuses, mockAeratorStatuses } from '@/mock/data'
import { POND_NAMES, METRIC_LABELS, type AeratorStatusType, type SensorOnlineStatus } from '@/types'
import { Cpu, Wind, Wifi, WifiOff } from 'lucide-vue-next'

const sensorByPond = computed(() => {
  const map: Record<string, typeof mockSensorStatuses> = {}
  for (const s of mockSensorStatuses) {
    if (!map[s.pondId]) map[s.pondId] = []
    map[s.pondId].push(s)
  }
  return map
})

const aeratorByPond = computed(() => {
  const map: Record<string, typeof mockAeratorStatuses> = {}
  for (const a of mockAeratorStatuses) {
    if (!map[a.pondId]) map[a.pondId] = []
    map[a.pondId].push(a)
  }
  return map
})

const pondIds = computed(() => Object.keys(POND_NAMES))

function statusDotColor(status: SensorOnlineStatus | AeratorStatusType): string {
  if (status === 'online' || status === 'running') return 'bg-emerald-400'
  if (status === 'offline' || status === 'stopped') return 'bg-[#EF4444]'
  if (status === 'fault') return 'bg-[#F59E0B]'
  return 'bg-gray-500'
}

function statusLabel(status: SensorOnlineStatus | AeratorStatusType): string {
  if (status === 'online') return '在线'
  if (status === 'offline') return '离线'
  if (status === 'running') return '运行中'
  if (status === 'stopped') return '已停止'
  if (status === 'fault') return '故障'
  return '未知'
}

function formatHeartbeat(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  return `${Math.floor(diffH / 24)}天前`
}
</script>

<template>
  <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] overflow-hidden">
    <div class="flex items-center gap-2 px-4 py-3 border-b border-[#0D3B47]">
      <Cpu class="w-4 h-4 text-[#00B4D8]" />
      <h3 class="text-sm font-medium text-gray-200">设备状态</h3>
    </div>

    <div class="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
      <div
        v-for="pondId in pondIds"
        :key="pondId"
        class="bg-[#0D3B47] rounded-lg p-3"
      >
        <div class="text-xs font-medium text-gray-300 mb-2">
          {{ POND_NAMES[pondId] }}
        </div>

        <div class="space-y-1.5">
          <div
            v-for="sensor in sensorByPond[pondId]"
            :key="sensor.sensorId"
            class="flex items-center gap-2 text-xs"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotColor(sensor.status)" />
            <Wifi v-if="sensor.status === 'online'" class="w-3 h-3 text-gray-500" />
            <WifiOff v-else class="w-3 h-3 text-gray-600" />
            <span class="text-gray-400">{{ METRIC_LABELS[sensor.type as keyof typeof METRIC_LABELS] }}</span>
            <span
              class="ml-auto"
              :class="sensor.status === 'online' ? 'text-gray-300' : 'text-[#EF4444]'"
            >
              {{ statusLabel(sensor.status) }}
            </span>
            <span v-if="sensor.status === 'offline'" class="text-[10px] text-gray-600">
              {{ formatHeartbeat(sensor.lastHeartbeat) }}
            </span>
          </div>

          <div
            v-for="aerator in aeratorByPond[pondId]"
            :key="aerator.id"
            class="flex items-center gap-2 text-xs"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotColor(aerator.status)" />
            <Wind class="w-3 h-3 text-gray-500" />
            <span class="text-gray-400">增氧机</span>
            <span
              class="ml-auto"
              :class="{
                'text-emerald-400': aerator.status === 'running',
                'text-[#EF4444]': aerator.status === 'stopped',
                'text-[#F59E0B]': aerator.status === 'fault',
              }"
            >
              {{ statusLabel(aerator.status) }}
            </span>
            <span
              v-if="aerator.autoMode"
              class="text-[10px] px-1 py-0.5 rounded bg-[#00B4D8]/10 text-[#00B4D8]"
            >
              自动
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
