<template>
  <NCard title="二手交易">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchKeyword" placeholder="搜索商品" style="width: 200px" @keyup.enter="fetchTrades" />
        <NSelect v-model:value="filterCategory" :options="categoryOptions" placeholder="全部类别" clearable style="width: 120px" @update:value="fetchTrades" />
        <NButton @click="fetchTrades">搜索</NButton>
      </NSpace>
    </template>

    <NDataTable
      :columns="columns"
      :data="trades"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row: any) => row.id"
      @update:page="handlePageChange"
    />
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NDataTable, NInput, NSelect, NButton, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const api = useApi()
const loading = ref(false)
const trades = ref<any[]>([])
const searchKeyword = ref('')
const filterCategory = ref<string | null>(null)

const categoryOptions = [
  { label: '书籍', value: '书籍' },
  { label: '电子设备', value: '电子设备' },
  { label: '生活用品', value: '生活用品' },
  { label: '其他', value: '其他' }
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0
})

const statusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' }> = {
  on_sale: { label: '在售', type: 'success' },
  sold: { label: '已售', type: 'default' },
  reserved: { label: '预留', type: 'warning' }
}

const columns: DataTableColumns = [
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '价格', key: 'price', width: 100,
    render(row: any) {
      return `¥${row.price}`
    }
  },
  { title: '类别', key: 'category', width: 100 },
  { title: '联系方式', key: 'contact', width: 120 },
  {
    title: '状态', key: 'status', width: 80,
    render(row: any) {
      const s = statusMap[row.status] || { label: row.status, type: 'default' as const }
      return h(NTag, { type: s.type, size: 'small' }, { default: () => s.label })
    }
  }
]

async function fetchTrades() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.category = filterCategory.value
    const res = await api.getSecondHandTrades(params) as any
    trades.value = res.items || []
    pagination.itemCount = res.total || 0
  } catch {
    trades.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchTrades()
}

onMounted(() => {
  fetchTrades()
})
</script>
