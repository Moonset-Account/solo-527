<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">我的申请</h2>
      <el-button type="primary" @click="$router.push('/portal/applications/new')">
        <el-icon><Plus /></el-icon>新建申请
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-select v-model="filter.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option
            v-for="(label, key) in ApplicationStatusLabel"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-input v-model="filter.keyword" placeholder="搜索单号/用途" clearable style="width: 240px" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="applicationNo" label="申请单号" width="180" />
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="applicantDepartment" label="部门" width="120" />
        <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
        <el-table-column label="试剂项" width="100">
          <template #default="{ row }">
            {{ row.items?.length || 0 }} 项
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="ApplicationStatusType[row.status] as any">
              {{ ApplicationStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/portal/applications/${row._id}`)">详情</el-button>
            <el-button
              v-if="row.status === 'draft'"
              link
              type="primary"
              @click="handleSubmit(row)"
            >提交</el-button>
            <el-button
              v-if="['draft', 'pending'].includes(row.status)"
              link
              type="danger"
              @click="handleCancel(row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applicationApi } from '@/api'
import { ApplicationStatusLabel, ApplicationStatusType, type Application } from '@/types'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const list = ref<Application[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[]>([])

const filter = reactive({
  status: '',
  keyword: '',
})

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (filter.status) params.status = filter.status
    if (filter.keyword) params.keyword = filter.keyword
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await applicationApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function handleSubmit(row: Application) {
  try {
    await ElMessageBox.confirm(`确定提交申请 ${row.applicationNo}？`, '提示', { type: 'warning' })
    await applicationApi.submit(row._id)
    ElMessage.success('提交成功')
    loadData()
  } catch {}
}

async function handleCancel(row: Application) {
  try {
    await ElMessageBox.confirm(`确定取消申请 ${row.applicationNo}？`, '提示', { type: 'warning' })
    await applicationApi.cancel(row._id)
    ElMessage.success('已取消')
    loadData()
  } catch {}
}

onMounted(loadData)
</script>
