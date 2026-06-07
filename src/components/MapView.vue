<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import L from 'leaflet'
import type { MonitorStation, DistrictHeatmap } from '@/types'

const props = defineProps<{
  stations: MonitorStation[]
  heatmap: DistrictHeatmap[]
}>()

const emit = defineEmits<{
  (e: 'stationClick', stationId: string): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markers: L.Marker[] = []

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

function createStationIcon(station: MonitorStation, aqiValue: number = 0): L.DivIcon {
  const isOffline = station.status === 'offline'
  const color = isOffline ? '#64748b' : getAqiColor(aqiValue)
  const pulseClass = isOffline ? 'animate-pulse-slow' : ''

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width: 28px; height: 28px;">
        <div class="${pulseClass}" style="
          width: 24px; height: 24px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <span style="
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          background: rgba(255,255,255,0.9);
          padding: 1px 4px;
          border-radius: 3px;
        ">${station.name.substring(0, 4)}</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [28, 40],
    iconAnchor: [14, 12],
  })
}

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: [39.9042, 116.4074],
    zoom: 11,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  updateMarkers()
}

function updateMarkers() {
  if (!map) return

  markers.forEach(m => m.remove())
  markers = []

  props.stations.forEach(station => {
    const mockAqi = Math.floor(Math.random() * 150) + 30
    const icon = createStationIcon(station, mockAqi)

    const marker = L.marker([station.lat, station.lng], { icon })
      .addTo(map!)
      .on('click', () => emit('stationClick', station.id))

    const statusText = station.status === 'online' ? '在线' : station.status === 'warning' ? '异常' : '离线'
    marker.bindTooltip(`
      <div class="text-sm">
        <div class="font-bold">${station.name}</div>
        <div>所属区域：${station.district}</div>
        <div>状态：<span style="color: ${station.status === 'offline' ? '#ef4444' : '#22c55e'}">${statusText}</span></div>
        <div>AQI：${mockAqi}</div>
        <div class="text-xs text-slate-500 mt-1">点击查看详情</div>
      </div>
    `, { direction: 'top', offset: [0, -20] })

    markers.push(marker)
  })
}

onMounted(() => {
  initMap()
})

watch(() => props.stations, () => {
  updateMarkers()
}, { deep: true })

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden"></div>
</template>

<style>
.custom-marker {
  background: none !important;
  border: none !important;
}

.leaflet-tooltip {
  font-family: 'Noto Sans SC', sans-serif;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
