<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import {
    BuildingOffice2Icon,
    ShoppingCartIcon,
    BellAlertIcon,
    ClipboardDocumentListIcon,
    PlusIcon,
    EyeIcon,
    TruckIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
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
import Button from '../../Components/Button.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const page = usePage()

const stats = computed(() => page.props.stats || {
    totalGreenhouses: 0,
    todayOrders: 0,
    activeAlerts: 0,
    sortingTasks: 0,
})

const environmentTrendData = computed(() => ({
    labels: page.props.environmentTrend?.labels || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
        {
            label: '温度 (°C)',
            data: page.props.environmentTrend?.temperature || [22, 24, 23, 25, 26, 24, 23],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
        },
        {
            label: '湿度 (%)',
            data: page.props.environmentTrend?.humidity || [65, 68, 70, 67, 64, 66, 69],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
        },
    ],
}))

const environmentTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
    },
    scales: {
        y: {
            beginAtZero: false,
        },
    },
    interaction: {
        intersect: false,
        mode: 'index',
    },
}

const recentAlerts = computed(() => page.props.recentAlerts || [])

const statCards = [
    {
        title: '大棚总数',
        icon: BuildingOffice2Icon,
        value: 'totalGreenhouses',
        color: 'text-primary',
        iconBg: 'bg-primary/10',
    },
    {
        title: '今日订单',
        icon: ShoppingCartIcon,
        value: 'todayOrders',
        color: 'text-success',
        iconBg: 'bg-success/10',
    },
    {
        title: '活跃告警',
        icon: BellAlertIcon,
        value: 'activeAlerts',
        color: 'text-danger',
        iconBg: 'bg-danger/10',
    },
    {
        title: '分拣中任务',
        icon: ClipboardDocumentListIcon,
        value: 'sortingTasks',
        color: 'text-warning',
        iconBg: 'bg-warning/10',
    },
]

const getAlertLevelColor = (level) => {
    const colors = {
        high: 'red',
        medium: 'yellow',
        low: 'blue',
    }
    return colors[level] || 'gray'
}

const getAlertLevelText = (level) => {
    const texts = {
        high: '严重',
        medium: '警告',
        low: '提示',
    }
    return texts[level] || level
}
</script>

<template>
    <AppLayout title="Dashboard">
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    v-for="card in statCards"
                    :key="card.title"
                    class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
                            <p class="mt-1 text-2xl font-bold text-gray-900">
                                {{ stats[card.value] }}
                            </p>
                        </div>
                        <div :class="['p-3 rounded-lg', card.iconBg || 'bg-gray-100']">
                            <component :is="card.icon" :class="['w-6 h-6', card.color || 'text-gray-600']" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">环境趋势（最近7天）</h3>
                        <div class="flex items-center gap-1 text-sm text-gray-500">
                            <ArrowTrendingUpIcon class="w-4 h-4 text-success mr-1" />
                            <span class="text-success">温度正常</span>
                            <ArrowTrendingDownIcon class="w-4 h-4 text-info ml-3 mr-1" />
                            <span class="text-info">湿度稳定</span>
                        </div>
                    </div>
                    <div class="h-72">
                        <Line :data="environmentTrendData" :options="environmentTrendOptions" />
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">最新异常告警</h3>
                    <div class="space-y-3">
                        <div
                            v-for="alert in recentAlerts"
                            :key="alert.id"
                            class="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <StatusBadge :color="getAlertLevelColor(alert.level)" dot size="sm">
                                        {{ getAlertLevelText(alert.level) }}
                                    </StatusBadge>
                                    <span class="text-sm font-medium text-gray-900 truncate">{{ alert.message }}</span>
                                </div>
                                <p class="text-xs text-gray-500">{{ alert.greenhouse_name }} · {{ alert.created_at }}</p>
                            </div>
                        </div>
                        <div v-if="recentAlerts.length === 0" class="text-center py-8 text-gray-500 text-sm">
                            暂无告警
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button @click="router.visit('/orders/create')" class="justify-start">
                        <PlusIcon class="w-5 h-5 mr-2" />
                        新建订单
                    </Button>
                    <Button variant="secondary" @click="router.visit('/sorting')" class="justify-start">
                        <EyeIcon class="w-5 h-5 mr-2" />
                        查看分拣
                    </Button>
                    <Button variant="success" @click="router.visit('/shipping')" class="justify-start">
                        <TruckIcon class="w-5 h-5 mr-2" />
                        安排发货
                    </Button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
