<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">患者档案</h2>
      <button
        v-if="hasRole(['ADMIN', 'DOCTOR'])"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="showCreateModal = true"
      >
        新增患者
      </button>
    </div>

    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索患者姓名、手机号、档案号"
          class="px-3 py-2 border rounded"
          @keyup.enter="loadData"
        />
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部状态</option>
          <option value="ACTIVE">在诊</option>
          <option value="INACTIVE">暂停</option>
          <option value="LOST">已流失</option>
          <option value="COMPLETED">已完成</option>
        </select>
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

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">患者总数</p>
        <p class="text-2xl font-bold text-blue-600">{{ pagination.total }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">在诊患者</p>
        <p class="text-2xl font-bold text-green-600">{{ activeCount }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">流失患者</p>
        <p class="text-2xl font-bold text-red-600">{{ lostCount }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-gray-500 text-sm">本月新增</p>
        <p class="text-2xl font-bold text-purple-600">{{ newThisMonth }}</p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">档案号</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">患者信息</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">性别/年龄</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">初诊日期</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">病历数</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">疗程数</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">随访数</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="patient in patients"
            :key="patient.id"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ patient.patientNo }}</td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium">{{ patient.name }}</div>
              <div class="text-xs text-gray-500">{{ patient.phone }}</div>
            </td>
            <td class="px-4 py-3 text-sm">
              {{ genderText(patient.gender) }} / {{ patient.age || '未知' }}岁
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(patient.firstVisitDate) }}</td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                v-if="patient._count?.medicalRecords > 0"
                class="text-blue-600 hover:underline"
                @click="viewPatientRecords(patient)"
              >
                {{ patient._count?.medicalRecords || 0 }}
              </button>
              <span v-else>{{ patient._count?.medicalRecords || 0 }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                v-if="patient._count?.treatmentCourses > 0"
                class="text-purple-600 hover:underline"
                @click="viewPatientCourses(patient)"
              >
                {{ patient._count?.treatmentCourses || 0 }}
              </button>
              <span v-else>{{ patient._count?.treatmentCourses || 0 }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                v-if="patient._count?.followUpTasks > 0"
                class="text-green-600 hover:underline"
                @click="viewPatientFollowUps(patient)"
              >
                {{ patient._count?.followUpTasks || 0 }}
              </button>
              <span v-else>{{ patient._count?.followUpTasks || 0 }}</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span :class="statusClass(patient.status)" class="px-2 py-1 rounded text-xs">
                {{ statusText(patient.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button
                class="text-blue-600 hover:underline mr-2 text-sm"
                @click="viewDetail(patient)"
              >
                查看
              </button>
              <button
                class="text-green-600 hover:underline text-sm"
                @click="viewSource(patient)"
              >
                追溯来源
              </button>
            </td>
          </tr>
          <tr v-if="patients.length === 0">
            <td colspan="9" class="px-4 py-8 text-center text-gray-500">
              暂无患者档案
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
          <h3 class="text-xl font-bold">患者详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div v-if="selectedPatient" class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-gray-500 text-sm">档案号</label>
              <p class="font-mono font-medium">{{ selectedPatient.patientNo }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">姓名</label>
              <p class="font-medium">{{ selectedPatient.name }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">性别</label>
              <p>{{ genderText(selectedPatient.gender) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">年龄</label>
              <p>{{ selectedPatient.age || '未知' }} 岁</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">手机号</label>
              <p>{{ selectedPatient.phone }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">初诊日期</label>
              <p>{{ formatDate(selectedPatient.firstVisitDate) }}</p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">状态</label>
              <p>
                <span :class="statusClass(selectedPatient.status)" class="px-2 py-1 rounded text-xs">
                  {{ statusText(selectedPatient.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-gray-500 text-sm">建档时间</label>
              <p>{{ formatDate(selectedPatient.createdAt) }}</p>
            </div>
          </div>

          <div class="mb-6">
            <label class="text-gray-500 text-sm block mb-1">过敏史</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedPatient.allergy || '无' }}</p>
          </div>

          <div class="mb-6">
            <label class="text-gray-500 text-sm block mb-1">既往病史</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedPatient.medicalHistory || '无' }}</p>
          </div>

          <div class="mb-6">
            <label class="text-gray-500 text-sm block mb-1">备注</label>
            <p class="p-3 bg-gray-50 rounded">{{ selectedPatient.remark || '无' }}</p>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 rounded text-center">
              <p class="text-2xl font-bold text-blue-600">{{ selectedPatient._count?.medicalRecords || 0 }}</p>
              <p class="text-sm text-gray-600">病历数</p>
            </div>
            <div class="p-4 bg-purple-50 rounded text-center">
              <p class="text-2xl font-bold text-purple-600">{{ selectedPatient._count?.treatmentCourses || 0 }}</p>
              <p class="text-sm text-gray-600">疗程数</p>
            </div>
            <div class="p-4 bg-green-50 rounded text-center">
              <p class="text-2xl font-bold text-green-600">{{ selectedPatient._count?.followUpTasks || 0 }}</p>
              <p class="text-sm text-gray-600">随访数</p>
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

const pagination = usePagination(20)
const filters = ref({
  keyword: '',
  status: ''
})

const patients = ref<any[]>([])
const activeCount = ref(0)
const lostCount = ref(0)
const newThisMonth = ref(0)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedPatient = ref<any>(null)

const formatDate = (date: string | number) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const genderText = (gender: string) => {
  const map: Record<string, string> = {
    MALE: '男',
    FEMALE: '女',
    OTHER: '其他'
  }
  return map[gender] || '未知'
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-yellow-100 text-yellow-800',
    LOST: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: '在诊',
    INACTIVE: '暂停',
    LOST: '已流失',
    COMPLETED: '已完成'
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
    if (!params.keyword) delete params.keyword
    if (!params.status) delete params.status

    const res = await get('/api/patients', params)
    patients.value = res.data || []
    pagination.setTotal(res.total || 0)

    activeCount.value = patients.value.filter(p => p.status === 'ACTIVE').length
    lostCount.value = patients.value.filter(p => p.status === 'LOST').length

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    newThisMonth.value = patients.value.filter(p => new Date(p.createdAt) >= monthStart).length
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    pagination.loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: ''
  }
  pagination.reset()
  loadData()
}

const viewDetail = async (patient: any) => {
  try {
    const res = await get(`/api/patients/${patient.id}`)
    selectedPatient.value = res.data
    showDetailModal.value = true
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

const viewSource = (patient: any) => {
  navigateTo(`/reconciliation/patient-archive/${patient.id}`)
}

const viewPatientRecords = (patient: any) => {
  navigateTo(`/medical-records?patientId=${patient.id}`)
}

const viewPatientCourses = (patient: any) => {
  navigateTo(`/treatment-courses?patientId=${patient.id}`)
}

const viewPatientFollowUps = (patient: any) => {
  navigateTo(`/follow-up?patientId=${patient.id}`)
}

watch(() => pagination.page, loadData)
watch(() => pagination.pageSize, loadData)

onMounted(() => {
  loadData()
})
</script>
