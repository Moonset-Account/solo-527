<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('checklists.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">新建检查清单模板</h1>
                </div>
            </div>
        </div>

        <form @submit.prevent="submitForm" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">模板名称 *</label>
                        <input
                            v-model="form.title"
                            type="text"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="例如：数据安全合规检查清单"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <select
                            v-model="form.category"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">请选择分类</option>
                            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                        <input
                            v-model="form.version"
                            type="text"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="1.0"
                        />
                    </div>
                    <div class="flex items-center">
                        <input
                            v-model="form.is_active"
                            type="checkbox"
                            id="is-active"
                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="is-active" class="ml-2 text-sm text-gray-700">
                            立即可用（启用此模板）
                        </label>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">模板描述</label>
                        <textarea
                            v-model="form.description"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="简要描述此检查清单的用途..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">检查项</h3>
                    <button
                        type="button"
                        @click="addItem"
                        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                    >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        添加检查项
                    </button>
                </div>

                <div class="space-y-4">
                    <div
                        v-for="(item, index) in form.items"
                        :key="index"
                        class="border border-gray-200 rounded-lg p-4"
                    >
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm font-medium text-gray-500">#{{ index + 1 }}</span>
                            </div>
                            <button
                                type="button"
                                @click="removeItem(index)"
                                class="text-red-500 hover:text-red-700 text-sm"
                            >
                                删除
                            </button>
                        </div>

                        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-500 mb-1">检查项标题 *</label>
                                <input
                                    v-model="item.title"
                                    type="text"
                                    required
                                    class="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="例如：是否启用了数据加密传输"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1">风险等级</label>
                                <select
                                    v-model="item.risk_level"
                                    class="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option v-for="level in riskLevels" :key="level" :value="level">
                                        {{ riskLevelLabels[level] }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1">子分类</label>
                                <input
                                    v-model="item.category"
                                    type="text"
                                    class="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="例如：访问控制"
                                />
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-500 mb-1">判定标准</label>
                                <textarea
                                    v-model="item.criteria"
                                    rows="2"
                                    class="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="描述如何判定该项是否通过..."
                                ></textarea>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-500 mb-1">详细描述</label>
                                <textarea
                                    v-model="item.description"
                                    rows="1"
                                    class="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="检查项详细说明..."
                                ></textarea>
                            </div>
                            <div class="md:col-span-2 flex items-center">
                                <input
                                    v-model="item.is_required"
                                    type="checkbox"
                                    :id="'required-' + index"
                                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label :for="'required-' + index" class="ml-2 text-sm text-gray-700">
                                    必须检查项（不允许标记为不适用）
                                </label>
                            </div>
                        </div>
                    </div>

                    <p v-if="form.items.length === 0" class="text-sm text-gray-500 text-center py-8">
                        暂无检查项，点击上方「添加检查项」按钮开始创建
                    </p>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <Link
                    :href="route('checklists.index')"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    取消
                </Link>
                <button
                    type="submit"
                    :disabled="form.items.length === 0"
                    class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {{ isEdit ? '保存修改' : '创建模板' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    checklist: Object,
    riskLevels: Array,
    categories: Array,
})

const isEdit = computed(() => !!props.checklist)

const form = reactive({
    title: props.checklist?.title || '',
    description: props.checklist?.description || '',
    category: props.checklist?.category || '',
    version: props.checklist?.version || '1.0',
    is_active: props.checklist?.is_active ?? true,
    items: props.checklist?.items?.map((item, index) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        criteria: item.criteria || '',
        risk_level: item.risk_level || 'medium',
        category: item.category || '',
        is_required: item.is_required ?? true,
        sort_order: item.sort_order || index,
    })) || [
        {
            title: '',
            description: '',
            criteria: '',
            risk_level: 'medium',
            category: '',
            is_required: true,
            sort_order: 0,
        }
    ]
})

const riskLevelLabels = {
    low: '低',
    medium: '中',
    high: '高',
}

function addItem() {
    form.items.push({
        title: '',
        description: '',
        criteria: '',
        risk_level: 'medium',
        category: '',
        is_required: true,
        sort_order: form.items.length,
    })
}

function removeItem(index) {
    if (form.items.length <= 1) return
    form.items.splice(index, 1)
}

function submitForm() {
    const data = { ...form }
    if (isEdit.value) {
        router.put(route('checklists.update', props.checklist.id), data)
    } else {
        router.post(route('checklists.store'), data)
    }
}
</script>
