<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">批量操作记录</h2>
      <button
        @click="loadData"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        刷新
      </button>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select v-model="filters.operationType" class="px-3 py-2 border rounded">
          <option value="">全部操作类型</option>
          <option value="FOLLOW_UP_STATUS">批量修改随访状态</option>
          <option value="TREATMENT_COURSE_LOST">批量标记疗程流失</option>
        </select>
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部执行状态</option>
          <option value="COMPLETED">全部成功</option>
          <option value="PARTIAL">部分成功</option>
          <option value="FAILED">全部失败</option>
        </select>
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
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作编号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作类型</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作时间</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作人</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">总数</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">成功</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">失败</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">执行状态</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="operation in operations"
            :key="operation.id"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ operation.batchNo }}</td>
            <td class="px-4 py-3 text-sm">
              <span :class="operationTypeClass(operation.operationType)" class="px-2 py-1 rounded text-xs">
                {{ operationTypeText(operation.operationType) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(operation.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ operation.operator?.name }}</td>
            <td class="px-4 py-3 text-sm text-center font-medium">
              {{ operation.totalCount }}
            </td>
            <td class="px-4 py-3 text-sm text-center text-green-600 font-medium">
              {{ operation.successCount }}
            </td>
            <td class="px-4 py-3 text-sm text-center text-red-600 font-medium">
              {{ operation.failCount }}
            </td>
            <td class="px-4 py-3 text-center">
              <span :class="statusClass(operation.status)" class="px-2 py-1 rounded text-xs">
                {{ statusText(operation.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button
                v-if="operation.failCount > 0"
                class="text-blue-600 hover:underline text-sm"
                @click="viewDetail(operation)"
              >
                查看失败明细
              </button>
              <span v-else class="text-gray-400 text-sm">-</span>
            </td>
          </tr>
          <tr v-if="operations.length === 0">
            <td colspan="9" class="px-4 py-8 text-center text-gray-500">
              暂无批量操作记录
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
      <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">批量操作详情</h3>
            <p class="text-sm text-gray-500 mt-1">{{ selectedOperation?.batchNo }}</p>
          </div>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div v-if="selectedOperation" class="p-6">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-blue-50 rounded">
              <p class="text-2xl font-bold text-blue-600">{{ selectedOperation.totalCount }}</p>
              <p class="text-sm text-gray-600">处理总数</p>
            </div>
            <div class="text-center p-4 bg-green-50 rounded">
              <p class="text-2xl font-bold text-green-600">{{ selectedOperation.successCount }}</p>
              <p class="text-sm text-gray-600">成功数量</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded">
              <p class="text-2xl font-bold text-red-600">{{ selectedOperation.failCount }}</p>
              <p class="text-sm text-gray-600">失败数量</p>
            </div>
          </div>

          <div class="mb-6 p-4 bg-gray-50 rounded">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="text-gray-500">操作类型</label>
                <p class="font-medium">{{ operationTypeText(selectedOperation.operationType) }}</p>
              </div>
              <div>
                <label class="text-gray-500">执行状态</label>
                <p>
                  <span :class="statusClass(selectedOperation.status)" class="px-2 py-1 rounded text-xs">
                    {{ statusText(selectedOperation.status) }}
                  </span>
                </p>
              </div>
              <div>
                <label class="text-gray-500">操作人</label>
                <p>{{ selectedOperation.operator?.name }}</p>
              </div>
              <div>
                <label class="text-gray-500">操作时间</label>
                <p>{{ formatDate(selectedOperation.createdAt) }}</p>
              </div>
            </div>
            <div class="mt-3" v-if="selectedOperation.changeReason">
              <label class="text-gray-500 text-sm">修改原因</label>
              <p class="text-sm">{{ selectedOperation.changeReason }}</p>
            </div>
          </div>

          <div v-if="failedItems.length > 0">
            <h4 class="font-semibold mb-3 text-red-600">失败明细</h4>
            <div class="space-y-2 max-h-64 overflow-auto">
              <div
                v-for="(item, index) in failedItems"
                :key="index"
                class="p-3 bg-red-50 rounded text-sm border border-red-100"
              >
                <div class="flex justify-between items-start">
                  <span class="font-medium text-red-800">ID: {{ item.id }}</span>
                  <span class="text-xs text-gray-500">#{{ index + 1 }}</span>
                </div>
                <p class="text-red-600 mt-1">{{ item.error }}</p>
                <p v-if="item.additionalInfo" class="text-xs text-gray-500 mt-1">
                  详情：{{ item.additionalInfo }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            无失败记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()

const pagination = usePagination(20)
const filters = ref({
  operationType: '',
  status: ''
})

const operations = ref<any[]>([])
const showDetailModal = ref(false)
const selectedOperation = ref<any>(null)
const failedItems = ref<any[]>([])

const formatDate = (date: string | number) => {
  return new Date(date).toLocaleString('zh-CN')
}

const operationTypeClass = (type: string) => {
  const map: Record<string, string> = {
    FOLLOW_UP_STATUS: 'bg-purple-100 text-purple-800',
    TREATMENT_COURSE_LOST: 'bg-orange-100 text-orange-800'
  }
  return map[type] || 'bg-gray-100 text-gray-800'
}

const operationTypeText = (type: string) => {
  const map: Record<string, string> = {
    FOLLOW_UP_STATUS: '批量修改随访状态',
    TREATMENT_COURSE_LOST: '批量标记疗程流失'
  }
  return map[type] || type
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-blue-100 text-blue-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: '全部成功',
    PARTIAL: '部分成功',
    FAILED: '全部失败',
    PROCESSING: '处理中'
  }
  return map[status] || status
}

const loadData = async () => {
  pagination.loading.value = true
  try {
    const params: any = {
      ...pagination.getParams(),
      ...filters.value
    }
    if (!params.operationType) delete params.operationType
    if (!params.status) delete params.status

    const res = await get('/api/batch/operations', params)
    operations.value = res.data || []
    pagination.setTotal(res.total || 0)
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
}

const viewDetail = (operation: any) => {
  selectedOperation.value = operation
  try {
    const failedData = operation.failedItems ? JSON.parse(operation.failedItems) : []
    failedItems.value = Array.isArray(failedData) ? failedData : []
  } catch {
    failedItems.value = []
  }
  showDetailModal.value = true
}

watch(() => pagination.page, loadData)
watch(() => pagination.pageSize, loadData)

onMounted(() => {
  loadData()
})
</script>
