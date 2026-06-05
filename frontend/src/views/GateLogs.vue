<template>
  <div class="gate-logs">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>门岗记录</span>
          <el-button size="small" @click="fetchTodayStats">
            今日统计
          </el-button>
        </div>
      </template>

      <el-row :gutter="16" style="margin-bottom: 20px" v-if="todayStats">
        <el-col :span="6">
          <el-statistic title="今日进场" :value="todayStats.entry_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日出场" :value="todayStats.exit_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="场内人数" :value="todayStats.inside_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="异常拦截" :value="todayStats.rejected_count" />
        </el-col>
      </el-row>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="门岗">
          <el-select v-model="searchForm.gate_name" placeholder="全部" clearable style="width: 120px">
            <el-option label="东门" value="东门" />
            <el-option label="西门" value="西门" />
            <el-option label="南门" value="南门" />
            <el-option label="北门" value="北门" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.date" type="date" placeholder="选择日期" style="width: 150px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.action_type" placeholder="全部" clearable style="width: 120px">
            <el-option label="进场" value="entry" />
            <el-option label="出场" value="exit" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="gate_name" label="门岗" width="100" />
        <el-table-column prop="action_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.action_type === 'entry' ? 'success' : 'primary'" size="small">
              {{ row.action_type === 'entry' ? '进场' : '出场' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通行证号" width="160">
          <template #default="{ row }">
            {{ row.pass?.pass_number }}
          </template>
        </el-table-column>
        <el-table-column label="人员" width="100">
          <template #default="{ row }">
            {{ row.person?.name }}
          </template>
        </el-table-column>
        <el-table-column label="车牌号" width="120">
          <template #default="{ row }">
            {{ row.vehicle?.plate_number || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.result === 'allowed' ? 'success' : 'danger'" size="small">
              {{ row.result === 'allowed' ? '放行' : '拦截' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reject_reason" label="拦截原因" show-overflow-tooltip />
        <el-table-column label="操作员" width="100">
          <template #default="{ row }">
            {{ row.operator?.real_name }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { gateLogsApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const todayStats = ref(null)

const searchForm = reactive({
  gate_name: '',
  date: '',
  action_type: ''
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await gateLogsApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const fetchTodayStats = async () => {
  try {
    const res = await gateLogsApi.todayStats()
    todayStats.value = res
  } catch (e) {}
}

const resetSearch = () => {
  searchForm.gate_name = ''
  searchForm.date = ''
  searchForm.action_type = ''
  page.value = 1
  fetchList()
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')

onMounted(() => {
  fetchList()
  fetchTodayStats()
})
</script>
