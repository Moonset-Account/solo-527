<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useAppointmentsStore } from '@/stores/appointments'
import AppointmentDetail from '@/components/appointments/AppointmentDetail.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const detailVisible = ref(true)

const appointmentId = computed(() => route.params.id as string)

onMounted(async () => {
  await appointmentsStore.fetchAppointment(appointmentId.value)
  detailVisible.value = true
})

function handleClose() {
  detailVisible.value = false
  router.push('/appointments')
}

const statusVariantMap: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'info', confirmed: 'success', in_progress: 'warning', completed: 'success', cancelled: 'danger', no_show: 'danger',
}
const statusLabelMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', in_progress: '进行中', completed: '已完成', cancelled: '已取消', no_show: '未到店',
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <button class="p-2 rounded-lg hover:bg-rosegold/5 text-grayrose hover:text-rosegold transition-colors" @click="router.push('/appointments')">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-xl font-semibold text-gray-800">预约详情</h1>
    </div>
    <div v-if="appointmentsStore.currentAppointment" class="bg-white rounded-xl border border-rosegold/10 p-6 space-y-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-medium text-gray-800">{{ appointmentsStore.currentAppointment.customerName }}</h2>
        <StatusBadge
          :variant="statusVariantMap[appointmentsStore.currentAppointment.status]"
          :label="statusLabelMap[appointmentsStore.currentAppointment.status]"
        />
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-warmwhite rounded-lg p-3">
          <p class="text-xs text-grayrose">预约时间</p>
          <p class="text-sm font-medium text-gray-800 mt-1">{{ appointmentsStore.currentAppointment.appointmentDate }} {{ appointmentsStore.currentAppointment.appointmentTime }}</p>
        </div>
        <div class="bg-warmwhite rounded-lg p-3">
          <p class="text-xs text-grayrose">顾问</p>
          <p class="text-sm font-medium text-gray-800 mt-1">{{ appointmentsStore.currentAppointment.consultantName }}</p>
        </div>
        <div class="bg-warmwhite rounded-lg p-3">
          <p class="text-xs text-grayrose">联系电话</p>
          <p class="text-sm font-medium text-gray-800 mt-1">{{ appointmentsStore.currentAppointment.customerPhone }}</p>
        </div>
        <div class="bg-warmwhite rounded-lg p-3">
          <p class="text-xs text-grayrose">总金额</p>
          <p class="text-sm font-medium text-rosegold mt-1">¥{{ appointmentsStore.currentAppointment.totalAmount }}</p>
        </div>
      </div>
      <div>
        <h3 class="text-sm font-medium text-gray-800 mb-3">服务项目</h3>
        <div class="space-y-2">
          <div v-for="item in appointmentsStore.currentAppointment.items" :key="item.id" class="flex items-center justify-between p-3 bg-warmwhite rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ item.serviceName }}</p>
              <p class="text-xs text-grayrose">{{ item.productName }} × {{ item.quantity }}</p>
            </div>
            <span class="text-sm font-medium text-gray-800">¥{{ item.subtotal }}</span>
          </div>
        </div>
      </div>
      <div v-if="appointmentsStore.currentAppointment.notes">
        <h3 class="text-sm font-medium text-gray-800 mb-2">备注</h3>
        <p class="text-sm text-grayrose bg-warmwhite p-3 rounded-lg">{{ appointmentsStore.currentAppointment.notes }}</p>
      </div>
    </div>
  </div>
</template>
