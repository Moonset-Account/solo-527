<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">人力成本统计</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          登记工时
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-date-picker
          v-model:value="filters.date_range"
          type="daterange"
          placeholder="统计周期"
          style="width: 260px"
        />
        <n-button type="primary" @click="loadData">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-grid :cols="4" :x-gap="20" style="margin-bottom: 20px">
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #2080f0">{{ stats.total_regular_hours?.toFixed(1) || '0' }}h</div>
            <div class="stat-label">正常工时</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #f0a020">{{ stats.total_overtime_hours?.toFixed(1) || '0' }}h</div>
            <div class="stat-label">加班工时</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #18a058">¥{{ stats.total_cost?.toFixed(2) || '0.00' }}</div>
            <div class="stat-label">人力总成本</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #722ed1">{{ stats.employee_count || 0 }}</div>
            <div class="stat-label">员工人数</div>
          </div>
        </n-grid-item>
      </n-grid>

      <n-divider>人力成本趋势</n-divider>
      <div style="height: 300px; margin-bottom: 20px">
        <client-only>
          <VChart :option="chartOption" autoresize />
        </client-only>
      </div>

      <n-divider>工时记录</n-divider>
      <n-data-table
        :columns="columns"
        :data="laborRecords"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadLaborRecords() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="登记工时" style="width: 550px">
      <n-form :model="laborForm" :rules="laborRules" label-width="100px">
        <n-form-item label="员工" path="user_id">
          <n-select v-model:value="laborForm.user_id" :options="userOptions" placeholder="请选择员工" />
        </n-form-item>
        <n-form-item label="工作日期" path="work_date">
          <n-date-picker v-model:value="laborForm.work_date" type="date" placeholder="选择日期" style="width: 100%" />
        </n-form-item>
        <n-form-item label="上班时间" path="start_time">
          <n-date-picker v-model:value="laborForm.start_time" type="datetime" placeholder="选择上班时间" style="width: 100%" />
        </n-form-item>
        <n-form-item label="下班时间" path="end_time">
          <n-date-picker v-model:value="laborForm.end_time" type="datetime" placeholder="选择下班时间" style="width: 100%" />
        </n-form-item>
        <n-form-item label="正常工时(h)" path="regular_hours">
          <n-input-number v-model:value="laborForm.regular_hours" :min="0" step="0.5" style="width: 100%" />
        </n-form-item>
        <n-form-item label="加班工时(h)" path="overtime_hours">
          <n-input-number v-model:value="laborForm.overtime_hours" :min="0" step="0.5" style="width: 100%" />
        </n-form-item>
        <n-form-item label="时薪(元)" path="hourly_rate">
          <n-input-number v-model:value="laborForm.hourly_rate" :min="0" step="0.5" style="width: 100%" />
        </n-form-item>
        <n-form-item label="加班时薪(元)" path="overtime_rate">
          <n-input-number v-model:value="laborForm.overtime_rate" :min="0" step="0.5" style="width: 100%" />
        </n-form-item>
        <n-form-item label="预计工资">
          <n-input :value="`¥${(laborForm.regular_hours * laborForm.hourly_rate + laborForm.overtime_hours * laborForm.overtime_rate).toFixed(2)}`" disabled />
        </n-form-item>
        <n-form-item label="工作内容" path="work_content">
          <n-input v-model:value="laborForm.work_content" type="textarea" :rows="2" placeholder="请填写工作内容" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createLaborRecord">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'

const message = useMessage()
const { getLaborRecords, getLaborStats, createLaborRecord: apiCreate } = useFinanceApi()
const { getUsers } = useMasterApi()
const { getUser, isStoreManager, isSupervisor } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const laborRecords = ref<LaborRecord[]>([])
const users = ref<User[]>([])
const stats = ref<any>({})
const chartOption = ref<any>({})
const showCreateModal = ref(false)

const filters = reactive({
  date_range: null as any
})

const laborForm = reactive({
  user_id: null as number | null,
  work_date: null as any,
  start_time: null as any,
  end_time: null as any,
  regular_hours: 0,
  overtime_hours: 0,
  hourly_rate: 20,
  overtime_rate: 30,
  work_content: ''
})

const laborRules = {
  user_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  work_date: [{ required: true, message: '请选择工作日期', trigger: 'change' }],
  regular_hours: [{ required: true, message: '请输入正常工时', trigger: 'blur' }]
}

const userOptions = computed(() => users.value.filter(u => ['store_manager', 'baker', 'cashier'].includes(u.role)).map(u => ({ label: u.full_name, value: u.id })))

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '员工', key: 'user_name', render: (row: any) => row.user?.full_name || '-' },
  { title: '日期', key: 'work_date', width: 120 },
  { title: '上班', key: 'start_time', width: 140, render: (row: any) => row.start_time ? dayjs(row.start_time).format('HH:mm') : '-' },
  { title: '下班', key: 'end_time', width: 140, render: (row: any) => row.end_time ? dayjs(row.end_time).format('HH:mm') : '-' },
  { title: '正常工时', key: 'regular_hours', render: (row: any) => `${row.regular_hours}h` },
  { title: '加班工时', key: 'overtime_hours', render: (row: any) => `${row.overtime_hours}h` },
  { title: '工资', key: 'total_amount', render: (row: any) => `¥${row.total_amount?.toFixed(2) || '0.00'}` },
  { title: '工作内容', key: 'work_content', ellipsis: { tooltip: true } }
]

const loadData = async () => {
  await Promise.all([loadLaborRecords(), loadStats(), loadUsers()])
}

const loadUsers = async () => {
  users.value = await getUsers()
}

const loadLaborRecords = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.date_range) {
      params.start_date = dayjs(filters.date_range[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(filters.date_range[1]).format('YYYY-MM-DD')
    }
    const data = await getLaborRecords(params)
    laborRecords.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const params: any = {}
    if (filters.date_range) {
      params.start_date = dayjs(filters.date_range[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(filters.date_range[1]).format('YYYY-MM-DD')
    }
    const statsData = await getLaborStats(params)
    if (statsData && statsData.length > 0) {
      stats.value = statsData[0]
    } else {
      stats.value = { total_regular_hours: 0, total_overtime_hours: 0, total_cost: 0, employee_count: 0 }
    }

    const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
    const dayStats = days.map(d => {
      const dayRecords = laborRecords.value.filter(r => r.work_date === dayjs().subtract(6 - days.indexOf(d), 'day').format('YYYY-MM-DD'))
      return {
        regular: dayRecords.reduce((sum, r) => sum + r.regular_hours, 0),
        overtime: dayRecords.reduce((sum, r) => sum + r.overtime_hours, 0)
      }
    })

    chartOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['正常工时', '加班工时'] },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '小时' },
      series: [
        { name: '正常工时', type: 'bar', data: dayStats.map(d => d.regular), itemStyle: { color: '#2080f0' } },
        { name: '加班工时', type: 'bar', data: dayStats.map(d => d.overtime), itemStyle: { color: '#f0a020' } }
      ]
    }
  } catch (e) {
    stats.value = { total_regular_hours: 0, total_overtime_hours: 0, total_cost: 0, employee_count: 0 }
  }
}

const resetFilters = () => {
  filters.date_range = null
  page.value = 1
  loadData()
}

const createLaborRecord = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await apiCreate({
      ...laborForm,
      store_id: user?.store_id,
      work_date: laborForm.work_date ? dayjs(laborForm.work_date).format('YYYY-MM-DD') : undefined,
      start_time: laborForm.start_time ? new Date(laborForm.start_time).toISOString() : undefined,
      end_time: laborForm.end_time ? new Date(laborForm.end_time).toISOString() : undefined
    })
    message.success('工时已登记')
    showCreateModal.value = false
    Object.assign(laborForm, { user_id: null, work_date: null, start_time: null, end_time: null, regular_hours: 0, overtime_hours: 0, hourly_rate: 20, overtime_rate: 30, work_content: '' })
    loadData()
  } catch (e: any) {
    message.error(e.data?.detail || '登记失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
