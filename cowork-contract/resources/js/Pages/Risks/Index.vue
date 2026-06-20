<script setup>
import { Link, router } from '@inertiajs/vue3'
import { reactive, ref } from 'vue'

const props = defineProps({
  risks: Object,
  filters: Object,
})

const filters = reactive({
  status: props.filters?.status || '',
  severity: props.filters?.severity || '',
  risk_type: props.filters?.risk_type || '',
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '未解决' },
  { value: 'closed', label: '已关闭' },
]

const severityOptions = [
  { value: '', label: '全部严重程度' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const severityLabels = {
  low: '低',
  medium: '中',
  high: '高',
}

const showCloseModal = ref(false)
const closeRiskId = ref(null)
const closeRemark = ref('')

const assignRiskId = ref(null)
const assignUserId = ref('')

function applyFilter() {
  router.get(route('risks.index'), filters, { preserveState: true, preserveScroll: true })
}

function openCloseModal(riskId) {
  closeRiskId.value = riskId
  closeRemark.value = ''
  showCloseModal.value = true
}

function closeRisk() {
  if (!closeRemark.value.trim()) {
    alert('请填写关闭备注')
    return
  }
  router.put(route('risks.close', closeRiskId.value), {
    close_remark: closeRemark.value,
  })
  showCloseModal.value = false
}

function assignRisk() {
  if (!assignUserId.value) {
    alert('请输入用户ID')
    return
  }
  router.put(route('risks.assign', assignRiskId.value), {
    assigned_to: assignUserId.value,
  })
  assignRiskId.value = null
  assignUserId.value = ''
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">风险清单</h1>

      <div class="rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">状态</label>
            <select v-model="filters.status" @change="applyFilter" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">严重程度</label>
            <select v-model="filters.severity" @change="applyFilter" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">风险类型</label>
            <input v-model="filters.risk_type" @keyup.enter="applyFilter" type="text" placeholder="风险类型" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">合同</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">物业</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">风险类型</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">严重程度</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">描述</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">负责人</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="risk in risks.data" :key="risk.id" class="hover:bg-gray-50 transition-colors">
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                <Link v-if="risk.contract" :href="route('contracts.show', risk.contract.id)">{{ risk.contract.contract_no }}</Link>
                <span v-else>-</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ risk.contract?.property?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ risk.risk_type }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span :class="[severityColors[risk.severity] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ severityLabels[risk.severity] || risk.severity }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{{ risk.description }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ risk.assignedTo?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span :class="[risk.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ risk.status === 'open' ? '未解决' : '已关闭' }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm space-x-2">
                <button v-if="risk.status === 'open'" @click="openCloseModal(risk.id)" class="text-red-600 hover:text-red-900">关闭</button>
                <button v-if="risk.status === 'open'" @click="assignRiskId = risk.id" class="text-blue-600 hover:text-blue-900">分配</button>
              </td>
            </tr>
            <tr v-if="risks.data.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500">暂无风险记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="assignRiskId" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-gray-600 opacity-50" @click="assignRiskId = null"></div>
        <div class="relative rounded-lg bg-white p-6 shadow-xl w-full max-w-md">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">分配风险</h3>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">用户ID</label>
            <input v-model="assignUserId" type="number" placeholder="输入要分配的用户ID" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div class="flex justify-end space-x-3">
            <button @click="assignRiskId = null" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
            <button @click="assignRisk" class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">确认分配</button>
          </div>
        </div>
      </div>

      <div v-if="showCloseModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-gray-600 opacity-50" @click="showCloseModal = false"></div>
        <div class="relative rounded-lg bg-white p-6 shadow-xl w-full max-w-md">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">关闭风险</h3>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">关闭备注 <span class="text-red-500">*</span></label>
            <textarea v-model="closeRemark" rows="3" placeholder="请输入关闭备注" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button @click="showCloseModal = false" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
            <button @click="closeRisk" class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">确认关闭</button>
          </div>
        </div>
      </div>

      <div v-if="risks.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ risks.from }} 至 {{ risks.to }} 条，共 {{ risks.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in risks.last_page" :key="page" :href="route('risks.index', { ...filters, page })" :class="[page === risks.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
