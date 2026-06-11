<script setup>
import { Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { ref, computed } from 'vue'

const props = defineProps({
    work_order: Object,
    template_items: Array,
})

const existingMap = computed(() => {
    const map = {}
    if (props.work_order.inspections) {
        for (const insp of props.work_order.inspections) {
            map[insp.item_name] = insp
        }
    }
    return map
})

const items = ref(
    (props.template_items || []).map(item => ({
        item_name: item.item_name || item.name || '',
        category: item.category || '',
        result: existingMap.value[item.item_name || item.name]?.result || '',
        remarks: existingMap.value[item.item_name || item.name]?.remarks || '',
        required: item.required ?? true,
    }))
)

const form = useForm({
    items: items,
})

const resultOptions = [
    { value: 'pass', label: '合格' },
    { value: 'fail', label: '不合格' },
    { value: 'warning', label: '警告' },
    { value: 'skip', label: '跳过' },
]

const resultClass = (result) => {
    const map = {
        pass: 'bg-green-100 text-green-800 border-green-200',
        fail: 'bg-red-100 text-red-800 border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        skip: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return map[result] || 'bg-white border-gray-300'
}

const submit = () => {
    form.items = items.value
    form.post(`/work-orders/${props.work_order.id}/inspection`)
}
</script>

<template>
    <AppLayout title="车辆检测">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Link :href="`/work-orders/${work_order.id}`" class="text-gray-500 hover:text-gray-700 text-sm">工单详情</Link>
                    <span class="text-gray-400">/</span>
                    <h2 class="text-2xl font-bold text-gray-900">车辆检测</h2>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">工单号:</span>
                        <span class="ml-1 font-medium">{{ work_order.order_no }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">车牌号:</span>
                        <span class="ml-1 font-medium">{{ work_order.vehicle?.plate_number || '-' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">服务项目:</span>
                        <span class="ml-1 font-medium">{{ work_order.service_item?.name || '-' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">技师:</span>
                        <span class="ml-1 font-medium">{{ work_order.technician?.name || '-' }}</span>
                    </div>
                </div>
            </div>

            <form @submit.prevent="submit" class="space-y-4">
                <div v-for="(item, index) in items" :key="index" class="bg-white rounded-xl border border-gray-200 p-4">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h4 class="font-medium text-gray-900">{{ item.item_name }}</h4>
                            <span class="text-xs text-gray-500">{{ item.category }}</span>
                            <span v-if="item.required" class="ml-2 text-xs text-red-500">必检</span>
                        </div>
                        <span v-if="item.result" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border" :class="resultClass(item.result)">
                            {{ resultOptions.find(r => r.value === item.result)?.label || item.result }}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">检测结果</label>
                            <select v-model="item.result" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                                <option value="">请选择</option>
                                <option v-for="opt in resultOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-gray-600 mb-1">备注</label>
                            <input v-model="item.remarks" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" placeholder="输入备注" />
                        </div>
                    </div>
                </div>

                <div v-if="items.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    没有检测项目
                </div>

                <div class="flex items-center justify-end gap-3 pt-4">
                    <Link :href="`/work-orders/${work_order.id}`" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</Link>
                    <button type="submit" :disabled="form.processing" class="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">提交检测结果</button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>
