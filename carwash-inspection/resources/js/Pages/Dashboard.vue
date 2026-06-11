<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../Layouts/AppLayout.vue'
import StatusLabel from '../Components/StatusLabel.vue'

defineProps({
  stats: {
    type: Object,
    default: () => ({
      today_order_count: 0,
      in_progress_count: 0,
      completed_count: 0,
      no_show_count: 0,
    }),
  },
  recent_orders: {
    type: Array,
    default: () => [],
  },
  station_status: {
    type: Array,
    default: () => [],
  },
})

const statCards = (stats) => [
  {
    label: '今日工单',
    value: stats.today_order_count,
    icon: 'orders',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
  },
  {
    label: '进行中',
    value: stats.in_progress_count,
    icon: 'progress',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    valueColor: 'text-indigo-700',
  },
  {
    label: '已完成',
    value: stats.completed_count,
    icon: 'completed',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    valueColor: 'text-green-700',
  },
  {
    label: '爽约',
    value: stats.no_show_count,
    icon: 'noshow',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    valueColor: 'text-red-700',
  },
]
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p class="mt-1 text-sm text-gray-500">今日运营概览</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="card in statCards(stats)" :key="card.label" :class="card.bgColor" class="rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">{{ card.label }}</p>
              <p :class="card.valueColor" class="mt-1 text-3xl font-bold">{{ card.value }}</p>
            </div>
            <div :class="card.bgColor" class="p-3 rounded-lg">
              <svg v-if="card.icon === 'orders'" :class="card.iconColor" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <svg v-else-if="card.icon === 'progress'" :class="card.iconColor" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <svg v-else-if="card.icon === 'completed'" :class="card.iconColor" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else-if="card.icon === 'noshow'" :class="card.iconColor" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">最近工单</h2>
            <Link href="/work-orders" class="text-sm text-blue-600 hover:text-blue-700 font-medium">查看全部</Link>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单号</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">车牌</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务项目</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">技师</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预约时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="recent_orders.length === 0">
                  <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">暂无工单数据</td>
                </tr>
                <tr v-for="order in recent_orders" :key="order.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-3.5 text-sm font-medium text-blue-600">
                    <Link :href="`/work-orders/${order.id}`">{{ order.order_no || order.id }}</Link>
                  </td>
                  <td class="px-6 py-3.5 text-sm text-gray-900">{{ order.plate_number || '-' }}</td>
                  <td class="px-6 py-3.5 text-sm text-gray-600">{{ order.service_name || '-' }}</td>
                  <td class="px-6 py-3.5 text-sm text-gray-600">{{ order.technician_name || '-' }}</td>
                  <td class="px-6 py-3.5">
                    <StatusLabel :status="order.status" />
                  </td>
                  <td class="px-6 py-3.5 text-sm text-gray-500">{{ order.appointment_time || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">工位状态</h2>
          </div>
          <div class="p-6 space-y-3">
            <div v-if="station_status.length === 0" class="text-center text-sm text-gray-500 py-4">
              暂无工位数据
            </div>
            <div v-for="station in station_status" :key="station.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
              <div class="flex items-center gap-3">
                <div :class="station.is_occupied ? 'bg-indigo-100' : 'bg-green-100'" class="w-10 h-10 rounded-lg flex items-center justify-center">
                  <svg :class="station.is_occupied ? 'text-indigo-600' : 'text-green-600'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ station.name }}</p>
                  <p v-if="station.current_order" class="text-xs text-gray-500">{{ station.current_order.plate_number }} · {{ station.current_order.service_name }}</p>
                  <p v-else class="text-xs text-gray-400">空闲</p>
                </div>
              </div>
              <span :class="station.is_occupied ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                {{ station.is_occupied ? '使用中' : '空闲' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
