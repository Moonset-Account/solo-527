<script setup lang="ts">
import { computed } from 'vue'
import type { ConstructionSite, ComplaintAggregate, TrafficData } from '@/types'
import { DISTRICTS } from '@/types'

const props = defineProps<{
  constructionSites: ConstructionSite[]
  complaints: ComplaintAggregate[]
  trafficData: TrafficData[]
}>()

const recentEvents = computed(() => {
  const events: Array<{
    type: 'construction' | 'complaint' | 'traffic'
    time: string
    title: string
    description: string
    district: string
  }> = []

  props.constructionSites
    .filter(s => s.status === 'active')
    .slice(0, 5)
    .forEach(site => {
      events.push({
        type: 'construction',
        time: site.startDate,
        title: site.name,
        description: '施工进行中',
        district: site.district,
      })
    })

  const today = new Date().toISOString().split('T')[0]
  const todayComplaints = props.complaints.filter(c => c.date === today)
  if (todayComplaints.length > 0) {
    const total = todayComplaints.reduce((sum, c) => sum + c.totalCount, 0)
    events.push({
      type: 'complaint',
      time: today,
      title: '公众投诉汇总',
      description: `今日共 ${total} 件投诉（已脱敏聚合）`,
      district: '全市',
    })
  }

  const rushHourTraffic = props.trafficData
    .filter(t => {
      const hour = new Date(t.timestamp).getHours()
      return hour >= 17 && hour <= 19
    })
    .slice(0, 3)

  rushHourTraffic.forEach(t => {
    events.push({
      type: 'traffic',
      time: new Date(t.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      title: `${t.district} 车流量`,
      description: `${t.vehicleCount} 辆/小时，平均 ${t.avgSpeed} km/h`,
      district: t.district,
    })
  })

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)
})

const typeConfig = {
  construction: { icon: '🏗️', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  complaint: { icon: '📢', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  traffic: { icon: '🚗', color: 'bg-blue-100 text-blue-800 border-blue-200' },
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-800">关联事件时间线</h3>
      <span class="text-xs text-slate-500">隐私保护：投诉仅显示聚合数据</span>
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-3">
      <div
        v-for="(event, idx) in recentEvents"
        :key="idx"
        class="relative pl-6 pb-3 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
      >
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-xs">
          {{ typeConfig[event.type].icon }}
        </div>

        <div
          class="p-3 rounded-lg border transition-all hover:shadow-sm"
          :class="typeConfig[event.type].color"
        >
          <div class="flex items-start justify-between">
            <span class="font-medium text-sm">{{ event.title }}</span>
            <span class="text-xs opacity-75 font-mono">{{ event.time }}</span>
          </div>
          <p class="text-xs mt-1 opacity-80">{{ event.description }}</p>
          <span class="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-white/50">
            {{ event.district }}
          </span>
        </div>
      </div>

      <div v-if="recentEvents.length === 0" class="text-center py-8 text-slate-400 text-sm">
        暂无事件数据
      </div>
    </div>
  </div>
</template>
