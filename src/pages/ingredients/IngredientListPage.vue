<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">原料管理</h2>
      <button class="btn-primary" @click="openCreate">新增原料</button>
    </div>

    <FilterBar>
      <select v-model="filters.category" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-bark/70">
        <input v-model="filters.lowStockOnly" type="checkbox" class="rounded" />
        仅显示低库存
      </label>
    </FilterBar>

    <DataTable
      :columns="columns"
      :data="filteredIngredients"
      :clickable="true"
      @row-click="openEdit"
    >
      <template #costPerUnit="{ row }">
        {{ formatCurrency(row.costPerUnit) }}
      </template>
      <template #currentStock="{ row }">
        <span :class="{ 'font-bold text-red-600': row.currentStock <= row.minStock }">
          {{ row.currentStock }}
        </span>
      </template>
      <template #minStock="{ row }">
        <span class="text-bark/50">{{ row.minStock }}</span>
      </template>
      <template #costTrend="{ row }">
        <span v-if="row.costHistory && row.costHistory.length >= 2" :class="getTrendClass(row.costHistory)">
          {{ getTrendLabel(row.costHistory) }}
        </span>
        <span v-else class="text-bark/30">-</span>
      </template>
    </DataTable>

    <Drawer :visible="drawerVisible" :title="isEditing ? '编辑原料' : '新增原料'" @close="drawerVisible = false">
      <form class="space-y-4" @submit.prevent="handleSave">
        <div>
          <label class="mb-1 block text-sm text-bark/70">名称</label>
          <input v-model="form.name" type="text" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">分类</label>
          <select v-model="form.category" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option value="粉类">粉类</option>
            <option value="糖类">糖类</option>
            <option value="油脂类">油脂类</option>
            <option value="蛋类">蛋类</option>
            <option value="乳制品">乳制品</option>
            <option value="添加剂">添加剂</option>
            <option value="调味料">调味料</option>
            <option value="辅料">辅料</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm text-bark/70">单位</label>
            <input v-model="form.unit" type="text" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-bark/70">单价</label>
            <input v-model.number="form.costPerUnit" type="number" step="0.01" min="0" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm text-bark/70">当前库存</label>
            <input v-model.number="form.currentStock" type="number" step="0.01" min="0" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-bark/70">最低库存</label>
            <input v-model.number="form.minStock" type="number" step="0.01" min="0" required class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="drawerVisible = false">取消</button>
          <button type="submit" class="btn-primary">{{ isEditing ? '保存' : '创建' }}</button>
        </div>
      </form>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import Drawer from '@/components/common/Drawer.vue'
import { useIngredientStore } from '@/stores/ingredient'
import { formatCurrency } from '@/lib/utils'

const ingredientStore = useIngredientStore()

const drawerVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')

const filters = ref({
  category: '',
  lowStockOnly: false,
})

const form = ref({
  name: '',
  category: '粉类',
  unit: 'kg',
  costPerUnit: 0,
  currentStock: 0,
  minStock: 0,
})

const categories = computed(() => {
  const cats = new Set(ingredientStore.list.map((i: any) => i.category))
  return [...cats]
})

const columns = [
  { key: 'name', label: '名称', sortable: true },
  { key: 'category', label: '分类' },
  { key: 'unit', label: '单位' },
  { key: 'costPerUnit', label: '单价', sortable: true },
  { key: 'currentStock', label: '库存', sortable: true },
  { key: 'minStock', label: '最低库存' },
  { key: 'costTrend', label: '成本趋势' },
]

const filteredIngredients = computed(() => {
  let list = ingredientStore.list
  if (filters.value.category) {
    list = list.filter((i: any) => i.category === filters.value.category)
  }
  if (filters.value.lowStockOnly) {
    list = list.filter((i: any) => i.currentStock <= i.minStock)
  }
  return list
})

const getTrendLabel = (history: any[]) => {
  if (!history || history.length < 2) return '-'
  const sorted = [...history].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const change = sorted[sorted.length - 1].cost - sorted[0].cost
  const pct = ((change / sorted[0].cost) * 100).toFixed(1)
  return change > 0 ? `↑${pct}%` : change < 0 ? `↓${Math.abs(Number(pct))}%` : '—'
}

const getTrendClass = (history: any[]) => {
  if (!history || history.length < 2) return ''
  const sorted = [...history].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const change = sorted[sorted.length - 1].cost - sorted[0].cost
  return change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-bark/40'
}

const openCreate = () => {
  isEditing.value = false
  editingId.value = ''
  form.value = { name: '', category: '粉类', unit: 'kg', costPerUnit: 0, currentStock: 0, minStock: 0 }
  drawerVisible.value = true
}

const openEdit = (row: any) => {
  isEditing.value = true
  editingId.value = row._id
  form.value = {
    name: row.name,
    category: row.category,
    unit: row.unit,
    costPerUnit: row.costPerUnit,
    currentStock: row.currentStock,
    minStock: row.minStock,
  }
  drawerVisible.value = true
}

const handleSave = async () => {
  if (isEditing.value) {
    await ingredientStore.edit(editingId.value, form.value as any)
  } else {
    await ingredientStore.add(form.value as any)
  }
  drawerVisible.value = false
}

onMounted(() => {
  ingredientStore.loadList()
})
</script>
