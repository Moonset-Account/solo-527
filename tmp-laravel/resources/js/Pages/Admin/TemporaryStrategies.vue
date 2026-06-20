<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  strategies: Object,
  filters: Object,
})

const showModal = ref(false)
const editingStrategy = ref(null)
const form = ref(getDefaultForm())
const togglingId = ref(null)

const filterSearch = ref(props.filters?.search || '')
const filterType = ref(props.filters?.type || '')
const filterActive = ref(props.filters?.is_active ?? '')

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'pricing', label: '定价策略' },
  { value: 'scheduling', label: '排课策略' },
  { value: 'enrollment', label: '招生策略' },
  { value: 'discount', label: '优惠策略' },
]

const activeOptions = [
  { value: '', label: '全部状态' },
  { value: '1', label: '已启用' },
  { value: '0', label: '已停用' },
]

const typeLabels = {
  pricing: '定价策略',
  scheduling: '排课策略',
  enrollment: '招生策略',
  discount: '优惠策略',
}

function getDefaultForm() {
  return {
    name: '',
    code: '',
    type: 'pricing',
    start_date: '',
    end_date: '',
    description: '',
    config: '{}',
  }
}

function openCreateModal() {
  editingStrategy.value = null
  form.value = getDefaultForm()
  showModal.value = true
}

function openEditModal(strategy) {
  editingStrategy.value = strategy
  form.value = {
    name: strategy.name,
    code: strategy.code,
    type: strategy.type,
    start_date: strategy.start_date || '',
    end_date: strategy.end_date || '',
    description: strategy.description || '',
    config: strategy.config ? JSON.stringify(strategy.config, null, 2) : '{}',
  }
  showModal.value = true
}

function submitForm() {
  let payload = { ...form.value }
  try {
    payload.config = JSON.parse(payload.config)
  } catch {
    payload.config = {}
  }

  if (editingStrategy.value) {
    router.put(route('admin.temporary-strategies.update', editingStrategy.value.id), payload, {
      onSuccess: () => { showModal.value = false },
    })
  } else {
    router.post(route('admin.temporary-strategies.store'), payload, {
      onSuccess: () => { showModal.value = false },
    })
  }
}

function toggleActive(strategy) {
  togglingId.value = strategy.id
  router.post(route('admin.temporary-strategies.toggle', strategy.id), {}, {
    preserveScroll: true,
    onFinish: () => { togglingId.value = null },
  })
}

function deleteStrategy(strategy) {
  if (!confirm('确定删除该策略？')) return
  router.delete(route('admin.temporary-strategies.destroy', strategy.id))
}

function applyFilters() {
  router.get(route('admin.temporary-strategies.index'), {
    search: filterSearch.value,
    type: filterType.value,
    is_active: filterActive.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterType, filterActive], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

function configPreview(config) {
  if (!config) return '-'
  try {
    const obj = typeof config === 'string' ? JSON.parse(config) : config
    return JSON.stringify(obj, null, 2).slice(0, 120)
  } catch {
    return String(config).slice(0, 120)
  }
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="临时策略">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">临时策略</h2>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新增策略
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索策略名称..." />
        <select
          v-model="filterType"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterActive"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in activeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="strategy in strategies.data"
        :key="strategy.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-sm font-semibold text-gray-900 truncate">{{ strategy.name }}</h3>
              <span class="inline-block px-1.5 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700">
                {{ typeLabels[strategy.type] || strategy.type }}
              </span>
            </div>
            <p class="text-xs text-gray-500 font-mono">{{ strategy.code }}</p>
          </div>
          <button
            @click="toggleActive(strategy)"
            :disabled="togglingId === strategy.id"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-3',
              strategy.is_active ? 'bg-indigo-600' : 'bg-gray-300',
              togglingId === strategy.id ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                strategy.is_active ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>

        <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ strategy.start_date || '无开始日期' }} ~ {{ strategy.end_date || '无结束日期' }}
          </span>
        </div>

        <p v-if="strategy.description" class="text-sm text-gray-600 mb-3 line-clamp-2">{{ strategy.description }}</p>

        <div class="bg-gray-50 rounded-lg p-3 mb-3">
          <p class="text-xs text-gray-400 mb-1">配置预览</p>
          <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-hidden max-h-20">{{ configPreview(strategy.config) }}</pre>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="openEditModal(strategy)"
            class="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            编辑
          </button>
          <button
            @click="deleteStrategy(strategy)"
            class="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="strategies.data.length === 0" class="bg-white rounded-xl border border-gray-200 py-16 text-center">
      <p class="text-sm text-gray-400">暂无策略数据</p>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="strategies.links" />
    </div>

    <Modal :show="showModal" :title="editingStrategy ? '编辑策略' : '新增策略'" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">编码</label>
            <input
              v-model="form.code"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              v-model="form.type"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="opt in typeOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                v-model="form.start_date"
                type="date"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                v-model="form.end_date"
                type="date"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">配置 (JSON)</label>
          <textarea
            v-model="form.config"
            rows="5"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {{ editingStrategy ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
