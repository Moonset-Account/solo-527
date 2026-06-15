<script setup lang="ts">
import { Plus, Edit2, Trash2, Save, X, Palette, Users, Power, PowerOff } from 'lucide-vue-next'

interface TagItem {
  id: string
  name: string
  color: string
  usageCount: number
  enabled: boolean
  createdAt: string
}

const tags = ref<TagItem[]>([
  { id: '1', name: '种植牙', color: '#F43F5E', usageCount: 156, enabled: true, createdAt: '2025-06-01' },
  { id: '2', name: '牙齿矫正', color: '#8B5CF6', usageCount: 128, enabled: true, createdAt: '2025-06-01' },
  { id: '3', name: '烤瓷牙', color: '#F59E0B', usageCount: 92, enabled: true, createdAt: '2025-06-15' },
  { id: '4', name: '洁牙', color: '#0EA5E9', usageCount: 342, enabled: true, createdAt: '2025-07-01' },
  { id: '5', name: 'VIP', color: '#0EA5A9', usageCount: 48, enabled: true, createdAt: '2025-07-10' },
  { id: '6', name: '儿童齿科', color: '#10B981', usageCount: 76, enabled: true, createdAt: '2025-08-01' },
  { id: '7', name: '流失风险', color: '#EF4444', usageCount: 23, enabled: true, createdAt: '2025-09-01' },
  { id: '8', name: '高意向', color: '#3B82F6', usageCount: 87, enabled: false, createdAt: '2025-09-15' },
])

const colorPresets = [
  '#EF4444', '#F43F5E', '#EC4899', '#D946EF',
  '#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9',
  '#06B6D4', '#0EA5A9', '#10B981', '#22C55E',
  '#84CC16', '#EAB308', '#F59E0B', '#F97316',
]

const editingId = ref<string | null>(null)
const editingName = ref('')
const editingColor = ref('')
const showAddForm = ref(false)
const newName = ref('')
const newColor = ref('#0EA5A9')
const selectedIds = ref<string[]>([])

function startEdit(tag: TagItem) {
  editingId.value = tag.id
  editingName.value = tag.name
  editingColor.value = tag.color
}
function cancelEdit() {
  editingId.value = null
}
async function saveEdit(tag: TagItem) {
  if (!editingName.value.trim()) return
  tag.name = editingName.value.trim()
  tag.color = editingColor.value
  editingId.value = null
}
function deleteTag(id: string) {
  const idx = tags.value.findIndex(t => t.id === id)
  if (idx !== -1) tags.value.splice(idx, 1)
}
function toggleEnabled(tag: TagItem) {
  tag.enabled = !tag.enabled
}
function toggleSelect(id: string) {
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
}
function selectAll() {
  if (selectedIds.value.length === tags.value.length) selectedIds.value = []
  else selectedIds.value = tags.value.map(t => t.id)
}
function batchToggle(enabled: boolean) {
  tags.value.forEach(t => {
    if (selectedIds.value.includes(t.id)) t.enabled = enabled
  })
  selectedIds.value = []
}
async function addTag() {
  if (!newName.value.trim()) return
  tags.value.unshift({
    id: 't' + Date.now(),
    name: newName.value.trim(),
    color: newColor.value,
    usageCount: 0,
    enabled: true,
    createdAt: new Date().toISOString().slice(0, 10),
  })
  newName.value = ''
  newColor.value = '#0EA5A9'
  showAddForm.value = false
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
</script>

<template>
  <div class="p-6 space-y-5 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">标签管理</h1>
        <p class="text-gray-500 text-sm mt-1">管理客户标签体系，支持颜色自定义和批量操作</p>
      </div>
      <div class="flex items-center gap-3">
        <Transition name="fade">
          <div v-if="selectedIds.length > 0" class="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-200">
            <span class="text-sm text-primary-700 font-medium">已选 {{ selectedIds.length }} 项</span>
            <UButton size="xs" variant="solid" color="primary" @click="batchToggle(true)">
              <template #leading><Power class="w-3 h-3" /></template>
              批量启用
            </UButton>
            <UButton size="xs" variant="outline" color="gray" @click="batchToggle(false)">
              <template #leading><PowerOff class="w-3 h-3" /></template>
              批量禁用
            </UButton>
          </div>
        </Transition>
        <UButton color="primary" @click="showAddForm = !showAddForm">
          <template #leading><Plus class="w-4 h-4" /></template>
          新建标签
        </UButton>
      </div>
    </div>

    <Transition name="slide-down">
      <UCard v-if="showAddForm" class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-4">
            <Palette class="w-5 h-5 text-primary-500" />
            <h3 class="font-semibold text-gray-800">新建标签</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div class="md:col-span-4">
              <UFormGroup label="标签名称" required>
                <UInput v-model="newName" placeholder="请输入标签名称" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-5">
              <UFormGroup label="标签颜色">
                <div class="flex items-center gap-3">
                  <input v-model="newColor" type="color" class="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer bg-white" />
                  <div class="flex flex-wrap gap-1.5 flex-1">
                    <button
                      v-for="c in colorPresets"
                      :key="c"
                      :style="{ background: c }"
                      :class="[
                        'w-7 h-7 rounded-lg transition-all hover:scale-110',
                        newColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      ]"
                      @click="newColor = c"
                    />
                  </div>
                </div>
              </UFormGroup>
            </div>
            <div class="md:col-span-3 flex items-end gap-2">
              <UButton block color="primary" size="md" @click="addTag">
                <template #leading><Save class="w-4 h-4" /></template>
                确认创建
              </UButton>
              <UButton block variant="ghost" color="gray" size="md" @click="showAddForm = false">
                取消
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </Transition>

    <UCard class="border-0 shadow-card">
      <template #body>
        <UTable :rows="tags">
          <template #head>
            <UTh class="w-10">
              <div class="w-4 h-4 rounded border border-gray-300 cursor-pointer flex items-center justify-center" :class="selectedIds.length === tags.length && tags.length > 0 ? 'bg-primary-500 border-primary-500' : ''" @click="selectAll">
                <span v-if="selectedIds.length === tags.length && tags.length > 0" class="text-white text-xs">✓</span>
              </div>
            </UTh>
            <UTh>标签</UTh>
            <UTh>使用统计</UTh>
            <UTh>状态</UTh>
            <UTh>创建时间</UTh>
            <UTh class="text-right w-56">操作</UTh>
          </template>
          <template #body="{ rows }">
            <UTR v-for="tag in rows" :key="tag.id">
              <UTD>
                <div class="w-4 h-4 rounded border border-gray-300 cursor-pointer flex items-center justify-center" :class="selectedIds.includes(tag.id) ? 'bg-primary-500 border-primary-500' : ''" @click="toggleSelect(tag.id)">
                  <span v-if="selectedIds.includes(tag.id)" class="text-white text-xs">✓</span>
                </div>
              </UTD>
              <UTD>
                <template v-if="editingId === tag.id">
                  <div class="flex items-center gap-3">
                    <input v-model="editingColor" type="color" class="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    <UInput v-model="editingName" size="sm" class="!max-w-[180px]" />
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
                      :style="{ background: tag.color }"
                    >
                      {{ tag.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-800">{{ tag.name }}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <div class="w-3 h-3 rounded-full" :style="{ background: tag.color }"></div>
                        <span class="text-xs text-gray-400 font-mono">{{ tag.color }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </UTD>
              <UTD>
                <div class="flex items-center gap-2">
                  <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Users class="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">{{ tag.usageCount }}</p>
                    <p class="text-xs text-gray-400">位客户使用</p>
                  </div>
                </div>
              </UTD>
              <UTD>
                <template v-if="editingId === tag.id">
                  <UBadge size="sm" :color="tag.enabled ? 'emerald' : 'gray'" variant="subtle">
                    {{ tag.enabled ? '已启用' : '已禁用' }}
                  </UBadge>
                </template>
                <button
                  v-else
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    tag.enabled ? 'bg-primary-500' : 'bg-gray-200'
                  ]"
                  @click="toggleEnabled(tag)"
                >
                  <span
                    :class="[
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                      tag.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    ]"
                  />
                </button>
              </UTD>
              <UTD class="text-gray-500 text-sm">{{ tag.createdAt }}</UTD>
              <UTD class="text-right">
                <div v-if="editingId === tag.id" class="flex justify-end gap-1.5">
                  <UButton size="xs" color="primary" variant="solid" @click="saveEdit(tag)">
                    <template #leading><Save class="w-3 h-3" /></template>
                    保存
                  </UButton>
                  <UButton size="xs" variant="ghost" color="gray" @click="cancelEdit">
                    <template #leading><X class="w-3 h-3" /></template>
                    取消
                  </UButton>
                </div>
                <div v-else class="flex justify-end gap-1">
                  <UButton size="xs" variant="ghost" color="gray" @click="startEdit(tag)">
                    <Edit2 class="w-4 h-4" />
                  </UButton>
                  <UButton size="xs" variant="ghost" color="red" @click="deleteTag(tag.id)">
                    <Trash2 class="w-4 h-4" />
                  </UButton>
                </div>
              </UTD>
            </UTR>
          </template>
        </UTable>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
