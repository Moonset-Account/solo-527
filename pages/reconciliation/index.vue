<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">月底核对</h2>
      <div class="flex gap-2">
        <input
          v-model="selectedMonth"
          type="month"
          class="px-3 py-2 border rounded"
          @change="loadData"
        />
        <button
          @click="exportData"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          导出数据
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">病历数量</p>
        <p class="text-2xl font-bold text-blue-600">{{ summary?.medicalRecordCount || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">随访任务</p>
        <p class="text-2xl font-bold text-purple-600">
          {{ summary?.followUpTaskCount || 0 }}
          <span class="text-sm text-gray-400">
            (完成{{ summary?.completedFollowUpCount || 0 }})
          </span>
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">收费单据</p>
        <p class="text-2xl font-bold text-green-600">{{ summary?.billingRecordCount || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">应收/实收/欠款</p>
        <p class="text-lg font-bold">
          <span class="text-gray-600">¥{{ formatNumber(summary?.totalAmount || 0) }}</span>
          <span class="text-green-600 ml-2">¥{{ formatNumber(summary?.paidAmount || 0) }}</span>
          <span class="text-red-600 ml-2">¥{{ formatNumber(summary?.unpaidAmount || 0) }}</span>
        </p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow mb-6">
      <div class="border-b">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-6 py-3 font-medium"
            :class="activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
          >
            {{ tab.name }}
            <span class="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
              {{ getTabCount(tab.key) }}
            </span>
          </button>
        </div>
      </div>

      <div class="p-4">
        <div v-if="activeTab === 'medical-records'">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">病历号</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">就诊日期</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">诊断</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">摘要</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">创建人</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="record in medicalRecords" :key="record.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono">{{ record.recordNo }}</td>
                  <td class="px-4 py-3 text-sm">
                    <div>{{ record.patient?.name }}</div>
                    <div class="text-xs text-gray-500">{{ record.patient?.patientNo }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ formatDate(record.visitDate) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {{ record.diagnosis }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm max-w-xs truncate" :title="record.summary">
                    {{ record.summary || '-' }}
                  </td>
                  <td class="px-4 py-3 text-sm">{{ record.creator?.name }}</td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      class="text-blue-600 hover:underline"
                      @click="viewSource('medical-record', record.id)"
                    >
                      追溯来源
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'follow-up'">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">任务号</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">计划时间</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">随访次数</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">负责人</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="task in followUpTasks" :key="task.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono">{{ task.taskNo }}</td>
                  <td class="px-4 py-3 text-sm">
                    <div>{{ task.patient?.name }}</div>
                    <div class="text-xs text-gray-500">{{ task.patient?.phone }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ typeText(task.type) }}</td>
                  <td class="px-4 py-3 text-sm">{{ formatDate(task.scheduledDate) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span :class="statusClass(task.status)" class="px-2 py-1 rounded text-xs">
                      {{ statusText(task.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ task.followUpRecords?.length || 0 }} 次</td>
                  <td class="px-4 py-3 text-sm">{{ task.assignee?.name }}</td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      class="text-blue-600 hover:underline mr-2"
                      @click="viewFollowUpHistory(task)"
                    >
                      回看历史
                    </button>
                    <button
                      class="text-green-600 hover:underline"
                      @click="viewSource('follow-up', task.id)"
                    >
                      追溯来源
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'billing'">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">单据号</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关联病历</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关联疗程</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">已收</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="bill in billingRecords" :key="bill.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono">{{ bill.billNo }}</td>
                  <td class="px-4 py-3 text-sm">{{ bill.patient?.name }}</td>
                  <td class="px-4 py-3 text-sm">{{ bill.medicalRecord?.recordNo || '-' }}</td>
                  <td class="px-4 py-3 text-sm">{{ bill.course?.name || '-' }}</td>
                  <td class="px-4 py-3 text-sm font-medium">¥{{ formatNumber(bill.amount) }}</td>
                  <td class="px-4 py-3 text-sm text-green-600">¥{{ formatNumber(bill.paidAmount) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span :class="billStatusClass(bill.status)" class="px-2 py-1 rounded text-xs">
                      {{ billStatusText(bill.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      class="text-blue-600 hover:underline"
                      @click="viewSource('billing', bill.id)"
                    >
                      追溯来源
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'patient-archives'">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">档案编号</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">档案类型</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">摘要</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">归档时间</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="archive in patientArchives" :key="archive.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono">{{ archive.archiveNo }}</td>
                  <td class="px-4 py-3 text-sm">
                    <div>{{ archive.patient?.name }}</div>
                    <div class="text-xs text-gray-500">{{ archive.patient?.patientNo }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {{ archiveTypeText(archive.archiveType) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm max-w-xs truncate" :title="archive.summary">
                    {{ archive.summary }}
                  </td>
                  <td class="px-4 py-3 text-sm">{{ formatDate(archive.createdAt) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      class="text-blue-600 hover:underline"
                      @click="viewSource('patient-archive', archive.id)"
                    >
                      追溯来源
                    </button>
                  </td>
                </tr>
                <tr v-if="patientArchives.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    暂无患者档案
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">随访历史记录</h3>
          <button @click="showHistoryModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div v-if="selectedFollowUp" class="p-6">
          <div class="mb-4 p-4 bg-gray-50 rounded">
            <p class="font-medium">{{ selectedFollowUp.patient?.name }}</p>
            <p class="text-sm text-gray-500">任务号：{{ selectedFollowUp.taskNo }}</p>
          </div>

          <div class="space-y-4">
            <div
              v-for="record in selectedFollowUp.followUpRecords"
              :key="record.id"
              class="p-4 border rounded"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm font-medium">{{ record.operator?.name }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(record.recordDate) }}</span>
              </div>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-gray-500">随访内容</label>
                  <p class="text-sm">{{ record.content }}</p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">联系结果</label>
                  <p class="text-sm text-green-600">{{ record.contactResult }}</p>
                </div>
                <div v-if="record.nextFollowUp">
                  <label class="text-xs text-gray-500">下次随访</label>
                  <p class="text-sm text-blue-600">{{ formatDate(record.nextFollowUp) }}</p>
                </div>
              </div>
            </div>
            <p v-if="!selectedFollowUp.followUpRecords?.length" class="text-center text-gray-500 py-8">
              暂无随访记录
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()

const selectedMonth = ref(new Date().toISOString().substring(0, 7))
const activeTab = ref('medical-records')
const summary = ref<any>(null)
const medicalRecords = ref<any[]>([])
const followUpTasks = ref<any[]>([])
const billingRecords = ref<any[]>([])
const patientArchives = ref<any[]>([])
const showHistoryModal = ref(false)
const selectedFollowUp = ref<any>(null)

const tabs = [
  { key: 'medical-records', name: '病历摘要' },
  { key: 'follow-up', name: '随访任务' },
  { key: 'billing', name: '收费单据' },
  { key: 'patient-archives', name: '患者档案' }
]

const formatDate = (date: string | number) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatNumber = (num: any) => {
  if (typeof num === 'object' && num.toNumber) {
    return num.toNumber().toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const typeText = (type: string) => {
  const map: Record<string, string> = {
    PHONE: '电话',
    WECHAT: '微信',
    VISIT: '上门',
    OTHER: '其他'
  }
  return map[type] || type
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    FAILED: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    FAILED: '已失败'
  }
  return map[status] || status
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

const archiveTypeText = (type: string) => {
  const map: Record<string, string> = {
    MONTHLY_SUMMARY: '月度汇总',
    TREATMENT_COMPLETED: '疗程完成',
    PATIENT_LOST: '患者流失',
    FOLLOW_UP_SUMMARY: '随访汇总',
    BILLING_RECONCILIATION: '收费核对'
  }
  return map[type] || type
}

const getTabCount = (key: string) => {
  switch (key) {
    case 'medical-records':
      return medicalRecords.value.length
    case 'follow-up':
      return followUpTasks.value.length
    case 'billing':
      return billingRecords.value.length
    case 'patient-archives':
      return patientArchives.value.length
    default:
      return 0
  }
}

const loadData = async () => {
  try {
    const res = await get('/api/reconciliation/monthly', {
      month: selectedMonth.value
    })
    summary.value = res.data?.summary
    medicalRecords.value = res.data?.medicalRecords || []
    followUpTasks.value = res.data?.followUpTasks || []
    billingRecords.value = res.data?.billingRecords || []
    patientArchives.value = res.data?.patientArchives || []
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

const viewSource = (type: string, id: number) => {
  navigateTo(`/reconciliation/${type}/${id}`)
}

const viewFollowUpHistory = (task: any) => {
  selectedFollowUp.value = task
  showHistoryModal.value = true
}

const exportData = () => {
  alert('导出功能开发中...')
}

onMounted(() => {
  loadData()
})
</script>
