<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const order = computed(() => page.props.order)
const greenhouses = computed(() => page.props.greenhouses || [])

const form = useForm({
    customer_name: order.value?.customer_name || '',
    customer_phone: order.value?.customer_phone || '',
    customer_address: order.value?.customer_address || '',
    product_name: order.value?.product_name || '',
    product_spec: order.value?.product_spec || '',
    quantity: order.value?.quantity || '',
    unit: order.value?.unit || 'kg',
    unit_price: order.value?.unit_price || '',
    greenhouse_id: order.value?.greenhouse_id || '',
    expected_delivery_date: order.value?.expected_delivery_date || '',
    status: order.value?.status || 'pending',
    payment_status: order.value?.payment_status || 'unpaid',
    remark: order.value?.remark || '',
})

const productOptions = [
    { value: 'tomato', label: '番茄' },
    { value: 'cucumber', label: '黄瓜' },
    { value: 'pepper', label: '辣椒' },
    { value: 'lettuce', label: '生菜' },
    { value: 'strawberry', label: '草莓' },
]

const greenhouseOptions = computed(() =>
    greenhouses.value.map((g) => ({ value: g.id, label: g.name }))
)

const statusOptions = [
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'sorting', label: '分拣中' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
]

const paymentStatusOptions = [
    { value: 'unpaid', label: '未付款' },
    { value: 'partial', label: '部分付款' },
    { value: 'paid', label: '已付款' },
]

const submit = () => {
    form.put(route('orders.update', order.value.id), {
        onSuccess: () => router.visit(route('orders.index')),
    })
}
</script>

<template>
    <AppLayout title="编辑订单">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('orders.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">编辑订单</h2>
                <form @submit.prevent="submit" class="space-y-6">
                    <div>
                        <h3 class="text-sm font-medium text-gray-700 mb-3">客户信息</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                v-model="form.customer_name"
                                label="客户名称"
                                placeholder="请输入客户名称"
                                :error="form.errors.customer_name"
                                required
                            />
                            <Input
                                v-model="form.customer_phone"
                                label="联系电话"
                                placeholder="请输入联系电话"
                                :error="form.errors.customer_phone"
                                required
                            />
                            <div class="md:col-span-2">
                                <Input
                                    v-model="form.customer_address"
                                    label="收货地址"
                                    placeholder="请输入收货地址"
                                    :error="form.errors.customer_address"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">产品信息</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                v-model="form.product_name"
                                label="产品名称"
                                placeholder="请输入产品名称"
                                :error="form.errors.product_name"
                                required
                            />
                            <Input
                                v-model="form.product_spec"
                                label="产品规格"
                                placeholder="请输入产品规格"
                                :error="form.errors.product_spec"
                            />
                            <Select
                                v-model="form.greenhouse_id"
                                label="来源大棚"
                                :options="greenhouseOptions"
                                :error="form.errors.greenhouse_id"
                                required
                            />
                            <Input
                                v-model="form.unit"
                                label="计量单位"
                                placeholder="如：kg, 箱"
                                :error="form.errors.unit"
                            />
                            <Input
                                v-model="form.quantity"
                                type="number"
                                label="数量"
                                placeholder="请输入数量"
                                :error="form.errors.quantity"
                                required
                            />
                            <Input
                                v-model="form.unit_price"
                                type="number"
                                step="0.01"
                                label="单价"
                                placeholder="请输入单价"
                                :error="form.errors.unit_price"
                                required
                            />
                            <Input
                                v-model="form.expected_delivery_date"
                                type="date"
                                label="预计发货日期"
                                :error="form.errors.expected_delivery_date"
                                required
                            />
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">订单状态</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                v-model="form.status"
                                label="订单状态"
                                :options="statusOptions"
                                :error="form.errors.status"
                                required
                            />
                            <Select
                                v-model="form.payment_status"
                                label="付款状态"
                                :options="paymentStatusOptions"
                                :error="form.errors.payment_status"
                                required
                            />
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
                        <Button variant="secondary" type="button" @click="router.visit(route('orders.index'))">
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
