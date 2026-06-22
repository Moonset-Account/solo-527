<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">配方管理</h2>
      <button class="btn-primary" @click="openDrawer">
        <Plus :size="16" class="inline -mt-0.5 mr-1" />
        新增配方
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-bark/40" />
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索配方..."
          class="rounded-btn border border-brand/20 py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <div class="flex gap-1">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="[
            'rounded-btn px-3 py-1.5 text-sm transition-colors',
            activeCategory === cat ? 'bg-brand text-white' : 'bg-cream text-bark/60 hover:bg-brand/10',
          ]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe._id"
        class="card cursor-pointer"
        @click="goDetail(recipe._id)"
      >
        <span class="mb-2 inline-block rounded-btn bg-cream px-2 py-0.5 text-xs text-accent">{{ recipe.category }}</span>
        <h3 class="font-medium text-bark">{{ recipe.name }}</h3>
        <div class="mt-2 flex items-center justify-between text-sm text-bark/60">
          <span>{{ formatCurrency(recipe.standardCost) }}</span>
          <span>{{ recipe.yield }} {{ recipe.unit }}</span>
        </div>
      </div>
    </div>

    <EmptyState v-if="!filteredRecipes.length" message="未找到配方" />

    <Drawer :visible="drawerVisible" title="新增配方" @close="drawerVisible = false">
      <form class="space-y-4" @submit.prevent="handleAdd">
        <div>
          <label class="mb-1 block text-sm text-bark/70">名称</label>
          <input v-model="form.name" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">分类</label>
          <select v-model="form.category" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" required>
            <option value="">请选择分类</option>
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-sm text-bark/70">产出数量</label>
            <input v-model.number="form.yield" type="number" min="0" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" required />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-sm text-bark/70">单位</label>
            <input v-model="form.unit" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" required />
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="text-sm text-bark/70">原料</label>
            <button type="button" class="text-sm text-accent hover:text-accent/80" @click="addIngredientRow">+ 添加原料</button>
          </div>
          <div class="space-y-2">
            <div v-for="(row, idx) in form.ingredients" :key="idx" class="flex items-center gap-2">
              <select v-model="row.ingredientId" class="flex-1 rounded-btn border border-brand/20 px-2 py-1.5 text-sm" required>
                <option value="">选择原料</option>
                <option v-for="ing in ingredientStore.list" :key="ing._id" :value="ing._id">{{ ing.name }}</option>
              </select>
              <input v-model.number="row.ratio" type="number" min="0" step="0.01" placeholder="比例" class="w-20 rounded-btn border border-brand/20 px-2 py-1.5 text-sm" required />
              <input v-model="row.unit" type="text" placeholder="单位" class="w-16 rounded-btn border border-brand/20 px-2 py-1.5 text-sm" required />
              <button type="button" class="text-bark/30 hover:text-red-500 transition-colors" @click="removeIngredientRow(idx)">
                <X :size="16" />
              </button>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, X } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import Drawer from '@/components/common/Drawer.vue'
import { useRecipeStore } from '@/stores/recipe'
import { useIngredientStore } from '@/stores/ingredient'
import { formatCurrency } from '@/lib/utils'

const router = useRouter()
const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()

const searchText = ref('')
const activeCategory = ref('全部')
const drawerVisible = ref(false)

const categoryOptions = ['起酥类', '面包类', '蛋糕类', '饼干类', '点心类']

const defaultForm = () => ({
  name: '',
  category: '',
  yield: 0,
  unit: '',
  ingredients: [] as { ingredientId: string; ratio: number; unit: string }[],
})

const form = ref(defaultForm())

const categories = computed(() => {
  const cats = new Set(recipeStore.list.map((r: any) => r.category))
  return ['全部', ...cats]
})

const filteredRecipes = computed(() => {
  let list = recipeStore.list
  if (activeCategory.value !== '全部') {
    list = list.filter((r: any) => r.category === activeCategory.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter((r: any) => r.name.toLowerCase().includes(q))
  }
  return list
})

const openDrawer = () => {
  form.value = defaultForm()
  ingredientStore.loadList()
  drawerVisible.value = true
}

const addIngredientRow = () => {
  form.value.ingredients.push({ ingredientId: '', ratio: 0, unit: '' })
}

const removeIngredientRow = (idx: number) => {
  form.value.ingredients.splice(idx, 1)
}

const handleAdd = async () => {
  const ingredients = form.value.ingredients.map(row => {
    const ing = ingredientStore.list.find((i: any) => i._id === row.ingredientId)
    return {
      ingredientId: row.ingredientId,
      ingredientName: ing?.name || '',
      ratio: row.ratio,
      unit: row.unit,
    }
  })
  await recipeStore.add({ ...form.value, ingredients })
  drawerVisible.value = false
}

const goDetail = (id: string) => {
  router.push(`/recipes/${id}`)
}

onMounted(() => {
  recipeStore.loadList()
})
</script>
