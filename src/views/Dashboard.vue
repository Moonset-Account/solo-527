<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import SampleSizeBadge from '@/components/common/SampleSizeBadge.vue'
import PermissionGuard from '@/components/common/PermissionGuard.vue'
import LowSampleTip from '@/components/common/LowSampleTip.vue'
import { RefreshCw, MapPin, Store, AlertCircle } from 'lucide-vue-next'
import { ElButton, ElSelect, ElOption, ElMessage, ElLoading } from 'element-plus'
import { REGIONS, STORES } from '@/utils/constants'

const dataStore = useDataStore()
const authStore = useAuthStore()
const isRefreshing = ref(false)

const totalSampleSize = computed(() => {
  const firstMetric = dataStore.coreMetrics[0]
  return firstMetric?.sampleSize || 0
})

const hasLowSample = computed(() => {
  return dataStore.coreMetrics.some(m => m.lowSample)
})

const currentStoreName = computed(() => {
  const storeId = authStore.user?.storeId
  if (!storeId) return ''
  const store = STORES.find(s => s.id === storeId)
  return store?.name || storeId
})

const availableStores = computed(() => {
  if (authStore.permissions.canViewAllStores) {
    return STORES
  }
  const storeId = authStore.user?.storeId
  if (storeId) {
    return STORES.filter(s => s.id === storeId)
  }
  return []
})

async function handleRefresh() {
  isRefreshing.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '正在刷新数据...',
    background: 'rgba(255, 255, 255, 0.7)'
  })
  
  try {
    await dataStore.refreshAll()
    ElMessage.success({
      message: `数据已刷新 · 查询耗时 ${dataStore.lastExecutionTime}ms`,
      duration: 2000
    })
  } catch (e) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.close()
    isRefreshing.value = false
  }
}

function handleStoreChange() {
  dataStore.loadStoreRank()
  dataStore.loadCoreMetrics()
  dataStore.loadPriceTrend()
}

onMounted(() => {
  if (dataStore.coreMetrics.length === 0) {
    dataStore.loadCoreMetrics()
    dataStore.loadPriceTrend()
    dataStore.loadStoreRank()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">数据概览</h2>
        <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <span>基于聚合统计数据</span>
          <SampleSizeBadge :sample-size="totalSampleSize" />
          <span v-if="!authStore.permissions.canViewAllStores" class="flex items-center gap-1 text-amber-600">
            <Store class="w-3.5 h-3.5" />
            仅查看: {{ currentStoreName }}
          </span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <PermissionGuard permission="canViewAllStores">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-gray-400" />
            <ElSelect
              v-model="dataStore.currentFilter.storeIds"
              size="small"
              placeholder="选择门店"
              style="width: 140px"
              multiple
              collapse-tags
              @change="handleStoreChange"
            >
              <ElOption
                v-for="store in availableStores"
                :key="store.id"
                :label="store.name"
                :value="store.id"
              />
            </ElSelect>
          </div>
        </PermissionGuard>
        <ElButton size="small" @click="handleRefresh" :loading="isRefreshing">
          <RefreshCw class="w-4 h-4 mr-1" />
          刷新数据
        </ElButton>
      </div>
    </div>

    <div v-if="hasLowSample">
      <LowSampleTip message="当前数据范围下部分指标样本量不足，结果仅供参考" />
    </div>

    <div v-if="!authStore.permissions.canViewAllStores" class="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2">
      <AlertCircle class="w-4 h-4 text-blue-500 flex-shrink-0" />
      <p class="text-sm text-blue-700">
        您当前为门店经理角色，仅可查看 <strong>{{ currentStoreName }}</strong> 的数据。如需查看更多门店数据，请联系大区运营。
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        v-for="metric in dataStore.coreMetrics"
        :key="metric.name"
        :name="metric.name"
        :value="metric.value"
        :unit="metric.unit"
        :trend="metric.trend"
        :sample-size="metric.sampleSize"
        :low-sample="metric.lowSample"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">客单价趋势</h3>
            <p class="text-xs text-gray-500 mt-0.5">近12个月客单价变化情况</p>
          </div>
          <SampleSizeBadge
            v-if="dataStore.priceTrend[0]"
            :sample-size="dataStore.priceTrend[0].sampleSize"
          />
        </div>
        <div class="h-72">
          <LineChart :data="dataStore.priceTrend" :height="280" />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">门店复购率排名</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ authStore.permissions.canViewAllStores ? '全部门店' : '当前门店' }}
            </p>
          </div>
        </div>
        <div class="space-y-3">
          <div
            v-for="(store, index) in dataStore.storeRank"
            :key="store.storeId"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              :class="[
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-500'
              ]"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ store.storeName }}</p>
              <p class="text-xs text-gray-500">{{ store.region }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold" :class="store.lowSample ? 'text-orange-500' : 'text-blue-600'">
                {{ store.lowSample ? 'n<10' : store.repurchaseRate + '%' }}
              </p>
              <p class="text-xs text-gray-400">n={{ store.sampleSize }}</p>
            </div>
          </div>
          <div v-if="dataStore.storeRank.length === 0" class="text-center py-8 text-gray-400 text-sm">
            暂无门店数据
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800">权限与隐私说明</h3>
          <p class="text-xs text-gray-500 mt-0.5">当前角色的数据访问范围</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-1">可查看门店</p>
          <p class="text-lg font-bold text-blue-600">
            {{ authStore.permissions.canViewAllStores ? '全部门店' : '仅本店' }}
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-1">导出权限</p>
          <p class="text-lg font-bold" :class="authStore.permissions.canExport ? 'text-green-600' : 'text-gray-400'">
            {{ authStore.permissions.canExport ? '允许' : '禁止' }}
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-1">个人信息查看</p>
          <p class="text-lg font-bold" :class="authStore.permissions.canViewPersonalData ? 'text-green-600' : 'text-orange-500'">
            {{ authStore.permissions.canViewPersonalData ? '允许' : '脱敏' }}
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-1">分类维护</p>
          <p class="text-lg font-bold" :class="authStore.permissions.canManageCategory ? 'text-green-600' : 'text-gray-400'">
            {{ authStore.permissions.canManageCategory ? '允许' : '只读' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
