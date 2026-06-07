<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { Search, Filter, Info, TrendingUp, MapPin, Database, Loader2 } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import { api } from '@/services/api'
import { getGeoHash } from '@/utils/geohash'
import type { BinPointStatus } from '@/types'

const router = useRouter()

const mapContainer = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const selectedStatus = ref<BinPointStatus | 'all'>('all')
const selectedDistrict = ref<string>('all')
const selectedBinPoint = ref<any>(null)
const showSidebar = ref(true)
const mapReady = ref(false)
const loading = ref(true)
const lastSQL = ref('')

const binPoints = ref<any[]>([])
const districts = ref<string[]>([])
const statsData = ref({ total: 0, normal: 0, warning: 0, full: 0, abnormal: 0 })

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let projection: d3.GeoProjection | null = null
let cachedGeoJson: any = null

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

const filteredBinPoints = computed(() => {
  let points = binPoints.value

  if (selectedStatus.value !== 'all') {
    points = points.filter(p => p.status === selectedStatus.value)
  }

  if (selectedDistrict.value !== 'all') {
    points = points.filter(p => p.district === selectedDistrict.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    points = points.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.grid_code.toLowerCase().includes(q) ||
        p.communityName?.toLowerCase().includes(q)
      )
    })
  }

  return points
})

async function loadData() {
  loading.value = true
  try {
    const [binRes, statsRes, geoRes] = await Promise.all([
      api.binpoints.list(),
      api.binpoints.getStats(),
      api.spatial.getDistrictsGeoJson()
    ])

    binPoints.value = binRes.data
    statsData.value = statsRes.data
    cachedGeoJson = geoRes.data
    lastSQL.value = binRes.sql

    console.log('[MapPage] GeoJSON loaded:', cachedGeoJson?.type, cachedGeoJson?.features?.length, 'features')
    if (cachedGeoJson?.features?.length > 0) {
      const f0 = cachedGeoJson.features[0]
      console.log('[MapPage] First feature:', f0.properties?.name, f0.geometry?.type, f0.geometry?.coordinates?.[0]?.length, 'vertices')
      const coords = f0.geometry.coordinates[0]
      const lngs = coords.map((c: number[]) => c[0])
      const lats = coords.map((c: number[]) => c[1])
      console.log('[MapPage] First feature range: lng=[', Math.min(...lngs), ',', Math.max(...lngs), '] lat=[', Math.min(...lats), ',', Math.max(...lats), ']')
    }
    console.log('[MapPage] BinPoints loaded:', binPoints.value.length, 'first:', binPoints.value[0]?.lng, binPoints.value[0]?.lat)

    const districtSet = new Set<string>()
    binPoints.value.forEach(b => { if (b.district) districtSet.add(b.district) })
    districts.value = Array.from(districtSet)
  } catch (e) {
    console.error('Failed to load data from ClickHouse API:', e)
  } finally {
    loading.value = false
  }
}

function initMap() {
  if (!mapContainer.value) {
    console.log('[MapPage] initMap: no container')
    return
  }
  if (!cachedGeoJson) {
    console.log('[MapPage] initMap: no GeoJSON')
    return
  }

  const rect = mapContainer.value.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  console.log('[MapPage] initMap: container', width, 'x', height, 'geojson features:', cachedGeoJson.features?.length)

  if (width === 0 || height === 0) return

  d3.select(mapContainer.value).selectAll('svg').remove()

  svg = d3.select(mapContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 12])
    .on('zoom', (event) => {
      if (g) g.attr('transform', event.transform)
    })

  svg.call(zoom!)

  g = svg.append('g')

  projection = d3.geoMercator()
    .fitExtent([[20, 20], [width - 20, height - 20]], cachedGeoJson)

  console.log('[MapPage] projection: scale=', projection.scale(), 'translate=', projection.translate())
  const testPt = projection([116.34, 39.90])
  console.log('[MapPage] test projection [116.34,39.90] ->', testPt)

  const path = d3.geoPath().projection(projection!)

  g.append('g')
    .attr('class', 'districts')
    .selectAll('path')
    .data(cachedGeoJson.features)
    .enter()
    .append('path')
    .attr('d', path as any)
    .attr('fill', (_d: any, i: number) => {
      const colors = ['#ecfdf5', '#f0fdf4', '#dcfce7', '#d1fae5', '#a7f3d0', '#6ee7b7']
      return colors[i % colors.length]
    })
    .attr('stroke', '#10b981')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.4)
    .style('cursor', 'pointer')
    .on('mouseover', function(this: any) {
      d3.select(this).attr('fill-opacity', 0.7).attr('stroke-width', 3)
    })
    .on('mouseout', function(this: any) {
      d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 1.5)
    })
    .append('title')
    .text((d: any) => `${d.properties.name} (${d.properties.binCount}个桶点)`)

  g.selectAll('.district-label')
    .data(cachedGeoJson.features)
    .enter()
    .append('text')
    .attr('class', 'district-label')
    .attr('transform', (d: any) => {
      const centroid = path.centroid(d as any)
      return centroid ? `translate(${centroid[0]}, ${centroid[1]})` : ''
    })
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#065f46')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .attr('pointer-events', 'none')
    .text((d: any) => d.properties.name)

  drawBinPoints()

  mapReady.value = true
}

function drawBinPoints() {
  if (!g || !projection) return

  g.select('.bin-points').remove()

  const pointsGroup = g.append('g').attr('class', 'bin-points')
  const points = filteredBinPoints.value

  points.forEach(bin => {
    const pos = projection!([bin.lng, bin.lat])
    if (!pos) return

    const pointG = pointsGroup.append('g')
      .attr('class', 'bin-point')
      .attr('transform', `translate(${pos[0]}, ${pos[1]})`)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedBinPoint.value = bin
      })

    pointG.append('circle')
      .attr('r', 14)
      .attr('fill', statusColors[bin.status as BinPointStatus])
      .attr('fill-opacity', 0.15)

    if (bin.status !== 'normal') {
      pointG.append('circle')
        .attr('r', 14)
        .attr('fill', 'none')
        .attr('stroke', statusColors[bin.status as BinPointStatus])
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.4)
        .attr('class', 'pulse-ring')
    }

    pointG.append('circle')
      .attr('r', 5)
      .attr('fill', statusColors[bin.status as BinPointStatus])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)

    pointG.append('title')
      .text(`${bin.name}\n社区: ${bin.communityName || '未知'}\n状态: ${statusLabels[bin.status as BinPointStatus] || bin.status}\n满载率: ${bin.fill_level}%\nGeoHash: ${bin.geo_hash?.substring(0, 6) || getGeoHash(bin.lng, bin.lat, 6)}`)
  })
}

function handleResize() {
  if (!mapContainer.value) return
  initMap()
}

function getBinPointCommunity(bin: any) {
  return bin.communityName || '未知'
}

function closeDetail() {
  selectedBinPoint.value = null
}

watch(filteredBinPoints, () => {
  if (mapReady.value) drawBinPoints()
})

onMounted(async () => {
  await loadData()
  await nextTick()
  setTimeout(() => {
    initMap()
    window.addEventListener('resize', handleResize)
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden">
    <NavBar />

    <div class="flex-1 flex overflow-hidden" style="min-height: 0">
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
              <p class="text-xl font-bold text-gray-900">{{ statsData.total }}</p>
              <p class="text-xs text-gray-500">总桶点数</p>
            </div>
            <div class="bg-green-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-green-600">{{ statsData.normal }}</p>
              <p class="text-xs text-green-600">正常</p>
            </div>
            <div class="bg-amber-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-amber-600">{{ statsData.warning }}</p>
              <p class="text-xs text-amber-600">预警</p>
            </div>
            <div class="bg-red-50 rounded-lg p-2 text-center">
              <p class="text-xl font-bold text-red-600">{{ statsData.full + statsData.abnormal }}</p>
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
              v-for="bin in filteredBinPoints.slice(0, 30)"
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
                    {{ bin.communityName || '未知' }} · {{ bin.grid_code }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        class="h-1.5 rounded-full transition-all"
                        :style="{
                          width: `${bin.fill_level}%`,
                          backgroundColor: statusColors[bin.status as BinPointStatus]
                        }"
                      />
                    </div>
                    <span class="text-xs text-gray-500">{{ bin.fill_level }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 relative" style="min-height: 400px">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div class="text-center">
            <Loader2 class="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p class="text-sm text-gray-600">正在从 ClickHouse 加载数据...</p>
          </div>
        </div>

        <div ref="mapContainer" class="absolute inset-0" />

        <button
          class="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          @click="showSidebar = !showSidebar"
        >
          <Filter class="w-5 h-5 text-gray-600" />
        </button>

        <div v-if="lastSQL" class="absolute top-4 left-16 z-10 px-2 py-1 bg-teal-50 border border-teal-200 rounded text-xs text-teal-700 max-w-sm truncate">
          <Database class="w-3 h-3 inline mr-1" />
          {{ lastSQL.substring(0, 80) }}...
        </div>

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
                    {{ selectedBinPoint.communityName || '未知' }}
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
                  {{ statusLabels[selectedBinPoint.status as BinPointStatus] || selectedBinPoint.status }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">满载率</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.fill_level }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">垃圾桶数量</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.bin_count }} 个</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">空间索引</span>
                <span class="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{{ (selectedBinPoint.geo_hash || '').substring(0, 6) || getGeoHash(selectedBinPoint.lng, selectedBinPoint.lat, 6) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">网格编码</span>
                <span class="text-sm font-medium text-gray-900">{{ selectedBinPoint.grid_code }}</span>
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
