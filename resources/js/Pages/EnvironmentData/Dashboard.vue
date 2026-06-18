<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import {
    ArrowLeftIcon,
    ThermometerIcon,
    DropIcon,
    BeakerIcon,
    SunIcon,
    ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { Line, Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const page = usePage()

const greenhouseRealtimeData = computed(() => page.props.greenhouseRealtimeData || [])
const trend24hData = computed(() => page.props.trend24hData || {})
const anomalyStatsData = computed(() => page.props.anomalyStatsData || {})
const activeAlerts = computed(() => page.props.activeAlerts || [])

const generateTimeLabels = () => {
    const labels = []
    for (let i = 23; i >= 0; i--) {
        labels.push(`${i}:00`)
    }
    return labels
}

const trendChartData = computed(() => ({
    labels: trend24hData.value.labels || generateTimeLabels(),
    datasets: [
        {
            label: '温度 (°C)',
            data: trend24hData.value.temperature || Array(24).fill(0),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            tension: 0.4,
            yAxisID: 'y',
            fill: false,
        },
        {
            label: '湿度 (%)',
            data: trend24hData.value.humidity || Array(24).fill(0),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            tension: 0.4,
            yAxisID: 'y1',
            fill: false,
        },
        {
            label: '土壤水分 (%)',
            data: trend24hData.value.soilMoisture || Array(24).fill(0),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.05)',
            tension: 0.4,
            yAxisID: 'y1',
            fill: false,
        },
    ],
}))

const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top',
        },
    },
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: '温度 (°C)',
            },
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: '湿度/水分 (%)',
            },
            grid: {
                drawOnChartArea: false,
            },
        },
    },
}

const anomalyChartData = computed(() => ({
    labels: anomalyStatsData.value.labels || ['温度', '湿度', '土壤', '光照'],
    datasets: [
        {
            label: '异常次数',
            data: anomalyStatsData.value.counts || [5, 3, 2, 1],
            backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(234, 179, 8, 0.8)',
            ],
            borderRadius: 6,
        },
    ],
}))

const anomalyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1,
            },
        },
    },
}

const sensorCards = [
    {
        key: 'temperature',
        label: '温度',
        unit: '°C',
        icon: ThermometerIcon,
        color: 'text-danger',
        iconBg: 'bg-danger/10',
        min: 15,
        max: 30,
    },
    {
        key: 'humidity',
        label: '湿度',
        unit: '%',
        icon: DropIcon,
        color: 'text-info',
        iconBg: 'bg-info/10',
        min: 40,
        max: 85,
    },
    {
        key: 'soil_moisture',
        label: '土壤水分',
        unit: '%',
        icon: BeakerIcon,
        color: 'text-indigo-500',
        iconBg: 'bg-indigo-500/10',
        min: 30,
        max: 80,
    },
    {
        key: 'light',
        label: '光照',
        unit: 'lux',
        icon: SunIcon,
        color: 'text-warning',
        iconBg: 'bg-warning/10',
        min: 500,
        max: 50000,
    },
]
</script>

<template>
    <AppLayout title="环境监控看板">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit('/environment')" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回数据列表
            </Button>

            <div v-if="activeAlerts.length > 0" class="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3">
                <ExclamationTriangleIcon class="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                    <h4 class="font-medium text-danger">实时异常提示（{{ activeAlerts.length }}条）</h4>
                    <div class="mt-2 space-y-1">
                        <p v-for="alert in activeAlerts.slice(0, 3)" :key="alert.id" class="text-sm text-danger/90">
                            · {{ alert.greenhouse_name }}：{{ alert.message }}（{{ alert.created_at }}）
                        </p>
                        <p v-if="activeAlerts.length > 3" class="text-sm text-danger/70">
                            还有 {{ activeAlerts.length - 3 }} 条异常...
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">各大棚实时数据</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div
                        v-for="gh in greenhouseRealtimeData"
                        :key="gh.id"
                        class="bg-white rounded-xl border border-gray-200 p-5"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-900">{{ gh.name }}</h4>
                            <StatusBadge v-if="gh.has_anomaly" color="red" dot>异常</StatusBadge>
                            <StatusBadge v-else color="green" dot>正常</StatusBadge>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="sensor in sensorCards" :key="sensor.key" class="flex items-center gap-3">
                                <div :class="['p-2 rounded-lg', sensor.iconBg]">
                                    <component :is="sensor.icon" :class="['w-4 h-4', sensor.color]" />
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500">{{ sensor.label }}</p>
                                    <p :class="['text-sm font-medium', gh[sensor.key] < sensor.min || gh[sensor.key] > sensor.max ? 'text-danger' : 'text-gray-900']">
                                        {{ gh[sensor.key] }}{{ sensor.unit }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">24小时趋势图表</h3>
                    <div class="h-72">
                        <Line :data="trendChartData" :options="trendChartOptions" />
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">异常趋势统计</h3>
                    <div class="h-72">
                        <Bar :data="anomalyChartData" :options="anomalyChartOptions" />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
