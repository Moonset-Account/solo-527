<script setup>
defineProps({
    success: Boolean,
    order: Object,
    message: String,
})
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-lg mx-auto px-4 py-12">
            <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div
                    class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    :class="success ? 'bg-green-100' : 'bg-red-100'"
                >
                    <svg
                        v-if="success"
                        class="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg
                        v-else
                        class="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h2
                    class="text-2xl font-bold mb-2"
                    :class="success ? 'text-gray-900' : 'text-gray-900'"
                >
                    {{ success ? '支付成功' : '支付失败' }}
                </h2>
                <p class="text-gray-600 mb-8">{{ message }}</p>

                <div class="bg-gray-50 rounded-xl p-4 mb-8 text-left">
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">工单号</span>
                            <span class="font-medium text-gray-900">{{ order.order_no }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">服务项目</span>
                            <span class="font-medium text-gray-900">{{ order.service_item?.name }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">车牌号码</span>
                            <span class="font-medium text-gray-900">{{ order.vehicle?.plate_number }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">支付金额</span>
                            <span class="font-bold text-red-500">¥{{ order.total_amount }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">支付状态</span>
                            <span
                                class="font-medium"
                                :class="order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'unpaid' ? 'text-red-500' : 'text-yellow-600'"
                            >
                                {{ order.payment_status === 'paid' ? '已支付' : order.payment_status === 'pending' ? '待支付' : '未支付' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <a
                        v-if="!success"
                        :href="`/booking/pay/${order.id}`"
                        class="block w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        重新支付
                    </a>
                    <a
                        href="/booking/create"
                        class="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        返回预约
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>
