<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">疗程管理</h2>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          @click="showBatchLostModal = true"
        >
          批量标记流失
        </button>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索患者姓名"
          class="px-3 py-2 border rounded"
        />
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部状态</option>
          <option value="NOT_STARTED">未开始</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="SUSPENDED">已暂停</option>
          <option value="LOST">已流失</option>
        </select>
        <select v-model="filters.isLost" class="px-3 py-2 border rounded">
          <option value="">是否流失</option>
          <option value="true">已流失</option>
          <option value="false">未流失</option>
        </select>
        <button
          @click="loadData"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          搜索
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
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">疗程编号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">疗程名称</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">关联方案</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">开始日期</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">完成进度</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">是否流失</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.includes(course.id)"
                @change="toggleSelect(course.id)"
              />
            </td>
            <td class="px-4 py-3 text-sm font-mono">{{ course.courseNo }}</td>
            <td class="px-4 py-3 text-sm">
              <div>{{ course.patient.name }}</div>
              <div class="text-xs text-gray-500">{{ course.patient.phone }}</div>
            </td>
            <td class="px-4 py-3 text-sm font-medium">{{ course.name }}</td>
            <td class="px-4 py-3 text-sm">
              <span v-if="course.plan" class="text-purple-600">{{ course.plan.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(course.startDate) }}</td>
            <td class="px-4 py-3 text-sm">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  class="h-2 rounded-full"
                  :class="course.completedSessions >= course.totalSessions ? 'bg-green-500' : 'bg-blue-500'"
                  :style="{ width: `${(course.completedSessions / course.totalSessions) * 100}%` }"
                ></div>
              </div>
              <span class="text-xs text-gray-500">
                {{ course.completedSessions }}/{{ course.totalSessions }} 次
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span :class="statusClass(course.status)" class="px-2 py-1 rounded text-xs">
                {{ statusText(course.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span v-if="course.isLost" class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                已流失
              </span>
              <span v-else class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                正常
              </span>
            </td>
            <td class="px-4 py-3 text-sm space-x-2">
              <button
                class="text-blue-600 hover:underline"
                @click="viewDetail(course)"
              >
                查看
              </button>
              <button
                v-if="!course.isLost && course.status !== 'COMPLETED'"
                class="text-red-600 hover:underline"
                @click="handleMarkLost(course)"
              >
                标记流失
              </button>
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

    <div v-if="showLostModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">标记流失</h3>
          <button @click="showLostModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div class="p-6">
          <div v-if="selectedCourse" class="mb-4 p-4 bg-yellow-50 rounded">
            <p class="text-yellow-800">
              即将标记 <strong>{{ selectedCourse.name }}</strong> 为流失
            </p>
            <p class="text-sm text-yellow-600 mt-1">
              患者：{{ selectedCourse.patient?.name }}
            </p>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">流失原因 *</label>
            <textarea
              v-model="lostForm.reason"
              class="w-full px-3 py-2 border rounded"
              rows="4"
              placeholder="请详细说明流失原因，该记录将沉淀到收费报表"
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showLostModal = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="submitMarkLost"
              :disabled="submitting"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {{ submitting ? '处理中...' : '确认标记流失' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showBatchLostModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">批量标记流失</h3>
          <button @click="showBatchLostModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div class="p-6">
          <div v-if="selectedIds.length > 0" class="mb-4 p-4 bg-yellow-50 rounded">
            <p class="text-yellow-800">
              即将标记 <strong>{{ selectedIds.length }}</strong> 个疗程为流失
            </p>
            <p class="text-sm text-yellow-600 mt-1">
              该操作将同时更新患者状态，并沉淀到收费报表
            </p>
          </div>
          <div v-else class="mb-4 p-4 bg-gray-50 rounded">
            <p class="text-gray-600">请先在列表中选择要标记流失的疗程</p>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">流失原因 *</label>
            <textarea
              v-model="batchLostForm.reason"
              class="w-full px-3 py-2 border rounded"
              rows="4"
              placeholder="请说明流失原因"
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showBatchLostModal = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="submitBatchMarkLost"
              :disabled="submitting || selectedIds.length === 0"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {{ submitting ? '处理中...' : '确认批量标记' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="batchResult" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6 border-b">
          <h3 class="text-xl font-bold">批量标记流失结果</h3>
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
              @click="batchResult = null; showBatchLostModal = false; loadData()"
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

const pagination = usePagination(10)
const filters = ref({
  keyword: '',
  status: '',
  isLost: ''
})

const courses = ref<any[]>([])
const selectedIds = ref<number[]>([])
const showLostModal = ref(false)
const showBatchLostModal = ref(false)
const selectedCourse = ref<any>(null)
const submitting = ref(false)
const batchResult = ref<any>(null)

const lostForm = ref({
  reason: ''
})

const batchLostForm = ref({
  reason: ''
})

const isAllSelected = computed(() => {
  return courses.value.length > 0 && courses.value.every(c => selectedIds.value.includes(c.id))
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
    LOST: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    SUSPENDED: '已暂停',
    LOST: '已流失'
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
    if (!params.isLost) delete params.isLost

    const res = await get('/api/treatment-courses', params)
    courses.value = res.data || []
    pagination.setTotal(res.total || 0)
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
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
    selectedIds.value = courses.value.map(c => c.id)
  }
}

const viewDetail = (course: any) => {
  alert(`查看疗程详情：${course.name}`)
}

const handleMarkLost = (course: any) => {
  selectedCourse.value = course
  lostForm.value.reason = ''
  showLostModal.value = true
}

const submitMarkLost = async () => {
  if (!lostForm.value.reason) {
    alert('请填写流失原因')
    return
  }

  const confirmed = confirm('确定要标记该疗程为流失吗？该操作将更新患者状态并沉淀到收费报表。')
  if (!confirmed) return

  submitting.value = true
  try {
    const res = await post(`/api/treatment-courses/${selectedCourse.value.id}/lost`, {
      lostReason: lostForm.value.reason
    })
    alert(res.message)
    showLostModal.value = false
    selectedIds.value = []
    loadData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const submitBatchMarkLost = async () => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要标记流失的疗程')
    return
  }

  if (!batchLostForm.value.reason) {
    alert('请填写流失原因')
    return
  }

  const confirmed = confirm(`确定要批量标记 ${selectedIds.value.length} 个疗程为流失吗？该操作将更新患者状态并沉淀到收费报表。`)
  if (!confirmed) return

  submitting.value = true
  try {
    const res = await put('/api/batch/treatment-courses/lost', {
      ids: selectedIds.value,
      lostReason: batchLostForm.value.reason
    })

    batchResult.value = {
      total: selectedIds.value.length,
      success: res.successCount || 0,
      fail: res.failCount || 0,
      failedItems: res.failedItems || []
    }

    selectedIds.value = []
    batchLostForm.value.reason = ''
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
