<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed, watch } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const greenhouses = computed(() => page.props.greenhouses || [])
const orders = computed(() => page.props.orders || [])
const sortingTasks = computed(() => page.props.sortingTasks || [])
const shippers = computed(() => page.props.shippers || [])

const form = useForm({
    order_id: '',
    sorting_task_id: '',
    greenhouse_id: '',
    logistics_company: '',
    tracking_no: '',
    shipment_date: '',
    estimated_arrival: '',
    actual_arrival: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    status: 'pending',
    weight: '',
    packages: '',
    remark: '',
})

const greenhouseOptions = computed(() =>
    greenhouses.value.map((g) => ({ value: g.id, label: g.name }))
)
const orderOptions = computed(() =>
    orders.value.map((o) => ({ value: o.id, label: `${o.order_no} - ${o.customer_name}` }))
)
const sortingTaskOptions = computed(() =>
    sortingTasks.value.map((s) => ({ value: s.id, label: s.task_no }))
)
const shipperOptions = computed(() =>
    shippers.value.map((s) => ({ value: s.id, label: s.name }))
)

const logisticsOptions = [
    { value: '顺丰速运', label: '顺丰速运' },
    { value: '圆通速递', label: '圆通速递' },
    { value: '中通快递', label: '中通快递' },
    { value: '韵达速递', label: '韵达速递' },
    { value: 'EMS', label: 'EMS' },
    { value: '京东物流', label: '京东物流' },
    { value: '其他', label: '其他' },
]

const statusOptions = [
    { value: 'pending', label: '待发货' },
    { value: 'picked', label: '已揽收' },
    { value: 'transit', label: '运输中' },
    { value: 'delivered', label: '已签收' },
    { value: 'returned', label: '已退回' },
    { value: 'cancelled', label: '已取消' },
]

watch(() => form.order_id, (orderId) => {
    const order = orders.value.find((o) => o.id == orderId)
    if (order) {
        form.receiver_name = order.customer_name || form.receiver_name
        form.receiver_phone = order.customer_phone || form.receiver_phone
        form.receiver_address = order.customer_address || form.receiver_address
    }
})

const submit = () => {
    form.post(route('shipments.store'), {
        onSuccess: () => router.visit(route('shipments.index')),
    })
}
</script>

<template>
    <AppLayout title="新建发货单">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('shipments.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
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
                            v-model="form.sorting_task_id"
                            label="关联分拣任务"
                            :options="[{ value: '', label: '无' }, ...sortingTaskOptions]"
                            :error="form.errors.sorting_task_id"
                        />
                        <Select
                            v-model="form.greenhouse_id"
                            label="来源大棚"
                            :options="greenhouseOptions"
                            :error="form.errors.greenhouse_id"
                            required
                        />
                        <Select
                            v-model="form.status"
                            label="发货状态"
                            :options="statusOptions"
                            :error="form.errors.status"
                            required
                        />
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">物流信息</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                v-model="form.logistics_company"
                                label="物流公司"
                                :options="logisticsOptions"
                                :error="form.errors.logistics_company"
                                required
                            />
                            <Input
                                v-model="form.tracking_no"
                                label="物流跟踪号"
                                placeholder="请输入跟踪号"
                                :error="form.errors.tracking_no"
                            />
                            <Input
                                v-model="form.shipment_date"
                                type="date"
                                label="发货日期"
                                :error="form.errors.shipment_date"
                                required
                            />
                            <Input
                                v-model="form.estimated_arrival"
                                type="date"
                                label="预计到达日期"
                                :error="form.errors.estimated_arrival"
                            />
                            <Input
                                v-model="form.actual_arrival"
                                type="date"
                                label="实际到达日期"
                                :error="form.errors.actual_arrival"
                            />
                            <Input
                                v-model="form.weight"
                                type="number"
                                label="重量(kg)"
                                :error="form.errors.weight"
                            />
                            <Input
                                v-model="form.packages"
                                type="number"
                                label="包裹数"
                                :error="form.errors.packages"
                            />
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">收件人信息</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                v-model="form.receiver_name"
                                label="收件人姓名"
                                placeholder="请输入收件人姓名"
                                :error="form.errors.receiver_name"
                                required
                            />
                            <Input
                                v-model="form.receiver_phone"
                                label="收件人电话"
                                placeholder="请输入收件人电话"
                                :error="form.errors.receiver_phone"
                                required
                            />
                            <div class="md:col-span-2">
                                <Input
                                    v-model="form.receiver_address"
                                    label="收件地址"
                                    placeholder="请输入收件地址"
                                    :error="form.errors.receiver_address"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <Input
                            v-model="form.remark"
                            label="备注"
                            placeholder="请输入备注信息"
                        />
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit(route('shipments.index'))">
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
