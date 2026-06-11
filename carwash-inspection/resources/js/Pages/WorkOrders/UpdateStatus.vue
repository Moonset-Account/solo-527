<script setup>
import { Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusLabel from '../../Components/StatusLabel.vue'

const props = defineProps({
    work_order: Object,
})

const form = useForm({
    status: '',
    remarks: '',
})

const statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'confirmed', label: '已确认' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
    { value: 'paid', label: '已支付' },
]

const submit = () => {
    form.post(`/work-orders/${props.work_order.id}/status`)
}
</script>

<template>
    <AppLayout title="变更状态">
        <div class="max-w-lg mx-auto space-y-6">
            <div class="flex items-center gap-3">
                <Link :href="`/work-orders/${work_order.id}`" class="text-gray-500 hover:text-gray-700 text-sm">工单详情</Link>
                <span class="text-gray-400">/</span>
                <h2 class="text-2xl font-bold text-gray-900">变更状态</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="mb-4 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span class="text-sm text-gray-600">当前状态:</span>
                    <StatusLabel :status="work_order.status" />
                </div>

                <form @submit.prevent="submit" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">新状态 <span class="text-red-500">*</span></label>
                        <select v-model="form.status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">请选择</option>
                            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                        <p v-if="form.errors.status" class="mt-1 text-sm text-red-600">{{ form.errors.status }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea v-model="form.remarks" rows="3" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" placeholder="输入变更备注"></textarea>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Link :href="`/work-orders/${work_order.id}`" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</Link>
                        <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">确认变更</button>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
