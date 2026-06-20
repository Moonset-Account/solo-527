<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">收费报表</h2>
      <div class="flex gap-2">
        <input
          v-model="filters.startDate"
          type="date"
          class="px-3 py-2 border rounded"
        />
        <span class="py-2">至</span>
        <input
          v-model="filters.endDate"
          type="date"
          class="px-3 py-2 border rounded"
        />
        <select v-model="filters.groupBy" class="px-3 py-2 border rounded">
          <option value="day">按日汇总</option>
          <option value="month">按月汇总</option>
        </select>
        <button
          @click="loadData"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          查询
        </button>
        <button
          @click="exportReport"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          导出
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">总营收</p>
        <p class="text-2xl font-bold text-gray-800">¥{{ formatNumber(summary?.totalAmount || 0) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">实收金额</p>
        <p class="text-2xl font-bold text-green-600">¥{{ formatNumber(summary?.paidAmount || 0) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">欠款金额</p>
        <p class="text-2xl font-bold text-red-600">¥{{ formatNumber(summary?.unpaidAmount || 0) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">收费单据</p>
        <p class="text-2xl font-bold text-blue-600">{{ summary?.totalCount || 0 }} 张</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">患者总数</p>
        <p class="text-xl font-bold text-purple-600">{{ summary?.patientCount || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">新增患者</p>
        <p class="text-xl font-bold text-green-600">{{ summary?.newPatientCount || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">流失患者</p>
        <p class="text-xl font-bold text-red-600">{{ summary?.lostPatientCount || 0 }}</p>
        <p class="text-xs text-red-500 mt-1">涉及金额：¥{{ formatNumber(summary?.lostAmount || 0) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">已结清 / 未结清</p>
        <p class="text-xl font-bold">
          <span class="text-green-600">{{ summary?.paidCount || 0 }}</span>
          <span class="text-gray-400"> / </span>
          <span class="text-yellow-600">{{ summary?.unpaidCount || 0 }}</span>
        </p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow mb-6">
      <div class="p-4 border-b">
        <h3 class="font-semibold">每日收费汇总（点击可下钻查看明细）</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">日期</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">收费金额</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">实收金额</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">欠款金额</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">单据数</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">患者数</th>
              <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="day in dailyData"
              :key="day.date"
              class="hover:bg-gray-50 cursor-pointer"
              @click="drillDown(day.date)"
            >
              <td class="px-4 py-3 text-sm font-medium text-blue-600">
                {{ day.date }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-medium">
                ¥{{ formatNumber(day.totalAmount) }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-green-600">
                ¥{{ formatNumber(day.paidAmount) }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-red-600">
                ¥{{ formatNumber(day.unpaidAmount) }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ day.count }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ day.patientCount }}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  class="text-blue-600 hover:underline text-sm"
                  @click.stop="drillDown(day.date)"
                >
                  查看明细 ↓
                </button>
              </td>
            </tr>
            <tr v-if="dailyData.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">{{ selectedDate }} 收费明细</h3>
            <div class="flex gap-6 mt-2 text-sm">
              <span>
                总金额：<span class="font-bold">¥{{ formatNumber(detailSummary?.totalAmount || 0) }}</span>
              </span>
              <span class="text-green-600">
                实收：<span class="font-bold">¥{{ formatNumber(detailSummary?.paidAmount || 0) }}</span>
              </span>
              <span class="text-red-600">
                欠款：<span class="font-bold">¥{{ formatNumber(detailSummary?.unpaidAmount || 0) }}</span>
              </span>
              <span>
                单据数：<span class="font-bold">{{ detailSummary?.count || 0 }}</span>
              </span>
            </div>
          </div>
          <button @click="closeDetailModal" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div class="p-4">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">单据号</th>
                  <th class="px-3 py-2 text-left">患者</th>
                  <th class="px-3 py-2 text-left">诊断</th>
                  <th class="px-3 py-2 text-left">关联疗程</th>
                  <th class="px-3 py-2 text-right">应收</th>
                  <th class="px-3 py-2 text-right">实收</th>
                  <th class="px-3 py-2 text-center">状态</th>
                  <th class="px-3 py-2 text-left">创建人</th>
                  <th class="px-3 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="bill in detailRecords"
                  :key="bill.id"
                  class="hover:bg-gray-50"
                >
                  <td class="px-3 py-2 font-mono">{{ bill.billNo }}</td>
                  <td class="px-3 py-2">
                    <div>{{ bill.patient?.name }}</div>
                    <div class="text-xs text-gray-500">{{ bill.patient?.phone }}</div>
                  </td>
                  <td class="px-3 py-2 max-w-xs truncate" :title="bill.medicalRecord?.diagnosis">
                    {{ bill.medicalRecord?.diagnosis || '-' }}
                  </td>
                  <td class="px-3 py-2">
                    <span v-if="bill.course">
                      {{ bill.course.name }}
                      <span v-if="bill.course.isLost" class="text-red-600 text-xs ml-1">
                        (已流失)
                      </span>
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td class="px-3 py-2 text-right font-medium">
                    ¥{{ formatNumber(bill.amount) }}
                  </td>
                  <td class="px-3 py-2 text-right text-green-600">
                    ¥{{ formatNumber(bill.paidAmount) }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span :class="billStatusClass(bill.status)" class="px-2 py-1 rounded text-xs">
                      {{ billStatusText(bill.status) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-500">{{ bill.creator?.name }}</td>
                  <td class="px-3 py-2 text-center">
                    <button
                      class="text-blue-600 hover:underline text-sm"
                      @click="viewBillingSource(bill)"
                    >
                      追溯来源
                    </button>
                  </td>
                </tr>
                <tr v-if="detailRecords.length === 0">
                  <td colspan="9" class="px-3 py-8 text-center text-gray-500">
                    暂无该日期的收费记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="font-semibold">流失患者收费记录</h3>
        <span class="text-sm text-red-600">
          共 {{ lostCourses?.length || 0 }} 条记录，涉及金额 ¥{{ formatNumber(summary?.lostAmount || 0) }}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">单据号</th>
              <th class="px-4 py-3 text-left">患者</th>
              <th class="px-4 py-3 text-left">疗程名称</th>
              <th class="px-4 py-3 text-left">流失原因</th>
              <th class="px-4 py-3 text-right">金额</th>
              <th class="px-4 py-3 text-right">已收</th>
              <th class="px-4 py-3 text-center">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="bill in lostCourses"
              :key="bill.id"
              class="hover:bg-gray-50 bg-red-50"
            >
              <td class="px-4 py-3 font-mono">{{ bill.billNo }}</td>
              <td class="px-4 py-3">
                <div>{{ bill.patient?.name }}</div>
                <div class="text-xs text-gray-500">{{ bill.patient?.phone }}</div>
              </td>
              <td class="px-4 py-3">{{ bill.course?.name }}</td>
              <td class="px-4 py-3 text-red-600 max-w-xs truncate" :title="bill.course?.lostReason">
                {{ bill.course?.lostReason }}
              </td>
              <td class="px-4 py-3 text-right font-medium">
                ¥{{ formatNumber(bill.amount) }}
              </td>
              <td class="px-4 py-3 text-right text-green-600">
                ¥{{ formatNumber(bill.paidAmount) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="billStatusClass(bill.status)" class="px-2 py-1 rounded text-xs">
                  {{ billStatusText(bill.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="!lostCourses?.length">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                暂无流失患者收费记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()
import dayjs from 'dayjs'

const filters = ref({
  startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
  endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  groupBy: 'day'
})

const summary = ref<any>(null)
const dailyData = ref<any[]>([])
const lostCourses = ref<any[]>([])

const showDetailModal = ref(false)
const selectedDate = ref('')
const detailRecords = ref<any[]>([])
const detailSummary = ref<any>(null)

const formatDate = (date: string | number) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatNumber = (num: any) => {
  if (typeof num === 'object' && num.toNumber) {
    return num.toNumber().toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const billStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    UNPAID: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const billStatusText = (status: string) => {
  const map: Record<string, string> = {
    PAID: '已结清',
    UNPAID: '未付款',
    PARTIAL: '部分付款',
    REFUNDED: '已退款'
  }
  return map[status] || status
}

const loadData = async () => {
  try {
    const res = await get('/api/reports/billing', {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      groupBy: filters.value.groupBy
    })
    summary.value = res.data?.summary
    dailyData.value = res.data?.dailyData || []
    lostCourses.value = res.data?.lostCourses || []
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

const drillDown = async (date: string) => {
  selectedDate.value = date
  try {
    const res = await get(`/api/reports/billing/${date}`)
    detailSummary.value = res.data?.summary
    detailRecords.value = res.data?.billingRecords || []
    showDetailModal.value = true
  } catch (e: any) {
    alert(e.message || '加载明细失败')
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailRecords.value = []
  detailSummary.value = null
}

const viewBillingSource = (bill: any) => {
  navigateTo(`/reconciliation/billing/${bill.id}`)
}

const exportReport = () => {
  alert('导出功能开发中...')
}

onMounted(() => {
  loadData()
})
</script>
