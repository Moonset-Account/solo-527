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
  pageSize: 10
})

const statusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' }> = {
  available: { label: '在售', type: 'success' },
  on_sale: { label: '在售', type: 'success' },
  sold: { label: '已售', type: 'default' },
  reserved: { label: '预留', type: 'warning' }
}

const columns: DataTableColumns = [
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '价格', key: 'price', width: 100,
    render(row: any) {
      return `¥${row.price}`
    }
  },
  { title: '类别', key: 'category', width: 100 },
  { title: '联系方式', key: 'contact', width: 150 },
  {
    title: '状态', key: 'status', width: 80,
    render(row: any) {
      const s = statusMap[row.status] || { label: row.status || '在售', type: 'success' as const }
      return h(NTag, { type: s.type, size: 'small' }, { default: () => s.label })
    }
  },
  { title: '发布时间', key: 'created_at', width: 160 }
]

let allTrades: any[] = []

async function fetchTrades() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      limit: 100
    }
    const res = await api.getTrades(params) as any
    allTrades = Array.isArray(res) ? res : (res.items || [])
    applyFilters()
  } catch {
    allTrades = []
    trades.value = []
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  let filtered = [...allTrades]
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    filtered = filtered.filter((t: any) =>
      (t.title || '').toLowerCase().includes(kw) ||
      (t.description || '').toLowerCase().includes(kw)
    )
  }
  if (filterCategory.value) {
    filtered = filtered.filter((t: any) => t.category === filterCategory.value)
  }
  const start = (pagination.page - 1) * pagination.pageSize
  trades.value = filtered.slice(start, start + pagination.pageSize)
}

function handlePageChange(page: number) {
  pagination.page = page
  applyFilters()
}

onMounted(() => {
  fetchTrades()
})
</script>
