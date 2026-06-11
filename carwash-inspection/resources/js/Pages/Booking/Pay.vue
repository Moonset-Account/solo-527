<script setup>
import { useForm } from '@inertiajs/vue3'

const props = defineProps({
    order: Object,
})

const form = useForm({
    payment_method: props.order.payment_method || 'wechat',
})

const paymentMethods = [
    { id: 'wechat', name: '微信支付', icon: '💚', desc: '微信扫码支付' },
    { id: 'alipay', name: '支付宝', icon: '💙', desc: '支付宝快捷支付' },
    { id: 'cash', name: '到店支付', icon: '💴', desc: '到店后现金或刷卡' },
]

const submitPayment = () => {
    form.post(`/booking/pay/${props.order.id}/confirm`)
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-lg mx-auto px-4 py-12">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900">订单支付</h1>
                <p class="mt-2 text-gray-600">请选择支付方式完成支付</p>
            </div>

            <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                <div class="p-6 border-b border-gray-100">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">订单信息</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">工单号</span>
                            <span class="font-medium text-gray-900">{{ order.order_no }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">服务项目</span>
                            <span class="font-medium text-gray-900">{{ order.service_item?.name }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">车牌号码</span>
                            <span class="font-medium text-gray-900">{{ order.vehicle?.plate_number }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">预约时间</span>
                            <span class="font-medium text-gray-900">{{ order.scheduled_time }}</span>
                        </div>
                        <div class="pt-3 border-t border-gray-100 flex justify-between">
                            <span class="text-gray-700 font-medium">支付金额</span>
                            <span class="text-2xl font-bold text-red-500">¥{{ order.total_amount }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">选择支付方式</h3>
                    <div class="space-y-3">
                        <label
                            v-for="method in paymentMethods"
                            :key="method.id"
                            class="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all"
                            :class="form.payment_method === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'"
                        >
                            <input
                                type="radio"
                                :value="method.id"
                                v-model="form.payment_method"
                                class="sr-only"
                            />
                            <span class="text-3xl mr-4">{{ method.icon }}</span>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">{{ method.name }}</p>
                                <p class="text-sm text-gray-500">{{ method.desc }}</p>
                            </div>
                            <div
                                class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                :class="form.payment_method === method.id ? 'border-blue-500' : 'border-gray-300'"
                            >
                                <div
                                    v-if="form.payment_method === method.id"
                                    class="w-3 h-3 rounded-full bg-blue-500"
                                ></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <button
                @click="submitPayment"
                :disabled="form.processing"
                class="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
                <span v-if="form.processing" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                </span>
                <span v-else>
                    {{ form.payment_method === 'cash' ? '确认预约' : '立即支付' }} ¥{{ order.total_amount }}
                </span>
            </button>

            <div class="mt-6 text-center">
                <a
                    href="/booking/create"
                    class="text-sm text-gray-500 hover:text-gray-700"
                >
                    ← 返回预约页面
                </a>
            </div>
        </div>
    </div>
</template>
