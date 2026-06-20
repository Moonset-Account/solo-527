<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold">来源数据追溯</h2>
        <p class="text-gray-500 text-sm mt-1">{{ sourceTypeText }} #{{ sourceNo }}</p>
      </div>
      <button
        @click="goBack"
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        ← 返回列表
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else-if="detailData" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">{{ getSectionTitle() }}</h3>

        <div v-if="sourceType === 'medical-record'">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-500 text-sm">病历号</label>
              <p class="font-medium">{{ detailData.recordNo }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">就诊日期</label>
              <p>{{ formatDate(detailData.visitDate) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">患者姓名</label>
              <p class="font-medium">{{ detailData.patient?.name }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">联系电话</label>
              <p>{{ detailData.patient?.phone }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-gray-500 text-sm block mb-1">主诉</label>
              <p class="p-3 bg-gray-50 rounded">{{ detailData.chiefComplaint }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm block mb-1">诊断</label>
              <p class="p-3 bg-blue-50 rounded text-blue-800">{{ detailData.diagnosis }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm block mb-1">处方</label>
              <p class="p-3 bg-gray-50 rounded">{{ detailData.prescription || '无' }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm block mb-1">治疗方案</label>
              <p class="p-3 bg-gray-50 rounded">{{ detailData.treatment || '无' }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm block mb-1">摘要</label>
              <p class="p-3 bg-yellow-50 rounded">{{ detailData.summary || '无' }}</p>
            </div>
          </div>

          <div v-if="detailData.treatmentCourses?.length > 0" class="mt-6">
            <h4 class="font-semibold mb-3">关联疗程</h4>
            <div class="space-y-2">
              <div
                v-for="course in detailData.treatmentCourses"
                :key="course.id"
                class="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <p class="font-medium">{{ course.name }}</p>
                  <p class="text-xs text-gray-500">{{ course.courseNo }}</p>
                </div>
                <button
                  @click="viewSource('treatment-course', course.id)"
                  class="text-blue-600 hover:underline text-sm"
                >
                  查看详情 →
                </button>
              </div>
            </div>
          </div>

          <div v-if="detailData.billingRecords?.length > 0" class="mt-6">
            <h4 class="font-semibold mb-3">关联收费单据</h4>
            <div class="space-y-2">
              <div
                v-for="bill in detailData.billingRecords"
                :key="bill.id"
                class="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <p class="font-medium">{{ bill.billNo }}</p>
                  <p class="text-sm text-green-600">¥{{ formatNumber(bill.amount) }}</p>
                </div>
                <button
                  @click="viewSource('billing', bill.id)"
                  class="text-blue-600 hover:underline text-sm"
                >
                  查看单据 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="sourceType === 'follow-up'">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-500 text-sm">任务号</label>
              <p class="font-mono font-medium">{{ detailData.taskNo }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">类型</label>
              <p>{{ typeText(detailData.type) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">患者</label>
              <p class="font-medium">{{ detailData.patient?.name }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">计划时间</label>
              <p>{{ formatDate(detailData.scheduledDate) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">状态</label>
              <p>
                <span :class="statusClass(detailData.status)" class="px-2 py-1 rounded text-xs">
                  {{ statusText(detailData.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">负责人</label>
              <p>{{ detailData.assignee?.name }}</p>
            </div>
          </div>

          <div class="mb-6">
            <label class="text-gray-500 text-sm block mb-1">随访内容</label>
            <p class="p-3 bg-gray-50 rounded">{{ detailData.content || '无' }}</p>
          </div>

          <div v-if="detailData.course" class="mb-6">
            <h4 class="font-semibold mb-3">关联疗程</h4>
            <div class="p-3 border rounded flex justify-between items-center">
              <div>
                <p class="font-medium">{{ detailData.course.name }}</p>
                <p class="text-xs text-gray-500">{{ detailData.course.courseNo }}</p>
              </div>
              <button
                @click="viewSource('treatment-course', detailData.course.id)"
                class="text-blue-600 hover:underline text-sm"
              >
                查看疗程 →
              </button>
            </div>
          </div>

          <div>
            <h4 class="font-semibold mb-3">随访历史记录（可回看）</h4>
            <div class="space-y-3">
              <div
                v-for="record in detailData.followUpRecords"
                :key="record.id"
                class="p-4 border rounded bg-gray-50"
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
                    <p class="text-sm font-medium text-green-600">{{ record.contactResult }}</p>
                  </div>
                  <div v-if="record.nextFollowUp">
                    <label class="text-xs text-gray-500">下次随访</label>
                    <p class="text-sm text-blue-600">{{ formatDate(record.nextFollowUp) }}</p>
                  </div>
                </div>
              </div>
              <p v-if="!detailData.followUpRecords?.length" class="text-gray-500 text-center py-4">
                暂无随访记录
              </p>
            </div>
          </div>
        </div>

        <div v-else-if="sourceType === 'billing'">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-500 text-sm">单据号</label>
              <p class="font-mono font-medium">{{ detailData.billNo }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">创建时间</label>
              <p>{{ formatDate(detailData.createdAt) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">患者</label>
              <p class="font-medium">{{ detailData.patient?.name }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">状态</label>
              <p>
                <span :class="billStatusClass(detailData.status)" class="px-2 py-1 rounded text-xs">
                  {{ billStatusText(detailData.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">应收金额</label>
              <p class="text-lg font-bold">¥{{ formatNumber(detailData.amount) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">实收金额</label>
              <p class="text-lg font-bold text-green-600">¥{{ formatNumber(detailData.paidAmount) }}</p>
            </div>
          </div>

          <div v-if="detailData.medicalRecord" class="mb-6">
            <h4 class="font-semibold mb-3">关联病历</h4>
            <div class="p-3 border rounded flex justify-between items-center">
              <div>
                <p class="font-medium">{{ detailData.medicalRecord.recordNo }}</p>
                <p class="text-sm text-gray-500">{{ detailData.medicalRecord.diagnosis }}</p>
              </div>
              <button
                @click="viewSource('medical-record', detailData.medicalRecord.id)"
                class="text-blue-600 hover:underline text-sm"
              >
                查看病历 →
              </button>
            </div>
          </div>

          <div v-if="detailData.course" class="mb-6">
            <h4 class="font-semibold mb-3">关联疗程</h4>
            <div class="p-3 border rounded flex justify-between items-center">
              <div>
                <p class="font-medium">{{ detailData.course.name }}</p>
                <p class="text-xs text-gray-500">{{ detailData.course.courseNo }}</p>
                <p v-if="detailData.course.isLost" class="text-xs text-red-600 mt-1">
                  ⚠️ 患者已流失：{{ detailData.course.lostReason }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="detailData.items?.length > 0" class="mb-6">
            <h4 class="font-semibold mb-3">收费明细</h4>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">项目名称</th>
                  <th class="px-3 py-2 text-left">规格</th>
                  <th class="px-3 py-2 text-right">数量</th>
                  <th class="px-3 py-2 text-right">单价</th>
                  <th class="px-3 py-2 text-right">金额</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="(item, idx) in detailData.items" :key="idx">
                  <td class="px-3 py-2">{{ item.name }}</td>
                  <td class="px-3 py-2">{{ item.spec || '-' }}</td>
                  <td class="px-3 py-2 text-right">{{ item.quantity }}</td>
                  <td class="px-3 py-2 text-right">¥{{ formatNumber(item.unitPrice) }}</td>
                  <td class="px-3 py-2 text-right font-medium">¥{{ formatNumber(item.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-4 bg-gray-50 rounded">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">创建人</span>
              <span>{{ detailData.creator?.name }}</span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-gray-500">备注</span>
              <span>{{ detailData.remark || '无' }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="sourceType === 'patient-archive'">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-500 text-sm">档案编号</label>
              <p class="font-mono font-medium">{{ detailData.archiveNo }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">归档时间</label>
              <p>{{ formatDate(detailData.createdAt) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">患者</label>
              <p class="font-medium">{{ detailData.patient?.name }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">档案类型</label>
              <p>
                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {{ archiveTypeText(detailData.archiveType) }}
                </span>
              </p>
            </div>
          </div>

          <div class="mb-6">
            <label class="text-gray-500 text-sm block mb-1">档案摘要</label>
            <p class="p-3 bg-yellow-50 rounded">{{ detailData.summary }}</p>
          </div>

          <div v-if="detailData.medicalRecordId" class="mb-4">
            <button
              @click="viewSource('medical-record', detailData.medicalRecordId)"
              class="text-blue-600 hover:underline"
            >
              → 查看关联病历
            </button>
          </div>
          <div v-if="detailData.followUpTaskId" class="mb-4">
            <button
              @click="viewSource('follow-up', detailData.followUpTaskId)"
              class="text-blue-600 hover:underline"
            >
              → 查看关联随访任务
            </button>
          </div>
          <div v-if="detailData.treatmentCourseId" class="mb-4">
            <button
              @click="viewSource('treatment-course', detailData.treatmentCourseId)"
              class="text-blue-600 hover:underline"
            >
              → 查看关联疗程
            </button>
          </div>
          <div v-if="detailData.billingRecordId" class="mb-4">
            <button
              @click="viewSource('billing', detailData.billingRecordId)"
              class="text-blue-600 hover:underline"
            >
              → 查看关联收费单据
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">数据来源追溯链</h3>
        <div class="space-y-3">
          <div
            v-for="(source, index) in dataSources"
            :key="source.id"
            class="p-4 border rounded relative"
          >
            <div v-if="index < dataSources.length - 1" class="absolute left-6 top-full w-0.5 h-3 bg-blue-300"></div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-sm text-gray-500">{{ source.relation }}</span>
                    <p class="font-medium">{{ source.remark }}</p>
                  </div>
                  <span class="text-xs text-gray-400">{{ formatDate(source.createdAt) }}</span>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {{ source.sourceType }}
                  </span>
                  <span class="text-xs text-blue-600">
                    #{{ source.sourceNo }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="dataSources.length === 0" class="text-center py-8 text-gray-500">
            暂无来源数据
          </div>
        </div>
      </div>

      <div v-if="detailData.auditLogs?.length > 0" class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">操作历史</h3>
        <div class="space-y-3">
          <div
            v-for="log in detailData.auditLogs"
            :key="log.id"
            class="p-4 border rounded"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-medium">{{ log.operationType }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(log.createdAt) }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ log.changeReason || '无说明' }}</p>
            <p class="text-xs text-gray-500 mt-1">操作人：{{ log.operator?.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()

const route = useRoute()
const type = computed(() => route.params.type as string)
const id = computed(() => parseInt(route.params.id as string))

const loading = ref(true)
const detailData = ref<any>(null)
const dataSources = ref<any[]>([])
const sourceType = ref('')
const sourceNo = ref('')

const sourceTypeText = computed(() => {
  const map: Record<string, string> = {
    'medical-record': '病历',
    'follow-up': '随访任务',
    'billing': '收费单据',
    'patient-archive': '患者档案',
    'treatment-course': '疗程'
  }
  return map[type.value] || type.value
})

const formatDate = (date: string | number) => {
  return new Date(date).toLocaleString('zh-CN')
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

const getSectionTitle = () => {
  if (sourceType.value === 'MEDICAL_RECORD') return '病历详情'
  if (sourceType.value === 'FOLLOW_UP_TASK') return '随访任务详情'
  if (sourceType.value === 'BILLING_RECORD') return '收费单据详情'
  if (sourceType.value === 'PATIENT_ARCHIVE') return '患者档案详情'
  return '详情'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await get(`/api/reconciliation/${type.value}/${id.value}`)
    detailData.value = res.data?.data
    dataSources.value = res.data?.dataSources || []
    sourceType.value = res.data?.sourceType

    if (detailData.value) {
      if (detailData.value.recordNo) sourceNo.value = detailData.value.recordNo
      else if (detailData.value.taskNo) sourceNo.value = detailData.value.taskNo
      else if (detailData.value.billNo) sourceNo.value = detailData.value.billNo
      else if (detailData.value.archiveNo) sourceNo.value = detailData.value.archiveNo
      else sourceNo.value = id.value.toString()
    }
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const viewSource = (type: string, id: number) => {
  navigateTo(`/reconciliation/${type}/${id}`)
}

const goBack = () => {
  navigateTo('/reconciliation')
}

onMounted(() => {
  loadData()
})

watch(() => [route.params.type, route.params.id], () => {
  loadData()
})
</script>
