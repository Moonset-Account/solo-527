<script setup>
import { router } from '@inertiajs/vue3'
import Modal from '@/Components/Modal.vue'
import { ref, onMounted } from 'vue'

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  currentFilters: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['apply'])

const showPanel = ref(false)
const showSaveModal = ref(false)
const savedFilters = ref([])
const saveForm = ref({ name: '', is_default: false })
const loading = ref(false)

onMounted(() => {
  loadFilters()
})

function loadFilters() {
  loading.value = true
  router.visit(route('saved-filters.index', { module: props.module }), {
    preserveState: true,
    preserveScroll: true,
    onSuccess: (page) => {
      savedFilters.value = page.props.savedFilters?.data || page.props.savedFilters || []
      loading.value = false
    },
    onError: () => {
      loading.value = false
    },
    only: ['savedFilters'],
  })
}

function openSaveModal() {
  saveForm.value = { name: '', is_default: false }
  showSaveModal.value = true
}

function saveFilter() {
  router.post(route('saved-filters.store'), {
    name: saveForm.value.name,
    is_default: saveForm.value.is_default,
    module: props.module,
    filters: props.currentFilters,
  }, {
    preserveScroll: true,
    onSuccess: () => {
      showSaveModal.value = false
      loadFilters()
    },
  })
}

function applyFilter(savedFilter) {
  emit('apply', savedFilter.filters)
  router.get(route().current(), savedFilter.filters, {
    preserveState: true,
    preserveScroll: true,
  })
  showPanel.value = false
}

function deleteFilter(savedFilter) {
  if (!confirm('确定删除该筛选方案？')) return
  router.delete(route('saved-filters.destroy', savedFilter.id), {
    preserveScroll: true,
    onSuccess: () => {
      loadFilters()
    },
  })
}
</script>

<template>
  <div class="relative">
    <button
      @click="showPanel = !showPanel"
      class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      已存筛选
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="showPanel"
      class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-40"
    >
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">已存筛选</span>
        <button
          @click="openSaveModal"
          class="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          保存当前筛选
        </button>
      </div>

      <div class="max-h-60 overflow-y-auto">
        <div v-if="loading" class="px-4 py-6 text-center text-sm text-gray-400">加载中...</div>
        <div v-else-if="savedFilters.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">暂无已存筛选</div>
        <div
          v-for="filter in savedFilters"
          :key="filter.id"
          class="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <button
            @click="applyFilter(filter)"
            class="flex-1 text-left min-w-0"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-gray-700 truncate">{{ filter.name }}</span>
              <span
                v-if="filter.is_default"
                class="inline-block px-1 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700"
              >
                默认
              </span>
            </div>
          </button>
          <button
            @click="deleteFilter(filter)"
            class="p-1 text-gray-400 hover:text-red-600 rounded transition-colors shrink-0 ml-2"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="px-4 py-2 border-t border-gray-100">
        <button
          @click="showPanel = false"
          class="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
        >
          关闭
        </button>
      </div>
    </div>

    <div
      v-if="showPanel"
      class="fixed inset-0 z-30"
      @click="showPanel = false"
    />

    <Modal :show="showSaveModal" title="保存筛选方案" max-width="sm" @close="showSaveModal = false">
      <form @submit.prevent="saveFilter" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input
            v-model="saveForm.name"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="saveForm.is_default"
            type="checkbox"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-700">设为默认筛选</span>
        </label>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showSaveModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
