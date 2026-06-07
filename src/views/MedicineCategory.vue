<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MedicineCategory } from '@/types'

const dataStore = useDataStore()
const editingId = ref<string | null>(null)
const editName = ref('')

const rootCategories = computed(() => {
  return dataStore.medicineCategories.filter(c => c.level === 1)
})

function getChildren(parentId: string) {
  return dataStore.medicineCategories.filter(c => c.parentId === parentId)
}

function startEdit(category: MedicineCategory) {
  editingId.value = category.id
  editName.value = category.name
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
}

function saveEdit(category: MedicineCategory) {
  if (!editName.value.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  const updated = dataStore.medicineCategories.map(c => {
    if (c.id === category.id) {
      return { ...c, name: editName.value.trim() }
    }
    return c
  })
  dataStore.updateMedicineCategory(updated)
  editingId.value = null
  editName.value = ''
  ElMessage.success('分类名称已更新')
}

async function deleteCategory(category: MedicineCategory) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类「${category.name}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const children = getChildren(category.id)
    if (children.length > 0) {
      ElMessage.error('请先删除该分类下的子分类')
      return
    }
    const updated = dataStore.medicineCategories.filter(c => c.id !== category.id)
    dataStore.updateMedicineCategory(updated)
    ElMessage.success('分类已删除')
  } catch {
    // 用户取消
  }
}

function addSubCategory(parent: MedicineCategory) {
  const newId = `SUB${String(Date.now()).slice(-6)}`
  const newCategory: MedicineCategory = {
    id: newId,
    name: '新分类',
    parentId: parent.id,
    level: 2,
    medicines: []
  }
  const updated = [...dataStore.medicineCategories, newCategory]
  dataStore.updateMedicineCategory(updated)
  editingId.value = newId
  editName.value = '新分类'
  ElMessage.success('已添加新分类，请修改名称')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">药品分类管理</h2>
        <p class="mt-1 text-sm text-gray-500">
          维护药品分类维度映射表，用于分析维度配置
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500">
          共 {{ dataStore.medicineCategories.length }} 个分类
        </span>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100 bg-gray-50">
        <div class="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500">
          <div class="col-span-3">分类名称</div>
          <div class="col-span-2">层级</div>
          <div class="col-span-4">包含药品</div>
          <div class="col-span-3 text-right">操作</div>
        </div>
      </div>

      <div class="divide-y divide-gray-50">
        <template v-for="root in rootCategories" :key="root.id">
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-3">
                <template v-if="editingId === root.id">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="editName"
                      class="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                      @keyup.enter="saveEdit(root)"
                    />
                    <button
                      class="p-1 text-green-600 hover:bg-green-50 rounded"
                      @click="saveEdit(root)"
                    >
                      <Save class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      @click="cancelEdit"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span class="font-medium text-gray-800">{{ root.name }}</span>
                  </div>
                </template>
              </div>
              <div class="col-span-2">
                <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                  一级分类
                </span>
              </div>
              <div class="col-span-4">
                <span class="text-sm text-gray-500">
                  {{ getChildren(root.id).length }} 个子分类
                </span>
              </div>
              <div class="col-span-3 flex items-center justify-end gap-1">
                <button
                  v-if="editingId !== root.id"
                  class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="添加子分类"
                  @click="addSubCategory(root)"
                >
                  <Plus class="w-4 h-4" />
                </button>
                <button
                  v-if="editingId !== root.id"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="编辑"
                  @click="startEdit(root)"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-for="child in getChildren(root.id)"
            :key="child.id"
            class="p-4 pl-10 hover:bg-gray-50 transition-colors bg-gray-50/50"
          >
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-3">
                <template v-if="editingId === child.id">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="editName"
                      class="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                      @keyup.enter="saveEdit(child)"
                    />
                    <button
                      class="p-1 text-green-600 hover:bg-green-50 rounded"
                      @click="saveEdit(child)"
                    >
                      <Save class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      @click="cancelEdit"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    <span class="text-gray-700">{{ child.name }}</span>
                  </div>
                </template>
              </div>
              <div class="col-span-2">
                <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  二级分类
                </span>
              </div>
              <div class="col-span-4">
                <span class="text-xs text-gray-500">
                  {{ child.medicines.join('、') || '暂无药品' }}
                </span>
              </div>
              <div class="col-span-3 flex items-center justify-end gap-1">
                <button
                  v-if="editingId !== child.id"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="编辑"
                  @click="startEdit(child)"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  v-if="editingId !== child.id"
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                  @click="deleteCategory(child)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
      <h4 class="text-sm font-medium text-blue-800 mb-2">📋 分类映射说明</h4>
      <ul class="text-xs text-blue-700 space-y-1">
        <li>• 药品分类映射表用于统一分析维度，确保各门店统计口径一致</li>
        <li>• 修改分类后，历史数据将自动按新分类重新聚合</li>
        <li>• 分类变更将记录操作日志，便于审计追溯</li>
      </ul>
    </div>
  </div>
</template>
