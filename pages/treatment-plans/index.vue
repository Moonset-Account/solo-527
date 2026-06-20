<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">疗程方案配置</h2>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="showCreateModal = true"
      >
        新增方案
      </button>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索方案名称"
          class="px-3 py-2 border rounded"
        />
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部状态</option>
          <option value="ACTIVE">启用</option>
          <option value="INACTIVE">停用</option>
          <option value="DRAFT">草稿</option>
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
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">方案编号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">方案名称</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">疗程时长</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">治疗频率</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">价格</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">使用次数</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="plan in plans" :key="plan.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono">{{ plan.planNo }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ plan.name }}</td>
            <td class="px-4 py-3 text-sm">
              <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                {{ plan.type }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">{{ plan.duration }}天</td>
            <td class="px-4 py-3 text-sm">{{ plan.frequency }}</td>
            <td class="px-4 py-3 text-sm font-medium text-green-600">
              ¥{{ Number(plan.price).toFixed(2) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ plan._count.treatmentCourses }} 次</td>
            <td class="px-4 py-3 text-sm">
              <span :class="statusClass(plan.status)" class="px-2 py-1 rounded text-xs">
                {{ statusText(plan.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm space-x-2">
              <button
                class="text-blue-600 hover:underline"
                @click="viewDetail(plan)"
              >
                查看
              </button>
              <button
                class="text-green-600 hover:underline"
                @click="editPlan(plan)"
              >
                编辑
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

    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">方案详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div v-if="selectedPlan" class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-600 text-sm">方案编号</label>
              <p>{{ selectedPlan.planNo }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">状态</label>
              <p>
                <span :class="statusClass(selectedPlan.status)" class="px-2 py-1 rounded text-xs">
                  {{ statusText(selectedPlan.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">方案名称</label>
              <p class="font-medium">{{ selectedPlan.name }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">类型</label>
              <p>{{ selectedPlan.type }}</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">疗程时长</label>
              <p>{{ selectedPlan.duration }}天</p>
            </div>
            <div>
              <label class="text-gray-600 text-sm">治疗频率</label>
              <p>{{ selectedPlan.frequency }}</p>
            </div>
            <div class="col-span-2">
              <label class="text-gray-600 text-sm">价格</label>
              <p class="text-xl font-bold text-green-600">¥{{ Number(selectedPlan.price).toFixed(2) }}</p>
            </div>
          </div>

          <div v-if="selectedPlan.description" class="mb-6">
            <label class="text-gray-600 text-sm block mb-1">方案描述</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedPlan.description }}</p>
          </div>

          <div class="mb-6">
            <label class="text-gray-600 text-sm block mb-1">治疗项目</label>
            <div class="p-3 bg-gray-50 rounded">
              <div v-if="selectedPlan.items?.treatments" class="flex flex-wrap gap-2">
                <span
                  v-for="(item, index) in selectedPlan.items.treatments"
                  :key="index"
                  class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {{ item }}
                </span>
              </div>
              <p v-if="selectedPlan.items?.eachTime" class="text-sm text-gray-600 mt-2">
                每次治疗时长：{{ selectedPlan.items.eachTime }} 分钟
              </p>
            </div>
          </div>

          <div v-if="selectedPlan.remark" class="mb-6">
            <label class="text-gray-600 text-sm block mb-1">备注</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedPlan.remark }}</p>
          </div>

          <div class="flex justify-end">
            <button
              @click="editPlan(selectedPlan)"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              编辑方案
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">{{ isEdit ? '编辑方案' : '新增方案' }}</h3>
          <button @click="showEditModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">方案名称 *</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-3 py-2 border rounded"
                placeholder="请输入方案名称"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">方案类型 *</label>
              <select v-model="form.type" class="w-full px-3 py-2 border rounded">
                <option value="">请选择</option>
                <option value="针灸">针灸</option>
                <option value="推拿">推拿</option>
                <option value="中药">中药</option>
                <option value="综合调理">综合调理</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">疗程时长（天）*</label>
              <input
                v-model.number="form.duration"
                type="number"
                min="1"
                class="w-full px-3 py-2 border rounded"
                placeholder="请输入疗程天数"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">治疗频率 *</label>
              <input
                v-model="form.frequency"
                type="text"
                class="w-full px-3 py-2 border rounded"
                placeholder="如：每周2次"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">价格（元）*</label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border rounded"
                placeholder="请输入价格"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">状态</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded">
                <option value="ACTIVE">启用</option>
                <option value="INACTIVE">停用</option>
                <option value="DRAFT">草稿</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2">每次时长（分钟）*</label>
              <input
                v-model.number="form.items.eachTime"
                type="number"
                min="1"
                class="w-full px-3 py-2 border rounded"
                placeholder="请输入每次治疗时长"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">治疗项目 *</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="(item, index) in form.items.treatments"
                :key="index"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
              >
                {{ item }}
                <button @click="removeTreatment(index)" class="text-blue-600 hover:text-blue-800">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newTreatment"
                type="text"
                class="flex-1 px-3 py-2 border rounded"
                placeholder="输入治疗项目名称"
                @keyup.enter="addTreatment"
              />
              <button
                @click="addTreatment"
                class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                添加
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">方案描述</label>
            <textarea
              v-model="form.description"
              class="w-full px-3 py-2 border rounded"
              rows="3"
              placeholder="请输入方案描述"
            ></textarea>
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">备注</label>
            <textarea
              v-model="form.remark"
              class="w-full px-3 py-2 border rounded"
              rows="2"
              placeholder="请输入备注信息"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3">
            <button
              @click="showEditModal = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="submitPlan"
              :disabled="submitting"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {{ submitting ? '保存中...' : '保存' }}
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
  status: ''
})

const plans = ref<any[]>([])
const showDetailModal = ref(false)
const showEditModal = ref(false)
const showCreateModal = ref(false)
const selectedPlan = ref<any>(null)
const isEdit = ref(false)
const submitting = ref(false)
const newTreatment = ref('')

const form = ref({
  name: '',
  description: '',
  type: '',
  duration: 30,
  frequency: '',
  price: 0,
  status: 'ACTIVE',
  items: {
    treatments: [] as string[],
    eachTime: 30
  },
  remark: ''
})

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '启用',
    INACTIVE: '停用'
  }
  return map[status] || status
}

const loadData = async () => {
  pagination.loading.value = true
  try {
    const res = await get('/api/treatment-plans', {
      ...pagination.getParams(),
      ...filters.value
    })
    plans.value = res.data || []
    pagination.setTotal(res.total || 0)
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
}

const viewDetail = (plan: any) => {
  selectedPlan.value = plan
  showDetailModal.value = true
}

const editPlan = (plan: any) => {
  isEdit.value = true
  showDetailModal.value = false
  form.value = {
    name: plan.name,
    description: plan.description || '',
    type: plan.type,
    duration: plan.duration,
    frequency: plan.frequency,
    price: Number(plan.price),
    status: plan.status,
    items: {
      treatments: [...(plan.items?.treatments || [])],
      eachTime: plan.items?.eachTime || 30
    },
    remark: plan.remark || ''
  }
  selectedPlan.value = plan
  showEditModal.value = true
}

const addTreatment = () => {
  if (newTreatment.value.trim()) {
    form.value.items.treatments.push(newTreatment.value.trim())
    newTreatment.value = ''
  }
}

const removeTreatment = (index: number) => {
  form.value.items.treatments.splice(index, 1)
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    type: '',
    duration: 30,
    frequency: '',
    price: 0,
    status: 'ACTIVE',
    items: {
      treatments: [],
      eachTime: 30
    },
    remark: ''
  }
  newTreatment.value = ''
  selectedPlan.value = null
}

watch(showCreateModal, (val) => {
  if (val) {
    resetForm()
    isEdit.value = false
    showEditModal.value = true
  }
})

const submitPlan = async () => {
  if (!form.value.name || !form.value.type || !form.value.frequency || form.value.items.treatments.length === 0) {
    alert('请填写完整的方案信息')
    return
  }

  submitting.value = true
  try {
    let res
    if (isEdit.value && selectedPlan.value) {
      res = await put(`/api/treatment-plans/${selectedPlan.value.id}`, form.value)
    } else {
      res = await post('/api/treatment-plans', form.value)
    }
    alert(res.message)
    showEditModal.value = false
    showCreateModal.value = false
    loadData()
  } catch (e: any) {
    alert(e.message || '保存失败')
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
