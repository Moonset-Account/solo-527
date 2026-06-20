<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">病历管理</h2>
      <button
        v-if="hasRole(['ADMIN', 'DOCTOR'])"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="showCreateModal = true"
      >
        新增病历
      </button>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索患者姓名、手机号、病历号"
          class="px-3 py-2 border rounded"
          @keyup.enter="loadData"
        />
        <input
          v-model="filters.startDate"
          type="date"
          class="px-3 py-2 border rounded"
        />
        <input
          v-model="filters.endDate"
          type="date"
          class="px-3 py-2 border rounded"
        />
        <button
          @click="loadData"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">病历号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">就诊日期</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">主诉</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">诊断</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关联疗程</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">收费单据</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="record in records" :key="record.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">{{ record.recordNo }}</td>
            <td class="px-4 py-3 text-sm">
              <div>{{ record.patient.name }}</div>
              <div class="text-xs text-gray-500">{{ record.patient.phone }}</div>
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(record.visitDate) }}</td>
            <td class="px-4 py-3 text-sm max-w-xs truncate" :title="record.chiefComplaint">
              {{ record.chiefComplaint }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {{ record.diagnosis }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span v-if="record._count.treatmentCourses > 0" class="text-green-600">
                {{ record._count.treatmentCourses }}个
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <button
                v-if="record._count.billingRecords > 0"
                class="text-blue-600 hover:underline"
                @click="viewBilling(record)"
              >
                {{ record._count.billingRecords }}张
              </button>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <button
                class="text-blue-600 hover:underline mr-2"
                @click="viewDetail(record)"
              >
                查看
              </button>
              <button
                class="text-green-600 hover:underline mr-2"
                @click="viewSource(record)"
              >
                追溯来源
              </button>
            </td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-500">
              暂无病历记录
            </td>
          </tr>
        </tbody>
      </table>

      <div class="px-4 py-3 flex justify-between items-center border-t">
        <span class="text-sm text-gray-600">共 {{ pagination.total }} 条记录</span>
        <div class="flex gap-2">
          <button
            @click="pagination.changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span class="px-3 py-1">
            {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <button
            @click="pagination.changePage(pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">病历详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div v-if="selectedRecord" class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-600 text-sm">病历号</label>
              <p>{{ selectedRecord.recordNo }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">就诊日期</label>
              <p>{{ formatDate(selectedRecord.visitDate) }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">患者姓名</label>
              <p>{{ selectedRecord.patient?.name }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">联系电话</label>
              <p>{{ selectedRecord.patient?.phone }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-gray-600 text-sm block mb-1">主诉</label>
              <p class="p-3 bg-gray-50 rounded">{{ selectedRecord.chiefComplaint }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">现病史</label>
              <p class="p-3 bg-gray-50 rounded">{{ selectedRecord.presentIllness }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">既往史</label>
              <p class="p-3 bg-gray-50 rounded">{{ selectedRecord.pastHistory || '无' }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">诊断</label>
              <p class="p-3 bg-blue-50 rounded text-blue-800">{{ selectedRecord.diagnosis }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">处方</label>
              <p class="p-3 bg-gray-50 rounded">{{ selectedRecord.prescription || '无' }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">治疗方案</label>
              <p class="p-3 bg-gray-50 rounded">{{ selectedRecord.treatment || '无' }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm block mb-1">摘要</label>
              <p class="p-3 bg-yellow-50 rounded">{{ selectedRecord.summary || '无' }}</p>
            </div>
          </div>

          <div class="mt-6">
            <h4 class="font-semibold mb-3">数据来源追溯</h4>
            <div class="space-y-2">
              <div
                v-for="source in selectedRecord.dataSources"
                :key="source.id"
                class="p-3 border rounded"
              >
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">{{ source.relation }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(source.createdAt) }}</span>
                </div>
                <p class="text-sm">{{ source.remark }}</p>
                <p class="text-xs text-blue-600 mt-1">
                  来源：{{ source.sourceType }} #{{ source.sourceNo }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <h4 class="font-semibold mb-3">操作历史</h4>
            <div class="space-y-2">
              <div
                v-for="log in selectedRecord.auditLogs"
                :key="log.id"
                class="p-3 border rounded"
              >
                <div class="flex justify-between">
                  <span class="text-sm font-medium">{{ log.operationType }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(log.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ log.changeReason }}</p>
                <p class="text-xs text-gray-500 mt-1">操作人：{{ log.operator.name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()
const { hasRole } = useAuth()

const pagination = usePagination(10)
const filters = ref({
  keyword: '',
  startDate: '',
  endDate: ''
})

const records = ref<any[]>([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedRecord = ref<any>(null)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadData = async () => {
  pagination.loading.value = true
  try {
    const res = await get('/api/medical-records', {
      ...pagination.getParams(),
      ...filters.value
    })
    records.value = res.data || []
    pagination.setTotal(res.total || 0)
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
}

const viewDetail = async (record: any) => {
  try {
    const res = await get(`/api/medical-records/${record.id}`)
    selectedRecord.value = res.data
    showDetailModal.value = true
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

const viewSource = (record: any) => {
  navigateTo(`/reconciliation/medical-record/${record.id}`)
}

const viewBilling = (record: any) => {
  navigateTo(`/reports/billing?medicalRecordId=${record.id}`)
}

watch(() => pagination.page, loadData)
watch(() => pagination.pageSize, loadData)

onMounted(() => {
  loadData()
})
</script>
