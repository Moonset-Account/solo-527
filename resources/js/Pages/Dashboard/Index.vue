<script setup>
import { computed, onMounted, ref } from 'vue'
import { Link } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    stats: Object,
    recentAlerts: Array,
    todayDuty: Array,
    pendingApplications: Array,
})

const realtimeStats = ref(props.stats)

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const getLevelColor = (level) => {
    const colors = {
        critical: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
        debug: 'bg-gray-500',
    }
    return colors[level] || 'bg-gray-500'
}

const getStatusBadgeClass = (status) => {
    const classes = {
        open: 'bg-red-100 text-red-800',
        acknowledged: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        open: '待处理',
        acknowledged: '已确认',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭',
    }
    return texts[status] || status
}

const fetchRealtimeStats = async () => {
    try {
        const response = await axios.get(route('api.realtime-stats'))
        realtimeStats.value = response.data
    } catch (e) {
        // ignore
    }
}

onMounted(() => {
    setInterval(fetchRealtimeStats, 30000)
})
</script>

<template>
    <Layout title="仪表盘">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-red-500 rounded-md p-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">未处理告警</p>
                        <p class="text-2xl font-bold text-gray-900">{{ realtimeStats?.open_alerts || 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">严重告警</p>
                        <p class="text-2xl font-bold text-gray-900">{{ realtimeStats?.critical_alerts || 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">今日处理</p>
                        <p class="text-2xl font-bold text-gray-900">{{ realtimeStats?.today_resolved || 0 }}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">平均响应时间</p>
                        <p class="text-2xl font-bold text-gray-900">{{ realtimeStats?.avg_response_time || 0 }}分钟</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">最新告警</h3>
                        <Link :href="route('alerts.index')" class="text-sm text-blue-600 hover:text-blue-800">
                            查看全部
                        </Link>
                    </div>
                    <div class="divide-y divide-gray-200">
                        <div v-if="recentAlerts?.length === 0" class="px-4 py-8 text-center text-gray-500">
                            暂无告警
                        </div>
                        <div v-for="alert in recentAlerts" :key="alert.id" class="px-4 py-4 hover:bg-gray-50">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <span :class="getLevelColor(alert.level)" class="w-3 h-3 rounded-full"></span>
                                    <div>
                                        <Link :href="route('alerts.show', alert.id)" class="text-sm font-medium text-gray-900 hover:text-blue-600">
                                            {{ alert.title }}
                                        </Link>
                                        <p class="text-xs text-gray-500 mt-1">{{ alert.server_ip }} · {{ alert.service }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span :class="getStatusBadgeClass(alert.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                                        {{ getStatusText(alert.status) }}
                                    </span>
                                    <span class="text-xs text-gray-400">{{ alert.created_at }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">今日值班</h3>
                    </div>
                    <div class="px-4 py-4 space-y-3">
                        <div v-if="todayDuty?.length === 0" class="text-center text-gray-500 text-sm py-4">
                            暂无值班安排
                        </div>
                        <div v-for="duty in todayDuty" :key="duty.id" class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {{ duty.user?.name?.charAt(0)?.toUpperCase() }}
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ duty.user?.name }}</p>
                                    <p class="text-xs text-gray-500">{{ duty.user?.department }}</p>
                                </div>
                            </div>
                            <span class="px-2 py-1 text-xs font-medium rounded-full" :class="duty.type === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'">
                                {{ duty.type === 'primary' ? '主班' : duty.type === 'backup' ? '备班' : '待命' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="isAdmin" class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">待处理申请</h3>
                        <Link :href="route('account-applications.index')" class="text-sm text-blue-600 hover:text-blue-800">
                            查看全部
                        </Link>
                    </div>
                    <div class="px-4 py-4">
                        <div v-if="pendingApplications?.length === 0" class="text-center text-gray-500 text-sm py-4">
                            暂无待处理申请
                        </div>
                        <div v-for="app in pendingApplications" :key="app.id" class="py-2 border-b border-gray-100 last:border-0">
                            <Link :href="route('account-applications.show', app.id)" class="text-sm text-gray-900 hover:text-blue-600">
                                {{ app.applicant?.name }} - {{ app.application_type }}
                            </Link>
                            <p class="text-xs text-gray-500 mt-1">{{ app.created_at }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-4">
                    <h3 class="text-sm font-medium text-gray-700 mb-3">快捷操作</h3>
                    <div class="space-y-2">
                        <Link
                            :href="route('alerts.create')"
                            class="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 text-center"
                        >
                            提交告警
                        </Link>
                        <Link
                            :href="route('duty.my')"
                            class="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-center"
                        >
                            我的值班
                        </Link>
                        <Link
                            v-if="isAdmin"
                            :href="route('duty.create')"
                            class="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-center"
                        >
                            安排值班
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
</template>
