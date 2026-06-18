<script setup>
import { usePage, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import {
    ArrowLeftIcon,
    PencilIcon,
    PaperClipIcon,
    PlusIcon,
    PaperAirplaneIcon,
    ClockIcon,
    UserIcon,
    ReceiptRefundIcon,
    WrenchIcon,
} from '@heroicons/vue/24/outline'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Badge from '../../Components/Badge.vue'
import Button from '../../Components/Button.vue'
import Input from '../../Components/Input.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const page = usePage()

const order = computed(() => page.props.order)
const comments = computed(() => page.props.comments || [])
const attachments = computed(() => page.props.attachments || [])
const auditLogs = computed(() => page.props.auditLogs || [])
const envTrendData = computed(() => page.props.envTrendData || {})
const subsidyVoucher = computed(() => page.props.subsidyVoucher)
const machineryAppointment = computed(() => page.props.machineryAppointment)

const commentForm = useForm({
    content: '',
})

const fileInputRef = ref(null)

const envChartData = computed(() => ({
    labels: envTrendData.value.labels || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
        {
            label: '温度 (°C)',
            data: envTrendData.value.temperature || [22, 24, 23, 25, 26, 24, 23],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
        },
        {
            label: '湿度 (%)',
            data: envTrendData.value.humidity || [65, 68, 70, 67, 64, 66, 69],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
        },
    ],
}))

const envChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                boxWidth: 12,
                padding: 15,
            },
        },
    },
    scales: {
        y: {
            beginAtZero: false,
        },
    },
}

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        confirmed: 'blue',
        sorting: 'yellow',
        shipped: 'indigo',
        completed: 'green',
        cancelled: 'red',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待确认',
        confirmed: '已确认',
        sorting: '分拣中',
        shipped: '已发货',
        completed: '已完成',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const getProductText = (product) => {
    const texts = {
        tomato: '番茄',
        cucumber: '黄瓜',
        pepper: '辣椒',
        lettuce: '生菜',
        strawberry: '草莓',
    }
    return texts[product] || product
}

const submitComment = () => {
    commentForm.post(route('comments.store', { commentableType: 'orders', commentableId: order.value.id }), {
        onSuccess: () => commentForm.reset(),
    })
}

const handleFileUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
        const formData = new FormData()
        Array.from(files).forEach((file) => formData.append('files[]', file))
        router.post(route('attachments.store', { attachableType: 'orders', attachableId: order.value.id }), formData, {
            onSuccess: () => {
                if (fileInputRef.value) fileInputRef.value.value = ''
            },
        })
    }
}
</script>

<template>
    <AppLayout :title="`订单详情 - ${order.order_no}`">
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button variant="ghost" @click="router.visit(route('orders.index'))" class="-ml-2">
                    <ArrowLeftIcon class="w-5 h-5 mr-2" />
                    返回列表
                </Button>
                <Button @click="router.visit(route('orders.edit', order.id))">
                    <PencilIcon class="w-5 h-5 mr-2" />
                    编辑订单
                </Button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900">{{ order.order_no }}</h2>
                                <p class="text-sm text-gray-500 mt-1">创建于 {{ order.created_at }}</p>
                            </div>
                            <StatusBadge :color="getStatusColor(order.status)" dot size="lg">
                                {{ getStatusText(order.status) }}
                            </StatusBadge>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <h3 class="text-sm font-medium text-gray-500 mb-2">客户信息</h3>
                                <div class="space-y-1.5 text-sm">
                                    <p class="font-medium text-gray-900">{{ order.customer_name }}</p>
                                    <p class="text-gray-600">{{ order.customer_phone }}</p>
                                    <p class="text-gray-600">{{ order.customer_address }}</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-gray-500 mb-2">产品信息</h3>
                                <div class="space-y-1.5 text-sm">
                                    <p class="text-gray-900">
                                        <span class="font-medium">产品：</span>{{ getProductText(order.product_name) }}
                                    </p>
                                    <p class="text-gray-900">
                                        <span class="font-medium">数量：</span>{{ order.quantity }} kg
                                    </p>
                                    <p class="text-gray-900">
                                        <span class="font-medium">单价：</span>¥{{ order.unit_price }}/kg
                                    </p>
                                    <p class="text-gray-900 font-semibold text-primary">
                                        总价：¥{{ (order.quantity * order.unit_price).toFixed(2) }}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-gray-500 mb-2">发货信息</h3>
                                <div class="space-y-1.5 text-sm">
                                    <p class="text-gray-900">
                                        <span class="font-medium">预计发货：</span>{{ order.expected_delivery_date || '-' }}
                                    </p>
                                    <p class="text-gray-900">
                                        <span class="font-medium">来源大棚：</span>{{ order.greenhouse?.name || '-' }}
                                    </p>
                                </div>
                            </div>
                            <div v-if="order.remark">
                                <h3 class="text-sm font-medium text-gray-500 mb-2">订单备注</h3>
                                <p class="text-sm text-gray-600">{{ order.remark }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">关联环境数据摘要（最近7天）</h3>
                        <div class="h-48">
                            <Line :data="envChartData" :options="envChartOptions" />
                        </div>
                    </div>

                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">附件</h3>
                            <label class="cursor-pointer">
                                <input
                                    ref="fileInputRef"
                                    type="file"
                                    multiple
                                    class="hidden"
                                    @change="handleFileUpload"
                                />
                                <Button variant="outline" size="sm">
                                    <PlusIcon class="w-4 h-4 mr-2" />
                                    上传附件
                                </Button>
                            </label>
                        </div>
                        <div v-if="attachments.length === 0" class="text-center py-8 text-gray-500 text-sm">
                            暂无附件
                        </div>
                        <div v-else class="space-y-2">
                            <div
                                v-for="attachment in attachments"
                                :key="attachment.id"
                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div class="flex items-center gap-3">
                                    <PaperClipIcon class="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">{{ attachment.name }}</p>
                                        <p class="text-xs text-gray-500">{{ attachment.size }} · {{ attachment.created_at }}</p>
                                    </div>
                                </div>
                                <a :href="attachment.url" class="text-sm text-primary hover:text-primary-dark">下载</a>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">备注</h3>
                        <div class="space-y-4">
                            <div v-if="comments.length === 0" class="text-center py-6 text-gray-500 text-sm">
                                暂无备注
                            </div>
                            <div
                                v-for="comment in comments"
                                :key="comment.id"
                                class="flex gap-3"
                            >
                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <UserIcon class="w-4 h-4 text-gray-500" />
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-gray-900">{{ comment.user_name }}</span>
                                        <span class="text-xs text-gray-500">{{ comment.created_at }}</span>
                                    </div>
                                    <p class="text-sm text-gray-700 mt-1">{{ comment.content }}</p>
                                </div>
                            </div>
                        </div>
                        <form @submit.prevent="submitComment" class="mt-4 flex gap-3">
                            <Input
                                v-model="commentForm.content"
                                placeholder="添加备注..."
                                class="flex-1"
                                :error="commentForm.errors.content"
                            />
                            <Button type="submit" :loading="commentForm.processing">
                                <PaperAirplaneIcon class="w-5 h-5" />
                            </Button>
                        </form>
                    </div>

                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">修改历史</h3>
                        <div class="relative">
                            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            <div class="space-y-4">
                                <div
                                    v-for="log in auditLogs"
                                    :key="log.id"
                                    class="relative pl-10"
                                >
                                    <div class="absolute left-2 top-1 w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                                        <ClockIcon class="w-2.5 h-2.5 text-primary" />
                                    </div>
                                    <div class="bg-gray-50 rounded-lg p-3">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-sm font-medium text-gray-900">{{ log.user_name }}</span>
                                            <span class="text-xs text-gray-500">{{ log.created_at }}</span>
                                            <Badge variant="primary" size="sm">{{ log.action }}</Badge>
                                        </div>
                                        <p class="text-sm text-gray-600">{{ log.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div v-if="subsidyVoucher" class="bg-white rounded-xl border border-gray-200 p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <ReceiptRefundIcon class="w-5 h-5 text-primary" />
                            <h3 class="text-lg font-semibold text-gray-900">补贴凭证</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">凭证号</span>
                                <span class="font-medium text-gray-900">{{ subsidyVoucher.voucher_no }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">类型</span>
                                <span class="text-gray-900">{{ subsidyVoucher.type }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">金额</span>
                                <span class="font-medium text-success">¥{{ subsidyVoucher.amount }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">状态</span>
                                <StatusBadge :color="subsidyVoucher.status === 'approved' ? 'green' : subsidyVoucher.status === 'rejected' ? 'red' : 'yellow'">
                                    {{ subsidyVoucher.status_text }}
                                </StatusBadge>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            class="w-full mt-4"
                            @click="router.visit(`/subsidies/${subsidyVoucher.id}`)"
                        >
                            查看详情
                        </Button>
                    </div>

                    <div v-if="machineryAppointment" class="bg-white rounded-xl border border-gray-200 p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <WrenchIcon class="w-5 h-5 text-warning" />
                            <h3 class="text-lg font-semibold text-gray-900">农机预约</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">预约号</span>
                                <span class="font-medium text-gray-900">{{ machineryAppointment.appointment_no }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">农机类型</span>
                                <span class="text-gray-900">{{ machineryAppointment.machinery_type }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">时间段</span>
                                <span class="text-gray-900">{{ machineryAppointment.time_slot }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">状态</span>
                                <StatusBadge :color="machineryAppointment.status === 'confirmed' ? 'green' : machineryAppointment.status === 'cancelled' ? 'red' : 'yellow'">
                                    {{ machineryAppointment.status_text }}
                                </StatusBadge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
