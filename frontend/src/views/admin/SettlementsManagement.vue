<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">老师结算</h2>
      <div class="flex gap-2">
        <button @click="handleExport" class="btn btn-secondary">
          📥 导出
        </button>
        <button @click="showGenerate = true" class="btn btn-primary">
          + 生成结算单
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结算单号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">老师</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结算周期</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程数</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in settlements" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ s.settlement_no }}</td>
              <td class="px-4 py-3 text-sm text-gray-800">{{ s.teacher?.user?.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ s.period_start }} 至 {{ s.period_end }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.total_sessions }} 节 / {{ s.total_students }} 人</td>
              <td class="px-4 py-3 text-sm font-bold text-gray-800">¥{{ s.total_amount }}</td>
              <td class="px-4 py-3">
                <span :class="['badge', getStatusBadge(s.status)]">{{ getStatusLabel(s.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button v-if="s.status === 0 || s.status === 1" @click="handleApprove(s)" class="text-green-600 hover:text-green-700 text-sm">
                    审批
                  </button>
                  <button v-if="s.status === 2" @click="handleMarkPaid(s)" class="text-blue-600 hover:text-blue-700 text-sm">
                    标记已付
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showGenerate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold mb-4">生成结算单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择老师</label>
            <select v-model="form.teacher_id" class="form-input">
              <option :value="null">请选择老师</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.user?.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input v-model="form.period_start" type="date" class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input v-model="form.period_end" type="date" class="form-input" />
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showGenerate = false" class="btn btn-secondary flex-1">取消</button>
          <button @click="confirmGenerate" class="btn btn-primary flex-1">生成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { settlementAPI, teacherAPI } from '../../utils/api'
import type { TeacherSettlement, SettlementStatus, Teacher } from '../../types'

const settlements = ref<TeacherSettlement[]>([])
const teachers = ref<Teacher[]>([])
const activeTab = ref('all')
const showGenerate = ref(false)

const form = reactive({
  teacher_id: null as number | null,
  period_start: '',
  period_end: ''
})

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'paid', label: '已付款' }
]

const getStatusLabel = (status: SettlementStatus) => {
  const labels: Record<SettlementStatus, string> = {
    [SettlementStatus.DRAFT]: '草稿',
    [SettlementStatus.PENDING_APPROVAL]: '待审批',
    [SettlementStatus.APPROVED]: '已批准',
    [SettlementStatus.PAID]: '已付款',
    [SettlementStatus.REJECTED]: '已拒绝'
  }
  return labels[status]
}

const getStatusBadge = (status: SettlementStatus) => {
  const badges: Record<SettlementStatus, string> = {
    [SettlementStatus.DRAFT]: 'badge-secondary',
    [SettlementStatus.PENDING_APPROVAL]: 'badge-warning',
    [SettlementStatus.APPROVED]: 'badge-info',
    [SettlementStatus.PAID]: 'badge-success',
    [SettlementStatus.REJECTED]: 'badge-danger'
  }
  return badges[status]
}

const loadSettlements = async () => {
  try {
    const params: any = { per_page: 50 }
    if (activeTab.value === 'pending') params.pending = true
    const res = await settlementAPI.list(params)
    settlements.value = res.teacher_settlements
  } catch (e) {
    console.error(e)
  }
}

const loadTeachers = async () => {
  try {
    teachers.value = await teacherAPI.list()
  } catch (e) {
    console.error(e)
  }
}

const confirmGenerate = async () => {
  if (!form.teacher_id || !form.period_start || !form.period_end) return
  try {
    await settlementAPI.generate({
      teacher_id: form.teacher_id,
      period_start: form.period_start,
      period_end: form.period_end
    })
    showGenerate.value = false
    loadSettlements()
  } catch (e: any) {
    alert(e.response?.data?.error || '生成失败')
  }
}

const handleApprove = async (s: TeacherSettlement) => {
  if (!confirm('确定批准该结算单？')) return
  try {
    await settlementAPI.approve(s.id)
    loadSettlements()
  } catch (e) {
    console.error(e)
  }
}

const handleMarkPaid = async (s: TeacherSettlement) => {
  if (!confirm('确认已付款？')) return
  try {
    await settlementAPI.markPaid(s.id)
    loadSettlements()
  } catch (e) {
    console.error(e)
  }
}

const handleExport = async () => {
  try {
    const blob = await settlementAPI.export()
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `老师结算_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadSettlements()
  loadTeachers()
})
</script>
