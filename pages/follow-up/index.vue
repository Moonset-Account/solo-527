<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">随访任务管理</h2>
      <div class="flex gap-2">
        <button
          v-if="hasRole(['ADMIN', 'OPERATOR'])"
          class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          @click="showBatchModal = true"
        >
          批量修改状态
        </button>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索患者"
          class="px-3 py-2 border rounded"
        />
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
          <option value="FAILED">已失败</option>
        </select>
        <select v-model="filters.type" class="px-3 py-2 border rounded">
          <option value="">全部类型</option>
          <option value="PHONE">电话</option>
          <option value="WECHAT">微信</option>
          <option value="VISIT">上门</option>
          <option value="OTHER">其他</option>
        </select>
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
      </div>
      <div class="mt-4 flex gap-2">
        <button
          @click="loadData"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          搜索
        </button>
        <button
          @click="resetFilters"
          class="px-4 py-2 border rounded hover:bg-gray-50"
        >
          重置
        </button>
      </div>
    </div>

    <div v-if="selectedIds.length > 0" class="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
      <span>已选择 {{ selectedIds.length }} 条记录</span>
      <button
        @click="selectedIds = []"
        class="text-blue-600 hover:underline"
      >
        取消选择
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">任务号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">计划时间</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">优先级</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">随访次数</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">负责人</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="task in tasks" :key="task.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.includes(task.id)"
                @change="toggleSelect(task.id)"
              />
            </td>
            <td class="px-4 py-3 text-sm font-mono">{{ task.taskNo }}</td>
            <td class="px-4 py-3 text-sm">
              <div>{{ task.patient?.name || '-' }}</div>
              <div class="text-xs text-gray-500">{{ task.patient?.phone || '-' }}</div>
            </td>
            <td class="px-4 py-3 text-sm">
              <span :class="typeClass(task.type)" class="px-2 py-1 rounded text-xs">
                {{ typeText(task.type) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(task.scheduledDate) }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                v-for="i in (task.priority || 0)"
                :key="i"
                class="text-yellow-500"
              >★</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span :class="statusClass(task.status)" class="px-2 py-1 rounded text-xs">
                {{ statusText(task.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="text-blue-600">{{ task._count?.followUpRecords ?? 0 }} 次</span>
            </td>
            <td class="px-4 py-3 text-sm">{{ task.assignee?.name || '-' }}</td>
            <td class="px-4 py-3 text-sm space-x-2">
              <button
                class="text-blue-600 hover:underline"
                @click="viewDetail(task)"
              >
                查看
              </button>
              <button
                v-if="task.status !== 'COMPLETED' && task.status !== 'CANCELLED'"
                class="text-green-600 hover:underline"
                @click="openRecordModal(task)"
              >
                记录随访
              </button>
              <button
                class="text-purple-600 hover:underline"
                @click="viewHistory(task)"
              >
                回看历史
              </button>
            </td>
          </tr>
          <tr v-if="tasks.length === 0">
            <td colspan="10" class="px-4 py-8 text-center text-gray-500">
              暂无随访任务
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
      <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">随访任务详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div v-if="selectedTask" class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-600 text-sm">任务号</label>
              <p>{{ selectedTask.taskNo }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">类型</label>
              <p>{{ typeText(selectedTask.type) }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">患者</label>
              <p>{{ selectedTask.patient?.name }} ({{ selectedTask.patient?.phone }})</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">计划时间</label>
              <p>{{ formatDate(selectedTask.scheduledDate) }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">状态</label>
              <p>
                <span :class="statusClass(selectedTask.status)" class="px-2 py-1 rounded text-xs">
                  {{ statusText(selectedTask.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">负责人</label>
              <p>{{ selectedTask.assignee?.name }}</p>
            </div>
          </div>

          <div class="mb-6">
            <label class="text-gray-600 text-sm block mb-1">随访内容</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedTask.content || '无' }}</p>
          </div>

          <div v-if="selectedTask.result" class="mb-6">
            <label class="text-gray-600 text-sm block mb-1">随访结果</label>
            <p class="p-3 bg-green-50 rounded">{{ selectedTask.result }}</p>
          </div>

          <div>
            <h4 class="font-semibold mb-3">随访历史记录（可回看）</h4>
            <div class="space-y-3">
              <div
                v-for="record in (selectedTask.followUpRecords || [])"
                :key="record.id"
                class="p-4 border rounded bg-gray-50"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm font-medium">{{ record.operator?.name || '-' }}</span>
                  <span class="text-xs text-gray-500">{{ formatDate(record.recordDate) }}</span>
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
              <p v-if="!selectedTask.followUpRecords?.length" class="text-gray-500 text-center py-4">
                暂无随访记录
              </p>
            </div>
          </div>

          <div class="mt-6">
            <h4 class="font-semibold mb-3">数据来源追溯</h4>
            <div class="space-y-2">
              <div
                v-for="source in (selectedTask.dataSources || [])"
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
        </div>
      </div>
    </div>

    <div v-if="showRecordFormModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-lg">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">记录随访</h3>
          <button @click="showRecordFormModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">随访内容</label>
            <textarea
              v-model="followUpForm.content"
              class="w-full px-3 py-2 border rounded"
              rows="4"
              placeholder="请输入本次随访的具体内容"
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">联系结果</label>
            <select v-model="followUpForm.contactResult" class="w-full px-3 py-2 border rounded">
              <option value="">请选择</option>
              <option value="SUCCESS">联系成功，患者情况良好</option>
              <option value="IMPROVED">症状有所改善</option>
              <option value="UNCHANGED">症状无明显变化</option>
              <option value="WORSE">症状加重，需复诊</option>
              <option value="NO_ANSWER">无人接听</option>
              <option value="WRONG_NUMBER">号码错误</option>
              <option value="REFUSED">患者拒绝随访</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">下次随访时间（选填）</label>
            <input
              v-model="followUpForm.nextFollowUp"
              type="datetime-local"
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showRecordFormModal = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="submitFollowUpRecord"
              :disabled="submitting"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {{ submitting ? '提交中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">批量修改状态</h3>
          <button @click="showBatchModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div class="p-6">
          <div class="mb-4 p-4 bg-yellow-50 rounded">
            <p class="text-yellow-800">
              即将修改 <strong>{{ selectedIds.length }}</strong> 条随访任务的状态
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">目标状态</label>
            <select v-model="batchForm.status" class="w-full px-3 py-2 border rounded">
              <option value="">请选择</option>
              <option value="PENDING">待处理</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
              <option value="FAILED">已失败</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">修改原因</label>
            <textarea
              v-model="batchForm.changeReason"
              class="w-full px-3 py-2 border rounded"
              rows="3"
              placeholder="请说明修改原因"
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showBatchModal = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="submitBatchUpdate"
              :disabled="submitting || !batchForm.status"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {{ submitting ? '处理中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="batchResult" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6 border-b">
          <h3 class="text-xl font-bold">批量操作结果</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-blue-50 rounded">
              <p class="text-2xl font-bold text-blue-600">{{ batchResult.total }}</p>
              <p class="text-sm text-gray-600">总数</p>
            </div>
            <div class="text-center p-4 bg-green-50 rounded">
              <p class="text-2xl font-bold text-green-600">{{ batchResult.success }}</p>
              <p class="text-sm text-gray-600">成功</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded">
              <p class="text-2xl font-bold text-red-600">{{ batchResult.fail }}</p>
              <p class="text-sm text-gray-600">失败</p>
            </div>
          </div>

          <div v-if="batchResult.failedItems.length > 0" class="mb-4">
            <h4 class="font-semibold mb-2 text-red-600">失败明细</h4>
            <div class="max-h-48 overflow-auto space-y-2">
              <div
                v-for="(item, index) in batchResult.failedItems"
                :key="index"
                class="p-3 bg-red-50 rounded text-sm"
              >
                <span class="font-medium">ID: {{ item.id }}</span>
                <span class="text-red-600 ml-2">{{ item.error }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              @click="batchResult = null; showBatchModal = false; loadData()"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get, post, put } = useApi()
const { hasRole } = useAuth()

const pagination = usePagination(10)
const filters = ref({
  keyword: '',
  status: '',
  type: '',
  startDate: '',
  endDate: ''
})

const tasks = ref<any[]>([])
const selectedIds = ref<number[]>([])
const showDetailModal = ref(false)
const showRecordFormModal = ref(false)
const showBatchModal = ref(false)
const selectedTask = ref<any>(null)
const submitting = ref(false)
const batchResult = ref<any>(null)

const followUpForm = ref({
  content: '',
  contactResult: '',
  nextFollowUp: ''
})

const batchForm = ref({
  status: '',
  changeReason: ''
})

const isAllSelected = computed(() => {
  return tasks.value.length > 0 && tasks.value.every(t => selectedIds.value.includes(t.id))
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const typeClass = (type: string) => {
  const map: Record<string, string> = {
    PHONE: 'bg-purple-100 text-purple-800',
    WECHAT: 'bg-green-100 text-green-800',
    VISIT: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800'
  }
  return map[type] || 'bg-gray-100 text-gray-800'
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

const loadData = async () => {
  pagination.loading.value = true
  try {
    const res = await get('/api/follow-up', {
      ...pagination.getParams(),
      ...filters.value
    })
    tasks.value = res.data || []
    pagination.setTotal(res.total || 0)
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: '',
    type: '',
    startDate: '',
    endDate: ''
  }
  pagination.reset()
  loadData()
}

const toggleSelect = (id: number) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = tasks.value.map(t => t.id)
  }
}

const viewDetail = async (task: any) => {
  try {
    const res = await get(`/api/follow-up/${task.id}`)
    selectedTask.value = res.data
    showDetailModal.value = true
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

const viewHistory = (task: any) => {
  viewDetail(task)
}

const openRecordModal = (task: any) => {
  selectedTask.value = task
  followUpForm.value = {
    content: '',
    contactResult: '',
    nextFollowUp: ''
  }
  showRecordFormModal.value = true
}

const submitFollowUpRecord = async () => {
  if (!followUpForm.value.content || !followUpForm.value.contactResult) {
    alert('请填写完整的随访信息')
    return
  }

  submitting.value = true
  try {
    const res = await post(`/api/follow-up/${selectedTask.value.id}/record`, followUpForm.value)
    alert(res.message)
    showRecordFormModal.value = false
    loadData()
  } catch (e: any) {
    alert(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const submitBatchUpdate = async () => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要修改的记录')
    return
  }

  const confirmed = confirm(`确定要修改 ${selectedIds.value.length} 条记录的状态吗？`)
  if (!confirmed) return

  submitting.value = true
  try {
    const res = await put('/api/batch/follow-up/status', {
      ids: selectedIds.value,
      status: batchForm.value.status,
      changeReason: batchForm.value.changeReason
    })

    batchResult.value = {
      total: selectedIds.value.length,
      success: res.successCount || 0,
      fail: res.failCount || 0,
      failedItems: res.failedItems || []
    }

    selectedIds.value = []
    batchForm.value = { status: '', changeReason: '' }
  } catch (e: any) {
    alert(e.message || '批量操作失败')
  } finally {
    submitting.value = false
  }
}

watch(() => pagination.page, loadData)
watch(() => pagination.pageSize, loadData)

onMounted(() => {
  loadData()
})
</script>
