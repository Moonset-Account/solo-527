<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPinCheck, Filter, Calendar, Plus, CheckCircle, Clock, XCircle } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { useUserStore } from '@/stores/user'
import type { ReturnVisit } from '@/types'

const dataStore = useDataStore()
const userStore = useUserStore()

const selectedCommunity = ref<string>('all')
const showAddVisitModal = ref(false)
const newVisit = ref({
  binPointId: '',
  issueType: '',
  rectification: ''
})

const issueTypes = ['误投率高', '桶满未清运', '设施损坏', '周边脏乱', '居民投诉']

const communityInspectionData = computed(() => {
  return dataStore.communities.map(comm => {
    const bins = dataStore.getBinPointsByCommunity(comm.id)
    const binIds = new Set(bins.map(b => b.id))
    const photos = dataStore.inspectionPhotos.filter(p => binIds.has(p.binPointId))
    const inspectedBinIds = new Set(photos.map(p => p.binPointId))
    const coverage = bins.length > 0 ? (inspectedBinIds.size / bins.length * 100) : 0

    const visits = dataStore.returnVisits.filter(v => binIds.has(v.binPointId))
    const pendingVisits = visits.filter(v => v.status === 'pending')

    return {
      id: comm.id,
      name: comm.name,
      district: comm.district,
      binCount: bins.length,
      inspectedCount: inspectedBinIds.size,
      coverage: parseFloat(coverage.toFixed(1)),
      photoCount: photos.length,
      visitCount: visits.length,
      pendingVisitCount: pendingVisits.length
    }
  }).sort((a, b) => b.coverage - a.coverage)
})

const filteredData = computed(() => {
  if (selectedCommunity.value === 'all') {
    return communityInspectionData.value
  }
  return communityInspectionData.value.filter(c => c.id === selectedCommunity.value)
})

const allVisits = computed(() => {
  let visits = dataStore.returnVisits

  if (selectedCommunity.value !== 'all') {
    const binIds = new Set(
      dataStore.getBinPointsByCommunity(selectedCommunity.value).map(b => b.id)
    )
    visits = visits.filter(v => binIds.has(v.binPointId))
  }

  return visits.sort((a, b) => new Date(b.visitTime).getTime() - new Date(a.visitTime).getTime())
})

const summary = computed(() => {
  const totalBins = dataStore.binPoints.length
  const inspectedBins = new Set(dataStore.inspectionPhotos.map(p => p.binPointId)).size
  const coverage = totalBins > 0 ? (inspectedBins / totalBins * 100).toFixed(1) : '0'

  return {
    totalBins,
    inspectedBins,
    coverage,
    totalPhotos: dataStore.inspectionPhotos.length,
    pendingVisits: dataStore.returnVisits.filter(v => v.status === 'pending').length,
    completedVisits: dataStore.returnVisits.filter(v => v.status === 'completed').length
  }
})

function getBinName(binPointId: string) {
  return dataStore.getBinPointById(binPointId)?.name || '未知'
}

function handleAddVisit() {
  if (!newVisit.value.binPointId || !newVisit.value.issueType) return

  dataStore.addReturnVisit(
    newVisit.value.binPointId,
    userStore.currentUser?.name || '系统',
    newVisit.value.issueType,
    newVisit.value.rectification
  )

  newVisit.value = { binPointId: '', issueType: '', rectification: '' }
  showAddVisitModal.value = false
}

function markVisitCompleted(visitId: string) {
  dataStore.updateReturnVisitStatus(visitId, 'completed')
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPinCheck class="w-7 h-7 text-green-500" />
          巡查覆盖管理
        </h1>
        <p class="text-gray-500 mt-1">管理桶点巡查覆盖和异常点回访</p>
      </div>
      <button class="btn-primary" @click="showAddVisitModal = true">
        <Plus class="w-4 h-4 mr-1" />
        添加回访记录
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">桶点总数</p>
        <p class="text-2xl font-bold text-gray-900">{{ summary.totalBins }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">已巡查</p>
        <p class="text-2xl font-bold text-green-600">{{ summary.inspectedBins }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">巡查覆盖率</p>
        <p class="text-2xl font-bold text-teal-600">{{ summary.coverage }}%</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500 mb-1">待回访</p>
        <p class="text-2xl font-bold text-amber-600">{{ summary.pendingVisits }}</p>
      </div>
    </div>

    <div class="card p-4 mb-6">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-600">社区</span>
          <select v-model="selectedCommunity" class="select !py-1 !text-sm !w-48">
            <option value="all">全部社区</option>
            <option v-for="c in dataStore.communities" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden mb-6">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">社区巡查覆盖率</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">社区</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">行政区</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">桶点总数</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">已巡查</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">覆盖率</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">照片数</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">待回访</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="comm in filteredData" :key="comm.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ comm.name }}</td>
              <td class="px-4 py-3 text-gray-600">{{ comm.district }}</td>
              <td class="px-4 py-3 text-center text-gray-600">{{ comm.binCount }}</td>
              <td class="px-4 py-3 text-center text-gray-600">{{ comm.inspectedCount }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-24 bg-gray-100 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="[
                        comm.coverage >= 90 ? 'bg-green-500' :
                        comm.coverage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                      ]"
                      :style="{ width: `${comm.coverage}%` }"
                    />
                  </div>
                  <span class="text-xs font-medium text-gray-700 w-10">{{ comm.coverage }}%</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center text-gray-600">{{ comm.photoCount }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="comm.pendingVisitCount > 0" class="badge-warning">
                  {{ comm.pendingVisitCount }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">回访记录</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">桶点</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">问题类型</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">回访人</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">回访时间</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">整改情况</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="visit in allVisits" :key="visit.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span :class="visit.status === 'completed' ? 'badge-success' : 'badge-warning'">
                  {{ visit.status === 'completed' ? '已完成' : '待处理' }}
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ getBinName(visit.binPointId) }}</td>
              <td class="px-4 py-3 text-gray-600">{{ visit.issueType }}</td>
              <td class="px-4 py-3 text-gray-600">{{ visit.visitor }}</td>
              <td class="px-4 py-3 text-gray-600">
                {{ new Date(visit.visitTime).toLocaleString('zh-CN') }}
              </td>
              <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ visit.rectification }}</td>
              <td class="px-4 py-3">
                <button
                  v-if="visit.status === 'pending'"
                  class="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                  @click="markVisitCompleted(visit.id)"
                >
                  <CheckCircle class="w-4 h-4" />
                  标记完成
                </button>
                <span v-else class="text-gray-400 text-sm">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showAddVisitModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAddVisitModal = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">添加回访记录</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">桶点</label>
              <select v-model="newVisit.binPointId" class="select">
                <option value="">请选择桶点</option>
                <option v-for="bin in dataStore.binPoints" :key="bin.id" :value="bin.id">
                  {{ bin.name }} - {{ dataStore.getCommunityById(bin.communityId)?.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
              <select v-model="newVisit.issueType" class="select">
                <option value="">请选择问题类型</option>
                <option v-for="type in issueTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">整改情况</label>
              <textarea
                v-model="newVisit.rectification"
                class="input min-h-[80px] resize-none"
                placeholder="描述整改情况或计划"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button class="btn-secondary flex-1" @click="showAddVisitModal = false">
              取消
            </button>
            <button
              class="btn-primary flex-1"
              :disabled="!newVisit.binPointId || !newVisit.issueType"
              @click="handleAddVisit"
            >
              添加记录
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
