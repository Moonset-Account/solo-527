<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">工作台</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-600 text-sm mb-2">今日待随访</h3>
        <p class="text-3xl font-bold text-blue-600">{{ stats.todayFollowUps }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-600 text-sm mb-2">本月新增病历</h3>
        <p class="text-3xl font-bold text-green-600">{{ stats.monthlyRecords }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-600 text-sm mb-2">进行中疗程</h3>
        <p class="text-3xl font-bold text-purple-600">{{ stats.activeCourses }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-gray-600 text-sm mb-2">本月收费总额</h3>
        <p class="text-3xl font-bold text-orange-600">¥{{ stats.monthlyRevenue.toFixed(2) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">待处理随访任务</h3>
        <div class="space-y-3">
          <div
            v-for="task in pendingFollowUps"
            :key="task.id"
            class="p-3 border rounded hover:bg-gray-50 cursor-pointer"
            @click="navigateTo(`/follow-up/${task.id}`)"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium">{{ task.patient.name }}</p>
                <p class="text-sm text-gray-600">{{ task.content || '随访任务' }}</p>
              </div>
              <span
                class="px-2 py-1 text-xs rounded"
                :class="statusClass(task.status)"
              >
                {{ statusText(task.status) }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              计划时间：{{ formatDate(task.scheduledDate) }}
            </p>
          </div>
          <p v-if="pendingFollowUps.length === 0" class="text-gray-500 text-center py-4">
            暂无待处理任务
          </p>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">最近病历</h3>
        <div class="space-y-3">
          <div
            v-for="record in recentRecords"
            :key="record.id"
            class="p-3 border rounded hover:bg-gray-50 cursor-pointer"
            @click="navigateTo(`/medical-records/${record.id}`)"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium">{{ record.patient.name }} - {{ record.diagnosis }}</p>
                <p class="text-sm text-gray-600">{{ record.chiefComplaint }}</p>
              </div>
              <span class="text-xs text-gray-500">
                {{ formatDate(record.visitDate) }}
              </span>
            </div>
            <p class="text-xs text-blue-600 mt-1">
              {{ record.recordNo }}
            </p>
          </div>
          <p v-if="recentRecords.length === 0" class="text-gray-500 text-center py-4">
            暂无病历记录
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow mt-6">
      <h3 class="text-lg font-semibold mb-4">流失预警</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-4">患者</th>
              <th class="text-left py-2 px-4">疗程</th>
              <th class="text-left py-2 px-4">末次就诊</th>
              <th class="text-left py-2 px-4">完成进度</th>
              <th class="text-left py-2 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in atRiskCourses" :key="course.id" class="border-b hover:bg-gray-50">
              <td class="py-2 px-4">{{ course.patient.name }}</td>
              <td class="py-2 px-4">{{ course.name }}</td>
              <td class="py-2 px-4">{{ formatDate(course.startDate) }}</td>
              <td class="py-2 px-4">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-yellow-500 h-2 rounded-full"
                    :style="{ width: `${(course.completedSessions / course.totalSessions) * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500">
                  {{ course.completedSessions }}/{{ course.totalSessions }}
                </span>
              </td>
              <td class="py-2 px-4">
                <button
                  class="text-blue-600 hover:underline text-sm"
                  @click="handleMarkLost(course)"
                >
                  标记流失
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()

const stats = ref({
  todayFollowUps: 0,
  monthlyRecords: 0,
  activeCourses: 0,
  monthlyRevenue: 0
})

const pendingFollowUps = ref<any[]>([])
const recentRecords = ref<any[]>([])
const atRiskCourses = ref<any[]>([])

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
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
  try {
    const [followUpsRes, recordsRes, coursesRes] = await Promise.all([
      get('/api/follow-up', { status: 'PENDING', pageSize: 5 }),
      get('/api/medical-records', { pageSize: 5 }),
      get('/api/treatment-courses', { status: 'IN_PROGRESS', pageSize: 10 })
    ])

    pendingFollowUps.value = followUpsRes.data || []
    recentRecords.value = recordsRes.data || []
    atRiskCourses.value = (coursesRes.data || []).filter((c: any) =>
      c.completedSessions > 0 && c.completedSessions < c.totalSessions / 2
    )

    stats.value = {
      todayFollowUps: pendingFollowUps.value.length,
      monthlyRecords: recordsRes.total || 0,
      activeCourses: coursesRes.total || 0,
      monthlyRevenue: 15680
    }
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const handleMarkLost = (course: any) => {
  const reason = prompt('请输入流失原因：')
  if (reason) {
    alert(`已标记流失：${course.name}，原因：${reason}`)
  }
}

onMounted(() => {
  loadData()
})
</script>
