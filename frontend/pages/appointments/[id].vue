<template>
  <div class="appointment-detail-page space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <n-button text size="small" @click="handleBack">
          <template #icon>
            <n-icon size="18">
              <ChevronBackSharp />
            </n-icon>
          </template>
          返回列表
        </n-button>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">订单详情</h1>
          <p class="text-sm text-gray-500 mt-1">订单号：<span class="font-mono text-primary">{{ appointment?.orderNo }}</span></p>
        </div>
      </div>
      <div class="flex items-center gap-2" v-if="appointment">
        <n-button size="small">
          <template #icon>
            <n-icon size="16">
              <PrintSharp />
            </n-icon>
          </template>
          打印
        </n-button>
        <n-button size="small" type="primary">
          <template #icon>
            <n-icon size="16">
              <CreateSharp />
            </n-icon>
          </template>
          编辑订单
        </n-button>
      </div>
    </div>

    <template v-if="appointment">
      <n-card class="!rounded-2xl !border-0" content-style="padding: 24px;">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
              :style="{
                backgroundColor: statusColorMap[appointment.status] + '15',
                color: statusColorMap[appointment.status],
                border: `1px solid ${statusColorMap[appointment.status]}30`,
              }"
            >
              {{ statusLabelMap[appointment.status] }}
            </span>
            <span class="text-sm text-gray-500">下单时间：{{ appointment.createdAt }}</span>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">实付金额</div>
            <div class="text-2xl font-bold text-primary">¥{{ appointment.paidAmount }}</div>
          </div>
        </div>

        <div class="relative">
          <div class="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full"></div>
          <div
            class="absolute top-5 left-0 h-1 rounded-full transition-all duration-500"
            :style="{ width: progressWidth + '%', backgroundColor: '#1A8A7D' }"
          ></div>
          <div class="relative flex justify-between">
            <div
              v-for="(step, index) in progressSteps"
              :key="step.key"
              class="flex flex-col items-center"
              :style="{ width: (100 / progressSteps.length) + '%' }"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-300"
                :style="{
                  backgroundColor: index <= currentProgressIndex ? '#1A8A7D' : '#F3F4F6',
                  color: index <= currentProgressIndex ? '#FFFFFF' : '#9CA3AF',
                  boxShadow: index <= currentProgressIndex ? '0 4px 12px rgba(26, 138, 125, 0.3)' : 'none',
                }"
              >
                <n-icon :size="18">
                  <component :is="step.icon" />
                </n-icon>
              </div>
              <div
                class="text-sm mt-2 font-medium"
                :class="index <= currentProgressIndex ? 'text-gray-800' : 'text-gray-400'"
              >
                {{ step.label }}
              </div>
              <div class="text-xs text-gray-400 mt-1" v-if="step.time">
                {{ step.time }}
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <n-card class="!rounded-2xl !border-0 xl:col-span-2" title="基本信息" content-style="padding: 20px;">
          <div class="space-y-5">
            <div>
              <div class="text-xs text-gray-500 mb-2">客户信息</div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div
                  class="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium"
                  style="background: linear-gradient(135deg, #1A8A7D 0%, #2AA89A 100%);"
                >
                  {{ appointment.customer.name.charAt(0) }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-800">{{ appointment.customer.name }}</span>
                    <n-tag size="small" type="success" round>{{ appointment.customer.memberLevel }}会员</n-tag>
                  </div>
                  <div class="text-sm text-gray-500 mt-0.5">{{ appointment.customer.phone }}</div>
                </div>
              </div>
            </div>

            <div>
              <div class="text-xs text-gray-500 mb-2">宠物信息</div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div
                  class="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg"
                  style="background: linear-gradient(135deg, #FF8C42 0%, #FFA56B 100%);"
                >
                  🐾
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ appointment.pet.name }}</div>
                  <div class="text-sm text-gray-500 mt-0.5">
                    {{ appointment.pet.breed }} · {{ appointment.pet.gender }} · {{ appointment.pet.age }}岁 · {{ appointment.pet.weight }}kg
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div class="text-xs text-gray-500 mb-2">服务套餐</div>
              <div class="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-800">{{ appointment.packageName }}</div>
                    <div class="text-sm text-gray-500 mt-0.5">服务类型：{{ appointment.serviceType }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-primary">¥{{ appointment.paidAmount }}</div>
                    <div class="text-xs text-gray-400 line-through" v-if="appointment.discount > 0">
                      原价 ¥{{ appointment.amount }}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-500 mt-2" v-if="appointment.staffName">
                  服务人员：<span class="text-gray-700">{{ appointment.staffName }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500">预约时间</div>
                <div class="text-sm font-medium text-gray-800 mt-1">{{ appointment.appointmentTime }}</div>
              </div>
              <div class="p-3 rounded-xl bg-gray-50">
                <div class="text-xs text-gray-500">支付方式</div>
                <div class="text-sm font-medium text-gray-800 mt-1">{{ appointment.paymentMethod || '未支付' }}</div>
              </div>
              <div class="p-3 rounded-xl bg-gray-50" v-if="appointment.checkInTime">
                <div class="text-xs text-gray-500">到店时间</div>
                <div class="text-sm font-medium text-gray-800 mt-1">{{ appointment.checkInTime }}</div>
              </div>
              <div class="p-3 rounded-xl bg-gray-50" v-if="appointment.completeTime">
                <div class="text-xs text-gray-500">完成时间</div>
                <div class="text-sm font-medium text-gray-800 mt-1">{{ appointment.completeTime }}</div>
              </div>
            </div>

            <div v-if="appointment.note" class="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div class="flex items-start gap-2">
                <n-icon size="16" color="#F59E0B">
                  <AlertCircleSharp />
                </n-icon>
                <div>
                  <div class="text-xs font-medium text-amber-800">客户备注</div>
                  <div class="text-sm text-amber-700 mt-0.5">{{ appointment.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </n-card>

        <div class="xl:col-span-3 space-y-6">
          <n-card class="!rounded-2xl !border-0" title="服务记录" content-style="padding: 20px;">
            <template v-if="appointment.serviceRecords.length > 0">
              <div class="space-y-3">
                <div
                  v-for="(record, idx) in appointment.serviceRecords"
                  :key="record.id"
                  class="flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-md"
                  :class="record.status === 'completed' ? 'bg-teal-50/60' : record.status === 'in_progress' ? 'bg-blue-50/60' : 'bg-gray-50'"
                >
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    :style="{
                      backgroundColor: record.status === 'completed' ? 'rgba(26, 138, 125, 0.15)' : record.status === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                    }"
                  >
                    <n-icon
                      :size="16"
                      :color="record.status === 'completed' ? '#1A8A7D' : record.status === 'in_progress' ? '#3B82F6' : '#9CA3AF'"
                    >
                      <component :is="record.status === 'completed' ? CheckmarkCircleSharp : record.status === 'in_progress' ? TimeSharp : EllipseSharp" />
                    </n-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-800">{{ record.serviceName }}</span>
                        <n-tag
                          size="small"
                          round
                          :type="record.status === 'completed' ? 'success' : record.status === 'in_progress' ? 'info' : 'default'"
                        >
                          {{ record.status === 'completed' ? '已完成' : record.status === 'in_progress' ? '进行中' : '待开始' }}
                        </n-tag>
                      </div>
                      <span class="text-sm text-gray-500">步骤 {{ idx + 1 }}/{{ appointment.serviceRecords.length }}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ record.staffName }} · {{ record.startTime }}
                      <span v-if="record.endTime"> ~ {{ record.endTime }}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-2" v-if="record.note">
                      {{ record.note }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="py-12 text-center text-gray-400">
              <n-icon size="40"><ListSharp /></n-icon>
              <div class="text-sm mt-2">暂无服务记录</div>
            </div>
          </n-card>

          <n-card
            class="!rounded-2xl !border-0"
            title="洗护照片"
            content-style="padding: 20px;"
          >
            <template #header-extra>
              <n-button text size="tiny" style="color: #1A8A7D;">
                上传照片
                <template #icon>
                  <n-icon size="14">
                    <AddCircleSharp />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <template v-if="appointment.photos.length > 0">
              <n-grid :cols="4" :x-gap="12" :y-gap="12">
                <n-grid-item v-for="(photo, idx) in appointment.photos" :key="idx">
                  <div
                    class="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
                    @click="previewPhoto(photo)"
                  >
                    <img
                      :src="photo"
                      :alt="`照片${idx + 1}`"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <n-icon size="24" color="white" class="opacity-0 group-hover:opacity-100 transition-opacity">
                        <EyeSharp />
                      </n-icon>
                    </div>
                  </div>
                </n-grid-item>
              </n-grid>
            </template>
            <div v-else class="py-12 text-center text-gray-400">
              <n-icon size="40"><ImagesSharp /></n-icon>
              <div class="text-sm mt-2">暂无洗护照片</div>
            </div>
          </n-card>

          <n-card
            class="!rounded-2xl !border-0"
            title="售后处理"
            content-style="padding: 20px;"
            :class="appointment.afterSaleRequests.length > 0 ? '!border !border-red-100' : ''"
          >
            <template v-if="appointment.afterSaleRequests.length > 0">
              <div class="space-y-4">
                <div
                  v-for="as in appointment.afterSaleRequests"
                  :key="as.id"
                  class="p-4 rounded-xl bg-red-50/60 border border-red-100"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <n-icon size="18" color="#EF4444">
                        <AlertCircleSharp />
                      </n-icon>
                      <span class="font-medium text-gray-800">
                        {{ as.type === 'refund' ? '退款申请' : as.type === 'exchange' ? '换货/重服务' : '投诉' }}
                      </span>
                      <n-tag
                        size="small"
                        round
                        :style="{
                          backgroundColor: afterSaleStatusMap[as.status].color + '15',
                          color: afterSaleStatusMap[as.status].color,
                          border: `1px solid ${afterSaleStatusMap[as.status].color}30`,
                        }"
                      >
                        {{ afterSaleStatusMap[as.status].label }}
                      </n-tag>
                    </div>
                    <span class="text-xs text-gray-400">{{ as.createdAt }}</span>
                  </div>
                  <div class="text-sm text-gray-600 mb-2">
                    <span class="text-gray-500">原因：</span>{{ as.reason }}
                  </div>
                  <div class="text-sm text-gray-600 bg-white/60 p-3 rounded-lg">
                    {{ as.description }}
                  </div>
                  <div v-if="as.result" class="mt-3 text-sm text-gray-600 bg-teal-50/60 p-3 rounded-lg border border-teal-100">
                    <div class="text-xs text-gray-500 mb-1">处理结果 · {{ as.handler }} · {{ as.handledAt }}</div>
                    {{ as.result }}
                  </div>
                  <div v-if="as.status === 'pending' || as.status === 'processing'" class="flex gap-2 mt-4">
                    <n-input
                      v-model:value="afterSaleRemark"
                      placeholder="请输入处理结果..."
                      size="small"
                      class="flex-1"
                    />
                    <n-button size="small" type="success" @click="handleAfterSale(as.id, 'resolved')">
                      同意解决
                    </n-button>
                    <n-button size="small" @click="handleAfterSale(as.id, 'rejected')">
                      拒绝
                    </n-button>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="py-8 text-center text-gray-400">
              <n-icon size="36"><ShieldCheckmarkSharp /></n-icon>
              <div class="text-sm mt-2">该订单暂无售后记录</div>
            </div>
          </n-card>
        </div>
      </div>

      <n-card class="!rounded-2xl !border-0" title="操作日志" content-style="padding: 20px;">
        <div class="relative pl-2">
          <div class="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
          <div class="space-y-5">
            <div
              v-for="(log, idx) in appointment.logs"
              :key="log.id"
              class="relative flex gap-3"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm"
                :class="idx === 0 ? 'bg-primary text-white' : 'bg-white border border-gray-200'"
              >
                <n-icon :size="16" :color="idx === 0 ? '#FFFFFF' : '#9CA3AF'">
                  <component :is="getLogIcon(log.action)" />
                </n-icon>
              </div>
              <div class="flex-1 pb-1 pt-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-800">{{ log.user }}</span>
                  <span class="text-sm text-gray-600">{{ log.action }}</span>
                </div>
                <div class="text-sm text-gray-500 mt-0.5">{{ log.target }}</div>
                <div class="text-sm text-gray-400 mt-1" v-if="log.remark">{{ log.remark }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ log.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </template>

    <n-empty v-else description="未找到该订单" />

    <n-image-group>
      <n-image
        v-for="(p, i) in previewPhotos"
        :key="i"
        :src="p"
        style="display: none;"
        :preview-src-list="previewPhotos"
      />
    </n-image-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronBackSharp,
  PrintSharp,
  CreateSharp,
  TimeSharp,
  CheckmarkCircleSharp,
  AlertCircleSharp,
  EyeSharp,
  AddCircleSharp,
  ListSharp,
  ImagesSharp,
  ShieldCheckmarkSharp,
  DocumentTextSharp,
  CheckmarkDoneSharp,
  RefreshSharp,
  CloseSharp,
  EllipseSharp,
} from '@vicons/ionicons5'
import {
  useAppointmentsStore,
  statusLabelMap,
  statusColorMap,
  afterSaleStatusMap,
  type Appointment,
  type OrderStatus,
} from '~/stores/appointments'

const route = useRoute()
const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const message = useMessage()

const appointment = ref<Appointment | null>(null)
const afterSaleRemark = ref('')
const previewPhotos = ref<string[]>([])

const progressSteps = computed(() => [
  { key: 'created', label: '订单创建', icon: DocumentTextSharp, time: appointment.value?.createdAt },
  { key: 'confirmed', label: '订单确认', icon: CheckmarkDoneSharp, time: getLogTime('确认订单') },
  { key: 'in_service', label: '服务中', icon: RefreshSharp, time: getLogTime('开始服务') },
  { key: 'completed', label: '已完成', icon: CheckmarkCircleSharp, time: getLogTime('完成服务') || appointment.value?.completeTime },
])

const currentProgressIndex = computed(() => {
  const order = appointment.value
  if (!order) return -1
  const statusMap: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 1,
    in_service: 2,
    completed: 3,
    after_sale: 3,
    cancelled: -1,
  }
  return statusMap[order.status] ?? -1
})

const progressWidth = computed(() => {
  if (currentProgressIndex.value < 0) return 0
  const total = progressSteps.value.length - 1
  return Math.min(100, (currentProgressIndex.value / total) * 100)
})

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      appointment.value = appointmentsStore.getAppointmentById(String(id)) || null
      previewPhotos.value = appointment.value?.photos || []
    }
  },
  { immediate: true }
)

function handleBack() {
  router.push('/appointments')
}

function getLogTime(action: string): string | undefined {
  const log = appointment.value?.logs.find((l) => l.action.includes(action))
  return log?.time
}

function getLogIcon(action: string) {
  if (action.includes('创建')) return AddCircleSharp
  if (action.includes('确认')) return CheckmarkDoneSharp
  if (action.includes('开始')) return RefreshSharp
  if (action.includes('完成')) return CheckmarkCircleSharp
  if (action.includes('取消')) return CloseSharp
  if (action.includes('售后')) return AlertCircleSharp
  if (action.includes('变更')) return CreateSharp
  return DocumentTextSharp
}

function previewPhoto(url: string) {
  const idx = previewPhotos.value.indexOf(url)
  if (idx >= 0) {
    const img = document.querySelectorAll('.n-image')[idx] as HTMLImageElement | null
    img?.click()
  }
}

function handleAfterSale(afterSaleId: string, result: 'resolved' | 'rejected') {
  if (!afterSaleRemark.value.trim()) {
    message.warning('请输入处理结果说明')
    return
  }
  appointmentsStore.handleAfterSale(afterSaleId, result, afterSaleRemark.value)
  message.success(result === 'resolved' ? '售后已解决' : '售后已拒绝')
  afterSaleRemark.value = ''
  if (appointment.value) {
    appointment.value = appointmentsStore.getAppointmentById(appointment.value.id) || null
  }
}
</script>

<style scoped>
.appointment-detail-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
