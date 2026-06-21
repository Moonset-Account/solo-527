<template>
  <div class="packages-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">套餐配置</h1>
        <p class="text-sm text-gray-500 mt-1">管理服务套餐的上架、价格和内容配置</p>
      </div>
      <n-button size="small" type="primary" @click="openCreateModal">
        <template #icon>
          <n-icon>
            <AddCircleSharp />
          </n-icon>
        </template>
        新增套餐
      </n-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="pkg in sortedPackages"
        :key="pkg.id"
        class="group"
      >
        <n-card
          class="!rounded-2xl !border-0 overflow-hidden h-full transition-all duration-300 hover:!shadow-xl hover:-translate-y-1"
          content-style="padding: 0;"
        >
          <div class="relative">
            <img
              :src="pkg.image"
              :alt="pkg.name"
              class="w-full h-44 object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div class="absolute top-3 right-3">
              <n-tag
                size="small"
                round
                :type="pkg.status === 'on_shelf' ? 'success' : 'default'"
              >
                {{ pkg.status === 'on_shelf' ? '已上架' : '已下架' }}
              </n-tag>
            </div>
            <div class="absolute bottom-3 left-4 right-4">
              <h3 class="text-lg font-bold text-white drop-shadow">{{ pkg.name }}</h3>
            </div>
          </div>

          <div class="p-5">
            <p class="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
              {{ pkg.description }}
            </p>

            <div class="flex items-baseline gap-2 mt-4">
              <span class="text-3xl font-bold text-primary">¥{{ pkg.price }}</span>
              <span class="text-sm text-gray-400 line-through">¥{{ pkg.originalPrice }}</span>
              <n-tag size="small" type="warning" round class="ml-auto">
                省 ¥{{ pkg.originalPrice - pkg.price }}
              </n-tag>
            </div>

            <div class="mt-3 text-xs text-gray-400">
              服务时长约 {{ formatDuration(pkg.duration) }}
            </div>

            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-500 mb-2">包含服务（{{ pkg.services.length }}项）</div>
              <div class="flex flex-wrap gap-1.5">
                <n-tag
                  v-for="(svc, idx) in pkg.services.slice(0, 4)"
                  :key="idx"
                  size="small"
                  class="!bg-teal-50 !text-teal-700 !border-teal-100"
                >
                  {{ svc }}
                </n-tag>
                <n-tag
                  v-if="pkg.services.length > 4"
                  size="small"
                  class="!bg-gray-50 !text-gray-500 !border-gray-200"
                >
                  +{{ pkg.services.length - 4 }}更多
                </n-tag>
              </div>
            </div>

            <div class="flex items-center gap-2 mt-5">
              <n-button
                size="small"
                ghost
                type="primary"
                class="flex-1"
                @click="openEditModal(pkg)"
              >
                <template #icon>
                  <n-icon size="14">
                    <CreateSharp />
                  </n-icon>
                </template>
                编辑
              </n-button>
              <n-button
                size="small"
                :type="pkg.status === 'on_shelf' ? 'warning' : 'success'"
                ghost
                @click="handleToggleStatus(pkg)"
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="pkg.status === 'on_shelf' ? EyeOffSharp : EyeSharp" />
                  </n-icon>
                </template>
                {{ pkg.status === 'on_shelf' ? '下架' : '上架' }}
              </n-button>
              <n-popconfirm
                @positive-click="handleDelete(pkg.id)"
                positive-text="确认删除"
                negative-text="取消"
              >
                <template #trigger>
                  <n-button size="small" ghost type="error">
                    <template #icon>
                      <n-icon size="14">
                        <TrashSharp />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                确定删除套餐「{{ pkg.name }}」吗？此操作不可恢复。
              </n-popconfirm>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="editingPackage ? '编辑套餐' : '新增套餐'"
      style="width: 680px; max-width: 95vw;"
      class="package-modal"
    >
      <div class="space-y-4 mt-2 max-h-[65vh] overflow-y-auto pr-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="text-sm text-gray-600 mb-1.5 block">套餐名称 <span class="text-red-500">*</span></label>
            <n-input v-model:value="formData.name" placeholder="请输入套餐名称" />
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1.5 block">售价（元） <span class="text-red-500">*</span></label>
            <n-input-number v-model:value="formData.price" :min="0" class="w-full" placeholder="请输入售价" />
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1.5 block">原价（元）</label>
            <n-input-number v-model:value="formData.originalPrice" :min="0" class="w-full" placeholder="请输入原价" />
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1.5 block">服务时长（分钟） <span class="text-red-500">*</span></label>
            <n-input-number v-model:value="formData.duration" :min="0" :step="30" class="w-full" placeholder="请输入服务时长" />
          </div>

          <div>
            <label class="text-sm text-gray-600 mb-1.5 block">状态</label>
            <n-select
              v-model:value="formData.status"
              :options="[
                { label: '上架', value: 'on_shelf' },
                { label: '下架', value: 'off_shelf' },
              ]"
            />
          </div>

          <div class="col-span-2">
            <label class="text-sm text-gray-600 mb-1.5 block">封面图片</label>
            <n-input v-model:value="formData.image" placeholder="请输入图片URL" />
          </div>

          <div class="col-span-2">
            <label class="text-sm text-gray-600 mb-1.5 block">套餐描述 <span class="text-red-500">*</span></label>
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :rows="2"
              placeholder="请输入套餐简介"
            />
          </div>

          <div class="col-span-2">
            <label class="text-sm text-gray-600 mb-1.5 block">包含服务 <span class="text-red-500">*</span></label>
            <div class="flex flex-wrap gap-2 mb-2">
              <n-tag
                v-for="(svc, idx) in formData.services"
                :key="idx"
                closable
                @close="removeService(idx)"
                class="!bg-teal-50 !text-teal-700 !border-teal-200"
              >
                {{ svc }}
              </n-tag>
            </div>
            <div class="flex gap-2">
              <n-input
                v-model:value="newService"
                placeholder="输入服务名称后按回车添加"
                @keyup.enter="addService"
                class="flex-1"
              />
              <n-button @click="addService">添加</n-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="submitForm">
            {{ editingPackage ? '保存修改' : '创建套餐' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  AddCircleSharp,
  CreateSharp,
  EyeSharp,
  EyeOffSharp,
  TrashSharp,
} from '@vicons/ionicons5'
import {
  useAppointmentsStore,
  type ServicePackage,
  type PackageStatus,
} from '~/stores/appointments'

const appointmentsStore = useAppointmentsStore()
const message = useMessage()

const showModal = ref(false)
const editingPackage = ref<ServicePackage | null>(null)
const newService = ref('')
const formData = ref({
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  duration: 60,
  services: [] as string[],
  image: '',
  status: 'off_shelf' as PackageStatus,
})

const sortedPackages = computed(() =>
  [...appointmentsStore.packages].sort((a, b) => a.sort - b.sort)
)

function formatDuration(min: number) {
  if (min >= 1440) return `${Math.floor(min / 1440)}天${min % 1440 > 0 ? ' ' + Math.floor((min % 1440) / 60) + '小时' : ''}`
  if (min >= 60) return `${Math.floor(min / 60)}小时${min % 60 > 0 ? ' ' + (min % 60) + '分钟' : ''}`
  return `${min}分钟`
}

function openCreateModal() {
  editingPackage.value = null
  formData.value = {
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    duration: 60,
    services: [],
    image: '',
    status: 'off_shelf',
  }
  showModal.value = true
}

function openEditModal(pkg: ServicePackage) {
  editingPackage.value = pkg
  formData.value = {
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    originalPrice: pkg.originalPrice,
    duration: pkg.duration,
    services: [...pkg.services],
    image: pkg.image,
    status: pkg.status,
  }
  showModal.value = true
}

function addService() {
  const v = newService.value.trim()
  if (!v) return
  if (formData.value.services.includes(v)) {
    message.warning('该服务已存在')
    return
  }
  formData.value.services.push(v)
  newService.value = ''
}

function removeService(idx: number) {
  formData.value.services.splice(idx, 1)
}

function validateForm() {
  if (!formData.value.name.trim()) {
    message.warning('请输入套餐名称')
    return false
  }
  if (!formData.value.description.trim()) {
    message.warning('请输入套餐描述')
    return false
  }
  if (!formData.value.price || formData.value.price <= 0) {
    message.warning('请输入有效售价')
    return false
  }
  if (!formData.value.duration || formData.value.duration <= 0) {
    message.warning('请输入有效服务时长')
    return false
  }
  if (formData.value.services.length === 0) {
    message.warning('请至少添加一项服务')
    return false
  }
  return true
}

function submitForm() {
  if (!validateForm()) return

  const data = {
    ...formData.value,
    id: editingPackage.value?.id,
  }

  appointmentsStore.savePackage(data)
  message.success(editingPackage.value ? '套餐已更新' : '套餐已创建')
  showModal.value = false
}

function handleToggleStatus(pkg: ServicePackage) {
  appointmentsStore.togglePackageStatus(pkg.id)
  message.success(pkg.status === 'on_shelf' ? '套餐已下架' : '套餐已上架')
}

function handleDelete(id: string) {
  appointmentsStore.deletePackage(id)
  message.success('套餐已删除')
}
</script>

<style scoped>
.packages-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.package-modal .n-card__content) {
  padding: 4px 24px 0 !important;
}
</style>
