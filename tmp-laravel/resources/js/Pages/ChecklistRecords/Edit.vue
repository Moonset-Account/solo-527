<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('checklist-records.show', record.id)" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">编辑检查记录</h1>
                    <p class="text-sm text-gray-500 mt-1">{{ record.checklist?.title }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button
                    @click="saveDraft"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    保存草稿
                </button>
                <button
                    @click="submitChecklist"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    提交审核
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-3 space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">检查标题 *</label>
                            <input
                                v-model="form.title"
                                type="text"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">检查部门</label>
                            <input
                                v-model="form.department"
                                type="text"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">检查日期</label>
                            <input
                                v-model="form.check_date"
                                type="date"
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                            <textarea
                                v-model="form.description"
                                rows="2"
                                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">检查项</h3>
                        <div class="flex items-center space-x-4 text-sm">
                            <span>通过: <strong class="text-green-600">{{ passCount }}</strong></span>
                            <span>不符合: <strong class="text-red-600">{{ failCount }}</strong></span>
                            <span>待处理: <strong class="text-yellow-600">{{ pendingCount }}</strong></span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div
                            v-for="(item, index) in form.items"
                            :key="item.id || index"
                            class="border border-gray-200 rounded-lg p-4"
                            :class="{
                                'border-green-200 bg-green-50': item.result === 'pass',
                                'border-red-200 bg-red-50': item.result === 'fail' || item.result === 'partial',
                                'border-yellow-200 bg-yellow-50': item.result === 'pending'
                            }"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm font-medium text-gray-900">
                                            {{ index + 1 }}. {{ getItemTitle(item) }}
                                        </span>
                                        <SeverityBadge v-if="getItemRiskLevel(item)" :severity="getItemRiskLevel(item)" />
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1" v-if="getItemCriteria(item)">
                                        判定标准: {{ getItemCriteria(item) }}
                                    </p>
                                </div>
                                <div class="ml-4">
                                    <select
                                        v-model="item.result"
                                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        @change="updateHasGap(item)"
                                    >
                                        <option value="pending">待检查</option>
                                        <option value="pass">通过</option>
                                        <option value="partial">部分通过</option>
                                        <option value="fail">不符合</option>
                                        <option value="na">不适用</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1">证据说明</label>
                                    <textarea
                                        v-model="item.evidence"
                                        rows="2"
                                        class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1">备注/问题描述</label>
                                    <textarea
                                        v-model="item.remark"
                                        rows="2"
                                        class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>
                            </div>

                            <div class="mt-2 flex items-center">
                                <input
                                    v-model="item.has_gap"
                                    type="checkbox"
                                    :id="'gap-' + index"
                                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label :for="'gap-' + index" class="ml-2 text-sm text-gray-600">
                                    标记为合规缺口
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">填写进度</h3>
                    <div class="space-y-3">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">完成进度</span>
                                <span class="font-medium text-gray-900">{{ progressPercent }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: progressPercent + '%' }"
                                ></div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-600">
                            <p>已完成: {{ completedCount }} / {{ totalCount }} 项</p>
                            <p class="mt-1">已标记缺口: {{ gapCount }} 项</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
                    <div class="space-y-2">
                        <button
                            type="button"
                            @click="markAllPass"
                            class="w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 text-left"
                        >
                            全部标记为通过
                        </button>
                        <button
                            type="button"
                            @click="markAllPending"
                            class="w-full px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 text-left"
                        >
                            全部重置为待检查
                        </button>
                    </div>
                </div>

                <div class="bg-indigo-50 rounded-lg border border-indigo-200 p-5">
                    <h3 class="text-sm font-medium text-indigo-900 mb-2">填写提示</h3>
                    <ul class="text-sm text-indigo-700 space-y-1">
                        <li>• 请根据实际情况逐项检查</li>
                        <li>• 不符合项会自动生成合规缺口</li>
                        <li>• 请详细描述证据和问题</li>
                        <li>• 可保存草稿稍后继续</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    record: Object,
})

const form = reactive({
    title: props.record?.title || '',
    description: props.record?.description || '',
    department: props.record?.department || '',
    check_date: props.record?.check_date || new Date().toISOString().split('T')[0],
    due_date: props.record?.due_date || '',
    responsible_user_id: props.record?.responsible_user_id || '',
    items: props.record?.items?.map(item => ({
        id: item.id,
        checklist_item_id: item.checklist_item_id,
        result: item.result,
        evidence: item.evidence || '',
        remark: item.remark || '',
        has_gap: item.has_gap,
    })) || []
})

const passCount = computed(() => {
    return form.items.filter(i => i.result === 'pass').length
})

const failCount = computed(() => {
    return form.items.filter(i => i.result === 'fail' || i.result === 'partial').length
})

const pendingCount = computed(() => {
    return form.items.filter(i => i.result === 'pending').length
})

const gapCount = computed(() => {
    return form.items.filter(i => i.has_gap).length
})

const totalCount = computed(() => {
    return form.items.length || 1
})

const completedCount = computed(() => {
    return form.items.filter(i => i.result !== 'pending').length
})

const progressPercent = computed(() => {
    return Math.round((completedCount.value / totalCount.value) * 100)
})

function getItemTitle(item) {
    const checklistItem = props.record?.checklist?.items?.find(i => i.id === item.checklist_item_id)
    return checklistItem?.title || '检查项'
}

function getItemRiskLevel(item) {
    const checklistItem = props.record?.checklist?.items?.find(i => i.id === item.checklist_item_id)
    return checklistItem?.risk_level || null
}

function getItemCriteria(item) {
    const checklistItem = props.record?.checklist?.items?.find(i => i.id === item.checklist_item_id)
    return checklistItem?.criteria || null
}

function updateHasGap(item) {
    if (item.result === 'fail' || item.result === 'partial') {
        item.has_gap = true
    } else if (item.result === 'pass' || item.result === 'na') {
        item.has_gap = false
    }
}

function markAllPass() {
    form.items.forEach(item => {
        item.result = 'pass'
        item.has_gap = false
    })
}

function markAllPending() {
    form.items.forEach(item => {
        item.result = 'pending'
        item.has_gap = false
    })
}

function saveDraft() {
    router.put(route('checklist-records.update', props.record.id), {
        ...form,
        submit: false
    })
}

function submitChecklist() {
    if (!form.title.trim()) {
        alert('请输入检查标题')
        return
    }
    if (confirm('确定要提交审核吗？提交后将不能直接修改。')) {
        router.put(route('checklist-records.update', props.record.id), {
            ...form,
            submit: true
        })
    }
}
</script>
