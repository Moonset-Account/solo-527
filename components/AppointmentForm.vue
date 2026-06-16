<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="emit('close')" />
      <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">新建预约</h3>
          <button class="p-1 hover:bg-gray-100 rounded" @click="emit('close')">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form class="p-6 space-y-5" @submit.prevent="submit">
          <div>
            <label class="label">客户姓名 <span class="text-danger">*</span></label>
            <input v-model="form.customerName" type="text" class="input" required />
          </div>

          <div>
            <label class="label">联系电话</label>
            <input v-model="form.customerPhone" type="tel" class="input" />
          </div>

          <div>
            <label class="label">车辆 <span class="text-danger">*</span></label>
            <select v-model="form.vehicleId" class="select" required>
              <option value="" disabled>请选择车辆</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.plateNumber }}{{ v.brand ? ` - ${v.brand}` : '' }}{{ v.model ? ` ${v.model}` : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">服务类型 <span class="text-danger">*</span></label>
            <select v-model="form.serviceType" class="select" required>
              <option value="" disabled>请选择服务类型</option>
              <option value="WASH">洗车</option>
              <option value="MAINTENANCE">保养</option>
              <option value="TEST_DRIVE">试驾</option>
            </select>
          </div>

          <div>
            <label class="label">预约时间 <span class="text-danger">*</span></label>
            <input v-model="form.scheduledAt" type="datetime-local" class="input" required />
          </div>

          <div>
            <label class="label">负责人 <span class="text-danger">*</span></label>
            <select v-model="form.assigneeId" class="select" required>
              <option value="" disabled>请选择负责人</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>

          <div>
            <label class="label">备注</label>
            <textarea v-model="form.notes" class="input" rows="3" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary flex-1" :disabled="submitting">
              {{ submitting ? '提交中...' : '创建预约' }}
            </button>
            <button type="button" class="btn-secondary" @click="emit('close')">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface VehicleItem {
  id: string
  plateNumber: string
  brand?: string | null
  model?: string | null
}

interface UserItem {
  id: string
  name: string
}

const props = defineProps<{
  visible: boolean
  vehicles: VehicleItem[]
  users: UserItem[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const defaultForm = () => ({
  customerName: '',
  customerPhone: '',
  vehicleId: '',
  serviceType: '',
  scheduledAt: '',
  assigneeId: '',
  notes: '',
})

const form = ref(defaultForm())
const submitting = ref(false)

watch(() => props.visible, (val) => {
  if (val) form.value = defaultForm()
})

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await $fetch('/api/appointments', {
      method: 'POST',
      body: {
        ...form.value,
        storeId: 'default-store',
      },
    })
    if ((res as any)?.success) {
      emit('saved')
    }
  } finally {
    submitting.value = false
  }
}
</script>
