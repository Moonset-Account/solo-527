<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-vue-next'
import { settingsApi } from '@/api'
import type { DictItem } from '@/types'

const categories = [
  { key: 'lead_source', label: '线索来源' },
  { key: 'decoration_style', label: '装修风格' },
  { key: 'churn_reason', label: '流失原因' },
  { key: 'followup_type', label: '回访类型' },
  { key: 'house_type', label: '户型类型' },
  { key: 'budget_range', label: '预算范围' },
]

const activeCategory = ref('lead_source')
const items = ref<DictItem[]>([])
const editingId = ref<string | null>(null)
const editForm = ref<Partial<DictItem>>({})

async function fetchItems() {
  const { data } = await settingsApi.dicts.list(activeCategory.value)
  items.value = data
}

function startCreate() {
  editingId.value = ''
  editForm.value = { category: activeCategory.value, key: '', label: '', sort: items.value.length + 1, enabled: true }
}

function startEdit(item: DictItem) {
  editingId.value = item.id
  editForm.value = { ...item }
}

async function saveItem() {
  if (editingId.value) {
    await settingsApi.dicts.update(editingId.value, editForm.value)
  } else {
    await settingsApi.dicts.create(editForm.value)
  }
  editingId.value = null
  await fetchItems()
}

async function deleteItem(id: string) {
  await settingsApi.dicts.delete(id)
  await fetchItems()
}

async function toggleEnabled(item: DictItem) {
  await settingsApi.dicts.update(item.id, { enabled: !item.enabled })
  await fetchItems()
}

watch(activeCategory, fetchItems)
onMounted(fetchItems)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-slate-800">字典管理</h1>

    <div class="flex bg-slate-100 rounded-md p-0.5 w-fit">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="px-3 py-1.5 text-sm rounded-md transition-colors"
        :class="activeCategory === cat.key ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500'"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span class="text-sm text-slate-500">共 {{ items.length }} 项</span>
        <button
          class="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 flex items-center gap-1"
          @click="startCreate"
        >
          <Plus class="w-3 h-3" /> 新增
        </button>
      </div>
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">键值</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">标签</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">排序</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="editingId === ''" class="bg-amber-50/50">
            <td class="px-4 py-2">
              <input v-model="editForm.key" class="w-full h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </td>
            <td class="px-4 py-2">
              <input v-model="editForm.label" class="w-full h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </td>
            <td class="px-4 py-2">
              <input v-model.number="editForm.sort" type="number" class="w-16 h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </td>
            <td class="px-4 py-2">
              <button @click="saveItem" class="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Check class="w-4 h-4" /></button>
              <button @click="editingId = null" class="p-1 text-slate-400 hover:bg-slate-100 rounded"><X class="w-4 h-4" /></button>
            </td>
            <td></td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50">
            <template v-if="editingId === item.id">
              <td class="px-4 py-2">
                <input v-model="editForm.key" class="w-full h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </td>
              <td class="px-4 py-2">
                <input v-model="editForm.label" class="w-full h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </td>
              <td class="px-4 py-2">
                <input v-model.number="editForm.sort" type="number" class="w-16 h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </td>
              <td class="px-4 py-2">
                <button @click="saveItem" class="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Check class="w-4 h-4" /></button>
                <button @click="editingId = null" class="p-1 text-slate-400 hover:bg-slate-100 rounded"><X class="w-4 h-4" /></button>
              </td>
              <td></td>
            </template>
            <template v-else>
              <td class="px-4 py-3 text-sm text-slate-700 font-mono">{{ item.key }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ item.label }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ item.sort }}</td>
              <td class="px-4 py-3">
                <button @click="toggleEnabled(item)">
                  <span v-if="item.enabled" class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">启用</span>
                  <span v-else class="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">禁用</span>
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button class="p-1 rounded hover:bg-slate-100" @click="startEdit(item)">
                    <Edit2 class="w-4 h-4 text-slate-500" />
                  </button>
                  <button class="p-1 rounded hover:bg-red-50" @click="deleteItem(item.id)">
                    <Trash2 class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
