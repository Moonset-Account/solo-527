<script setup>
import { Link } from '@inertiajs/vue3'


const props = defineProps({
  contract: Object,
})

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-red-100 text-red-800',
}

const statusLabels = {
  draft: '草稿',
  pending_approval: '待审批',
  active: '生效中',
  expired: '已过期',
  terminated: '已终止',
}

const depositStatusLabels = {
  collected: '已收取',
  refunded: '已退还',
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <Link :href="route('contracts.index')" class="text-gray-500 hover:text-gray-700">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 class="text-2xl font-bold text-gray-900">合同详情</h1>
          <span :class="[statusColors[contract.status] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ statusLabels[contract.status] || contract.status }}</span>
        </div>
        <div class="flex space-x-2">
          <Link :href="route('contracts.edit', contract.id)" class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">编辑</Link>
          <Link :href="route('contracts.history', contract.id)" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">历史记录</Link>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg bg-white p-6 shadow">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">基本信息</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">合同编号</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.contract_no }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">状态</dt>
              <dd class="text-sm font-medium text-gray-900">{{ statusLabels[contract.status] || contract.status }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">开始日期</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.start_date }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">结束日期</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.end_date }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">月租金</dt>
              <dd class="text-sm font-medium text-gray-900">¥{{ contract.monthly_rent }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">押金金额</dt>
              <dd class="text-sm font-medium text-gray-900">¥{{ contract.deposit_amount }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">付款周期</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.payment_cycle }}</dd>
            </div>
            <div v-if="contract.signed_at" class="flex justify-between">
              <dt class="text-sm text-gray-500">签约时间</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.signed_at }}</dd>
            </div>
            <div v-if="contract.reject_reason" class="flex justify-between">
              <dt class="text-sm text-gray-500">驳回原因</dt>
              <dd class="text-sm font-medium text-red-600">{{ contract.reject_reason }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg bg-white p-6 shadow">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">物业信息</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">物业名称</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.property?.name || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">物业编码</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.property?.code || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">地址</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.property?.address || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">负责人</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.property?.responsible_person?.name || '-' }}</dd>
            </div>
          </dl>

          <h3 class="mb-4 mt-6 text-lg font-semibold text-gray-900 border-b pb-2">租户/顾问</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">租户</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.tenant?.name || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">招商顾问</dt>
              <dd class="text-sm font-medium text-gray-900">{{ contract.consultant?.name || '-' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div v-if="contract.terms" class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">合同条款</h3>
        <p class="whitespace-pre-wrap text-sm text-gray-700">{{ contract.terms }}</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">押金记录</h3>
        <div v-if="contract.deposits?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">金额</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">收取日期</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">退还日期</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">操作人</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">备注</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="deposit in contract.deposits" :key="deposit.id">
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">¥{{ deposit.amount }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm">
                  <span :class="[deposit.status === 'collected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ depositStatusLabels[deposit.status] || deposit.status }}</span>
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ deposit.collected_date || '-' }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ deposit.refunded_date || '-' }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ deposit.operator?.name || '-' }}</td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ deposit.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">暂无押金记录</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">跟进记录</h3>
        <div v-if="contract.follow_ups?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">类型</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">内容</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">顾问</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">跟进时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="follow in contract.follow_ups" :key="follow.id">
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ follow.type }}</td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ follow.content }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ follow.consultant?.name || '-' }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ follow.followed_up_at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">暂无跟进记录</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">风险记录</h3>
        <div v-if="contract.risks?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">风险类型</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">严重程度</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">描述</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">状态</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">负责人</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="risk in contract.risks" :key="risk.id">
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ risk.risk_type }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm">
                  <span :class="[risk.severity === 'high' ? 'bg-red-100 text-red-800' : risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ risk.severity }}</span>
                </td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ risk.description }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm">
                  <span :class="[risk.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ risk.status === 'open' ? '未解决' : '已关闭' }}</span>
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ risk.assigned_to?.name || risk.assignedTo?.name || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">暂无风险记录</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">附件</h3>
        <div v-if="contract.attachments?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">文件名</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">类型</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">大小</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">上传者</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="attachment in contract.attachments" :key="attachment.id">
                <td class="px-4 py-2 text-sm font-medium text-blue-600">
                  <a :href="route('attachments.download', attachment.id)">{{ attachment.file_name }}</a>
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ attachment.file_type }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ attachment.file_size }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ attachment.uploader?.name || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">暂无附件</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">账单列表</h3>
        <div v-if="contract.bills?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">账单编号</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">类型</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">金额</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">到期日</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">付款日</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="bill in contract.bills" :key="bill.id">
                <td class="whitespace-nowrap px-4 py-2 text-sm font-medium text-blue-600">
                  <Link :href="route('bills.show', bill.id)">{{ bill.bill_no }}</Link>
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ bill.type }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">¥{{ bill.amount }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ bill.due_date }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{{ bill.paid_date || '-' }}</td>
                <td class="whitespace-nowrap px-4 py-2 text-sm">
                  <span :class="[bill.status === 'paid' ? 'bg-green-100 text-green-800' : bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ bill.status === 'paid' ? '已付' : bill.status === 'pending' ? '待付' : bill.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">暂无账单</p>
      </div>
    </div>
  </div>
</template>
