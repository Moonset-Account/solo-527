<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">巡检任务</h1>
        <p class="text-slate-500 mt-1">管理所有巡检任务和整改项</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">待开始</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">{{ stats.pending }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">进行中</p>
        <p class="text-2xl font-bold text-primary-600 mt-1">{{ stats.inProgress }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">整改中</p>
        <p class="text-2xl font-bold text-warning-600 mt-1">{{ stats.rectifying }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">已完成</p>
        <p class="text-2xl font-bold text-success-600 mt-1">{{ stats.completed }}</p>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">巡检列表</h2>
        <div class="flex items-center gap-2">
          <select v-model="filterStatus" class="input text-sm py-1 w-32">
            <option value="">全部状态</option>
            <option value="pending">待开始</option>
            <option value="in_progress">进行中</option>
            <option value="rectifying">整改中</option>
            <option value="completed">已完成</option>
          </select>
          <input v-model="searchKeyword" class="input text-sm py-1 w-48" placeholder="搜索巡检..." />
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>巡检标题</th>
              <th>所属项目</th>
              <th>巡检员</th>
              <th>计划时间</th>
              <th>整改项</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inspection in filteredInspections"
              :key="inspection.id"
              class="cursor-pointer hover:bg-slate-50"
              @click="goToDetail(inspection.id)"
            >
              <td class="font-medium text-slate-700">{{ inspection.title }}</td>
              <td>{{ inspection.projectName }}</td>
              <td>{{ inspection.inspectorName }}</td>
              <td class="text-slate-500">{{ formatDateTime(inspection.scheduledAt) }}</td>
              <td>
                <span class="text-warning-600 font-medium">{{ inspection.rectifications?.length || 0 }}</span>
                <span class="text-slate-400 text-sm"> 项</span>
              </td>
              <td>
                <span class="badge" :class="inspectionBadgeClass(inspection.status)">
                  {{ inspectionStatusLabel(inspection.status) }}
                </span>
              </td>
              <td>
                <button class="text-primary-600 hover:text-primary-700 text-sm">
                  查看详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between mt-4">
        <p class="text-sm text-slate-500">共 {{ filteredInspections.length }} 条记录</p>
        <div class="flex items-center gap-2">
          <button class="btn-secondary text-sm px-3" :disabled="page <= 1" @click="page--">上一页</button>
          <span class="text-sm text-slate-600">第 {{ page }} 页</span>
          <button class="btn-secondary text-sm px-3" @click="page++">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Inspection } from '~/types'

const inspections = ref<Inspection[]>([])
const filterStatus = ref('')
const searchKeyword = ref('')
const page = ref(1)

const stats = computed(() => ({
  pending: inspections.value.filter(i => i.status === 'pending').length,
  inProgress: inspections.value.filter(i => i.status === 'in_progress').length,
  rectifying: inspections.value.filter(i => i.status === 'rectifying').length,
  completed: inspections.value.filter(i => i.status === 'completed').length,
}))

const filteredInspections = computed(() => {
  let result = inspections.value
  if (filterStatus.value) {
    result = result.filter(i => i.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(i =>
      i.title.toLowerCase().includes(kw) ||
      i.projectName?.toLowerCase().includes(kw) ||
      i.inspectorName.toLowerCase().includes(kw)
    )
  }
  return result
})

const inspectionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    rectifying: '整改中',
  }
  return labels[status] || status
}

const inspectionBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-slate',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    rectifying: 'badge-warning',
  }
  return classes[status] || 'badge-slate'
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const goToDetail = (id: string) => {
  navigateTo(`/inspections/${id}`)
}

const fetchInspections = async () => {
  try {
    const data = await $fetch<any>('/api/inspections')
    inspections.value = data.data || []
  } catch {
    inspections.value = mockInspections
  }
}

const mockInspections: Inspection[] = [
  {
    id: 'ins1',
    projectId: '1',
    projectName: '万科城一期A栋',
    title: '水电工程验收',
    inspectorId: '3',
    inspectorName: '张巡检',
    status: 'completed',
    scheduledAt: '2024-01-20T10:00:00',
    completedAt: '2024-01-20T16:00:00',
    budgetVersionId: 'bv1',
    photos: [],
    rectifications: [
      { id: 'r1', inspectionId: 'ins1', title: '卫生间防水高度不足', description: '', responsiblePerson: '李工', deadline: '2024-01-25', status: 'completed', createdAt: '' },
    ],
    feedback: null,
    createdAt: '2024-01-18T09:00:00',
  },
  {
    id: 'ins2',
    projectId: '1',
    projectName: '万科城一期A栋',
    title: '瓦工阶段巡检',
    inspectorId: '3',
    inspectorName: '张巡检',
    status: 'rectifying',
    scheduledAt: '2024-02-05T09:00:00',
    completedAt: null,
    budgetVersionId: 'bv1',
    photos: [],
    rectifications: [
      { id: 'r2', inspectionId: 'ins2', title: '墙面平整度超标', description: '', responsiblePerson: '王工', deadline: '2024-02-10', status: 'pending', createdAt: '' },
      { id: 'r3', inspectionId: 'ins2', title: '地砖空鼓', description: '', responsiblePerson: '王工', deadline: '2024-02-08', status: 'processing', createdAt: '' },
    ],
    feedback: null,
    createdAt: '2024-02-01T10:00:00',
  },
  {
    id: 'ins3',
    projectId: '2',
    projectName: '碧桂园二期B栋',
    title: '木工阶段验收',
    inspectorId: '4',
    inspectorName: '李巡检',
    status: 'in_progress',
    scheduledAt: '2024-02-03T14:00:00',
    completedAt: null,
    budgetVersionId: null,
    photos: [],
    rectifications: [],
    feedback: null,
    createdAt: '2024-02-02T10:00:00',
  },
  {
    id: 'ins4',
    projectId: '5',
    projectName: '保利天汇C区',
    title: '拆改阶段巡检',
    inspectorId: '3',
    inspectorName: '张巡检',
    status: 'pending',
    scheduledAt: '2024-02-10T09:00:00',
    completedAt: null,
    budgetVersionId: null,
    photos: [],
    rectifications: [],
    feedback: null,
    createdAt: '2024-02-08T10:00:00',
  },
  {
    id: 'ins5',
    projectId: '4',
    projectName: '融创滨江壹号',
    title: '竣工验收',
    inspectorId: '4',
    inspectorName: '李巡检',
    status: 'completed',
    scheduledAt: '2023-12-20T10:00:00',
    completedAt: '2023-12-20T16:00:00',
    budgetVersionId: null,
    photos: [],
    rectifications: [],
    feedback: null,
    createdAt: '2023-12-18T10:00:00',
  },
]

onMounted(() => {
  fetchInspections()
})

definePageMeta({ layout: 'default' })
</script>
