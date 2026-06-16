<template>
  <div>
    <n-page-header title="操作日志" subtitle="全流程处理人留痕与审计追溯" />

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-select v-model:value="filterEntity" :options="entityOptions" placeholder="业务类型" clearable style="width: 160px;" />
          <n-select v-model:value="filterAction" :options="actionOptions" placeholder="操作类型" clearable style="width: 140px;" />
          <n-input v-model:value="filterUser" placeholder="操作人ID" clearable style="width: 120px;" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 280px;" />
          <n-button type="primary" @click="loadData">查询</n-button>
          <n-button @click="resetFilters">重置</n-button>
        </n-space>

        <n-data-table
          :columns="columns"
          :data="dataList"
          :loading="loading"
          :pagination="pagination"
          @update:page="handlePageChange"
        />
      </n-space>
    </n-card>

    <n-drawer v-model:show="showDetail" :width="640" placement="right">
      <n-drawer-content title="操作详情" closable>
        <n-descriptions v-if="currentLog" :column="1" bordered label-placement="left">
          <n-descriptions-item label="操作类型">{{ currentLog.action }}</n-descriptions-item>
          <n-descriptions-item label="业务类型">{{ currentLog.entity_type }}</n-descriptions-item>
          <n-descriptions-item label="业务ID">{{ currentLog.entity_id }}</n-descriptions-item>
          <n-descriptions-item label="业务名称">{{ currentLog.entity_name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="操作人">{{ currentLog.user_name || '-' }} (ID: {{ currentLog.user_id || '-' }})</n-descriptions-item>
          <n-descriptions-item label="角色">{{ currentLog.role || '-' }}</n-descriptions-item>
          <n-descriptions-item label="操作描述">{{ currentLog.description || '-' }}</n-descriptions-item>
          <n-descriptions-item label="操作时间">{{ dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss') }}</n-descriptions-item>
          <n-descriptions-item label="IP地址">{{ currentLog.ip_address || '-' }}</n-descriptions-item>
          <n-descriptions-item label="变更前数据">
            <n-log :text="JSON.stringify(currentLog.old_value, null, 2)" language="json" style="max-height: 200px;" />
          </n-descriptions-item>
          <n-descriptions-item label="变更后数据">
            <n-log :text="JSON.stringify(currentLog.new_value, null, 2)" language="json" style="max-height: 200px;" />
          </n-descriptions-item>
        </n-descriptions>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { listAuditLogs } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const showDetail = ref(false)
const currentLog = ref<any>(null)
const filterEntity = ref<string | null>(null)
const filterAction = ref<string | null>(null)
const filterUser = ref('')
const dateRange = ref<number[] | null>(null)

const dataList = ref<any[]>([])
const entityOptions = [
  { label: '用户', value: 'user' },
  { label: '耗材', value: 'material' },
  { label: '耗材分类', value: 'material_category' },
  { label: '月度用量', value: 'monthly_usage' },
  { label: '供应商', value: 'supplier' },
  { label: '报价', value: 'quote' },
  { label: '采购需求', value: 'purchase_request' },
  { label: '采购订单', value: 'purchase_order' },
  { label: '框架协议', value: 'framework_agreement' }
]
const actionOptions = [
  { label: '登录', value: 'login' },
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '审批', value: 'approve' },
  { label: '比价', value: 'compare' }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

function getEntityLabel(type: string) {
  const map: Record<string, string> = {
    user: '用户', material: '耗材', material_category: '耗材分类', monthly_usage: '月度用量',
    supplier: '供应商', quote: '报价', purchase_request: '采购需求',
    purchase_order: '采购订单', framework_agreement: '框架协议'
  }
  return map[type] || type
}

function getActionTag(type: string) {
  const map: Record<string, any> = {
    login: 'info', create: 'success', update: 'warning', delete: 'error', approve: 'primary', compare: 'info'
  }
  const label: Record<string, string> = {
    login: '登录', create: '创建', update: '更新', delete: '删除', approve: '审批', compare: '比价'
  }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '操作时间', key: 'created_at', width: 170, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') },
  { title: '操作人', key: 'user_name', width: 120, render: (row: any) => row.user_name || '-' },
  { title: '角色', key: 'role', width: 100, render: (row: any) => row.role || '-' },
  { title: '操作类型', key: 'action', width: 90, render: (row: any) => {
      const a = getActionTag(row.action)
      return h('n-tag', { type: a.type, size: 'small' }, { default: () => a.label })
  }},
  { title: '业务类型', key: 'entity_type', width: 110, render: (row: any) => getEntityLabel(row.entity_type) },
  { title: '业务名称', key: 'entity_name', width: 180, ellipsis: { tooltip: true } },
  { title: '操作描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '操作', key: 'actions', width: 80, render: (row: any) =>
    h('n-button', { size: 'small', type: 'primary', quaternary: true, onClick: () => viewDetail(row) }, () => '详情')
  }
]

function viewDetail(row: any) {
  currentLog.value = row
  showDetail.value = true
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      entity_type: filterEntity.value,
      action: filterAction.value
    }
    if (filterUser.value) params.user_id = parseInt(filterUser.value)
    const res = await listAuditLogs(params)
    if (res.code === 200) {
      dataList.value = res.data.items
      pagination.itemCount = res.data.total
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function resetFilters() {
  filterEntity.value = null
  filterAction.value = null
  filterUser.value = ''
  dateRange.value = null
  pagination.page = 1
  loadData()
}

onMounted(loadData)
</script>
