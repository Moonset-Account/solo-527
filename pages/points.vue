<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">点位地图</h2>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="map-container relative">
        <div class="absolute inset-0 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <div class="text-6xl mb-4">🗺️</div>
            <p class="text-lg">点位分布示意图</p>
            <p class="text-sm text-gray-400 mt-2">（接入真实地图 API 后可显示实际地图）</p>
          </div>
        </div>
        <div
          v-for="(point, index) in points"
          :key="point._id"
          class="map-marker"
          :style="getMarkerPosition(point, index)"
          @click="selectedPoint = point"
        >
          <div class="relative">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg border-2 border-white">
              📍
            </div>
            <div class="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
              {{ point.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">点位列表</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">点位名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">地址</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">社区</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">垃圾桶类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">物业公司</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">联系人</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point._id" class="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" @click="selectedPoint = point">
              <td class="py-3 px-4 text-sm text-gray-800 font-medium">{{ point.name }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ point.address }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ point.community }}</td>
              <td class="py-3 px-4 text-sm">
                <div class="flex flex-wrap gap-1">
                  <span v-for="bt in point.binTypes" :key="bt" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {{ bt }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ point.propertyCompany }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ point.contactPerson }}
                <span class="text-gray-400 text-xs block">{{ point.contactPhone }}</span>
              </td>
              <td class="py-3 px-4 text-sm">
                <span :class="point.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" class="px-2 py-1 text-xs rounded-full">
                  {{ point.status === 'active' ? '正常' : point.status === 'maintenance' ? '维护中' : '停用' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="selectedPoint" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="selectedPoint = null">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">{{ selectedPoint.name }}</h3>
          <button @click="selectedPoint = null" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <p class="text-sm text-gray-500">地址</p>
            <p class="text-gray-800">{{ selectedPoint.address }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">社区</p>
            <p class="text-gray-800">{{ selectedPoint.community }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">垃圾桶类型</p>
            <div class="flex flex-wrap gap-2 mt-1">
              <span v-for="bt in selectedPoint.binTypes" :key="bt" class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                {{ bt }}
              </span>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500">物业公司</p>
            <p class="text-gray-800">{{ selectedPoint.propertyCompany }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">联系方式</p>
            <p class="text-gray-800">{{ selectedPoint.contactPerson }} - {{ selectedPoint.contactPhone }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">经纬度</p>
            <p class="text-gray-600 text-sm font-mono">
              {{ selectedPoint.location.coordinates[1] }}, {{ selectedPoint.location.coordinates[0] }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Point } from '~/types'

const points = ref<Point[]>([])
const selectedPoint = ref<Point | null>(null)

const fetchPoints = async () => {
  try {
    const data = await $fetch<{ points: Point[] }>('/api/points?limit=100')
    points.value = data.points
  } catch (e) {
    console.error('Failed to fetch points:', e)
  }
}

const getMarkerPosition = (point: Point, index: number) => {
  const baseLng = 116.4074
  const baseLat = 39.9042
  const lng = point.location.coordinates[0]
  const lat = point.location.coordinates[1]
  
  const x = 50 + (lng - baseLng) * 5000
  const y = 50 - (lat - baseLat) * 5000
  
  return {
    left: `${Math.max(10, Math.min(90, x))}%`,
    top: `${Math.max(10, Math.min(90, y))}%`
  }
}

onMounted(() => {
  fetchPoints()
})
</script>
