<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">老师结算</h2>
      <div class="flex gap-2">
        <button @click="handleGenerate" class="btn btn-secondary">
          🔄 生成本期结算
        </button>
        <button @click="handleExport" class="btn btn-secondary">
          📥 导出报表
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">本期结算总额</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">¥{{ totalAmount.toFixed(2) }}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>
      <div class="card p-5 bg-amber-50 border-amber-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-amber-600 text-sm">待审批</p>
            <p class="text-2xl font-bold text-amber-700 mt-1">{{ pendingCount }}</p>
          </div>
          <div class="text-4xl">⏳</div>
        </div>
      </div>
      <div class="card p-5 bg-blue-50 border-blue-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-600 text-sm">已批准待付款</p>
            <p class="text-2xl font-bold text-blue-700 mt-1">{{ approvedCount }}</p>
          </div>
          <div class="text-4xl">✅</div>
        </div>
      </div>
      <div class="card p-5 bg-green-50 border-green-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-600 text-sm">已付款</p>
            <p class="text-2xl font-bold text-green-700 mt-1">{{ paidCount }}</p>
          </div>
          <div class="text-4xl">💳</div>
        </div>
      </div>
    </div>

    <div class="flex gap-2 mb-6">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        @click="currentStatus = s.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', currentStatus === s.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结算单号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">老师</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结算周期</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课时</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="settlement in settlements" :key="settlement.id" class="hover:bg-gray-50">
              <td class="px-4 py-4">
                <span class="font-mono text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">{{ settlement.settlement_no }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm">
                    {{ settlement.teacher?.user?.name?.charAt(0) || '👤' }}
                  </div>
                  <span class="text-sm text-gray-800">{{ settlement.teacher?.user?.name || '-' }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ formatDate(settlement.period_start) }} - {{ formatDate(settlement.period_end) }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ settlement.total_sessions }} 节课 · {{ settlement.total_students }} 人
              </td>
              <td class="px-4 py-4">
                <div class="text-sm font-bold text-gray-800">¥{{ settlement.total_amount }}</div>
                <div class="text-xs text-gray-400">
                  基础 ¥{{ settlement.base_amount }} + 奖金 ¥{{ settlement.bonus_amount }} - 扣款 ¥{{ settlement.deduction_amount }}
                </div>
              </td>
              <td class="px-4 py-4">
                <span :class="['badge', getStatusBadge(settlement.status)]">{{ getStatusLabel(settlement.status) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-2">
                  <button @click="viewSettlement = settlement" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    详情
                  </button>
                  <button
                    v-if="settlement.status === SettlementStatus.DRAFT"
                    @click="submitSettlement(settlement)"
                    class="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    提交审批
                  </button>
                  <button
                    v-if="settlement.status === SettlementStatus.PENDING_APPROVAL"
                    @click="approveSettlement(settlement)"
                    class="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    批准
                  </button>
                  <button
                    v-if="settlement.status === SettlementStatus.APPROVED"
                    @click="paySettlement(settlement)"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    付款
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="viewSettlement" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="viewSettlement = null">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-800">结算详情</h2>
              <p class="text-sm text-gray-500 mt-1">{{ viewSettlement.settlement_no }}</p>
            </div>
            <button @click="viewSettlement = null" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500">老师</p>
              <p class="font-bold text-gray-800 mt-1">{{ viewSettlement.teacher?.user?.name || '-' }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500">状态</p>
              <span :class="['badge mt-1', getStatusBadge(viewSettlement.status)]">{{ getStatusLabel(viewSettlement.status) }}</span>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500">结算周期</p>
              <p class="font-medium text-gray-800 mt-1">{{ formatDate(viewSettlement.period_start) }} - {{ formatDate(viewSettlement.period_end) }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500">统计</p>
              <p class="font-medium text-gray-800 mt-1">{{ viewSettlement.total_sessions }} 节课 · {{ viewSettlement.total_students }} 人</p>
            </div>
          </div>

          <div class="bg-purple-50 rounded-xl p-5 mb-6">
            <h3 class="font-bold text-purple-800 mb-4">💰 结算明细</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">基础课时费</span>
                <span class="text-gray-800">¥{{ viewSettlement.base_amount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">奖金</span>
                <span class="text-green-600">+ ¥{{ viewSettlement.bonus_amount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">扣款</span>
                <span class="text-red-600">- ¥{{ viewSettlement.deduction_amount }}</span>
              </div>
              <div class="border-t border-purple-200 pt-3 flex justify-between">
                <span class="font-bold text-purple-800">应发总计</span>
                <span class="font-bold text-purple-800 text-xl">¥{{ viewSettlement.total_amount }}</span>
              </div>
            </div>
          </div>

          <div v-if="viewSettlement.approved_by" class="p-4 bg-blue-50 rounded-xl mb-6">
            <p class="text-sm text-blue-800">
              <span class="font-bold">审批人：</span>{{ viewSettlement.approved_by?.name }}
              <span v-if="viewSettlement.approved_at"> · {{ formatDate(viewSettlement.approved_at) }}</span>
            </p>
          </div>

          <div v-if="viewSettlement.notes" class="p-4 bg-gray-50 rounded-xl">
            <p class="text-sm font-medium text-gray-700 mb-1">备注</p>
            <p class="text-sm text-gray-600">{{ viewSettlement.notes }}</p>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 flex gap-3">
          <button @click="viewSettlement = null" class="btn btn-secondary flex-1">关闭</button>
          <button
            v-if="viewSettlement.status === SettlementStatus.DRAFT"
            @click="submitSettlement(viewSettlement); viewSettlement = null"
            class="btn btn-primary flex-1"
          >
            提交审批
          </button>
          <button
            v-if="viewSettlement.status === SettlementStatus.PENDING_APPROVAL"
            @click="approveSettlement(viewSettlement); viewSettlement = null"
            class="btn btn-success flex-1"
          >
            批准结算
          </button>
          <button
            v-if="viewSettlement.status === SettlementStatus.APPROVED"
            @click="paySettlement(viewSettlement); viewSettlement = null"
            class="btn btn-primary flex-1"
          >
            确认付款
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { settlementAPI } from '../../utils/api'
import { SettlementStatus } from '../../types'
import type { TeacherSettlement } from '../../types'

const settlements = ref<TeacherSettlement[]>([])
const currentStatus = ref<number | null>(null)
const viewSettlement = ref<TeacherSettlement | null>(null)

const statusFilters = [
  { label: '全部', value: null },
  { label: '草稿', value: SettlementStatus.DRAFT },
  { label: '待审批', value: SettlementStatus.PENDING_APPROVAL },
  { label: '已批准', value: SettlementStatus.APPROVED },
  { label: '已付款', value: SettlementStatus.PAID }
]

const totalAmount = computed(() => settlements.value.reduce((sum, s) => sum + parseFloat(s.total_amount), 0))
const pendingCount = computed(() => settlements.value.filter(s => s.status === SettlementStatus.PENDING_APPROVAL).length)
const approvedCount = computed(() => settlements.value.filter(s => s.status === SettlementStatus.APPROVED).length)
const paidCount = computed(() => settlements.value.filter(s => s.status === SettlementStatus.PAID).length)

const getStatusLabel = (status: SettlementStatus) => {
  const labels: Record<SettlementStatus, string> = {
    [SettlementStatus.DRAFT]: '草稿',
    [SettlementStatus.PENDING_APPROVAL]: '待审批',
    [SettlementStatus.APPROVED]: '已批准',
    [SettlementStatus.PAID]: '已付款',
    [SettlementStatus.REJECTED]: '已拒绝'
  }
  return labels[status]
}

const getStatusBadge = (status: SettlementStatus) => {
  const badges: Record<SettlementStatus, string> = {
    [SettlementStatus.DRAFT]: 'badge-secondary',
    [SettlementStatus.PENDING_APPROVAL]: 'badge-warning',
    [SettlementStatus.APPROVED]: 'badge-info',
    [SettlementStatus.PAID]: 'badge-success',
    [SettlementStatus.REJECTED]: 'badge-danger'
  }
  return badges[status]
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const loadSettlements = async () => {
  try {
    const params: any = { per_page: 100 }
    if (currentStatus.value !== null) params.status = currentStatus.value
    const res: any = await settlementAPI.list(params)
    settlements.value = res.settlements || res.teacher_settlements || []
  } catch (e) {
    console.error('加载结算失败', e)
  }
}

const handleGenerate = async () => {
  if (!confirm('确定生成本期老师结算单？')) return
  try {
    await settlementAPI.generate()
    await loadSettlements()
    alert('结算单已生成')
  } catch (e: any) {
    alert(e.response?.data?.error || '生成失败')
  }
}

const submitSettlement = async (settlement: TeacherSettlement) => {
  if (!confirm('确定提交该结算单审批？')) return
  try {
    await settlementAPI.submit(settlement.id)
    settlement.status = SettlementStatus.PENDING_APPROVAL
  } catch (e: any) {
    alert(e.response?.data?.error || '提交失败')
  }
}

const approveSettlement = async (settlement: TeacherSettlement) => {
  if (!confirm('确定批准该结算单？')) return
  try {
    await settlementAPI.approve(settlement.id)
    settlement.status = SettlementStatus.APPROVED
  } catch (e: any) {
    alert(e.response?.data?.error || '审批失败')
  }
}

const paySettlement = async (settlement: TeacherSettlement) => {
  if (!confirm('确认已付款？此操作不可撤销。')) return
  try {
    await settlementAPI.pay(settlement.id)
    settlement.status = SettlementStatus.PAID
  } catch (e: any) {
    alert(e.response?.data?.error || '付款失败')
  }
}

const handleExport = async () => {
  try {
    const blob = await settlementAPI.export()
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `老师结算_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
    alert('导出失败')
  }
}

onMounted(() => {
  loadSettlements()
})
</script>
