<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  dictionaries: Object,
})

const selectedId = ref(null)
const showDictModal = ref(false)
const showItemModal = ref(false)
const editingDict = ref(null)
const editingItem = ref(null)
const dictForm = ref(getDefaultDictForm())
const itemForm = ref(getDefaultItemForm())

const selectedDictionary = computed(() => {
  if (!selectedId.value || !props.dictionaries?.data) return null
  return props.dictionaries.data.find(d => d.id === selectedId.value)
})

const dictItems = computed(() => {
  return selectedDictionary.value?.items || []
})

function getDefaultDictForm() {
  return { code: '', name: '', description: '' }
}

function getDefaultItemForm() {
  return { value: '', label: '', sort_order: 0 }
}

function selectDictionary(dict) {
  selectedId.value = dict.id
}

function openCreateDictModal() {
  editingDict.value = null
  dictForm.value = getDefaultDictForm()
  showDictModal.value = true
}

function openEditDictModal(dict) {
  editingDict.value = dict
  dictForm.value = { code: dict.code, name: dict.name, description: dict.description || '' }
  showDictModal.value = true
}

function submitDictForm() {
  if (editingDict.value) {
    router.put(route('admin.dictionaries.update', editingDict.value.id), dictForm.value, {
      onSuccess: () => { showDictModal.value = false },
    })
  } else {
    router.post(route('admin.dictionaries.store'), dictForm.value, {
      onSuccess: () => { showDictModal.value = false },
    })
  }
}

function deleteDictionary(dict) {
  if (dict.is_system) return
  if (!confirm('确定删除该字典？')) return
  router.delete(route('admin.dictionaries.destroy', dict.id))
}

function openCreateItemModal() {
  editingItem.value = null
  itemForm.value = getDefaultItemForm()
  showItemModal.value = true
}

function openEditItemModal(item) {
  editingItem.value = item
  itemForm.value = { value: item.value, label: item.label, sort_order: item.sort_order }
  showItemModal.value = true
}

function submitItemForm() {
  const dictId = selectedId.value
  if (editingItem.value) {
    router.put(route('admin.dictionaries.items.update', [dictId, editingItem.value.id]), itemForm.value, {
      onSuccess: () => { showItemModal.value = false },
    })
  } else {
    router.post(route('admin.dictionaries.items.store', dictId), itemForm.value, {
      onSuccess: () => { showItemModal.value = false },
    })
  }
}

function deleteItem(item) {
  if (!confirm('确定删除该条目？')) return
  router.delete(route('admin.dictionaries.items.destroy', [selectedId.value, item.id]))
}

function toggleItemActive(item) {
  router.post(route('admin.dictionaries.items.toggle', [selectedId.value, item.id]), {
    preserveScroll: true,
  })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="字典管理">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">字典管理</h2>
      <button
        @click="openCreateDictModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新增字典
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-5 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">字典列表</h3>
          </div>
          <div class="divide-y divide-gray-50">
            <div
              v-for="dict in dictionaries.data"
              :key="dict.id"
              :class="[
                'px-5 py-3 cursor-pointer transition-colors',
                selectedId === dict.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50',
              ]"
              @click="selectDictionary(dict)"
            >
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900 truncate">{{ dict.name }}</span>
                    <span
                      v-if="dict.is_system"
                      class="inline-block px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700"
                    >
                      系统
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ dict.code }} · {{ dict.items?.length || 0 }} 项</div>
                </div>
                <div class="flex items-center gap-1 ml-2" @click.stop>
                  <button
                    @click="openEditDictModal(dict)"
                    class="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    :disabled="dict.is_system"
                    :class="[
                      'p-1 rounded transition-colors',
                      dict.is_system ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600',
                    ]"
                    @click="deleteDictionary(dict)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="dictionaries.data.length === 0" class="px-5 py-10 text-center text-sm text-gray-500">
              暂无字典数据
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div v-if="selectedDictionary" class="bg-white rounded-xl border border-gray-200">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">{{ selectedDictionary.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ selectedDictionary.description || '无描述' }}</p>
            </div>
            <button
              @click="openCreateItemModal"
              class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              新增条目
            </button>
          </div>
          <table class="w-full">
            <thead>
              <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
                <th class="px-5 py-3 font-medium">值</th>
                <th class="px-5 py-3 font-medium">标签</th>
                <th class="px-5 py-3 font-medium">排序</th>
                <th class="px-5 py-3 font-medium">状态</th>
                <th class="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dictItems" :key="item.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td class="px-5 py-3 text-sm font-mono text-gray-900">{{ item.value }}</td>
                <td class="px-5 py-3 text-sm text-gray-700">{{ item.label }}</td>
                <td class="px-5 py-3 text-sm text-gray-600">{{ item.sort_order }}</td>
                <td class="px-5 py-3">
                  <button
                    @click="toggleItemActive(item)"
                    :class="[
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                      item.is_active ? 'bg-indigo-600' : 'bg-gray-300',
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                        item.is_active ? 'translate-x-4.5' : 'translate-x-0.5',
                      ]"
                    />
                  </button>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditItemModal(item)"
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      编辑
                    </button>
                    <button
                      @click="deleteItem(item)"
                      class="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="dictItems.length === 0">
                <td colspan="5" class="px-5 py-10 text-center text-sm text-gray-500">该字典暂无条目</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <p class="text-sm text-gray-400">请从左侧选择一个字典查看条目</p>
        </div>
      </div>
    </div>

    <Modal :show="showDictModal" :title="editingDict ? '编辑字典' : '新增字典'" max-width="md" @close="showDictModal = false">
      <form @submit.prevent="submitDictForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">编码</label>
          <input
            v-model="dictForm.code"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input
            v-model="dictForm.name"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="dictForm.description"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showDictModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {{ editingDict ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal :show="showItemModal" :title="editingItem ? '编辑条目' : '新增条目'" max-width="md" @close="showItemModal = false">
      <form @submit.prevent="submitItemForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">值</label>
          <input
            v-model="itemForm.value"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <input
            v-model="itemForm.label"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
          <input
            v-model.number="itemForm.sort_order"
            type="number"
            min="0"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showItemModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {{ editingItem ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
