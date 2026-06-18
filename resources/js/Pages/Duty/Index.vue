<script setup>
import { computed, ref } from 'vue'
import { Link } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    schedules: Object,
    weekStart: String,
    weekEnd: String,
})

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const currentWeek = ref(new Date())

const getWeekDays = () => {
    const days = []
    const start = new Date(props.weekStart)
    for (let i = 0; i < 7; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        days.push({
            date: date.toISOString().split('T')[0],
            dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
            dayNum: date.getDate(),
            isToday: date.toDateString() === new Date().toDateString(),
        })
    }
    return days
}

const getDutyForDate = (date) => {
    return props.schedules.data?.filter(s => s.date === date) || []
}

const getTypeBadgeClass = (type) => {
    const classes = {
        primary: 'bg-blue-100 text-blue-800',
        backup: 'bg-yellow-100 text-yellow-800',
        on_call: 'bg-gray-100 text-gray-800',
    }
    return classes[type] || 'bg-gray-100 text-gray-800'
}

const getTypeText = (type) => {
    const texts = {
        primary: '主班',
        backup: '备班',
        on_call: '待命',
    }
    return texts[type] || type
}

const weekDays = getWeekDays()
</script>

<template>
    <Layout title="值班安排">
        <div class="mb-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <Link
                    :href="route('duty.index', { week: weekStart, offset: -1 })"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <span class="text-lg font-medium text-gray-900">
                    {{ weekStart }} ~ {{ weekEnd }}
                </span>
                <Link
                    :href="route('duty.index', { week: weekStart, offset: 1 })"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <Link
                    :href="route('duty.index')"
                    class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                    本周
                </Link>
            </div>
            <div class="flex space-x-2">
                <Link
                    :href="route('duty.my')"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    我的值班
                </Link>
                <Link
                    v-if="isAdmin"
                    :href="route('duty.create')"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    安排值班
                </Link>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="grid grid-cols-7 border-b border-gray-200">
                <div
                    v-for="day in weekDays"
                    :key="day.date"
                    class="p-3 text-center border-r border-gray-200 last:border-r-0"
                    :class="day.isToday ? 'bg-blue-50' : ''"
                >
                    <div class="text-xs text-gray-500">{{ day.dayName }}</div>
                    <div class="text-lg font-bold" :class="day.isToday ? 'text-blue-600' : 'text-gray-900'">{{ day.dayNum }}</div>
                </div>
            </div>
            <div class="grid grid-cols-7 min-h-96">
                <div
                    v-for="day in weekDays"
                    :key="day.date"
                    class="p-2 border-r border-gray-200 last:border-r-0 min-h-96"
                    :class="day.isToday ? 'bg-blue-50' : ''"
                >
                    <div v-if="getDutyForDate(day.date).length === 0" class="text-center text-gray-400 text-xs py-4">
                        暂无值班
                    </div>
                    <div v-else class="space-y-2">
                        <div
                            v-for="duty in getDutyForDate(day.date)"
                            :key="duty.id"
                            class="p-2 rounded-md border"
                            :class="duty.type === 'primary' ? 'bg-blue-50 border-blue-200' : duty.type === 'backup' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'"
                        >
                            <div class="flex items-center justify-between mb-1">
                                <span :class="getTypeBadgeClass(duty.type)" class="px-2 py-0.5 text-xs font-medium rounded-full">
                                    {{ getTypeText(duty.type) }}
                                </span>
                                <Link
                                    v-if="isAdmin"
                                    :href="route('duty.edit', duty.id)"
                                    class="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    编辑
                                </Link>
                            </div>
                            <div class="text-sm font-medium text-gray-900">{{ duty.user?.name }}</div>
                            <div class="text-xs text-gray-500">{{ duty.user?.phone }}</div>
                            <div v-if="duty.notes" class="text-xs text-gray-500 mt-1">{{ duty.notes }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6 bg-white rounded-lg shadow p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-3">值班类型说明</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span class="text-sm text-gray-600">主班：主要负责人，必须在岗</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span class="text-sm text-gray-600">备班：替补人员，随叫随到</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span class="text-sm text-gray-600">待命：远程支持，可兼职</span>
                </div>
            </div>
        </div>
    </Layout>
</template>
