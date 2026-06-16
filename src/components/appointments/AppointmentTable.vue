<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '@/stores/appointments'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const statusFilter = ref('')

const statusVariantMap: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
}
const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到店',
}

const filteredAppointments = computed(() => {
  if (!statusFilter.value) return appointmentsStore.appointments
  return appointmentsStore.appointments.filter((a) => a.status === statusFilter.value)
})
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 overflow-hidden">
    <div class="p-4 border-b border-rosegold/10">
      <div class="flex items-center gap-3">
        <select
          v-model="statusFilter"
          class="px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite text-grayrose"
        >
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
          <option value="no_show">未到店</option>
        </select>
      </div>
    </div>
    <div class="overflow-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-rosegold/10 bg-warmwhite">
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">预约编号</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">客户</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">顾问</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">日期</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">时间</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-grayrose">金额</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">状态</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="apt in filteredAppointments"
            :key="apt.id"
            class="border-b border-rosegold/5 hover:bg-rosegold/[0.02] transition-colors"
          >
            <td class="px-4 py-3 text-sm font-medium text-rosegold">{{ apt.id }}</td>
            <td class="px-4 py-3 text-sm text-gray-800">{{ apt.customerName }}</td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ apt.consultantName }}</td>
            <td class="px-4 py-3 text-sm text-center text-grayrose">{{ apt.appointmentDate }}</td>
            <td class="px-4 py-3 text-sm text-center text-grayrose">{{ apt.appointmentTime }}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-800">¥{{ apt.totalAmount }}</td>
            <td class="px-4 py-3 text-center">
              <StatusBadge :variant="statusVariantMap[apt.status]" :label="statusLabelMap[apt.status]" />
            </td>
            <td class="px-4 py-3 text-center">
              <button
                class="text-xs text-rosegold hover:text-rosegold/80 transition-colors"
                @click="router.push(`/appointments/${apt.id}`)"
              >
                详情
              </button>
            </td>
          </tr>
          <tr v-if="filteredAppointments.length === 0">
            <td colspan="8" class="px-4 py-12 text-center text-sm text-grayrose/50">暂无预约数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
