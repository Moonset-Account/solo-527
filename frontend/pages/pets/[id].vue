<template>
  <div class="pet-detail-page space-y-6">
    <div class="flex items-center gap-2 text-sm text-gray-500">
      <span class="cursor-pointer hover:text-primary transition-colors" @click="goBack">宠物档案</span>
      <n-icon size="14">
        <ChevronForwardSharp />
      </n-icon>
      <span class="text-gray-700 font-medium">{{ pet?.name || '加载中...' }}</span>
    </div>

    <div v-if="pet" class="flex flex-col lg:flex-row gap-5">
      <div class="w-full lg:w-80 flex-shrink-0">
        <n-card class="!rounded-2xl !border-0 sticky top-6" content-style="padding: 0;">
          <div class="relative bg-gradient-to-br from-primary/5 via-teal-50 to-emerald-50 p-6 pb-20">
            <div class="flex items-center justify-between">
              <n-button text size="small" @click="goBack">
                <template #icon>
                  <n-icon size="16">
                    <ArrowBackSharp />
                  </n-icon>
                </template>
                返回
              </n-button>
              <n-tag :type="petsStore.getHealthStatusType(pet.healthStatus)" size="medium" round>
                <template #icon>
                  <n-icon size="14">
                    <HeartSharp v-if="pet.healthStatus === 'healthy'" />
                    <AlertCircleSharp v-else-if="pet.healthStatus === 'attention'" />
                    <WarningSharp v-else />
                  </n-icon>
                </template>
                {{ petsStore.getHealthStatusLabel(pet.healthStatus) }}
              </n-tag>
            </div>
          </div>
          <div class="px-6 pb-6 -mt-14">
            <div class="relative w-28 h-28 mx-auto">
              <img
                :src="pet.avatar"
                :alt="pet.name"
                class="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div class="text-center mt-4">
              <h2 class="text-2xl font-bold text-gray-800">{{ pet.name }}</h2>
              <p class="text-sm text-gray-500 mt-1">{{ pet.breed }}</p>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-5">
              <div class="text-center p-3 rounded-xl bg-gray-50">
                <n-icon size="20" :color="pet.gender === 'male' ? '#3B82F6' : '#EC4899'">
                  <MaleSharp v-if="pet.gender === 'male'" />
                  <FemaleSharp v-else />
                </n-icon>
                <div class="text-xs text-gray-500 mt-1">{{ petsStore.getGenderLabel(pet.gender) }}</div>
              </div>
              <div class="text-center p-3 rounded-xl bg-gray-50">
                <n-icon size="20" color="#6B7280">
                  <TimeSharp />
                </n-icon>
                <div class="text-xs text-gray-500 mt-1">{{ pet.age }}{{ pet.ageUnit === 'year' ? '岁' : '个月' }}</div>
              </div>
              <div class="text-center p-3 rounded-xl bg-gray-50">
                <n-icon size="20" color="#F97316">
                  <PawSharp />
                </n-icon>
                <div class="text-xs text-gray-500 mt-1">{{ petsStore.getSpeciesLabel(pet.species) }}</div>
              </div>
            </div>

            <n-divider class="!my-5" />

            <div>
              <div class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                <n-icon size="16" color="#1A8A7D">
                  <PersonSharp />
                </n-icon>
                主人信息
              </div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-teal-50">
                <div class="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <n-icon size="22" color="#1A8A7D">
                    <PersonSharp />
                  </n-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-800">{{ pet.owner.name }}</div>
                  <div class="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <n-icon size="12" color="#9CA3AF">
                      <CallSharp />
                    </n-icon>
                    {{ pet.owner.phone }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="pet.description" class="mt-4">
              <div class="text-sm font-medium text-gray-700 mb-2">备注</div>
              <p class="text-sm text-gray-600 p-3 rounded-xl bg-gray-50 leading-relaxed">{{ pet.description }}</p>
            </div>

            <div class="flex gap-2 mt-5">
              <n-button block type="primary" size="medium">
                <template #icon>
                  <n-icon>
                    <CreateSharp />
                  </n-icon>
                </template>
                编辑档案
              </n-button>
              <n-button size="medium">
                <template #icon>
                  <n-icon>
                    <EllipsisHorizontalSharp />
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </n-card>
      </div>

      <div class="flex-1 min-w-0">
        <n-card class="!rounded-2xl !border-0" content-style="padding: 0;">
          <n-tabs v-model:value="activeTab" type="line" animated size="large" tab-style="padding: 20px 24px 0;">
            <n-tab-pane name="basic" tab="基本信息">
              <div class="p-6 pt-4 space-y-6">
                <div>
                  <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <n-icon size="18" color="#1A8A7D">
                      <InformationCircleSharp />
                    </n-icon>
                    基础档案
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="item in basicInfoList" :key="item.label" class="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors">
                      <div class="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <n-icon :size="18" :color="item.color">
                          <component :is="item.icon" />
                        </n-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs text-gray-500">{{ item.label }}</div>
                        <div class="text-sm font-medium text-gray-800 mt-0.5">{{ item.value || '-' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <n-icon size="18" color="#6366F1">
                      <BarChartSharp />
                    </n-icon>
                    服务统计
                  </h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50">
                      <div class="text-2xl font-bold text-primary">{{ pet.serviceRecords.length }}</div>
                      <div class="text-xs text-gray-600 mt-1">总服务次数</div>
                    </div>
                    <div class="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50">
                      <div class="text-2xl font-bold text-secondary">¥{{ totalSpent }}</div>
                      <div class="text-xs text-gray-600 mt-1">累计消费</div>
                    </div>
                    <div class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                      <div class="text-2xl font-bold text-blue-600">{{ pet.healthRecords.length }}</div>
                      <div class="text-xs text-gray-600 mt-1">健康记录</div>
                    </div>
                    <div class="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50">
                      <div class="text-2xl font-bold text-pink-600">{{ pet.photos.length }}</div>
                      <div class="text-xs text-gray-600 mt-1">照片数量</div>
                    </div>
                  </div>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="health" tab="健康记录">
              <div class="p-6 pt-4">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <n-icon size="18" color="#10B981">
                      <HeartPulseSharp />
                    </n-icon>
                    健康时间轴
                  </h3>
                  <n-button size="small" type="primary" ghost>
                    <template #icon>
                      <n-icon>
                        <AddSharp />
                      </n-icon>
                    </template>
                    添加记录
                  </n-button>
                </div>

                <div v-if="pet.healthRecords.length > 0" class="relative pl-1">
                  <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-gray-200"></div>
                  <div class="space-y-5">
                    <div
                      v-for="(record, index) in pet.healthRecords"
                      :key="record.id"
                      class="relative flex gap-4"
                    >
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-md border-2 border-white"
                        :class="getHealthRecordItemBg(record.type)"
                      >
                        <n-icon :size="18" :color="getHealthRecordItemColor(record.type)">
                          <component :is="getHealthRecordItemIcon(record.type)" />
                        </n-icon>
                      </div>
                      <div class="flex-1 pb-2">
                        <n-card class="!rounded-xl !border-0 hover:!shadow-md transition-all" content-style="padding: 16px 18px;">
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-semibold text-gray-800">{{ record.title }}</span>
                                <n-tag :type="getHealthRecordTagType(record.type)" size="small" round>
                                  {{ petsStore.getHealthRecordTypeLabel(record.type) }}
                                </n-tag>
                              </div>
                              <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ record.description }}</p>
                              <div class="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                <span v-if="record.doctor" class="flex items-center gap-1">
                                  <n-icon size="12">
                                    <PersonSharp />
                                  </n-icon>
                                  {{ record.doctor }}
                                </span>
                                <span class="flex items-center gap-1">
                                  <n-icon size="12">
                                    <CalendarSharp />
                                  </n-icon>
                                  {{ record.date }}
                                </span>
                                <span v-if="record.nextDate" class="flex items-center gap-1 text-secondary">
                                  <n-icon size="12">
                                    <AlarmSharp />
                                  </n-icon>
                                  下次: {{ record.nextDate }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </n-card>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="py-16 text-center">
                  <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <n-icon size="28" color="#9CA3AF">
                      <HeartPulseSharp />
                    </n-icon>
                  </div>
                  <p class="text-gray-500">暂无健康记录</p>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="photos" tab="照片墙">
              <div class="p-6 pt-4">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <n-icon size="18" color="#EC4899">
                      <ImagesSharp />
                    </n-icon>
                    照片墙
                    <span class="text-xs text-gray-400 font-normal">共 {{ pet.photos.length }} 张</span>
                  </h3>
                  <div class="flex items-center gap-2">
                    <n-upload
                      :show-file-list="false"
                      accept="image/*"
                      @before-upload="handlePhotoUpload"
                    >
                      <n-button size="small" type="primary">
                        <template #icon>
                          <n-icon>
                            <CloudUploadSharp />
                          </n-icon>
                        </template>
                        上传照片
                      </n-button>
                    </n-upload>
                  </div>
                </div>

                <div v-if="pet.photos.length > 0" class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                  <div
                    v-for="photo in pet.photos"
                    :key="photo.id"
                    class="break-inside-avoid group cursor-pointer"
                  >
                    <div class="relative rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                      <img
                        :src="photo.url"
                        :alt="photo.description || '宠物照片'"
                        class="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        :class="photo.serviceType ? 'h-48' : ''"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="absolute bottom-0 left-0 right-0 p-3">
                          <div v-if="photo.serviceType" class="flex items-center gap-1.5">
                            <n-tag size="small" round type="primary">
                              {{ photo.serviceType }}
                            </n-tag>
                          </div>
                          <p v-if="photo.description" class="text-white text-xs mt-2 line-clamp-2">{{ photo.description }}</p>
                          <p class="text-white/70 text-xs mt-1">{{ photo.uploadedAt }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="py-16 text-center">
                  <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <n-icon size="28" color="#9CA3AF">
                      <ImagesSharp />
                    </n-icon>
                  </div>
                  <p class="text-gray-500">暂无照片，上传第一张吧</p>
                  <n-upload
                    :show-file-list="false"
                    accept="image/*"
                    class="mt-4 inline-block"
                    @before-upload="handlePhotoUpload"
                  >
                    <n-button size="small" type="primary">
                      <template #icon>
                        <n-icon>
                          <CloudUploadSharp />
                        </n-icon>
                      </template>
                      上传照片
                    </n-button>
                  </n-upload>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="services" tab="服务历史">
              <div class="p-6 pt-4">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <n-icon size="18" color="#6366F1">
                      <FileTrayStackedSharp />
                    </n-icon>
                    历史服务订单
                  </h3>
                  <n-button size="small">
                    <template #icon>
                      <n-icon>
                        <DownloadSharp />
                      </n-icon>
                    </template>
                    导出记录
                  </n-button>
                </div>

                <n-data-table
                  :columns="serviceColumns"
                  :data="pet.serviceRecords"
                  :pagination="servicePagination"
                  :bordered="false"
                  size="medium"
                  class="service-table"
                />
              </div>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </div>
    </div>

    <div v-else class="py-20 text-center">
      <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <n-icon size="36" color="#9CA3AF">
          <HelpCircleSharp />
        </n-icon>
      </div>
      <p class="text-gray-500 mb-4">未找到该宠物档案</p>
      <n-button type="primary" size="small" @click="goBack">返回宠物列表</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import type { DataTableColumns } from 'naive-ui'
import type { Pet, HealthRecord, ServiceRecord, PetPhoto } from '~/stores/pets'
import {
  ChevronForwardSharp,
  ArrowBackSharp,
  HeartSharp,
  AlertCircleSharp,
  WarningSharp,
  MaleSharp,
  FemaleSharp,
  TimeSharp,
  PawSharp,
  PersonSharp,
  CallSharp,
  CreateSharp,
  EllipsisHorizontalSharp,
  InformationCircleSharp,
  BarChartSharp,
  HeartPulseSharp,
  AddSharp,
  CalendarSharp,
  AlarmSharp,
  ImagesSharp,
  CloudUploadSharp,
  FileTrayStackedSharp,
  DownloadSharp,
  HelpCircleSharp,
  MedicalSharp,
  BodySharp,
  BandageSharp,
  ScaleSharp,
  ColorFillSharp,
  SparklesSharp,
  CheckmarkCircleSharp,
  CloseCircleSharp,
  PrismSharp,
} from '@vicons/ionicons5'

const petsStore = usePetsStore()
const router = useRouter()
const route = useRoute()

const activeTab = ref('basic')
const pet = ref<Pet | null>(null)

onMounted(() => {
  const id = route.params.id as string
  pet.value = petsStore.getPetById(id)
  petsStore.setCurrentPetId(id)
})

const totalSpent = computed(() => {
  if (!pet.value) return 0
  return pet.value.serviceRecords
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.price, 0)
})

const basicInfoList = computed(() => {
  if (!pet.value) return []
  return [
    { label: '宠物品种', value: pet.value.breed, icon: PawSharp, color: '#F97316' },
    { label: '物种分类', value: petsStore.getSpeciesLabel(pet.value.species), icon: ColorFillSharp, color: '#8B5CF6' },
    { label: '宠物性别', value: petsStore.getGenderLabel(pet.value.gender), icon: pet.value.gender === 'male' ? MaleSharp : FemaleSharp, color: pet.value.gender === 'male' ? '#3B82F6' : '#EC4899' },
    { label: '宠物年龄', value: `${pet.value.age}${pet.value.ageUnit === 'year' ? '岁' : '个月'}`, icon: TimeSharp, color: '#10B981' },
    { label: '体重', value: pet.value.weight ? `${pet.value.weight} kg` : undefined, icon: ScaleSharp, color: '#0EA5E9' },
    { label: '出生日期', value: pet.value.birthday, icon: CalendarSharp, color: '#F43F5E' },
    { label: '是否绝育', value: pet.value.sterilized !== undefined ? (pet.value.sterilized ? '已绝育' : '未绝育') : undefined, icon: pet.value.sterilized ? CheckmarkCircleSharp : CloseCircleSharp, color: pet.value.sterilized ? '#10B981' : '#F97316' },
    { label: '健康状态', value: petsStore.getHealthStatusLabel(pet.value.healthStatus), icon: SparklesSharp, color: '#1A8A7D' },
  ]
})

const serviceColumns = computed<DataTableColumns<ServiceRecord>>(() => [
  {
    title: '订单编号',
    key: 'orderNo',
    width: 140,
    render: (row) => h('span', { class: 'text-sm font-medium text-primary' }, row.orderNo),
  },
  {
    title: '服务类型',
    key: 'type',
    render: (row) => h('span', { class: 'text-sm text-gray-700' }, row.type),
  },
  {
    title: '服务日期',
    key: 'date',
    width: 120,
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.date),
  },
  {
    title: '服务人员',
    key: 'staff',
    width: 100,
    render: (row) => h('span', { class: 'text-sm text-gray-600' }, row.staff || '-'),
  },
  {
    title: '金额',
    key: 'price',
    width: 100,
    render: (row) => h('span', { class: 'text-sm font-semibold text-secondary' }, `¥${row.price}`),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h(
      'span',
      {
        class: [
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          row.status === 'completed' ? 'bg-green-100 text-green-700' :
          row.status === 'processing' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600',
        ],
      },
      petsStore.getServiceStatusLabel(row.status),
    ),
  },
  {
    title: '备注',
    key: 'remark',
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.remark || '-'),
  },
])

const servicePagination = computed(() => ({
  pageSize: 10,
  showSizePicker: false,
}))

function goBack() {
  router.push('/pets')
}

function handlePhotoUpload(file: File) {
  if (!pet.value) return false
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    const newPhoto: PetPhoto = {
      id: `ph_${Date.now()}`,
      url,
      uploadedAt: dayjs().format('YYYY-MM-DD'),
    }
    petsStore.addPhoto(pet.value!.id, newPhoto)
    window.$message?.success('照片上传成功')
  }
  reader.readAsDataURL(file)
  return false
}

function getHealthRecordItemIcon(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return MedicalSharp
    case 'deworm': return BodySharp
    case 'checkup': return HeartPulseSharp
    case 'treatment': return BandageSharp
    case 'surgery': return MedicalSharp
    default: return HeartPulseSharp
  }
}

function getHealthRecordItemBg(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return 'bg-blue-100'
    case 'deworm': return 'bg-green-100'
    case 'checkup': return 'bg-teal-100'
    case 'treatment': return 'bg-orange-100'
    case 'surgery': return 'bg-red-100'
    default: return 'bg-gray-100'
  }
}

function getHealthRecordItemColor(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return '#3B82F6'
    case 'deworm': return '#10B981'
    case 'checkup': return '#1A8A7D'
    case 'treatment': return '#F97316'
    case 'surgery': return '#EF4444'
    default: return '#6B7280'
  }
}

function getHealthRecordTagType(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return 'info' as const
    case 'deworm': return 'success' as const
    case 'checkup': return 'default' as const
    case 'treatment': return 'warning' as const
    case 'surgery': return 'error' as const
    default: return 'default' as const
  }
}
</script>

<style scoped>
.pet-detail-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.service-table :deep(.n-data-table .n-data-table-th) {
  background-color: #f9fafb !important;
  font-weight: 600;
  color: #374151;
}

.service-table :deep(.n-data-table .n-data-table-td) {
  padding: 14px 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
