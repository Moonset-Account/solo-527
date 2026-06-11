<script setup>
import { useForm } from '@inertiajs/vue3'
import { computed } from 'vue'

const props = defineProps({
    services: Array,
    available_slots: Array,
})

const form = useForm({
    plate_number: '',
    make: '',
    model: '',
    year: '',
    color: '',
    owner_name: '',
    owner_phone: '',
    service_item_id: '',
    scheduled_time: '',
    payment_method: 'wechat',
})

const selectedService = computed(() => {
    return props.services.find(s => s.id == form.service_item_id)
})

const paymentMethods = [
    { id: 'wechat', name: '微信支付', icon: '💚' },
    { id: 'alipay', name: '支付宝', icon: '💙' },
    { id: 'cash', name: '到店支付', icon: '💴' },
]

const submit = () => {
    form.post('/booking')
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-2xl mx-auto px-4 py-12">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900">在线预约洗车</h1>
                <p class="mt-2 text-gray-600">填写以下信息完成预约</p>
            </div>

            <form @submit.prevent="submit" class="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="p-6 space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">车辆信息</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">车牌号 <span class="text-red-500">*</span></label>
                                <input v-model="form.plate_number" type="text" placeholder="例: 京A12345" class="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                <p v-if="form.errors.plate_number" class="mt-1 text-sm text-red-600">{{ form.errors.plate_number }}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                                <input v-model="form.make" type="text" placeholder="例: 宝马" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">型号</label>
                                <input v-model="form.model" type="text" placeholder="例: 3系" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                                <input v-model="form.color" type="text" placeholder="例: 白色" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">年份</label>
                                <input v-model="form.year" type="number" placeholder="例: 2023" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">车主信息</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">车主姓名 <span class="text-red-500">*</span></label>
                                <input v-model="form.owner_name" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                                <p v-if="form.errors.owner_name" class="mt-1 text-sm text-red-600">{{ form.errors.owner_name }}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 <span class="text-red-500">*</span></label>
                                <input v-model="form.owner_phone" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                                <p v-if="form.errors.owner_phone" class="mt-1 text-sm text-red-600">{{ form.errors.owner_phone }}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">服务信息</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">服务项目 <span class="text-red-500">*</span></label>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <label
                                        v-for="service in services"
                                        :key="service.id"
                                        class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                                        :class="form.service_item_id == service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'"
                                    >
                                        <input type="radio" :value="service.id" v-model="form.service_item_id" class="text-blue-600" />
                                        <div class="ml-3">
                                            <span class="text-sm font-medium text-gray-900">{{ service.name }}</span>
                                            <span class="ml-2 text-xs text-gray-500">¥{{ service.price }}</span>
                                            <span v-if="service.duration_minutes" class="ml-1 text-xs text-gray-400">/ {{ service.duration_minutes }}分钟</span>
                                        </div>
                                    </label>
                                </div>
                                <p v-if="form.errors.service_item_id" class="mt-1 text-sm text-red-600">{{ form.errors.service_item_id }}</p>
                            </div>

                            <div v-if="available_slots && available_slots.length > 0">
                                <label class="block text-sm font-medium text-gray-700 mb-2">预约时间 <span class="text-red-500">*</span></label>
                                <div class="space-y-3">
                                    <div v-for="day in available_slots" :key="day.date" class="border border-gray-200 rounded-lg p-3">
                                        <p class="text-sm font-medium text-gray-700 mb-2">{{ day.date }} {{ day.day_name }}</p>
                                        <div class="flex flex-wrap gap-2">
                                            <button
                                                v-for="slot in day.slots"
                                                :key="slot.datetime"
                                                type="button"
                                                :disabled="!slot.available"
                                                @click="form.scheduled_time = slot.datetime"
                                                class="px-3 py-1 text-xs rounded-lg border transition-colors"
                                                :class="[
                                                    form.scheduled_time === slot.datetime ? 'bg-blue-600 text-white border-blue-600' : slot.available ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                ]"
                                            >
                                                {{ slot.time }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="form.errors.scheduled_time" class="mt-1 text-sm text-red-600">{{ form.errors.scheduled_time }}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">支付方式</h3>
                        <div class="grid grid-cols-3 gap-3">
                            <label
                                v-for="method in paymentMethods"
                                :key="method.id"
                                class="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all"
                                :class="form.payment_method === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'"
                            >
                                <input type="radio" :value="method.id" v-model="form.payment_method" class="sr-only" />
                                <span class="text-2xl mb-2">{{ method.icon }}</span>
                                <span class="text-sm font-medium text-gray-900">{{ method.name }}</span>
                            </label>
                        </div>
                        <p v-if="form.errors.payment_method" class="mt-1 text-sm text-red-600">{{ form.errors.payment_method }}</p>
                    </div>
                </div>

                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div v-if="selectedService" class="text-sm text-gray-600">
                            合计: <span class="text-lg font-bold text-gray-900">¥{{ selectedService.price }}</span>
                        </div>
                        <div v-else></div>
                        <button type="submit" :disabled="form.processing" class="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            <span v-if="form.processing">提交中...</span>
                            <span v-else>提交预约</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>
