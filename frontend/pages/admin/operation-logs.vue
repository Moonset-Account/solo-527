<template>
  <MainLayout>
    <div class="admin-logs-page">
      <n-card :bordered="false">
        <div class="filter-section">
          <n-form inline :model="queryForm">
            <n-form-item label="关键词">
              <n-input
                v-model:value="queryForm.keyword"
                placeholder="操作描述/用户名"
                clearable
                style="width: 200px"
              />
            </n-form-item>
            <n-form-item label="模块">
              <n-select
                v-model:value="queryForm.module"
                placeholder="请选择"
                clearable
                style="width: 150px"
                :options="moduleOptions"
              />
            </n-form-item>
            <n-form-item label="操作类型">
              <n-select
                v-model:value="queryForm.operation_type"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="typeOptions"
              />
            </n-form-item>
            <n-form-item label="操作时间">
              <n-date-picker
                v-model:value="dateRange"
                type="datetimerange"
                clearable
                style="width: 320px"
              />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleSearch">查询</n-button>
                <n-button @click="handleReset">重置</n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :pagination="pagination"
            :bordered="false"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getOperationLogs } from '~/api/system'
import type { OperationLog } from '~/types'
import { useMessageUtil } from '~/composables/useMessage'

const { error } = useMessageUtil()

const loading = ref(false)
const tableData = ref<OperationLog[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const queryForm = reactive({
  keyword: '',
  module: '',
  operation_type: '',
  status: '',
})

const dateRange = ref<[number, number] | null>(null)

const moduleOptions = [
  { label: '用户管理', value: 'user' },
  { label: '租约管理', value: 'lease' },
  { label: '账单管理', value: 'bill' },
  { label: '异常单', value: 'exception' },
  { label: '字典管理', value: 'dictionary' },
  { label: '系统', value: 'system' },
]

const typeOptions = [
  { label: '新增', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查询', value: 'query' },
  { label: '导出', value: 'export' },
]

const columns: DataTableColumns<OperationLog> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '操作人', key: 'username', width: 120 },
  { title: '模块', key: 'module', width: 100 },
  { title: '操作类型', key: 'operation_type', width: 100 },
  { title: '操作描述', key: 'description', width: 250, ellipsis: true },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h('n-tag', { type: row.status === 'success' ? 'success' : 'error' }, () => row.status === 'success' ? '成功' : '失败'),
  },
  { title: 'IP地址', key: 'ip_address', width: 140 },
  { title: '请求方法', key: 'request_method', width: 100 },
  { title: '操作时间', key: 'created_at', width: 170 },
]

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...queryForm,
    }
    if (dateRange.value) {
      params.start_time = new Date(dateRange.value[0]).toISOString()
      params.end_time = new Date(dateRange.value[1]).toISOString()
    }
    const res = await getOperationLogs(params)
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (e: any) {
    error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.module = ''
  queryForm.operation_type = ''
  queryForm.status = ''
  dateRange.value = null
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-logs-page {
  padding: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}
</style>
