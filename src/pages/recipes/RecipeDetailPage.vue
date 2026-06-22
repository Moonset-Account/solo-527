<template>
  <div v-if="recipeStore.current" class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="text-bark/50 hover:text-bark transition-colors" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
        <h2 class="text-lg font-bold text-bark">{{ recipeStore.current.name }}</h2>
        <span class="rounded-btn bg-cream px-2 py-0.5 text-xs text-accent">{{ recipeStore.current.category }}</span>
      </div>
      <button class="btn-secondary" @click="openEditModal">编辑</button>
    </div>

    <div class="card">
      <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><span class="text-bark/50">分类：</span><span class="rounded-btn bg-cream px-2 py-0.5 text-xs text-accent">{{ recipeStore.current.category }}</span></div>
        <div><span class="text-bark/50">标准成本：</span>{{ formatCurrency(recipeStore.current.standardCost) }}</div>
        <div><span class="text-bark/50">产出：</span>{{ recipeStore.current.yield }}</div>
        <div><span class="text-bark/50">单位：</span>{{ recipeStore.current.unit }}</div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-3 font-medium text-bark">原料清单</h3>
      <DataTable :columns="ingredientColumns" :data="ingredientRows">
        <template #cost="{ row }">
          {{ formatCurrency(row.cost) }}
        </template>
      </DataTable>
      <div class="mt-3 text-right text-sm">
        <span class="text-bark/60">合计成本：</span>
        <span class="font-bold text-brand">{{ formatCurrency(totalCost) }}</span>
      </div>
    </div>

    <div v-if="timelineItems.length" class="card">
      <h3 class="mb-3 font-medium text-bark">变更历史</h3>
      <Timeline :items="timelineItems" />
    </div>

    <Modal :visible="editModalVisible" title="编辑配方" @close="editModalVisible = false">
      <form class="space-y-4" @submit.prevent="handleEdit">
        <div>
          <label class="mb-1 block text-sm text-bark/70">名称</label>
          <input v-model="editForm.name" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">分类</label>
          <select v-model="editForm.category" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-sm text-bark/70">产出数量</label>
            <input v-model.number="editForm.yield" type="number" min="0" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-sm text-bark/70">单位</label>
            <input v-model="editForm.unit" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="editModalVisible = false">取消</button>
          <button type="submit" class="btn-primary">保存</button>
        </div>
      </form>
    </Modal>
  </div>
  <EmptyState v-else message="配方不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Timeline from '@/components/common/Timeline.vue'
import { useRecipeStore } from '@/stores/recipe'
import { useIngredientStore } from '@/stores/ingredient'
import { formatCurrency } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()

const editModalVisible = ref(false)
const editForm = ref({ name: '', category: '', yield: 0, unit: '' })

const categoryOptions = ['起酥类', '面包类', '蛋糕类', '饼干类', '点心类']

const ingredientColumns = [
  { key: 'ingredientName', label: '原料名称' },
  { key: 'ratio', label: '比例', sortable: true },
  { key: 'unit', label: '单位' },
  { key: 'cost', label: '成本', sortable: true },
]

const ingredientRows = computed(() => {
  const ingredients = recipeStore.current?.ingredients || []
  return ingredients.map((item: any) => {
    const ing = ingredientStore.list.find((i: any) => i._id === item.ingredientId)
    const costPerUnit = ing?.costPerUnit || 0
    return {
      ingredientName: item.ingredientName,
      ratio: item.ratio,
      unit: item.unit,
      cost: item.ratio * costPerUnit,
    }
  })
})

const totalCost = computed(() => {
  return ingredientRows.value.reduce((sum: number, row: any) => sum + (row.cost || 0), 0)
})

const timelineItems = computed(() => {
  const history = recipeStore.current?.history || []
  return history.map((h: any) => ({
    action: `${h.field}: ${h.oldValue} → ${h.newValue}`,
    operator: '系统',
    timestamp: h.changedAt,
  }))
})

const openEditModal = () => {
  if (recipeStore.current) {
    editForm.value = {
      name: recipeStore.current.name,
      category: recipeStore.current.category,
      yield: recipeStore.current.yield,
      unit: recipeStore.current.unit,
    }
  }
  editModalVisible.value = true
}

const handleEdit = async () => {
  await recipeStore.edit(route.params.id as string, editForm.value as any)
  editModalVisible.value = false
}

onMounted(() => {
  ingredientStore.loadList()
  recipeStore.loadDetail(route.params.id as string)
})
</script>
