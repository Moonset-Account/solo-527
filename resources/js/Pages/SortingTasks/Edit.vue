<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const task = computed(() => page.props.task)
const orders = computed(() => page.props.orders || [])
const greenhouses = computed(() => page.props.greenhouses || [])
const users = computed(() => page.props.users || [])

const form = useForm({
    order_id: task.value?.order_id || '',
    greenhouse_id: task.value?.greenhouse_id || '',
    assignee_id: task.value?.assignee_id || '',
    planned_quantity: task.value?.planned_quantity || '',
    actual_quantity: task.value?.actual_quantity || '',
    scheduled_date: task.value?.scheduled_date || '',
    status: task.value?.status || 'pending',
    notes: task.value?.notes || '',
})

const orderOptions = computed(() =>
    orders.value.map((o) => ({ value: o.id, label: `${o.order_no} - ${o.customer_name}` }))
)

const greenhouseOptions = computed(() =>
    greenhouses.value.map((g) => ({ value: g.id, label: g.name }))
)

const userOptions = computed(() =>
    users.value.map((u) => ({ value: u.id, label: u.name }))
)

const statusOptions = [
    { value: 'pending', label: '待开始' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
]

const submit = () => {
    form.put(route('sorting-tasks.update', task.value.id), {
        onSuccess: () => router.visit(route('sorting-tasks.index')),
    })
}
</script>

<template>
    <AppLayout title="编辑分拣任务">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('sorting-tasks.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">编辑分拣任务</h2>
                <form @submit.prevent="submit" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            v-model="form.order_id"
                            label="关联订单"
                            :options="orderOptions"
                            :error="form.errors.order_id"
                            required
                        />
                        <Select
                            v-model="form.greenhouse_id"
                            label="大棚"
                            :options="greenhouseOptions"
                            :error="form.errors.greenhouse_id"
                            required
                        />
                        <Select
                            v-model="form.assignee_id"
                            label="分配人员"
                            :options="userOptions"
                            :error="form.errors.assignee_id"
                            required
                        />
                        <Select
                            v-model="form.status"
                            label="状态"
                            :options="statusOptions"
                            :error="form.errors.status"
                            required
                        />
                        <Input
                            v-model="form.scheduled_date"
                            type="date"
                            label="计划日期"
                            :error="form.errors.scheduled_date"
                            required
                        />
                        <Input
                            v-model="form.planned_quantity"
                            type="number"
                            label="计划数量(kg)"
                            placeholder="请输入计划数量"
                            :error="form.errors.planned_quantity"
                            required
                        />
                        <Input
                            v-model="form.actual_quantity"
                            type="number"
                            label="实际数量(kg)"
                            placeholder="请输入实际数量"
                            :error="form.errors.actual_quantity"
                        />
                    </div>

                    <Input
                        v-model="form.notes"
                        label="备注"
                        placeholder="请输入备注信息"
                    />

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit('/sorting')">
                            取消
                        </Button>
                        <Button type="submit" :loading="form.processing">
                            保存
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
