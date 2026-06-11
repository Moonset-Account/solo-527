<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import PaymentStatus from '../../Components/PaymentStatus.vue'
import { ref } from 'vue'

const props = defineProps({
    orders: Object,
    filters: Object,
})

const filterForm = useForm({
    payment_status: props.filters.payment_status || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
})

const showModal = ref(false)
const showStatusModal = ref(false)
const editingOrder = ref(null)

const createForm = useForm({
    work_order_id: '',
    vehicle_id: '',
    service_item_id: '',
    amount: '',
    payment_method: '',
    payment_status: 'unpaid',
    notes: '',
})

const statusForm = useForm({
    payment_status: '',
    payment_method: '',
})

const filter = () => {
    filterForm.get('/cashier-orders', { preserveState: true, preserveScroll: true })
}

const resetFilter = () => {
    filterForm.reset()
    filterForm.get('/cashier-orders')
}

const openCreate = () => {
    createForm.reset()
    createForm.clearErrors()
    showModal.value = true
}

const openStatusModal = (order) => {
    editingOrder.value = order
    statusForm.payment_status = order.payment_status
    statusForm.payment_method = order.payment_method || ''
    statusForm.clearErrors()
    showStatusModal.value = true
}

const submitCreate = () => {
    createForm.post('/cashier-orders', {
        onSuccess: () => { showModal.value = false },
    })
}

const submitStatus = () => {
    statusForm.put(`/cashier-orders/${editingOrder.value.id}`, {
        onSuccess: () => { showStatusModal.value = false },
    })
}
</script>

<template>
    <AppLayout title="收银管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">收银管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增收银单
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">支付状态</label>
                        <select v-model="filterForm.payment_status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option value="unpaid">未支付</option>
                            <option value="partial">部分支付</option>
                            <option value="paid">已支付</option>
                            <option value="refunded">已退款</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input v-model="filterForm.date_from" type="date" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input v-model="filterForm.date_to" type="date" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div class="flex items-end gap-2">
                        <button @click="filter" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">查询</button>
                        <button @click="resetFilter" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">重置</button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">单号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">关联工单</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车牌</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">服务项目</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">金额</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">支付方式</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">支付状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作员</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="order in orders.data" :key="order.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-gray-900">{{ order.order_no }}</td>
                                <td class="px-4 py-3">
                                    <Link v-if="order.work_order" :href="`/work-orders/${order.work_order.id}`" class="text-blue-600">{{ order.work_order.order_no }}</Link>
                                    <span v-else>-</span>
                                </td>
                                <td class="px-4 py-3">{{ order.vehicle?.plate_number || '-' }}</td>
                                <td class="px-4 py-3">{{ order.service_item?.name || '-' }}</td>
                                <td class="px-4 py-3 font-medium">¥{{ order.amount }}</td>
                                <td class="px-4 py-3">{{ order.payment_method || '-' }}</td>
                                <td class="px-4 py-3"><PaymentStatus :status="order.payment_status" /></td>
                                <td class="px-4 py-3">{{ order.operator_name || '-' }}</td>
                                <td class="px-4 py-3">
                                    <button @click="openStatusModal(order)" class="text-blue-600 hover:text-blue-800">更新状态</button>
                                </td>
                            </tr>
                            <tr v-if="orders.data.length === 0">
                                <td colspan="9" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="orders.links && orders.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ orders.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in orders.links"
                            :key="link.label"
                            :href="link.url || '#'"
                            :class="[link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', !link.url ? 'pointer-events-none opacity-50' : '', 'px-3 py-1 text-sm rounded border border-gray-300']"
                            v-html="link.label"
                            @click.prevent="link.url && router.visit(link.url)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <Modal :show="showModal" @close="showModal = false" max-width="2xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">新增收银单</h3>
            <form @submit.prevent="submitCreate" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">关联工单ID</label>
                        <input v-model="createForm.work_order_id" type="number" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">车辆ID</label>
                        <input v-model="createForm.vehicle_id" type="number" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">服务项目ID</label>
                        <input v-model="createForm.service_item_id" type="number" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">金额 <span class="text-red-500">*</span></label>
                        <input v-model="createForm.amount" type="number" step="0.01" min="0" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        <p v-if="createForm.errors.amount" class="mt-1 text-sm text-red-600">{{ createForm.errors.amount }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                        <select v-model="createForm.payment_method" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">请选择</option>
                            <option value="cash">现金</option>
                            <option value="wechat">微信</option>
                            <option value="alipay">支付宝</option>
                            <option value="card">银行卡</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">支付状态</label>
                        <select v-model="createForm.payment_status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="unpaid">未支付</option>
                            <option value="paid">已支付</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea v-model="createForm.notes" rows="2" class="w-full rounded-lg border-gray-300 text-sm shadow-sm"></textarea>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="createForm.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">创建</button>
                </div>
            </form>
        </Modal>

        <Modal :show="showStatusModal" @close="showStatusModal = false">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">更新支付状态</h3>
            <form @submit.prevent="submitStatus" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">支付状态 <span class="text-red-500">*</span></label>
                    <select v-model="statusForm.payment_status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                        <option value="unpaid">未支付</option>
                        <option value="partial">部分支付</option>
                        <option value="paid">已支付</option>
                        <option value="refunded">已退款</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                    <select v-model="statusForm.payment_method" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                        <option value="">请选择</option>
                        <option value="cash">现金</option>
                        <option value="wechat">微信</option>
                        <option value="alipay">支付宝</option>
                        <option value="card">银行卡</option>
                    </select>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showStatusModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="statusForm.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">更新</button>
                </div>
            </form>
        </Modal>
    </AppLayout>
</template>
