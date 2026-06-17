<template>
  <MainLayout>
    <div class="bills-page">
      <n-card :bordered="false">
        <div class="filter-section">
          <n-form inline :model="queryForm">
            <n-form-item label="关键词">
              <n-input
                v-model:value="queryForm.keyword"
                placeholder="账单编号/租约编号"
                clearable
                style="width: 200px"
              />
            </n-form-item>
            <n-form-item label="账单类型">
              <n-select
                v-model:value="queryForm.bill_type"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="billTypeOptions"
              />
            </n-form-item>
            <n-form-item label="状态">
              <n-select
                v-model:value="queryForm.status"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="statusOptions"
              />
            </n-form-item>
            <n-form-item label="账期">
              <n-date-picker
                v-model:value="queryForm.bill_date"
                type="month"
                clearable
                style="width: 150px"
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

        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-space>
              <n-button
                v-if="userStore.hasPermission('bill:generate')"
                type="primary"
                @click="handleGenerate"
              >
                批量生成账单
              </n-button>
              <n-button
                v-if="userStore.hasPermission('bill:export')"
                @click="handleExport"
              >
                导出明细
              </n-button>
            </n-space>
          </div>
          <div class="toolbar-right">
            <n-button @click="loadData">刷新</n-button>
          </div>
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

      <n-modal
        v-model:show="showGenerateModal"
        preset="card"
        title="批量生成账单"
        style="width: 500px"
      >
        <n-form :model="generateForm" label-placement="left" label-width="100px">
          <n-form-item label="账单类型">
            <n-select v-model:value="generateForm.bill_type" :options="billTypeOptions" />
          </n-form-item>
          <n-form-item label="账期">
            <n-date-picker v-model:value="generateForm.bill_period" type="month" />
          </n-form-item>
          <n-form-item label="账单日期">
            <n-date-picker v-model:value="generateForm.bill_date" type="date" />
          </n-form-item>
          <n-form-item label="到期日期">
            <n-date-picker v-model:value="generateForm.due_date" type="date" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showGenerateModal = false">取消</n-button>
            <n-button type="primary" :loading="generating" @click="handleGenerateSubmit">生成</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getBillList, generateBills, exportBills } from '~/api/bill'
import type { Bill } from '~/types'
import { useUserStore } from '~/stores/user'
import { useMessageUtil } from '~/composables/useMessage'

const userStore = useUserStore()
const { success, error } = useMessageUtil()

const loading = ref(false)
const tableData = ref<Bill[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const queryForm = reactive({
  keyword: '',
  bill_type: '',
  status: '',
  bill_date: null as number | null,
})

const showGenerateModal = ref(false)
const generating = ref(false)
const generateForm = reactive({
  bill_type: 'rent',
  bill_period: null as number | null,
  bill_date: null as number | null,
  due_date: null as number | null,
})

const billTypeOptions = [
  { label: '租金', value: 'rent' },
  { label: '押金', value: 'deposit' },
  { label: '物业费', value: 'property_fee' },
  { label: '其他', value: 'other' },
]

const statusOptions = [
  { label: '待支付', value: 'pending' },
  { label: '部分支付', value: 'partial' },
  { label: '已支付', value: 'paid' },
  { label: '逾期', value: 'overdue' },
  { label: '已作废', value: 'cancelled' },
]

const columns: DataTableColumns<Bill> = [
  { title: '账单编号', key: 'bill_no', width: 160 },
  { title: '账期', key: 'bill_period', width: 120 },
  { title: '账单类型', key: 'bill_type', width: 100, render: (row) => getBillTypeLabel(row.bill_type) },
  { title: '账单日期', key: 'bill_date', width: 120 },
  { title: '到期日期', key: 'due_date', width: 120 },
  { title: '账单金额', key: 'amount', width: 120, render: (row) => `¥${Number(row.amount).toLocaleString()}` },
  { title: '已付金额', key: 'paid_amount', width: 120, render: (row) => `¥${Number(row.paid_amount).toLocaleString()}` },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h('n-tag', { type: getStatusTagType(row.status) }, () => getStatusLabel(row.status)),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => viewDetail(row.id) }, () => '详情'),
      userStore.hasPermission('bill:manage') ? h('n-button', { size: 'small', onClick: () => handlePayment(row) }, () => '收款') : null,
    ]),
  },
]

function getBillTypeLabel(type: string): string {
  const map: Record<string, string> = {
    rent: '租金',
    deposit: '押金',
    property_fee: '物业费',
    other: '其他',
  }
  return map[type] || type
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待支付',
    partial: '部分支付',
    paid: '已支付',
    overdue: '逾期',
    cancelled: '已作废',
  }
  return map[status] || status
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    partial: 'info',
    paid: 'success',
    overdue: 'error',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...queryForm,
    }
    if (queryForm.bill_date) {
      const date = new Date(queryForm.bill_date)
      params.bill_date_from = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      params.bill_date_to = lastDay.toISOString().split('T')[0]
    }
    const res = await getBillList(params)
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
  queryForm.bill_type = ''
  queryForm.status = ''
  queryForm.bill_date = null
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

function handleGenerate() {
  showGenerateModal.value = true
}

async function handleGenerateSubmit() {
  if (!generateForm.bill_period || !generateForm.bill_date || !generateForm.due_date) {
    error('请填写完整信息')
    return
  }

  generating.value = true
  try {
    const data: any = {
      bill_type: generateForm.bill_type,
      bill_period: formatMonth(generateForm.bill_period),
      bill_date: new Date(generateForm.bill_date).toISOString().split('T')[0],
      due_date: new Date(generateForm.due_date).toISOString().split('T')[0],
    }
    const res = await generateBills(data)
    if (res.code === 200) {
      success(res.message || '生成成功')
      showGenerateModal.value = false
      loadData()
    }
  } catch (e: any) {
    error(e.message || '生成失败')
  } finally {
    generating.value = false
  }
}

function formatMonth(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

async function handleExport() {
  try {
    const params: any = { ...queryForm }
    const blob = await exportBills(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `账单明细_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    success('导出成功')
  } catch (e: any) {
    error(e.message || '导出失败')
  }
}

function viewDetail(id: number) {
  // 跳转到详情页
}

function handlePayment(row: Bill) {
  // 打开收款弹窗
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.bills-page {
  padding: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
