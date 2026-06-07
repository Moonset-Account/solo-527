<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { Search, Filter, Info, TrendingUp, AlertTriangle, MapPin } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import { useDataStore } from '@/stores/data'
import type { BinPoint, BinPointStatus } from '@/types'

const dataStore = useDataStore()
const router = useRouter()

const mapContainer = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const selectedStatus = ref<BinPointStatus | 'all'>('all')
const selectedDistrict = ref<string>('all')
const selectedBinPoint = ref<BinPoint | null>(null)
const showSidebar = ref(true)

let svg: any = null
let g: any = null
let zoom: any = null

const statusColors: Record<BinPointStatus, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  full: '#ef4444',
  abnormal: '#8b5cf6'
}

const statusLabels: Record<BinPointStatus, string> = {
  normal: '正常',
  warning: '预警',
  full: '满溢',
  abnormal: '异常'
}

const districts = computed(() => {
  const set = new Set<string>()
  dataStore.communities.forEach(c => set.add(c.district))
  return Array.from(set)
})

const filteredBinPoints = computed(() => {
  let points = dataStore.binPoints

  if (selectedStatus.value !== 'all') {
    points = points.filter(p => p.status === selectedStatus.value)
  }

  if (selectedDistrict.value !== 'all') {
    const communityIds = new Set(
      dataStore.communities
        .filter(c => c.district === selectedDistrict.value)
        .map(c => c.id)
    )
    points = points.filter(p => communityIds.has(p.communityId))
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    points = points.filter(p => {
      const community = dataStore.getCommunityById(p.communityId)
      return (
        p.name.toLowerCase().includes(q) ||
        p.gridCode.toLowerCase().includes(q) ||
        community?.name.toLowerCase().includes(q)
      )
    })
  }

  return points
})

const stats = computed(() => {
  const points = dataStore.binPoints
  return {
    total: points.length,
    normal: points.filter(p => p.status === 'normal').length,
    warning: points.filter(p => p.status === 'warning').length,
    full: points.filter(p => p.status === 'full').length,
    abnormal: points.filter(p => p.status === 'abnormal').length
  }
})

function initMap() {
  if (!mapContainer.value) return

  const width = mapContainer.value.clientWidth
  const height = mapContainer.value.clientHeight

  svg = d3.select(mapContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on('zoom', (event: any) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  g = svg.append('g')

  drawMap()
  drawBinPoints()
}

function drawMap() {
  const geoJson = dataStore.cityGeoJson as any
  if (!geoJson || !geoJson.features.length) return

  const width = mapContainer.value?.clientWidth || 800
  const height = mapContainer.value?.clientHeight || 600

  const projection = d3.geoMercator()
    .fitSize([width, height], geoJson)

  const path = d3.geoPath().projection(projection)

  g.append('g')
    .attr('class', 'districts')
    .selectAll('path')
    .data(geoJson.features)
    .enter()
    .append('path')
    .attr('d', path as any)
    .attr('fill', (d: any) => {
      const index = d.properties.id.split('-')[1]
      const colors = ['#ecfdf5', '#f0fdf4', '#dcfce7', '#d1fae5', '#a7f3d0', '#6ee7b7']
      return colors[parseInt(index) % colors.length]
    })
    .attr('stroke', '#10b981')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.3)
    .style('cursor', 'pointer')
    .on('mouseover', function(this: any, _event: any, _d: any) {
      d3.select(this)
        .attr('fill-opacity', 0.8)
        .attr('stroke-width', 2)
    })
    .on('mouseout', function(this: any) {
      d3.select(this)
        .attr('fill-opacity', 1)
        .attr('stroke-width', 1)
    })
    .append('title')
    .text((d: any) => d.properties.name)

  g.selectAll('.district-label')
    .data(geoJson.features)
    .enter()
    .append('text')
    .attr('class', 'district-label')
    .attr('transform', (d: any) => {
      const centroid = path.centroid(d as any)
      return `translate(${centroid[0]}, ${centroid[1]})`
    })
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#065f46')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .attr('pointer-events', 'none')
    .text((d: any) => d.properties.name)
}

function drawBinPoints() {
  const geoJson = dataStore.cityGeoJson as any
  const width = mapContainer.value?.clientWidth || 800
  const height = mapContainer.value?.clientHeight || 600

  const projection = d3.geoMercator()
    .fitSize([width, height], geoJson)

  const pointsGroup = g.append('g').attr('class', 'bin-points')

  const updatePoints = () => {
    const points = filteredBinPoints.value

    const circles = pointsGroup.selectAll('.bin-point')
      .data(points, (d: any) => d.id)

    circles.exit().remove()

    const enter = circles.enter()
      .append('g')
      .attr('class', 'bin-point')
      .attr('transform', (d: any) => {
        const [x, y] = projection([d.lng, d.lat]) || [0, 0]
        return `translate(${x}, ${y})`
      })
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: BinPoint) => {
        selectedBinPoint.value = d
      })

    enter.append('circle')
      .attr('r', 0)
      .attr('fill', (d: any) => statusColors[d.status])
      .attr('fill-opacity', 0.3)
      .attr('class', 'pulse-ring')
      .transition()
      .duration(500)
      .attr('r', 12)

    enter.append('circle')
      .attr('r', 0)
      .attr('fill', (d: any) => statusColors[d.status])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .attr('r', 6)

    enter.selectAll('circle')
      .on('mouseover', function(this: any) {
        d3.select(this.parentNode).raise()
        d3.select(this.parentNode).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('r', 8)
      })
      .on('mouseout', function(this: any) {
        d3.select(this.parentNode).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('r', 6)
      })

    enter.append('title')
      .text((d: any) => {
        const comm = dataStore.getCommunityById(d.communityId)
        return `${d.name}\n社区: ${comm?.name || '未知'}\n状态: ${statusLabels[d.status]}\n满载率: ${d.fillLevel}%`
      })
  }

  updatePoints()

  watch(filteredBinPoints, () => {
    const points = filteredBinPoints.value
    const circles = pointsGroup.selectAll('.bin-point')
      .data(points, (d: any) => d.id)

    circles.exit().remove()

    const enter = circles.enter()
      .append('g')
      .attr('class', 'bin-point')
      .attr('transform', (d: any) => {
        const [x, y] = projection([d.lng, d.lat]) || [0, 0]
        return `translate(${x}, ${y})`
      })
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: BinPoint) => {
        selectedBinPoint.value = d
      })

    enter.append('circle')
      .attr('r', 12)
      .attr('fill', (d: any) => statusColors[d.status])
      .attr('fill-opacity', 0.3)
      .attr('class', 'pulse-ring')

    enter.append('circle')
      .attr('r', 6)
      .attr('fill', (d: any) => statusColors[d.status])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    enter.selectAll('circle')
      .on('mouseover', function(this: any) {
        d3.select(this.parentNode).raise()
        d3.select(this.parentNode).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('r', 8)
      })
      .on('mouseout', function(this: any) {
        d3.select(this.parentNode).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('r', 6)
      })

    enter.append('title')
      .text((d: any) => {
        const comm = dataStore.getCommunityById(d.communityId)
        return `${d.name}\n社区: ${comm?.name || '未知'}\n状态: ${statusLabels[d.status]}\n满载率: ${d.fillLevel}%`
      })
  }, { deep: true })
}

function handleResize() {
  if (!mapContainer.value || !svg) return

  const width = mapContainer.value.clientWidth
  const height = mapContainer.value.clientHeight

  svg.attr('width', width).attr('height', height)

  g.selectAll('*').remove()
  drawMap()
  drawBinPoints()
}

function getBinPointCommunity(bin: BinPoint) {
  return dataStore.getCommunityById(bin.communityId)
}

function closeDetail() {
  selectedBinPoint.value = null
}

onMounted(() => {
  setTimeout(() => {
    initMap()
    window.addEventListener('resize', handleResize)
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />

    <div class="flex-1 flex overflow-hidden">
      <div
        v-if="showSidebar"
        class="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0"
      >
        <div class="p-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-3">桶点查询</h2>
          <div class="relative mb-3">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索桶点、社区、网格..."
              class="input pl-9"
            />
          </div>
          <div class="space-y-2">
            <select v-model="selectedStatus" class="select">
              <option value="all">全部状态</option>
              <option value="normal">正常</option>
              <option value="warning">预警</option>
              <option value="full">满溢</option>
              <option value="abnormal">异常</option>
            </select>
            <select v-model="selectedDistrict" class="select">
              <option value="all">全部行政区</option>
              <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>

        <div class="p-4 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info class="w-4 h-4 text-teal-600" />
            数据概览
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-gray-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-gray-900">{{ stats.total }}</p>
              <p class="text-xs text-gray-500">总桶点数</p>
            </div>
            <div class="bg-green-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-green-600">{{ stats.normal }}</p>
              <p class="text-xs text-green-600">正常</p>
            </div>
            <div class="bg-amber-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-amber-600">{{ stats.warning }}</p>
              <p class="text-xs text-amber-600">预警</p>
            </div>
            <div class="bg-red-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-red-600">{{ stats.full + stats.abnormal }}</p>
              <p class="text-xs text-red-600">异常</p>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin class="w-4 h-4 text-teal-600" />
            桶点列表 ({{ filteredBinPoints.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="bin in filteredBinPoints.slice(0, 20)"
              :key="bin.id"
              class="p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'ring-2 ring-teal-500 bg-teal-50': selectedBinPoint?.id === bin.id }"
              @click="selectedBinPoint = bin"
            >
              <div class="flex items-start gap-2">
                <span :class="`status-${bin.status}`" class="mt-1.5 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ bin.name }}</p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ getBinPointCommunity(bin)?.name }} · {{ bin.gridCode }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        class="h-1.5 rounded-full transition-all"
                        :style="{
                          width: `${bin.fillLevel}%`,
                          backgroundColor: statusColors[bin.status]
                        }"
                      />
                    </div>
                    <span class="text-xs text-gray-500">{{ bin.fillLevel }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 relative">
        <div ref="mapContainer" class="absolute inset-0" />

        <button
          class="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          @click="showSidebar = !showSidebar"
        >
          <Filter class="w-5 h-5 text-gray-600" />
        </button>

        <div class="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md p-3">
          <h4 class="text-xs font-semibold text-gray-900 mb-2">图例</h4>
          <div class="space-y-1.5">
            <div v-for="(label, status) in statusLabels" :key="status" class="flex items-center gap-2">
              <span :class="`status-${status}`" />
              <span class="text-xs text-gray-600">{{ label }}</span>
            </div>
          </div>
        </div>

        <Transition name="slide-up">
          <div
            v-if="selectedBinPoint"
            class="absolute top-4 right-4 z-10 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div class="p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-bold text-gray-900">{{ selectedBinPoint.name }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ getBinPointCommunity(selectedBinPoint)?.name }}
                  </p>
                </div>
                <button
                  class="p-1 hover:bg-white/50 rounded"
                  @click="closeDetail"
                >
                  <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">运行状态</span>
                <span :class="`badge-${selectedBinPoint.status === 'normal' ? 'success' : selectedBinPoint.status === 'warning' ? 'warning' : 'danger'}`">
                  {{ statusLabels[selectedBinPoint.status] }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">满载率</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.fillLevel }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">垃圾桶数量</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.binCount }} 个</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">网格编码</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.gridCode }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">最后更新</span>
                <span class="text-sm text-gray-600">
                  {{ new Date(selectedBinPoint.lastUpdate).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>
            <div class="p-4 border-t border-gray-100 bg-gray-50">
              <button
                class="w-full btn-primary"
                @click="router.push('/manager')"
              >
                <TrendingUp class="w-4 h-4 mr-2" />
                查看详细分析
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
