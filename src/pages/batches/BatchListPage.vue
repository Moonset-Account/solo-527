<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">批次管理</h2>
      <button class="btn-primary" @click="drawerVisible = true">新增批次</button>
    </div>

    <FilterBar>
      <input v-model="filters.startDate" type="date" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm" />
      <input v-model="filters.endDate" type="date" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm" />
      <select v-model="filters.recipeId" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部配方</option>
        <option v-for="r in recipeList" :key="r._id" :value="r._id">{{ r.name }}</option>
      </select>
      <select v-model="filters.teamId" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部班组</option>
        <option v-for="t in teamList" :key="t._id" :value="t._id">{{ t.name }}</option>
      </select>
      <select v-model="filters.status" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
        <option value="picked_up">已取货</option>
        <option value="scrapped">已报废</option>
      </select>
    </FilterBar>

    <DataTable
      :columns="columns"
      :data="batchStore.list"
      :clickable="true"
      @row-click="goDetail"
    >
      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #costVariance="{ row }">
        <span :class="(row.costVariance || 0) > 0 ? 'text-red-600' : 'text-green-600'">
          {{ (row.costVariance || 0) > 0 ? '+' : '' }}{{ (row.costVariance || 0).toFixed(2) }}
        </span>
      </template>
      <template #plannedQty="{ row }">
        {{ row.plannedQty }}{{ row.unit }}
      </template>
      <template #createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </DataTable>

    <Drawer :visible="drawerVisible" title="新增批次" @close="drawerVisible = false">
      <form class="space-y-4" @submit.prevent="handleCreate">
        <div>
          <label class="mb-1 block text-sm text-bark/70">配方</label>
          <select v-model="form.recipeId" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option value="">请选择</option>
            <option v-for="r in recipeList" :key="r._id" :value="r._id">{{ r.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">计划数量</label>
          <input v-model.number="form.plannedQty" type="number" min="1" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">班组</label>
          <select v-model="form.teamId" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option value="">请选择</option>
            <option v-for="t in teamList" :key="t._id" :value="t._id">{{ t.name }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="drawerVisible = false">取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import Drawer from '@/components/common/Drawer.vue'
import { useBatchStore } from '@/stores/batch'
import { useRecipeStore } from '@/stores/recipe'
import { fetchTeams } from '@/api/team'
import { formatDateTime } from '@/lib/utils'

const router = useRouter()
const batchStore = useBatchStore()
const recipeStore = useRecipeStore()

const drawerVisible = ref(false)
const recipeList = ref<any[]>([])
const teamList = ref<any[]>([])

const filters = ref({
  startDate: '',
  endDate: '',
  recipeId: '',
  teamId: '',
  status: '',
})

const form = ref({
  recipeId: '',
  plannedQty: 0,
  teamId: '',
})

const columns = [
  { key: 'batchNo', label: '批次号', sortable: true },
  { key: 'recipeName', label: '配方' },
  { key: 'plannedQty', label: '数量', sortable: true },
  { key: 'teamName', label: '班组' },
  { key: 'status', label: '状态' },
  { key: 'costVariance', label: '成本偏差', sortable: true },
  { key: 'createdAt', label: '创建时间', sortable: true },
]

const goDetail = (row: any) => {
  router.push(`/batches/${row._id}`)
}

const handleCreate = async () => {
  await batchStore.add(form.value as any)
  drawerVisible.value = false
  form.value = { recipeId: '', plannedQty: 0, teamId: '' }
}

watch(filters, () => {
  const params: Record<string, unknown> = {}
  if (filters.value.startDate) params.startDate = filters.value.startDate
  if (filters.value.endDate) params.endDate = filters.value.endDate
  if (filters.value.recipeId) params.recipeId = filters.value.recipeId
  if (filters.value.teamId) params.teamId = filters.value.teamId
  if (filters.value.status) params.status = filters.value.status
  batchStore.loadList(params)
}, { deep: true })

onMounted(async () => {
  await batchStore.loadList()
  await recipeStore.loadList()
  recipeList.value = recipeStore.list
  try {
    const teams: any = await fetchTeams()
    teamList.value = Array.isArray(teams) ? teams : []
  } catch {}
})
</script>
