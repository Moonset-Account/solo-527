<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">筛选条件</h3>
            <div class="flex items-center space-x-2">
                <div class="relative" v-if="savedFilters.length > 0">
                    <select
                        class="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        @change="loadFilter($event.target.value)"
                    >
                        <option value="">- 选择已保存筛选 -</option>
                        <optgroup label="我的筛选">
                            <option v-for="filter in myFilters" :key="filter.id" :value="filter.id">
                                {{ filter.name }}
                            </option>
                        </optgroup>
                        <optgroup label="公共筛选" v-if="publicFilters.length > 0">
                            <option v-for="filter in publicFilters" :key="filter.id" :value="filter.id">
                                {{ filter.name }}
                            </option>
                        </optgroup>
                    </select>
                </div>
                <button
                    @click="showSaveDialog = true"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>
                    保存筛选
                </button>
                <button
                    @click="$emit('reset')"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    重置
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <slot></slot>
        </div>

        <div class="mt-4 flex justify-end">
            <button
                @click="$emit('apply')"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                应用筛选
            </button>
        </div>

        <div v-if="showSaveDialog" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">保存筛选条件</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">筛选名称</label>
                        <input
                            v-model="newFilterName"
                            type="text"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="输入筛选名称"
                        />
                    </div>
                    <div class="flex items-center">
                        <input
                            v-model="isPublic"
                            type="checkbox"
                            id="is-public"
                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="is-public" class="ml-2 text-sm text-gray-700">
                            设为公共筛选（其他角色也可使用）
                        </label>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button
                        @click="showSaveDialog = false"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        取消
                    </button>
                    <button
                        @click="saveFilter"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showRenameDialog" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">重命名筛选</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">筛选名称</label>
                    <input
                        v-model="renameFilterName"
                        type="text"
                        class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button
                        @click="showRenameDialog = false"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        取消
                    </button>
                    <button
                        @click="renameFilter"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'

const props = defineProps({
    savedFilters: {
        type: Array,
        default: () => []
    },
    currentFilters: {
        type: Object,
        default: () => ({})
    },
    page: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['apply', 'reset', 'loaded'])

const showSaveDialog = ref(false)
const showRenameDialog = ref(false)
const newFilterName = ref('')
const renameFilterName = ref('')
const isPublic = ref(false)
const selectedFilterId = ref(null)

const myFilters = computed(() => {
    return props.savedFilters.filter(f => !f.is_public)
})

const publicFilters = computed(() => {
    return props.savedFilters.filter(f => f.is_public)
})

function loadFilter(filterId) {
    if (!filterId) return

    const filter = props.savedFilters.find(f => f.id == filterId)
    if (filter) {
        emit('loaded', filter.filters)
        selectedFilterId.value = filterId
    }
}

function saveFilter() {
    if (!newFilterName.value.trim()) return

    router.post(route('saved-filters.store'), {
        name: newFilterName.value,
        page: props.page,
        filters: props.currentFilters,
        is_public: isPublic.value
    }, {
        onSuccess: () => {
            showSaveDialog.value = false
            newFilterName.value = ''
            isPublic.value = false
        }
    })
}

function renameFilter() {
    if (!renameFilterName.value.trim() || !selectedFilterId.value) return

    router.put(route('saved-filters.rename', selectedFilterId.value), {
        name: renameFilterName.value
    }, {
        onSuccess: () => {
            showRenameDialog.value = false
            renameFilterName.value = ''
        }
    })
}
</script>
