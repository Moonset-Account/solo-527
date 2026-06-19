<template>
  <div class="todo-my">
    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="待处理" name="PENDING" />
      <el-tab-pane label="进行中" name="PROCESSING" />
      <el-tab-pane label="已完成" name="COMPLETED" />
      <el-tab-pane label="已逾期" name="OVERDUE" />
    </el-tabs>
    <el-form :model="filterForm" inline class="filter-bar">
      <el-form-item label="任务类型">
        <el-select
          v-model="filterForm.taskTypes"
          multiple
          placeholder="请选择任务类型"
          clearable
          style="width: 220px"
        >
          <el-option
            v-for="item in taskTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-select
          v-model="filterForm.priorities"
          multiple
          placeholder="请选择优先级"
          clearable
          style="width: 180px"
        >
          <el-option
            v-for="item in priorityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="taskNo" label="任务编号" min-width="140" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" min-width="120" align="center">
          <template #default="{ row }">
            {{ getTaskTypeName(row.taskType) }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" effect="light" round>
              {{ getTaskPriorityName(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="taskStatusTagMap" />
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止时间" min-width="160" />
        <el-table-column prop="businessName" label="关联业务" min-width="160" show-overflow-tooltip />
        <el-table-column label="处理耗时" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.processDuration ? formatDuration(row.processDuration) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PENDING' || row.status === 'PROCESSING'"
              link
              type="primary"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
            <el-button link type="info" @click="handleView(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusTag from '@/components/StatusTag.vue'
import { getMyTodoList, updateTodoStatus, completeTodo } from '@/api/todo'
import { TASK_PRIORITY, TASK_STATUS, getTaskPriorityName, getTaskStatusName, getDictOptions } from '@/utils/dict'
import { formatDuration } from '@/utils/format'

const router = useRouter()

const activeTab = ref('PENDING')
const loading = ref(false)
const tableData = ref([])
const searchParams = reactive({})

const filterForm = reactive({
  taskTypes: [],
  priorities: [],
  dateRange: []
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const taskTypeOptions = [
  { value: 'FOLLOW', label: '跟进任务' },
  { value: 'APPROVAL', label: '审批任务' },
  { value: 'CONTRACT', label: '合同任务' },
  { value: 'PAYMENT', label: '回款任务' },
  { value: 'OTHER', label: '其他任务' }
]

const priorityOptions = getDictOptions(TASK_PRIORITY)

const taskStatusTagMap = {
  PENDING: { label: '待处理', type: 'warning' },
  PROCESSING: { label: '进行中', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  OVERDUE: { label: '已逾期', type: 'danger' },
  CANCELLED: { label: '已取消', type: 'info' }
}

const getTaskTypeName = (type) => {
  const map = {
    FOLLOW: '跟进任务',
    APPROVAL: '审批任务',
    CONTRACT: '合同任务',
    PAYMENT: '回款任务',
    OTHER: '其他任务'
  }
  return map[type] || type || '其他'
}

const getPriorityTagType = (priority) => {
  const typeMap = {
    1: 'info',
    2: '',
    3: 'warning',
    4: 'danger'
  }
  return typeMap[priority] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyTodoList({
      ...searchParams,
      status: activeTab.value,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data?.records || res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.pageNum = 1
  fetchList()
}

const handleSearch = () => {
  Object.assign(searchParams, {
    taskTypes: filterForm.taskTypes,
    priorities: filterForm.priorities
  })
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    searchParams.startDate = filterForm.dateRange[0]
    searchParams.endDate = filterForm.dateRange[1]
  } else {
    delete searchParams.startDate
    delete searchParams.endDate
  }
  pagination.pageNum = 1
  fetchList()
}

const handleReset = () => {
  filterForm.taskTypes = []
  filterForm.priorities = []
  filterForm.dateRange = []
  Object.keys(searchParams).forEach(key => delete searchParams[key])
  pagination.pageNum = 1
  fetchList()
}

const handleProcess = async (row) => {
  if (row.businessType && row.businessId) {
    const routeMap = {
      CONTRACT: `/contract/${row.businessId}`,
      APPROVAL: `/approval/${row.businessId}`,
      LEAD: `/lead/${row.businessId}`
    }
    const path = routeMap[row.businessType]
    if (path) {
      router.push(path)
      return
    }
  }
  try {
    if (row.status === 'PENDING') {
      await updateTodoStatus(row.id, 'PROCESSING')
    } else if (row.status === 'PROCESSING') {
      await completeTodo(row.id)
    }
    fetchList()
  } catch (e) {
    console.error(e)
  }
}

const handleView = (row) => {
  if (row.businessType && row.businessId) {
    const routeMap = {
      CONTRACT: `/contract/${row.businessId}`,
      APPROVAL: `/approval/${row.businessId}`,
      LEAD: `/lead/${row.businessId}`
    }
    const path = routeMap[row.businessType]
    if (path) {
      router.push(path)
      return
    }
  }
  router.push(`/todo/${row.id}`)
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.todo-my {
  .main-tabs {
    background-color: #fff;
    padding: 0 16px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .filter-bar {
    padding: 16px;
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .table-card {
    .pagination {
      margin-top: 16px;
      justify-content: flex-end;
      display: flex;
    }
  }
}
</style>
