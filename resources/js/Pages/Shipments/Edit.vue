<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const shipment = computed(() => page.props.shipment)
const orders = computed(() => page.props.orders || [])

const form = useForm({
    order_id: shipment.value?.order_id || '',
    logistics_provider: shipment.value?.logistics_provider || '',
    tracking_no: shipment.value?.tracking_no || '',
    status: shipment.value?.status || 'pending',
    shipped_at: shipment.value?.shipped_at || '',
    estimated_delivery: shipment.value?.estimated_delivery || '',
    recipient_name: shipment.value?.recipient_name || '',
    recipient_phone: shipment.value?.recipient_phone || '',
    recipient_address: shipment.value?.recipient_address || '',
    notes: shipment.value?.notes || '',
})

const orderOptions = computed(() =>
    orders.value.map((o) => ({ value: o.id, label: `${o.order_no} - ${o.customer_name}` }))
)

const logisticsOptions = [
    { value: 'sf', label: '顺丰速运' },
    { value: 'yt', label: '圆通速递' },
    { value: 'zt', label: '中通快递' },
    { value: 'yd', label: '韵达速递' },
    { value: 'ems', label: 'EMS' },
    { value: 'jd', label: '京东物流' },
    { value: 'other', label: '其他' },
]

const statusOptions = [
    { value: 'pending', label: '待发货' },
    { value: 'picked', label: '已揽收' },
    { value: 'in_transit', label: '运输中' },
    { value: 'delivered', label: '已签收' },
    { value: 'failed', label: '派送失败' },
    { value: 'returned', label: '已退回' },
]

const getLogisticsText = (value) => {
    const option = logisticsOptions.find((o) => o.value === value)
    return option?.label || value
}

const submit = () => {
    form.put(route('shipping.update', shipment.value.id), {
        onSuccess: () => router.visit('/shipping'),
    })
}
</script>

<template>
    <AppLayout title="编辑发货单">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit('/shipping')" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">编辑发货信息</h2>
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
                            v-model="form.logistics_provider"
                            label="物流公司"
                            :options="logisticsOptions"
                            :error="form.errors.logistics_provider"
                            required
                        />
                        <Input
                            v-model="form.tracking_no"
                            label="物流跟踪号"
                            placeholder="请输入跟踪号"
                            :error="form.errors.tracking_no"
                            required
                        />
                        <Select
                            v-model="form.status"
                            label="发货状态"
                            :options="statusOptions"
                            :error="form.errors.status"
                            required
                        />
                        <Input
                            v-model="form.shipped_at"
                            type="datetime-local"
                            label="发货时间"
                            :error="form.errors.shipped_at"
                            required
                        />
                        <Input
                            v-model="form.estimated_delivery"
                            type="date"
                            label="预计送达日期"
                            :error="form.errors.estimated_delivery"
                        />
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">收件人信息</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                v-model="form.recipient_name"
                                label="收件人姓名"
                                placeholder="请输入收件人姓名"
                                :error="form.errors.recipient_name"
                                required
                            />
                            <Input
                                v-model="form.recipient_phone"
                                label="收件人电话"
                                placeholder="请输入收件人电话"
                                :error="form.errors.recipient_phone"
                                required
                            />
                            <div class="md:col-span-2">
                                <Input
                                    v-model="form.recipient_address"
                                    label="收件地址"
                                    placeholder="请输入收件地址"
                                    :error="form.errors.recipient_address"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <Input
                            v-model="form.notes"
                            label="备注"
                            placeholder="请输入备注信息"
                        />
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit('/shipping')">
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
