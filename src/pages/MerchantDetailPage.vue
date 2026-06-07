<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="p-2 rounded-lg hover:bg-[#F2F3F5] transition-colors">
          <ArrowLeft class="w-5 h-5 text-[#4E5969]" />
        </button>
        <div>
          <h1 class="page-title">{{ merchant?.name || '商户详情' }}</h1>
          <p class="page-subtitle flex items-center gap-2">
            <MapPin class="w-4 h-4" />
            {{ merchant?.address }}
            <span class="mx-2">·</span>
            {{ merchant?.businessDistrict }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="primary" @click="showAddRect = true">
          <span class="flex items-center gap-1">
            <Plus class="w-4 h-4" />
            添加整改备注
          </span>
        </el-button>
        <el-button @click="exportOrders">
          <span class="flex items-center gap-1">
            <Download class="w-4 h-4" />
            导出报表
          </span>
        </el-button>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-5">
      <span class="text-sm text-[#86909C]">筛选：</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="small"
        value-format="YYYY-MM-DD"
        @change="handleDateChange"
      />
      <el-select
        v-model="selectedWeather"
        multiple
        placeholder="天气"
        size="small"
        style="width: 140px"
        @change="handleFilterChange"
      >
        <el-option v-for="w in WEATHER_OPTIONS" :key="w.value" :label="w.label" :value="w.value" />
      </el-select>
      <el-select
        v-model="selectedPeriod"
        multiple
        placeholder="时段"
        size="small"
        style="width: 150px"
        @change="handleFilterChange"
      >
        <el-option v-for="p in TIME_PERIOD_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
      </el-select>
      <el-button size="small" :loading="store.isLoading" @click="refreshMerchantData">
        <RefreshCw class="w-4 h-4 mr-1" />
        刷新
      </el-button>
    </div>

    <div class="grid grid-cols-5 gap-4 mb-5">
      <div class="stat-card col-span-1">
        <div class="text-center">
          <div class="text-xs text-[#86909C] mb-1">接单→备餐开始</div>
          <div class="stat-value text-[#165DFF]">
            {{ metrics.avgPrepTime }}<span class="text-sm font-normal">分钟</span>
          </div>
          <div class="text-xs text-[#86909C] mt-1">商户备餐时长</div>
        </div>
      </div>
      <div class="stat-card col-span-1">
        <div class="text-center">
          <div class="text-xs text-[#86909C] mb-1">骑手到店→取餐</div>
          <div class="stat-value text-[#FF7D00]">
            {{ metrics.avgWaitTime }}<span class="text-sm font-normal">分钟</span>
          </div>
          <div class="text-xs text-[#86909C] mt-1">骑手等待时长</div>
        </div>
      </div>
      <div class="stat-card col-span-1">
        <div class="text-center">
          <div class="text-xs text-[#86909C] mb-1">订单总量</div>
          <div class="stat-value text-[#00B42A]">{{ metrics.orderCount }}</div>
          <div class="text-xs text-[#86909C] mt-1">统计周期内</div>
        </div>
      </div>
      <div class="stat-card col-span-1">
        <div class="text-center">
          <div class="text-xs text-[#86909C] mb-1">超时率</div>
          <div class="stat-value text-[#FF7D00]">{{ metrics.timeoutRate }}%</div>
          <div class="text-xs text-[#86909C] mt-1">出餐超时占比</div>
        </div>
      </div>
      <div class="stat-card col-span-1">
        <div class="text-center">
          <div class="text-xs text-[#86909C] mb-1">退款率</div>
          <div class="stat-value text-[#F53F3F]">{{ metrics.refundRate }}%</div>
          <div class="text-xs text-[#86909C] mt-1">出餐相关退款</div>
        </div>
      </div>
    </div>

    <div class="card p-5 mb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="section-title mb-0">
          <Clock class="w-5 h-5 text-[#165DFF]" />
          订单流转时间轴（平均）
        </h3>
        <div class="flex items-center gap-2" v-if="dataGapOrders.length > 0">
          <AlertCircle class="w-4 h-4 text-[#FF7D00]" />
          <span class="text-xs text-[#FF7D00]">
            {{ dataGapOrders.length }} 条订单缺少骑手到店时间，已排除等待均值
          </span>
        </div>
      </div>
      <div class="flex items-center justify-between px-8 py-6">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-[#E8F3FF] flex items-center justify-center mb-2">
            <ClipboardList class="w-6 h-6 text-[#165DFF]" />
          </div>
          <span class="text-sm font-medium text-[#1D2129]">用户下单</span>
          <span class="text-xs text-[#86909C] mt-1">{{ formatTime(mockOrderTimes.create) }}</span>
        </div>
        <div class="flex-1 flex items-center mx-4">
          <div class="flex-1 h-1 bg-[#E5E6EB] rounded-full relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#165DFF]"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#165DFF]"></div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-[#F2F3F5] rounded text-xs text-[#86909C]">
            ~1分钟
          </div>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-[#E8FFEA] flex items-center justify-center mb-2">
            <Check class="w-6 h-6 text-[#00B42A]" />
          </div>
          <span class="text-sm font-medium text-[#1D2129]">商户接单</span>
          <span class="text-xs text-[#86909C] mt-1">{{ formatTime(mockOrderTimes.accept) }}</span>
        </div>
        <div class="flex-1 flex items-center mx-4 relative">
          <div class="flex-1 h-1 bg-[#165DFF] rounded-full relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#165DFF]"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#165DFF]"></div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-[#165DFF]/10 rounded text-xs text-[#165DFF] font-medium">
            备餐 {{ metrics.avgPrepTime }} 分钟
          </div>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-[#FFF7E8] flex items-center justify-center mb-2">
            <ChefHat class="w-6 h-6 text-[#FF7D00]" />
          </div>
          <span class="text-sm font-medium text-[#1D2129]">开始备餐</span>
          <span class="text-xs text-[#86909C] mt-1">{{ formatTime(mockOrderTimes.prep) }}</span>
        </div>
        <div class="flex-1 flex items-center mx-4 relative">
          <div class="flex-1 h-1 bg-[#E5E6EB] rounded-full relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#E5E6EB]"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#FF7D00]"></div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-[#F2F3F5] rounded text-xs text-[#86909C]">
            ~5分钟
          </div>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-[#FFF7E8] flex items-center justify-center mb-2">
            <Bike class="w-6 h-6 text-[#FF7D00]" />
          </div>
          <span class="text-sm font-medium text-[#1D2129]">骑手到店</span>
          <span class="text-xs text-[#86909C] mt-1">{{ formatTime(mockOrderTimes.rider) }}</span>
        </div>
        <div class="flex-1 flex items-center mx-4 relative">
          <div class="flex-1 h-1 bg-[#FF7D00] rounded-full relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#FF7D00]"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#FF7D00]"></div>
          </div>
          <div class="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FF7D00]/10 rounded text-xs text-[#FF7D00] font-medium">
            等待 {{ metrics.avgWaitTime }} 分钟
          </div>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-[#E8FFEA] flex items-center justify-center mb-2">
            <Package class="w-6 h-6 text-[#00B42A]" />
          </div>
          <span class="text-sm font-medium text-[#1D2129]">骑手取餐</span>
          <span class="text-xs text-[#86909C] mt-1">{{ formatTime(mockOrderTimes.pickup) }}</span>
        </div>
      </div>
      <div class="flex items-center justify-center gap-4 pt-4 border-t border-[#E5E6EB]">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-[#165DFF]"></div>
          <span class="text-xs text-[#86909C]">商户备餐阶段</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-[#FF7D00]"></div>
          <span class="text-xs text-[#86909C]">骑手等待阶段</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-8">
        <div class="card p-5 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <TrendingUp class="w-5 h-5 text-[#165DFF]" />
              出餐时长趋势
            </h3>
            <el-radio-group v-model="trendDays" size="small" @change="handleTrendDaysChange">
              <el-radio-button :value="7">近7天</el-radio-button>
              <el-radio-button :value="14">近14天</el-radio-button>
              <el-radio-button :value="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <BaseChart :option="trendChartOption" height="300px" />
        </div>

        <div class="card p-5 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <List class="w-5 h-5 text-[#165DFF]" />
              订单明细
            </h3>
            <div class="flex items-center gap-2">
              <el-tag size="small" @close="filterTimeout = false" v-if="filterTimeout" closable>
                仅看异常
              </el-tag>
              <el-button
                size="small"
                @click="filterTimeout = !filterTimeout"
                :type="filterTimeout ? 'primary' : 'default'"
              >
                <AlertTriangle class="w-4 h-4 mr-1" />
                异常订单
              </el-button>
            </div>
          </div>
          <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <div
              v-for="order in filteredOrders"
              :key="order.id"
              class="p-4 rounded-lg border transition-all"
              :class="getOrderBorderClass(order)"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-sm font-medium text-[#1D2129]">{{ order.orderNo }}</span>
                  <span class="tag tag-info">{{ getWeatherLabel(order.weather) }}</span>
                  <span class="tag tag-info">{{ getPeriodLabel(order.timePeriod) }}</span>
                  <span v-if="order.hasDataGap" class="tag tag-warning">数据缺口(无骑手到店时间)</span>
                  <span v-if="order.isTimeout" class="tag tag-danger">超时</span>
                  <span v-if="order.hasRefund" class="tag tag-danger">已退款</span>
                </div>
                <span class="text-xs text-[#86909C]">{{ formatDateTime(order.createTime) }}</span>
              </div>
              <div class="flex items-center gap-6 text-sm flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="text-[#86909C]">备餐：</span>
                  <span class="font-medium" :class="order.prepDuration > 15 ? 'text-[#FF7D00]' : 'text-[#00B42A]'">
                    {{ order.prepDuration }} 分钟
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[#86909C]">等待：</span>
                  <span
                    class="font-medium"
                    :class="order.waitDuration && order.waitDuration > 10 ? 'text-[#FF7D00]' : 'text-[#00B42A]'"
                  >
                    {{ order.waitDuration !== undefined ? order.waitDuration + ' 分钟' : '不计入统计' }}
                  </span>
                </div>
                <div v-if="order.timeoutReason" class="flex items-center gap-2">
                  <span class="text-[#86909C]">原因：</span>
                  <span class="text-[#4E5969]">{{ order.timeoutReason }}</span>
                </div>
              </div>
              <div v-if="order.riderRemark" class="mt-3 pt-3 border-t border-dashed border-[#E5E6EB]">
                <div class="flex items-start gap-2">
                  <MessageSquare class="w-4 h-4 text-[#86909C] mt-0.5 flex-shrink-0" />
                  <span class="text-sm text-[#4E5969]">骑手备注：{{ order.riderRemark }}</span>
                </div>
              </div>
              <div v-if="order.refundReason" class="mt-2">
                <div class="flex items-start gap-2">
                  <RotateCcw class="w-4 h-4 text-[#F53F3F] mt-0.5 flex-shrink-0" />
                  <span class="text-sm text-[#F53F3F]">退款原因：{{ order.refundReason }}</span>
                </div>
              </div>
            </div>
            <div v-if="filteredOrders.length === 0" class="text-center py-12 text-[#86909C]">
              暂无订单数据
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <div class="card p-5 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <FileText class="w-5 h-5 text-[#165DFF]" />
              整改记录
            </h3>
            <span class="text-xs text-[#86909C]">最近{{ rectifications.length }}次</span>
          </div>
          <div class="space-y-4">
            <div
              v-for="(rect, index) in rectifications"
              :key="rect.id"
              class="p-4 rounded-lg bg-[#F7F8FA] border border-[#E5E6EB]"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-[#86909C]">{{ formatDateTime(rect.createTime) }}</span>
                <span class="text-xs text-[#165DFF]">{{ rect.operator }}</span>
              </div>
              <p class="text-sm text-[#1D2129] mb-3">{{ rect.content }}</p>
              <div v-if="rect.beforeMetrics && rect.afterMetrics" class="grid grid-cols-2 gap-3">
                <div class="p-2 rounded bg-white text-center">
                  <div class="text-xs text-[#86909C] mb-1">整改前</div>
                  <div class="text-sm font-semibold text-[#FF7D00]">
                    {{ rect.beforeMetrics.avgPrepTime + rect.beforeMetrics.avgWaitTime }} 分钟
                  </div>
                  <div class="text-xs text-[#86909C]">
                    超时率 {{ rect.beforeMetrics.timeoutRate }}%
                  </div>
                </div>
                <div class="p-2 rounded bg-white text-center">
                  <div class="text-xs text-[#86909C] mb-1">整改后</div>
                  <div class="text-sm font-semibold text-[#00B42A]">
                    {{ rect.afterMetrics.avgPrepTime + rect.afterMetrics.avgWaitTime }} 分钟
                  </div>
                  <div class="text-xs text-[#86909C]">
                    超时率 {{ rect.afterMetrics.timeoutRate }}%
                  </div>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-center" v-if="getImprovement(rect) !== 0">
                <span v-if="getImprovement(rect) > 0" class="text-xs text-[#00B42A] font-medium">
                  ↓ 下降 {{ getImprovement(rect) }}%
                </span>
                <span v-else class="text-xs text-[#F53F3F] font-medium">
                  ↑ 上升 {{ Math.abs(getImprovement(rect)) }}%
                </span>
              </div>
            </div>
            <div v-if="rectifications.length === 0" class="text-center py-8 text-[#86909C]">
              暂无整改记录
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="section-title">
            <PieChart class="w-5 h-5 text-[#165DFF]" />
            超时原因分布
          </h3>
          <BaseChart :option="reasonPieOption" height="250px" />
          <div class="mt-4 space-y-2">
            <div v-for="reason in timeoutReasons.slice(0, 5)" :key="reason.reason" class="flex items-center justify-between">
              <span class="text-sm text-[#4E5969]">{{ reason.reason }}</span>
              <div class="flex items-center gap-2">
                <div class="w-20 h-1.5 bg-[#F2F3F5] rounded-full overflow-hidden">
                  <div
                    class="h-full bg-[#165DFF] rounded-full"
                    :style="{ width: `${reason.percentage}%` }"
                  ></div>
                </div>
                <span class="text-xs text-[#86909C] w-10 text-right">{{ reason.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAddRect" title="添加整改备注" width="500px">
      <el-form :model="rectForm" label-width="80px">
        <el-form-item label="整改内容">
          <el-input
            v-model="rectForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入整改措施和要求"
          />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="rectForm.operator" placeholder="请输入操作人姓名" />
        </el-form-item>
        <div class="text-xs text-[#86909C] px-3 pb-2">
          提示：系统将自动计算整改前 14 天和整改后 14 天的出餐时长进行对比
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showAddRect = false">取消</el-button>
        <el-button type="primary" @click="submitRectification" :disabled="!rectForm.content || !rectForm.operator">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { WEATHER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/constants'
import { formatTime, formatDateTime, exportToCSV, generateTrendData } from '@/utils/dataProcessor'
import BaseChart from '@/components/BaseChart.vue'
import type { Order, Rectification } from '@/types'
import {
  ArrowLeft,
  MapPin,
  Plus,
  Download,
  Clock,
  ClipboardList,
  Check,
  ChefHat,
  Bike,
  Package,
  TrendingUp,
  List,
  AlertTriangle,
  MessageSquare,
  FileText,
  PieChart,
  RotateCcw,
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const trendDays = ref(7)
const filterTimeout = ref(false)
const showAddRect = ref(false)
const rectForm = ref({
  content: '',
  operator: ''
})

const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])
const selectedWeather = ref<string[]>([])
const selectedPeriod = ref<string[]>([])

const mockOrderTimes = {
  create: '2024-01-15 12:00:00',
  accept: '2024-01-15 12:01:00',
  prep: '2024-01-15 12:02:00',
  rider: '2024-01-15 12:07:00',
  pickup: '2024-01-15 12:12:00'
}

onMounted(async () => {
  const merchantId = route.params.id as string
  await store.initialize()
  store.setSelectedMerchant(merchantId)
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      store.setSelectedMerchant(newId as string)
    }
  }
)

const merchant = computed(() => store.selectedMerchant)
const metrics = computed(() => store.merchantMetrics)
const orders = computed(() => store.merchantOrders)
const rectifications = computed(() => store.merchantRectifications)
const timeoutReasons = computed(() => store.timeoutReasons)
const dataGapOrders = computed(() => store.dataGapOrders)
const trendData = computed(() => generateTrendData(orders.value, trendDays.value))

const filteredOrders = computed(() => {
  if (!filterTimeout.value) return orders.value.slice(0, 30)
  return orders.value.filter(o => o.isTimeout || o.hasRefund || o.hasDataGap).slice(0, 30)
})

const trendChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E6EB',
      borderWidth: 1,
      textStyle: { color: '#1D2129' }
    },
    legend: {
      data: ['备餐时长', '骑手等待时长'],
      bottom: 0,
      textStyle: { fontSize: 12, color: '#86909C' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map(d => d.date),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    series: [
      {
        name: '备餐时长',
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.avgPrepTime),
        lineStyle: { color: '#165DFF', width: 2 },
        itemStyle: { color: '#165DFF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 93, 255, 0.2)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.02)' }
            ]
          }
        }
      },
      {
        name: '骑手等待时长',
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.avgWaitTime),
        lineStyle: { color: '#FF7D00', width: 2 },
        itemStyle: { color: '#FF7D00' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 125, 0, 0.2)' },
              { offset: 1, color: 'rgba(255, 125, 0, 0.02)' }
            ]
          }
        }
      }
    ]
  }
})

const reasonPieOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        data: timeoutReasons.value.slice(0, 6).map((r, i) => ({
          value: r.count,
          name: r.reason,
          itemStyle: {
            color: ['#165DFF', '#FF7D00', '#00B42A', '#F53F3F', '#722ED1', '#14C9C9'][i]
          }
        }))
      }
    ]
  }
})

function goBack() {
  router.back()
}

function getOrderBorderClass(order: Order): string {
  if (order.hasDataGap) return 'border-[#FF7D00] bg-[#FFF7E8]/30'
  if (order.isTimeout) return 'border-[#F53F3F] bg-[#FFECE8]/30'
  if (order.hasRefund) return 'border-[#F53F3F] bg-[#FFECE8]/30'
  return 'border-[#E5E6EB] hover:border-[#165DFF]'
}

function getWeatherLabel(value: string): string {
  return WEATHER_OPTIONS.find(w => w.value === value)?.label || value
}

function getPeriodLabel(value: string): string {
  return TIME_PERIOD_OPTIONS.find(p => p.value === value)?.label || value
}

function getImprovement(rect: Rectification): number {
  if (!rect.beforeMetrics || !rect.afterMetrics) return 0
  const before = rect.beforeMetrics.avgPrepTime + rect.beforeMetrics.avgWaitTime
  const after = rect.afterMetrics.avgPrepTime + rect.afterMetrics.avgWaitTime
  if (before === 0) return 0
  return Math.round(((before - after) / before) * 100)
}

function submitRectification() {
  if (!rectForm.value.content || !rectForm.value.operator) return
  const merchantId = route.params.id as string
  store.addRectification(merchantId, rectForm.value.content, rectForm.value.operator)
  showAddRect.value = false
  rectForm.value = { content: '', operator: '' }
}

function exportOrders() {
  exportToCSV(orders.value, `${merchant.value?.name || '商户'}_订单明细.csv`)
}

async function handleDateChange(val: [string, string] | null) {
  if (val && val[0] && val[1]) {
    await store.updateFilter({
      timeRange: { start: val[0], end: val[1] }
    })
  }
}

async function handleFilterChange() {
  await store.updateFilter({
    weather: selectedWeather.value,
    timePeriod: selectedPeriod.value
  })
}

function handleTrendDaysChange() {
  // trendDays is reactive, trendData computed will update automatically
}

async function refreshMerchantData() {
  const merchantId = route.params.id as string
  await store.loadMerchantOrders(merchantId)
}
</script>
