<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
} from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Pagination from '@/components/common/Pagination.vue'
import Modal from '@/components/common/Modal.vue'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Item, ReviewConclusion, User, Department, Review } from '@/types'

const activeTab = ref<'review' | 'responsibility' | 'overdue'>('review')

const reviewFilter = ref<'all' | 'pending' | 'completed'>('all')
const reviewPage = ref(1)
const reviewPageSize = ref(10)
const items = ref<(Item & { review?: Review })[]>([])
const totalItems = ref(0)
const editingId = ref<string | null>(null)
const editingConclusion = ref<ReviewConclusion>('completed')
const editingRemark = ref('')
const selectedIds = ref<string[]>([])
const batchModalVisible = ref(false)
const batchConclusion = ref<ReviewConclusion>('completed')
const batchRemark = ref('')

const responsibilityTimeRange = ref<'week' | 'month'>('week')

const overdueTimeRange = ref<'week' | 'month'>('week')
const overduePage = ref(1)
const overduePageSize = ref(10)

const reviewTemplates = [
  { value: 'completed', label: '已完成', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'partial', label: '部分完成', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'incomplete', label: '未完成', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'escalated', label: '需升级处理', color: 'bg-orange-50 text-orange-700 border-orange-200' },
]

const mockItems: (Item & { review?: Review })[] = [
  {
    _id: '1',
    title: '2024年度预算编制',
    description: '',
    status: 'completed',
    priority: 'high',
    department: { _id: 'd1', name: '财务部', head: '', createdAt: '', updatedAt: '' },
    assignee: { _id: 'u1', name: '张三', username: '', role: 'pm', department: '', status: 'active', createdAt: '', updatedAt: '' },
    deadline: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-20',
    completedAt: '2024-12-20',
    review: {
      _id: 'r1',
      itemId: '1',
      conclusion: 'completed',
      remark: '按时完成，数据准确',
      operator: 'u2',
      createdAt: '2024-12-21',
      updatedAt: '2024-12-21',
    },
  },
  {
    _id: '2',
    title: '新系统上线项目',
    description: '',
    status: 'completed',
    priority: 'urgent',
    department: { _id: 'd2', name: '技术部', head: '', createdAt: '', updatedAt: '' },
    assignee: { _id: 'u2', name: '李四', username: '', role: 'pm', department: '', status: 'active', createdAt: '', updatedAt: '' },
    deadline: '2024-11-30',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-05',
    completedAt: '2024-12-05',
  },
  {
    _id: '3',
    title: '市场推广活动策划',
    description: '',
    status: 'in_progress',
    priority: 'medium',
    department: { _id: 'd3', name: '市场部', head: '', createdAt: '', updatedAt: '' },
    assignee: { _id: 'u3', name: '王五', username: '', role: 'pm', department: '', status: 'active', createdAt: '', updatedAt: '' },
    deadline: '2024-12-15',
    createdAt: '2024-02-01',
    updatedAt: '2024-12-10',
  },
  {
    _id: '4',
    title: '人事管理制度修订',
    description: '',
    status: 'overdue',
    priority: 'high',
    department: { _id: 'd4', name: '人事部', head: '', createdAt: '', updatedAt: '' },
    assignee: { _id: 'u4', name: '赵六', username: '', role: 'pm', department: '', status: 'active', createdAt: '', updatedAt: '' },
    deadline: '2024-11-15',
    createdAt: '2024-02-15',
    updatedAt: '2024-11-10',
  },
  {
    _id: '5',
    title: '季度财务审计',
    description: '',
    status: 'completed',
    priority: 'high',
    department: { _id: 'd1', name: '财务部', head: '', createdAt: '', updatedAt: '' },
    assignee: { _id: 'u1', name: '张三', username: '', role: 'pm', department: '', status: 'active', createdAt: '', updatedAt: '' },
    deadline: '2024-10-31',
    createdAt: '2024-03-01',
    updatedAt: '2024-10-28',
    completedAt: '2024-10-28',
    review: {
      _id: 'r2',
      itemId: '5',
      conclusion: 'partial',
      remark: '部分数据需要核实',
      operator: 'u2',
      createdAt: '2024-11-01',
      updatedAt: '2024-11-01',
    },
  },
]

const departmentStats = [
  { name: '财务部', count: 25, color: '#1E3A5F' },
  { name: '技术部', count: 35, color: '#3B82F6' },
  { name: '市场部', count: 20, color: '#10B981' },
  { name: '人事部', count: 15, color: '#F59E0B' },
  { name: '运营部', count: 18, color: '#8B5CF6' },
]

const personStats = [
  { name: '张三', total: 12, overdue: 1, closed: 10, avgDays: 8.5 },
  { name: '李四', total: 18, overdue: 3, closed: 14, avgDays: 10.2 },
  { name: '王五', total: 8, overdue: 0, closed: 7, avgDays: 6.3 },
  { name: '赵六', total: 15, overdue: 5, closed: 9, avgDays: 12.8 },
  { name: '钱七', total: 10, overdue: 1, closed: 8, avgDays: 7.6 },
]

const weeklyOverdueData = [
  { period: '第1周', total: 12, overdue: 1 },
  { period: '第2周', total: 15, overdue: 2 },
  { period: '第3周', total: 18, overdue: 1 },
  { period: '第4周', total: 20, overdue: 3 },
  { period: '第5周', total: 22, overdue: 2 },
  { period: '第6周', total: 25, overdue: 4 },
  { period: '第7周', total: 28, overdue: 3 },
  { period: '第8周', total: 30, overdue: 5 },
  { period: '第9周', total: 27, overdue: 2 },
  { period: '第10周', total: 32, overdue: 6 },
  { period: '第11周', total: 35, overdue: 4 },
  { period: '第12周', total: 38, overdue: 3 },
]

const monthlyOverdueData = [
  { period: '1月', total: 45, overdue: 5 },
  { period: '2月', total: 52, overdue: 6 },
  { period: '3月', total: 58, overdue: 8 },
  { period: '4月', total: 65, overdue: 7 },
  { period: '5月', total: 70, overdue: 5 },
  { period: '6月', total: 75, overdue: 9 },
  { period: '7月', total: 80, overdue: 6 },
  { period: '8月', total: 85, overdue: 8 },
  { period: '9月', total: 82, overdue: 4 },
  { period: '10月', total: 88, overdue: 7 },
  { period: '11月', total: 92, overdue: 5 },
  { period: '12月', total: 95, overdue: 6 },
]

const filteredItems = computed(() => {
  let result = mockItems
  if (reviewFilter.value === 'pending') {
    result = result.filter(item => !item.review)
  } else if (reviewFilter.value === 'completed') {
    result = result.filter(item => item.review)
  }
  return result
})

const paginatedItems = computed(() => {
  const start = (reviewPage.value - 1) * reviewPageSize.value
  return filteredItems.value.slice(start, start + reviewPageSize.value)
})

const totalReviewPages = computed(() => Math.ceil(filteredItems.value.length / reviewPageSize.value))

const pieChartData = computed(() => {
  const total = departmentStats.reduce((sum, d) => sum + d.count, 0)
  let currentAngle = 0
  return departmentStats.map(d => {
    const angle = (d.count / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    return {
      ...d,
      percentage: ((d.count / total) * 100).toFixed(1),
      startAngle,
      endAngle: currentAngle,
    }
  })
})

const overdueData = computed(() => {
  return overdueTimeRange.value === 'week' ? weeklyOverdueData : monthlyOverdueData
})

const maxOverdueRate = computed(() => {
  return Math.max(...overdueData.value.map(d => (d.overdue / d.total) * 100)) + 5
})

const overdueTableData = computed(() => {
  const start = (overduePage.value - 1) * overduePageSize.value
  return overdueData.value.slice(start, start + overduePageSize.value).map(d => ({
    ...d,
    rate: ((d.overdue / d.total) * 100).toFixed(2),
  }))
})

const totalOverduePages = computed(() => Math.ceil(overdueData.value.length / overduePageSize.value))

const tabItems = [
  { key: 'review', label: '复盘结论', icon: FileText },
  { key: 'responsibility', label: '责任归属统计', icon: PieChart },
  { key: 'overdue', label: '逾期率统计', icon: TrendingUp },
]

function getDepartmentName(department: string | Department): string {
  return typeof department === 'object' ? department.name : '-'
}

function getUserName(user: string | User): string {
  return typeof user === 'object' ? user.name : '-'
}

function getConclusionLabel(conclusion: ReviewConclusion): string {
  const tpl = reviewTemplates.find(t => t.value === conclusion)
  return tpl ? tpl.label : '-'
}

function getConclusionClass(conclusion: ReviewConclusion): string {
  const tpl = reviewTemplates.find(t => t.value === conclusion)
  return tpl ? tpl.color : ''
}

function startEdit(item: Item & { review?: Review }) {
  editingId.value = item._id
  if (item.review) {
    editingConclusion.value = item.review.conclusion
    editingRemark.value = item.review.remark
  } else {
    editingConclusion.value = 'completed'
    editingRemark.value = ''
  }
}

function cancelEdit() {
  editingId.value = null
}

async function saveReview(itemId: string) {
  try {
    const existingItem = mockItems.find(i => i._id === itemId)
    if (existingItem?.review) {
      await api.reviews.update(existingItem.review._id, {
        conclusion: editingConclusion.value,
        remark: editingRemark.value,
      })
    } else {
      await api.reviews.create({
        itemId,
        conclusion: editingConclusion.value,
        remark: editingRemark.value,
      })
    }
    const item = mockItems.find(i => i._id === itemId)
    if (item) {
      item.review = {
        _id: item.review?._id || 'new',
        itemId,
        conclusion: editingConclusion.value,
        remark: editingRemark.value,
        operator: 'current',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    editingId.value = null
  } catch (e) {
    console.error('保存失败', e)
  }
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === paginatedItems.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = paginatedItems.value.map(i => i._id)
  }
}

function openBatchModal() {
  batchModalVisible.value = true
  batchConclusion.value = 'completed'
  batchRemark.value = ''
}

async function applyBatchSetting() {
  try {
    for (const id of selectedIds.value) {
      const item = mockItems.find(i => i._id === id)
      if (item) {
        if (item.review) {
          await api.reviews.update(item.review._id, {
            conclusion: batchConclusion.value,
            remark: batchRemark.value,
          })
        } else {
          await api.reviews.create({
            itemId: id,
            conclusion: batchConclusion.value,
            remark: batchRemark.value,
          })
        }
        item.review = {
          _id: item.review?._id || 'new',
          itemId: id,
          conclusion: batchConclusion.value,
          remark: batchRemark.value,
          operator: 'current',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    }
    selectedIds.value = []
    batchModalVisible.value = false
  } catch (e) {
    console.error('批量设置失败', e)
  }
}

function getCloseRate(closed: number, total: number): string {
  return total > 0 ? ((closed / total) * 100).toFixed(1) : '0'
}

function describeArc(startAngle: number, endAngle: number, radius: number, cx: number, cy: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function getBarHeight(value: number, maxValue: number): number {
  return maxValue > 0 ? (value / maxValue) * 100 : 0
}

onMounted(() => {
  items.value = mockItems
  totalItems.value = mockItems.length
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 border-b border-gray-200">
      <button
        v-for="tab in tabItems"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="[
          activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-show="activeTab === 'review'" class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <button
              v-for="filter in [{ key: 'all', label: '全部' }, { key: 'pending', label: '未复盘' }, { key: 'completed', label: '已复盘' }]"
              :key="filter.key"
              @click="reviewFilter = filter.key as any"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="[
                reviewFilter === filter.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
            >
              {{ filter.label }}
            </button>
          </div>
          <button
            @click="openBatchModal"
            :disabled="selectedIds.length === 0"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="[
              selectedIds.length > 0
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ]"
          >
            <Plus class="w-4 h-4" />
            批量设置结论
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-500">
                  <input
                    type="checkbox"
                    :checked="selectedIds.length === paginatedItems.length && paginatedItems.length > 0"
                    @change="toggleSelectAll"
                    class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">事项标题</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">部门</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">负责人</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">复盘结论</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in paginatedItems"
                :key="item._id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(item._id)"
                    @change="toggleSelect(item._id)"
                    class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td class="py-3 px-4 font-medium text-gray-900">{{ item.title }}</td>
                <td class="py-3 px-4 text-gray-600">{{ getDepartmentName(item.department) }}</td>
                <td class="py-3 px-4 text-gray-600">{{ getUserName(item.assignee) }}</td>
                <td class="py-3 px-4">
                  <StatusBadge :status="item.status" />
                </td>
                <td class="py-3 px-4" v-if="editingId !== item._id">
                  <span
                    v-if="item.review"
                    :class="['inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border', getConclusionClass(item.review.conclusion)]"
                  >
                    {{ getConclusionLabel(item.review.conclusion) }}
                  </span>
                  <span v-else class="text-gray-400">待复盘</span>
                </td>
                <td class="py-3 px-4" v-else>
                  <div class="space-y-2">
                    <select
                      v-model="editingConclusion"
                      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option v-for="tpl in reviewTemplates" :key="tpl.value" :value="tpl.value">
                        {{ tpl.label }}
                      </option>
                    </select>
                    <input
                      v-model="editingRemark"
                      type="text"
                      placeholder="备注"
                      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div v-if="editingId !== item._id" class="flex items-center gap-2">
                    <button
                      @click="startEdit(item)"
                      class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <button
                      @click="saveReview(item._id)"
                      class="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Save class="w-4 h-4" />
                    </button>
                    <button
                      @click="cancelEdit"
                      class="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4">
          <Pagination
            :current-page="reviewPage"
            :total-pages="totalReviewPages"
            :total-items="filteredItems.length"
            @update:current-page="reviewPage = $event"
          />
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'responsibility'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-primary" />
            按部门统计事项占比
          </h3>
          <div class="flex items-center justify-center">
            <div class="relative" style="width: 240px; height: 240px;">
              <svg viewBox="0 0 200 200" class="w-full h-full">
                <path
                  v-for="(slice, index) in pieChartData"
                  :key="index"
                  :d="describeArc(slice.startAngle, slice.endAngle, 80, 100, 100)"
                  :fill="slice.color"
                  class="transition-all duration-300 hover:opacity-80"
                />
                <circle cx="100" cy="100" r="50" fill="white" />
                <text x="100" y="95" text-anchor="middle" class="text-lg font-bold" fill="#1E3A5F">
                  {{ departmentStats.reduce((s, d) => s + d.count, 0) }}
                </text>
                <text x="100" y="115" text-anchor="middle" class="text-xs" fill="#6B7280">
                  总事项数
                </text>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap justify-center gap-3">
            <div
              v-for="(item, index) in departmentStats"
              :key="index"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }" />
              <span class="text-gray-600">{{ item.name }}</span>
              <span class="text-gray-900 font-medium">{{ pieChartData[index].percentage }}%</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-primary" />
            按负责人统计
          </h3>
          <div class="space-y-4">
            <div
              v-for="person in personStats"
              :key="person.name"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700 font-medium">{{ person.name }}</span>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <span>总数: {{ person.total }}</span>
                  <span class="text-red-500">逾期: {{ person.overdue }}</span>
                  <span class="text-green-500">闭环率: {{ getCloseRate(person.closed, person.total) }}%</span>
                </div>
              </div>
              <div class="flex items-stretch h-8 gap-1 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  class="bg-green-500 transition-all duration-300"
                  :style="{ width: getBarHeight(person.closed, person.total) + '%' }"
                />
                <div
                  class="bg-red-500 transition-all duration-300"
                  :style="{ width: getBarHeight(person.overdue, person.total) + '%' }"
                />
                <div
                  class="bg-gray-300 transition-all duration-300"
                  :style="{ width: getBarHeight(person.total - person.closed - person.overdue, person.total) + '%' }"
                />
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-center gap-6 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded bg-green-500" />
              <span class="text-gray-600">已闭环</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded bg-red-500" />
              <span class="text-gray-600">已逾期</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded bg-gray-300" />
              <span class="text-gray-600">进行中</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">详细数据</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-500">部门/负责人</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">事项数</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">逾期数</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">闭环率</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">平均处理天数</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="person in personStats"
                :key="person.name"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 font-medium text-gray-900">{{ person.name }}</td>
                <td class="py-3 px-4 text-gray-600">{{ person.total }}</td>
                <td class="py-3 px-4">
                  <span :class="person.overdue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">
                    {{ person.overdue }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span :class="parseFloat(getCloseRate(person.closed, person.total)) >= 80 ? 'text-green-600 font-medium' : 'text-gray-600'">
                    {{ getCloseRate(person.closed, person.total) }}%
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">{{ person.avgDays }} 天</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'overdue'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-primary" />
            逾期率趋势
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="overdueTimeRange = 'week'"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="[
                overdueTimeRange === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
            >
              按周
            </button>
            <button
              @click="overdueTimeRange = 'month'"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="[
                overdueTimeRange === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
            >
              按月
            </button>
          </div>
        </div>

        <div class="relative h-64">
          <svg viewBox="0 0 600 240" class="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
              </linearGradient>
            </defs>

            <g stroke="#E5E7EB" stroke-width="1">
              <line x1="50" y1="30" x2="580" y2="30" />
              <line x1="50" y1="80" x2="580" y2="80" />
              <line x1="50" y1="130" x2="580" y2="130" />
              <line x1="50" y1="180" x2="580" y2="180" />
            </g>

            <g fill="#9CA3AF" font-size="10">
              <text x="40" y="34" text-anchor="end">{{ maxOverdueRate.toFixed(0) }}%</text>
              <text x="40" y="84" text-anchor="end">{{ (maxOverdueRate * 0.75).toFixed(0) }}%</text>
              <text x="40" y="134" text-anchor="end">{{ (maxOverdueRate * 0.5).toFixed(0) }}%</text>
              <text x="40" y="184" text-anchor="end">{{ (maxOverdueRate * 0.25).toFixed(0) }}%</text>
            </g>

            <g fill="#9CA3AF" font-size="10">
              <text
                v-for="(d, i) in overdueData"
                :key="i"
                :x="50 + (i * (530 / (overdueData.length - 1)))"
                y="205"
                text-anchor="middle"
              >
                {{ d.period }}
              </text>
            </g>

            <path
              :d="`M ${overdueData.map((d, i) => {
                const x = 50 + (i * (530 / (overdueData.length - 1)))
                const y = 180 - (((d.overdue / d.total) * 100 / maxOverdueRate) * 150)
                return `${x} ${y}`
              }).join(' L ')}`"
              fill="none"
              stroke="#F59E0B"
              stroke-width="2"
            />

            <path
              :d="`M ${50} 180 L ${overdueData.map((d, i) => {
                const x = 50 + (i * (530 / (overdueData.length - 1)))
                const y = 180 - (((d.overdue / d.total) * 100 / maxOverdueRate) * 150)
                return `${x} ${y}`
              }).join(' L ')} L ${50 + ((overdueData.length - 1) * (530 / (overdueData.length - 1)))} 180 Z`"
              fill="url(#lineGradient)"
            />

            <circle
              v-for="(d, i) in overdueData"
              :key="i"
              :cx="50 + (i * (530 / (overdueData.length - 1)))"
              :cy="180 - (((d.overdue / d.total) * 100 / maxOverdueRate) * 150)"
              r="4"
              fill="#F59E0B"
              stroke="white"
              stroke-width="2"
            />
          </svg>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">数据详情</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-500">时间周期</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">事项总数</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">逾期数</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500">逾期率</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in overdueTableData"
                :key="item.period"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 font-medium text-gray-900">{{ item.period }}</td>
                <td class="py-3 px-4 text-gray-600">{{ item.total }}</td>
                <td class="py-3 px-4">
                  <span :class="item.overdue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'">
                    {{ item.overdue }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span :class="parseFloat(item.rate) >= 10 ? 'text-red-600 font-medium' : 'text-gray-600'">
                    {{ item.rate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4">
          <Pagination
            :current-page="overduePage"
            :total-pages="totalOverduePages"
            :total-items="overdueData.length"
            @update:current-page="overduePage = $event"
          />
        </div>
      </div>
    </div>

    <Modal
      v-model:visible="batchModalVisible"
      title="批量设置复盘结论"
      confirm-text="确认设置"
      @confirm="applyBatchSetting"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          已选择 <span class="font-semibold text-primary">{{ selectedIds.length }}</span> 个事项
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">复盘结论</label>
          <select
            v-model="batchConclusion"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option v-for="tpl in reviewTemplates" :key="tpl.value" :value="tpl.value">
              {{ tpl.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            v-model="batchRemark"
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>
