<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Edit2, Save, X } from 'lucide-vue-next'
import { settingsApi } from '@/api'
import type { ScopeConfig } from '@/types'

const scopeTypes = [
  { key: 'department', label: '部门' },
  { key: 'role', label: '角色' },
  { key: 'source', label: '来源' },
]

const activeType = ref<'department' | 'role' | 'source'>('department')
const scopes = ref<ScopeConfig[]>([])
const editingId = ref<number | null>(null)
const editValues = ref<string[]>([])

async function fetchScopes() {
  const { data } = await settingsApi.scopes.list(activeType.value)
  scopes.value = data
}

function startEdit(scope: ScopeConfig) {
  editingId.value = scope.id
  editValues.value = [...scope.values]
}

function cancelEdit() {
  editingId.value = null
  editValues.value = []
}

async function saveScope(id: number) {
  await settingsApi.scopes.update(id, { values: editValues.value })
  editingId.value = null
  await fetchScopes()
}

function addValue() {
  editValues.value.push('')
}

function removeValue(idx: number) {
  editValues.value.splice(idx, 1)
}

onMounted(fetchScopes)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-slate-800">作用域配置</h1>

    <div class="flex bg-slate-100 rounded-md p-0.5 w-fit">
      <button
        v-for="st in scopeTypes"
        :key="st.key"
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="activeType === st.key ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500'"
        @click="activeType = st.key as any; fetchScopes()"
      >
        {{ st.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="scope in scopes"
        :key="scope.id"
        class="bg-white rounded-lg border border-slate-200 p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="font-medium text-slate-800">{{ scope.name }}</span>
          <template v-if="editingId !== scope.id">
            <button class="p-1 rounded hover:bg-slate-100" @click="startEdit(scope)">
              <Edit2 class="w-4 h-4 text-slate-500" />
            </button>
          </template>
          <template v-else>
            <div class="flex items-center gap-1">
              <button class="p-1 rounded hover:bg-emerald-50 text-emerald-600" @click="saveScope(scope.id)">
                <Save class="w-4 h-4" />
              </button>
              <button class="p-1 rounded hover:bg-slate-100 text-slate-400" @click="cancelEdit">
                <X class="w-4 h-4" />
              </button>
            </div>
          </template>
        </div>

        <template v-if="editingId === scope.id">
          <div class="space-y-2">
            <div v-for="(val, idx) in editValues" :key="idx" class="flex items-center gap-2">
              <input
                v-model="editValues[idx]"
                class="flex-1 h-8 px-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button class="p-1 text-red-400 hover:bg-red-50 rounded" @click="removeValue(idx)">
                <X class="w-3 h-3" />
              </button>
            </div>
            <button
              class="text-sm text-amber-600 hover:text-amber-700"
              @click="addValue"
            >
              + 添加值
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="val in scope.values"
              :key="val"
              class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
            >
              {{ val }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
