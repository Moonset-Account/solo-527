<script setup lang="ts">
import { computed } from 'vue'
import { X, User, Phone, Clock, FileText, DollarSign } from 'lucide-vue-next'
import { useAppointmentsStore } from '@/stores/appointments'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps<{ appointmentId: string }>()
const emit = defineEmits<{ close: [] }>()
const appointmentsStore = useAppointmentsStore()

const visible = defineModel<boolean>('visible', { default: false })

const appointment = computed(() =>
  appointmentsStore.appointments.find((a) => a.id === props.appointmentId) || appointmentsStore.currentAppointment,
)

const statusVariantMap: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'info', confirmed: 'success', in_progress: 'warning', completed: 'success', cancelled: 'danger', no_show: 'danger',
}
const statusLabelMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', in_progress: '进行中', completed: '已完成', cancelled: '已取消', no_show: '未到店',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="visible && appointment" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="visible = false" />
        <div class="relative w-full max-w-lg bg-white shadow-xl overflow-auto">
          <div class="sticky top-0 bg-white border-b border-rosegold/10 px-6 py-4 flex items-center justify-between">
            <h3 class="text-base font-medium text-gray-900">预约详情</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="visible = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-rosegold/10 flex items-center justify-center">
                <User class="w-6 h-6 text-rosegold" />
              </div>
              <div>
                <h4 class="text-base font-medium text-gray-800">{{ appointment.customerName }}</h4>
                <p class="text-sm text-grayrose">{{ appointment.customerPhone }}</p>
              </div>
              <StatusBadge :variant="statusVariantMap[appointment.status]" :label="statusLabelMap[appointment.status]" class="ml-auto" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4 text-rosegold" />
                <span class="text-sm text-grayrose">{{ appointment.appointmentDate }} {{ appointment.appointmentTime }}</span>
              </div>
              <div class="flex items-center gap-2">
                <User class="w-4 h-4 text-rosegold" />
                <span class="text-sm text-grayrose">{{ appointment.consultantName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-rosegold" />
                <span class="text-sm font-medium text-gray-800">¥{{ appointment.totalAmount }}</span>
              </div>
            </div>

            <div>
              <h5 class="text-sm font-medium text-gray-800 mb-3">服务项目</h5>
              <div class="space-y-2">
                <div
                  v-for="item in appointment.items"
                  :key="item.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-warmwhite"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ item.serviceName }}</p>
                    <p class="text-xs text-grayrose">{{ item.productName }} × {{ item.quantity }}</p>
                  </div>
                  <span class="text-sm font-medium text-gray-800">¥{{ item.subtotal }}</span>
                </div>
              </div>
            </div>

            <div v-if="appointment.notes">
              <h5 class="text-sm font-medium text-gray-800 mb-2">备注</h5>
              <p class="text-sm text-grayrose bg-warmwhite p-3 rounded-lg">{{ appointment.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
