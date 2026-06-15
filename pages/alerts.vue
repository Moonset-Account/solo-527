<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">告警中心</h1>
        <p class="text-slate-500 mt-1">监控异常波动，及时处理问题</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex bg-slate-100 rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="activeTab === tab.value ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'fluctuations'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex gap-2">
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5"
              :class="statusFilter === filter.value ? 'bg-primary-50 text-primary-600 font-medium' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'"
              @click="statusFilter = filter.value"
            >
              {{ filter.label }}
              <span v-if="filter.count !== undefined" class="text-xs">({{ filter.count }})</span>
            </button>
          </div>

          <div class="w-px h-6 bg-slate-200"></div>

          <div class="flex gap-2">
            <button
              v-for="p in priorityFilters"
              :key="p.value"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="priorityFilter === p.value ? 'bg-' + p.color + '-100 text-' + p.color + '-600 font-medium' : 'bg-white border border-slate-200 text-slate-600 hover:border-' + p.color + '-300'"
              @click="priorityFilter = p.value"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜索异常..."
              class="input pl-9 w-60"
            />
          </div>
          <button class="btn-secondary flex items-center gap-1.5">
            <Filter class="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      <div class="grid gap-4">
        <div
          v-for="item in filteredFluctuations"
          :key="item.id"
          class="card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
          @click="viewDetail(item)"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="getPriorityBg(item.priority)">
                <AlertTriangle v-if="item.priority === 'high'" class="w-6 h-6" :class="getPriorityText(item.priority)" />
                <Activity v-else-if="item.priority === 'medium'" class="w-6 h-6" :class="getPriorityText(item.priority)" />
                <Info v-else class="w-6 h-6" :class="getPriorityText(item.priority)" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1">
                  <h3 class="text-base font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                    {{ item.title }}
                  </h3>
                  <span class="badge" :class="'badge-' + getStatusBadge(item.status)">
                    {{ getStatusText(item.status) }}
                  </span>
                  <span class="badge badge-secondary">
                    {{ getSourceText(item.source) }}
                  </span>
                </div>
                <p class="text-sm text-slate-600 mb-3">{{ item.readableReason }}</p>

                <div class="flex items-center gap-6 text-xs text-slate-500">
                  <div class="flex items-center gap-1.5">
                    <User class="w-3.5 h-3.5" />
                    <span>负责人：{{ item.assigneeName || '未分配' }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5" />
                    <span :class="isOverdue(item) ? 'text-danger-600 font-medium' : ''">
                      截止：{{ formatDeadline(item.deadline) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5" />
                    <span>发现于：{{ formatDate(item.detectedAt) }}</span>
                  </div>
                  <div v-if="item.deviation !== undefined" class="flex items-center gap-1.5">
                    <TrendingUp v-if="item.deviation > 0" class="w-3.5 h-3.5" :class="item.deviation > 0 ? 'text-success-500' : 'text-danger-500'" />
                    <TrendingDown v-else class="w-3.5 h-3.5" :class="item.deviation > 0 ? 'text-success-500' : 'text-danger-500'" />
                    <span :class="item.deviation > 0 ? 'text-success-600' : 'text-danger-600'" class="font-medium">
                      波动 {{ item.deviation > 0 ? '+' : '' }}{{ item.deviation }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                v-if="item.status === 'pending'"
                class="btn-primary btn-sm"
                @click.stop="startProcess(item)"
              >
                开始处理
              </button>
              <button
                v-if="item.status === 'processing'"
                class="btn-success btn-sm"
                @click.stop="closeFluctuation(item)"
              >
                关闭
              </button>
              <ChevronRight class="w-5 h-5 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredFluctuations.length === 0" class="card p-12 text-center">
        <CheckCircle class="w-16 h-16 text-success-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-slate-700 mb-1">暂无异常记录</h3>
        <p class="text-slate-500">所有指标运行正常，继续保持</p>
      </div>
    </div>

    <div v-if="activeTab === 'rules'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">共 {{ alertRules.length }} 条告警规则</p>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          新建规则
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="table-header">指标名称</th>
              <th class="table-header">规则类型</th>
              <th class="table-header">阈值配置</th>
              <th class="table-header">通知方式</th>
              <th class="table-header">负责人</th>
              <th class="table-header">状态</th>
              <th class="table-header text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="rule in alertRules" :key="rule.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="table-cell">
                <span class="font-medium text-slate-800">{{ rule.metricName }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ getRuleTypeText(rule.ruleType) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm">{{ formatThreshold(rule.thresholdConfig) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ getNotificationText(rule.notificationType) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ rule.assigneeName || '-' }}</span>
              </td>
              <td class="table-cell">
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="rule.enabled ? 'bg-success-500' : 'bg-slate-300'"
                  @click="toggleRule(rule)"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                    :class="rule.enabled ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
              </td>
              <td class="table-cell text-right">
                <button class="text-primary-500 hover:text-primary-600 text-sm font-medium">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'summary'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-500">管理摘要推送订阅</p>
        <button class="btn-primary flex items-center gap-1.5">
          <Plus class="w-4 h-4" />
          新建推送
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div v-for="push in summaryPushes" :key="push.id" class="card p-5">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="font-semibold text-slate-800">{{ push.name }}</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ push.frequency }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" :class="push.enabled ? 'badge-success' : 'badge-secondary'">
                {{ push.enabled ? '已启用' : '已停用' }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-xs text-slate-400 mb-1.5">包含指标</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="(metric, idx) in push.metricIds" :key="idx" class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                  {{ getMetricName(metric) }}
                </span>
              </div>
            </div>

            <div>
              <p class="text-xs text-slate-400 mb-1.5">推送类型</p>
              <span class="text-sm text-slate-600">{{ push.type === 'daily' ? '日报' : '周报' }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span class="text-xs text-slate-400">创建于 {{ formatDate(push.createdAt) }}</span>
            <div class="flex gap-2">
              <button class="text-sm text-slate-500 hover:text-slate-700">编辑</button>
              <button
                class="text-sm font-medium"
                :class="push.enabled ? 'text-danger-500 hover:text-danger-600' : 'text-success-500 hover:text-success-600'"
                @click="togglePush(push)"
              >
                {{ push.enabled ? '停用' : '启用' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle, Activity, Info, ChevronRight, User, Clock, Calendar,
  TrendingUp, TrendingDown, CheckCircle, Search, Filter, Plus
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { Fluctuation, AlertRule, SummaryPush } from '~/types'

const router = useRouter()

const tabs = [
  { value: 'fluctuations', label: '异常波动' },
  { value: 'rules', label: '告警规则' },
  { value: 'summary', label: '摘要推送' }
]

const activeTab = ref('fluctuations')

const statusFilters = [
  { value: 'all', label: '全部', count: undefined },
  { value: 'pending', label: '待处理', count: 5 },
  { value: 'processing', label: '处理中', count: 2 },
  { value: 'closed', label: '已关闭', count: 8 }
]

const priorityFilters = [
  { value: 'all', label: '全部优先级', color: 'slate' },
  { value: 'high', label: '高', color: 'danger' },
  { value: 'medium', label: '中', color: 'warning' },
  { value: 'low', label: '低', color: 'success' }
]

const statusFilter = ref('all')
const priorityFilter = ref('all')
const searchKeyword = ref('')

const fluctuations = ref<Fluctuation[]>([])
const alertRules = ref<AlertRule[]>([])
const summaryPushes = ref<SummaryPush[]>([])

const filteredFluctuations = computed(() => {
  let result = [...fluctuations.value]

  if (statusFilter.value !== 'all') {
    result = result.filter(f => f.status === statusFilter.value)
  }
  if (priorityFilter.value !== 'all') {
    result = result.filter(f => f.priority === priorityFilter.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(f =>
      f.title.toLowerCase().includes(keyword) ||
      f.readableReason.toLowerCase().includes(keyword)
    )
  }

  return result
})

const getPriorityBg = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-danger-50'
    case 'medium': return 'bg-warning-50'
    default: return 'bg-success-50'
  }
}

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'high': return 'text-danger-600'
    case 'medium': return 'text-warning-600'
    default: return 'text-success-600'
  }
}

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'primary'
    case 'closed': return 'success'
    default: return 'secondary'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'closed': return '已关闭'
    default: return status
  }
}

const getSourceText = (source: string): string => {
  switch (source) {
    case 'metric_monitor': return '指标监控'
    case 'api_error': return '接口错误'
    case 'manual': return '手动录入'
    default: return source
  }
}

const isOverdue = (item: Fluctuation): boolean => {
  if (item.status === 'closed' || !item.deadline) return false
  return dayjs(item.deadline).isBefore(dayjs())
}

const formatDeadline = (deadline?: string): string => {
  if (!deadline) return '-'
  const d = dayjs(deadline)
  if (d.isSame(dayjs(), 'day')) return '今天 ' + d.format('HH:mm')
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天 ' + d.format('HH:mm')
  return d.format('MM-DD HH:mm')
}

const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

const getRuleTypeText = (type: string): string => {
  switch (type) {
    case 'threshold': return '阈值告警'
    case 'fluctuation': return '波动告警'
    case 'trend': return '趋势告警'
    default: return type
  }
}

const formatThreshold = (config: Record<string, any>): string => {
  if (config.percentage) return `波动 ${config.direction === 'both' ? '±' : config.direction === 'up' ? '+' : '-'}${config.percentage}%`
  if (config.days) return `连续 ${config.days} 天 ${config.direction === 'down' ? '下降' : '上升'}`
  if (config.stdDeviations) return `${config.stdDeviations} 个标准差`
  if (config.maxErrorRate) return `错误率 > ${config.maxErrorRate}%`
  return '自定义配置'
}

const getNotificationText = (type: string): string => {
  switch (type) {
    case 'inapp': return '站内通知'
    case 'email': return '邮件'
    case 'both': return '站内+邮件'
    default: return type
  }
}

const getMetricName = (code: string): string => {
  const map: Record<string, string> = {
    'sales_amount': '销售额',
    'order_count': '订单量',
    'gross_margin': '毛利率',
    'avg_order_value': '客单价',
    'inventory_turnover': '库存周转率',
    'stock_level': '库存水平',
    'revenue': '营收',
    'cost': '成本',
    'profit': '利润'
  }
  return map[code] || code
}

const viewDetail = (item: Fluctuation) => {
  router.push(`/alerts/fluctuations/${item.id}`)
}

const startProcess = async (item: Fluctuation) => {
  try {
    await $fetch(`/api/alerts/fluctuations/${item.id}`, {
      method: 'PATCH',
      body: { status: 'processing' }
    })
    item.status = 'processing'
  } catch (e) {
    console.error('Failed to start processing:', e)
  }
}

const closeFluctuation = async (item: Fluctuation) => {
  const resolution = prompt('请输入关闭原因：')
  if (!resolution) return

  try {
    await $fetch(`/api/alerts/fluctuations/${item.id}/close`, {
      method: 'POST',
      body: { resolution }
    })
    item.status = 'closed'
    item.closedAt = new Date().toISOString()
    item.resolution = resolution
  } catch (e) {
    console.error('Failed to close fluctuation:', e)
  }
}

const toggleRule = (rule: AlertRule) => {
  rule.enabled = !rule.enabled
}

const togglePush = (push: SummaryPush) => {
  push.enabled = !push.enabled
}

const fetchData = async () => {
  try {
    const [fluctuationRes, rules, pushes] = await Promise.all([
      $fetch('/api/alerts/fluctuations'),
      $fetch('/api/alerts/rules'),
      $fetch('/api/alerts/summary-push')
    ])

    fluctuations.value = (fluctuationRes as any).items || []
    alertRules.value = rules as AlertRule[]
    summaryPushes.value = pushes as SummaryPush[]
  } catch (e) {
    console.error('Failed to fetch alerts data:', e)
  }
}

onMounted(() => {
  fetchData()
})

definePageMeta({
  layout: 'default'
})
</script>
