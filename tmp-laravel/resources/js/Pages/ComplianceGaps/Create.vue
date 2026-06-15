<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('compliance-gaps.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">新增合规缺口</h1>
                    <p class="text-sm text-gray-500 mt-1">手动录入发现的合规问题</p>
                </div>
            </div>
        </div>

        <form @submit.prevent="submitForm" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">缺口标题 *</label>
                        <input
                            v-model="form.title"
                            type="text"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="简要描述合规缺口的核心问题"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">严重程度 *</label>
                        <select
                            v-model="form.severity"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option v-for="s in severities" :key="s" :value="s">
                                {{ severityLabels[s] }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <select
                            v-model="form.category"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">请选择分类</option>
                            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">责任人 *</label>
                        <select
                            v-model="form.responsible_user_id"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">请选择责任人</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">
                                {{ u.name }} ({{ u.department || '未分配部门' }})
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">发现日期 *</label>
                        <input
                            v-model="form.discovered_date"
                            type="date"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">整改期限</label>
                        <input
                            v-model="form.due_date"
                            type="date"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">问题描述 *</label>
                        <textarea
                            v-model="form.description"
                            rows="3"
                            required
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="请详细描述发现的合规问题，包括涉及的范围、业务场景、影响面等..."
                        ></textarea>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">根本原因</label>
                        <textarea
                            v-model="form.root_cause"
                            rows="2"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="分析问题产生的根本原因（制度/流程/技术/人员）..."
                        ></textarea>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">整改措施建议</label>
                        <textarea
                            v-model="form.corrective_action"
                            rows="3"
                            class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="描述建议的整改措施和行动计划..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <Link
                    :href="route('compliance-gaps.index')"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    取消
                </Link>
                <button
                    type="submit"
                    class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    创建缺口
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    severities: Array,
    categories: Array,
    users: Array,
})

const form = reactive({
    title: '',
    description: '',
    severity: 'medium',
    category: '',
    responsible_user_id: '',
    discovered_date: new Date().toISOString().split('T')[0],
    due_date: '',
    root_cause: '',
    corrective_action: '',
})

const severityLabels = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
}

function submitForm() {
    router.post(route('compliance-gaps.store'), { ...form })
}
</script>
