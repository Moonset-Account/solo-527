<script setup>
import { Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { ref } from 'vue'

const props = defineProps({
    work_order: Object,
})

const form = useForm({
    reason: '',
    contact_attempts: 0,
    rescheduled: false,
    rescheduled_time: '',
})

const submit = () => {
    form.post(`/work-orders/${props.work_order.id}/no-show`)
}
</script>

<template>
    <AppLayout title="标记爽约">
        <div class="max-w-lg mx-auto space-y-6">
            <div class="flex items-center gap-3">
                <Link :href="`/work-orders/${work_order.id}`" class="text-gray-500 hover:text-gray-700 text-sm">工单详情</Link>
                <span class="text-gray-400">/</span>
                <h2 class="text-2xl font-bold text-gray-900">标记爽约</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    工单号: {{ work_order.order_no }} - 确认将此工单标记为爽约？
                </div>

                <form @submit.prevent="submit" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">爽约原因 <span class="text-red-500">*</span></label>
                        <textarea v-model="form.reason" rows="3" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" placeholder="请输入爽约原因"></textarea>
                        <p v-if="form.errors.reason" class="mt-1 text-sm text-red-600">{{ form.errors.reason }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">联系尝试次数</label>
                        <input v-model.number="form.contact_attempts" type="number" min="0" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>

                    <div class="flex items-center gap-2">
                        <input v-model="form.rescheduled" type="checkbox" id="rescheduled" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                        <label for="rescheduled" class="text-sm font-medium text-gray-700">是否改约</label>
                    </div>

                    <div v-if="form.rescheduled">
                        <label class="block text-sm font-medium text-gray-700 mb-1">改约时间</label>
                        <input v-model="form.rescheduled_time" type="datetime-local" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Link :href="`/work-orders/${work_order.id}`" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</Link>
                        <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">确认爽约</button>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
