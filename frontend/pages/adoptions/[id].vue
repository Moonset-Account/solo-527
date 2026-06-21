<template>
  <div class="adoption-detail-page space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <n-button text size="small" @click="handleBack">
          <template #icon>
            <n-icon>
              <ArrowBackSharp />
            </n-icon>
          </template>
          返回列表
        </n-button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-800">领养审核详情</h1>
            <div
              v-if="application"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              :style="{
                backgroundColor: statusConfig[application.status].color + '15',
                color: statusConfig[application.status].color,
              }"
            >
              <n-icon :size="14">
                <component :is="statusConfig[application.status].icon" />
              </n-icon>
              {{ statusConfig[application.status].label }}
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-1">申请编号：{{ route.params.id }}</p>
        </div>
      </div>
    </div>

    <div v-if="application" class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div class="xl:col-span-2 space-y-5">
        <n-card class="!rounded-2xl !border-0" title="申请人资料" content-style="padding: 0;">
          <div class="p-5">
            <div class="flex items-start gap-5">
              <div
                class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm"
                :style="{ backgroundColor: getAvatarColor(application.applicant.name) }"
              >
                {{ application.applicant.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                  <h2 class="text-xl font-semibold text-gray-800">{{ application.applicant.name }}</h2>
                  <n-tag size="small" type="info" round>
                    {{ application.applicant.gender === 'male' ? '男' : '女' }}
                    <template v-if="application.applicant.age"> · {{ application.applicant.age }}岁</template>
                  </n-tag>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4">
                  <div class="flex items-center gap-2 text-sm">
                    <n-icon size="16" color="#6B7280">
                      <CallSharp />
                    </n-icon>
                    <span class="text-gray-600">{{ application.applicant.phone }}</span>
                  </div>
                  <div v-if="application.applicant.email" class="flex items-center gap-2 text-sm">
                    <n-icon size="16" color="#6B7280">
                      <MailSharp />
                    </n-icon>
                    <span class="text-gray-600">{{ application.applicant.email }}</span>
                  </div>
                  <div v-if="application.applicant.occupation" class="flex items-center gap-2 text-sm">
                    <n-icon size="16" color="#6B7280">
                      <BriefcaseSharp />
                    </n-icon>
                    <span class="text-gray-600">{{ application.applicant.occupation }}</span>
                  </div>
                  <div v-if="application.applicant.address" class="flex items-center gap-2 text-sm md:col-span-2">
                    <n-icon size="16" color="#6B7280">
                      <LocationSharp />
                    </n-icon>
                    <span class="text-gray-600">{{ application.applicant.address }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="!rounded-2xl !border-0" title="居住环境" content-style="padding: 0;">
          <div class="p-5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-500">住房类型</div>
                <div class="text-sm font-medium text-gray-800 mt-1">
                  {{ housingTypeMap[application.livingEnvironment.housingType] }}
                </div>
              </div>
              <div v-if="application.livingEnvironment.housingArea" class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-500">住房面积</div>
                <div class="text-sm font-medium text-gray-800 mt-1">
                  {{ application.livingEnvironment.housingArea }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-500">房屋产权</div>
                <div class="text-sm font-medium text-gray-800 mt-1">
                  {{ application.livingEnvironment.isOwned ? '自有' : '租赁' }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-500">同住人数</div>
                <div class="text-sm font-medium text-gray-800 mt-1">
                  {{ application.livingEnvironment.householdCount }}人
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-3 mt-4">
              <n-tag
                :type="application.livingEnvironment.hasYard ? 'success' : 'default'"
                size="medium"
                round
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="application.livingEnvironment.hasYard ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                有院子
              </n-tag>
              <n-tag
                :type="application.livingEnvironment.hasBalcony ? 'success' : 'default'"
                size="medium"
                round
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="application.livingEnvironment.hasBalcony ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                有阳台
              </n-tag>
              <n-tag
                :type="application.livingEnvironment.hasChildren ? 'warning' : 'default'"
                size="medium"
                round
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="application.livingEnvironment.hasChildren ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                有儿童
              </n-tag>
              <n-tag
                :type="application.livingEnvironment.hasElderly ? 'warning' : 'default'"
                size="medium"
                round
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="application.livingEnvironment.hasElderly ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                有老人
              </n-tag>
              <n-tag
                :type="application.livingEnvironment.hasOtherPets ? 'info' : 'default'"
                size="medium"
                round
              >
                <template #icon>
                  <n-icon size="14">
                    <component :is="application.livingEnvironment.hasOtherPets ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                其他宠物
                <template v-if="application.livingEnvironment.otherPetsDesc">
                  ：{{ application.livingEnvironment.otherPetsDesc }}
                </template>
              </n-tag>
            </div>
          </div>
        </n-card>

        <n-card class="!rounded-2xl !border-0" title="养宠经验" content-style="padding: 0;">
          <div class="p-5">
            <div class="flex items-center gap-3 mb-4">
              <n-tag
                :type="application.petExperience.hasExperience ? 'success' : 'warning'"
                size="large"
                round
              >
                <template #icon>
                  <n-icon size="16">
                    <component :is="application.petExperience.hasExperience ? CheckmarkCircleSharp : AlertCircleSharp" />
                  </n-icon>
                </template>
                {{ application.petExperience.hasExperience ? '有养宠经验' : '无养宠经验' }}
              </n-tag>
              <div v-if="application.petExperience.yearsOfExperience" class="text-sm text-gray-600">
                养宠经验 {{ application.petExperience.yearsOfExperience }} 年
              </div>
            </div>
            <div v-if="application.petExperience.petTypes && application.petExperience.petTypes.length > 0" class="mb-3">
              <div class="text-xs text-gray-500 mb-2">饲养过的宠物类型</div>
              <div class="flex flex-wrap gap-2">
                <n-tag
                  v-for="type in application.petExperience.petTypes"
                  :key="type"
                  type="primary"
                  size="small"
                  round
                >
                  {{ type }}
                </n-tag>
              </div>
            </div>
            <div v-if="application.petExperience.currentPets" class="mt-3">
              <div class="text-xs text-gray-500 mb-1">当前宠物</div>
              <div class="text-sm text-gray-700">{{ application.petExperience.currentPets }}</div>
            </div>
            <div v-if="application.petExperience.surrenderedPets" class="mt-3">
              <div class="text-xs text-gray-500 mb-1">曾送养宠物</div>
              <div class="text-sm text-gray-700">{{ application.petExperience.surrenderedPets }}</div>
              <div v-if="application.petExperience.reasonForSurrender" class="text-xs text-gray-500 mt-1">
                原因：{{ application.petExperience.reasonForSurrender }}
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="!rounded-2xl !border-0" title="领养申请内容" content-style="padding: 0;">
          <div class="p-5 space-y-4">
            <div>
              <div class="text-xs text-gray-500 mb-2">申请理由</div>
              <n-alert type="info" :show-icon="false" class="!bg-blue-50 !border-0">
                {{ application.reason }}
              </n-alert>
            </div>
            <div v-if="application.dailyCarePlan">
              <div class="text-xs text-gray-500 mb-2">日常照顾计划</div>
              <n-alert type="success" :show-icon="false" class="!bg-emerald-50 !border-0">
                {{ application.dailyCarePlan }}
              </n-alert>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div v-if="application.emergencyContact">
                <div class="text-xs text-gray-500 mb-1">紧急联系人</div>
                <div class="text-sm text-gray-700">{{ application.emergencyContact }}</div>
              </div>
              <div v-if="application.emergencyPhone">
                <div class="text-xs text-gray-500 mb-1">紧急联系电话</div>
                <div class="text-sm text-gray-700">{{ application.emergencyPhone }}</div>
              </div>
            </div>
            <div class="pt-2">
              <n-tag type="success" size="small" round>
                <template #icon>
                  <n-icon size="14">
                    <CheckmarkSharp />
                  </n-icon>
                </template>
                已同意领养协议条款
              </n-tag>
            </div>
          </div>
        </n-card>

        <n-card v-if="application.reviewRemark" class="!rounded-2xl !border-0" title="审核记录" content-style="padding: 0;">
          <div class="p-5">
            <n-timeline>
              <n-timeline-item
                :type="getTimelineType(application.status)"
                :title="statusConfig[application.status].label + '审核'"
                :time="application.reviewTime"
              >
                <div class="text-sm text-gray-600 mb-1">审核人：{{ application.reviewer || '系统' }}</div>
                <n-alert
                  :type="getAlertType(application.status)"
                  :show-icon="false"
                  class="!mt-2"
                >
                  {{ application.reviewRemark }}
                </n-alert>
              </n-timeline-item>
              <n-timeline-item
                type="default"
                title="提交申请"
                :time="application.applyTime"
              />
            </n-timeline>
          </div>
        </n-card>
      </div>

      <div class="space-y-5">
        <n-card class="!rounded-2xl !border-0 overflow-hidden" content-style="padding: 0;">
          <div class="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 p-5 text-center">
            <div
              class="w-24 h-24 mx-auto rounded-full bg-white shadow-md flex items-center justify-center"
            >
              <n-icon :size="48" color="#EC4899">
                <PawSharp />
              </n-icon>
            </div>
            <div class="mt-4">
              <h3 class="text-lg font-semibold text-gray-800">{{ application.pet.name }}</h3>
              <div class="text-sm text-gray-500 mt-1">{{ application.pet.breed }}</div>
            </div>
          </div>
          <div class="p-5 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">年龄</span>
              <span class="text-gray-800 font-medium">{{ application.pet.age }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">性别</span>
              <span class="text-gray-800 font-medium">{{ application.pet.gender === 'male' ? '公' : '母' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">种类</span>
              <span class="text-gray-800 font-medium">{{ speciesMap[application.pet.species] }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">健康状态</span>
              <n-tag type="success" size="small" round v-if="application.pet.healthStatus === '健康'">
                {{ application.pet.healthStatus }}
              </n-tag>
              <span v-else class="text-gray-800 font-medium">{{ application.pet.healthStatus }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">已接种疫苗</span>
              <n-tag
                :type="application.pet.vaccinated ? 'success' : 'warning'"
                size="small"
                round
              >
                <template #icon>
                  <n-icon size="12">
                    <component :is="application.pet.vaccinated ? CheckmarkSharp : CloseSharp" />
                  </n-icon>
                </template>
                {{ application.pet.vaccinated ? '是' : '否' }}
              </n-tag>
            </div>
          </div>
        </n-card>

        <n-card class="!rounded-2xl !border-0" title="申请时间线" content-style="padding: 20px;">
          <n-descriptions :column="1" bordered size="small" label-placement="left">
            <n-descriptions-item label="申请时间">
              <span class="text-gray-700">{{ application.applyTime }}</span>
            </n-descriptions-item>
            <n-descriptions-item v-if="application.reviewTime" label="审核时间">
              <span class="text-gray-700">{{ application.reviewTime }}</span>
            </n-descriptions-item>
            <n-descriptions-item v-if="application.reviewer" label="审核人">
              <span class="text-gray-700">{{ application.reviewer }}</span>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <n-card
          v-if="application.status === 'pending' || application.status === 'supplement'"
          class="!rounded-2xl !border-0"
          title="审核操作"
          content-style="padding: 20px;"
        >
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium text-gray-700 mb-2">审核备注</div>
              <n-input
                v-model:value="reviewRemark"
                type="textarea"
                :rows="4"
                placeholder="请输入审核备注意见..."
                maxlength="500"
                show-count
              />
            </div>
            <div class="grid grid-cols-1 gap-2">
              <n-button
                type="success"
                size="large"
                :disabled="!reviewRemark.trim()"
                @click="handleApprove"
              >
                <template #icon>
                  <n-icon>
                    <CheckmarkCircleSharp />
                  </n-icon>
                </template>
                审核通过
              </n-button>
              <n-button
                type="error"
                size="large"
                :disabled="!reviewRemark.trim()"
                @click="handleReject"
              >
                <template #icon>
                  <n-icon>
                    <CloseCircleSharp />
                  </n-icon>
                </template>
                审核驳回
              </n-button>
              <n-button
                type="warning"
                size="large"
                ghost
                :disabled="!reviewRemark.trim()"
                @click="handleSupplement"
              >
                <template #icon>
                  <n-icon>
                    <CreateSharp />
                  </n-icon>
                </template>
                要求补充资料
              </n-button>
            </div>
          </div>
        </n-card>

        <n-card
          v-else
          class="!rounded-2xl !border-0"
          :title="application.status === 'approved' ? '审核结果' : '审核结果'"
          content-style="padding: 20px;"
        >
          <n-alert
            :type="getAlertType(application.status)"
            :show-icon="true"
            class="!mb-0"
          >
            <template #header>
              {{ statusConfig[application.status].label }}
            </template>
            {{ application.reviewRemark }}
          </n-alert>
        </n-card>
      </div>
    </div>

    <n-empty v-else description="未找到该申请记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { AdoptionStatus } from '~/stores/adoptions'
import {
  ArrowBackSharp,
  TimeSharp,
  CheckmarkCircleSharp,
  CloseCircleSharp,
  AlertCircleSharp,
  CallSharp,
  MailSharp,
  BriefcaseSharp,
  LocationSharp,
  PawSharp,
  CheckmarkSharp,
  CloseSharp,
  CreateSharp,
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const adoptionsStore = useAdoptionsStore()

const reviewRemark = ref('')

const application = computed(() => adoptionsStore.getApplicationById(route.params.id as string))

const statusConfig: Record<AdoptionStatus, { label: string; type: string; icon: any; color: string }> = {
  pending: { label: '待审核', type: 'warning', icon: TimeSharp, color: '#F59E0B' },
  approved: { label: '已通过', type: 'success', icon: CheckmarkCircleSharp, color: '#10B981' },
  rejected: { label: '已驳回', type: 'error', icon: CloseCircleSharp, color: '#F43F5E' },
  supplement: { label: '待补充', type: 'info', icon: AlertCircleSharp, color: '#6366F1' },
}

const housingTypeMap: Record<string, string> = {
  apartment: '公寓/小区',
  house: '独栋房屋',
  villa: '别墅',
  other: '其他',
}

const speciesMap: Record<string, string> = {
  dog: '狗狗',
  cat: '猫咪',
  other: '其他',
}

function getAvatarColor(name: string) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getTimelineType(status: AdoptionStatus) {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    case 'supplement':
      return 'warning'
    default:
      return 'default'
  }
}

function getAlertType(status: AdoptionStatus) {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    case 'supplement':
      return 'warning'
    default:
      return 'info'
  }
}

function handleBack() {
  router.push('/adoptions')
}

function handleApprove() {
  if (!application.value) return
  dialog.warning({
    title: '确认审核通过？',
    content: `确定要通过 ${application.value.applicant.name} 对 ${application.value.pet.name} 的领养申请吗？`,
    positiveText: '确认通过',
    negativeText: '取消',
    onPositiveClick: () => {
      adoptionsStore.reviewApplication(application.value!.id, 'approved', reviewRemark.value)
      message.success('审核通过成功')
      reviewRemark.value = ''
    },
  })
}

function handleReject() {
  if (!application.value) return
  dialog.warning({
    title: '确认审核驳回？',
    content: `确定要驳回 ${application.value.applicant.name} 对 ${application.value.pet.name} 的领养申请吗？`,
    positiveText: '确认驳回',
    negativeText: '取消',
    onPositiveClick: () => {
      adoptionsStore.reviewApplication(application.value!.id, 'rejected', reviewRemark.value)
      message.warning('已驳回申请')
      reviewRemark.value = ''
    },
  })
}

function handleSupplement() {
  if (!application.value) return
  dialog.info({
    title: '要求补充资料',
    content: `确定要求 ${application.value.applicant.name} 补充资料吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      adoptionsStore.reviewApplication(application.value!.id, 'supplement', reviewRemark.value)
      message.info('已发送补充资料通知')
      reviewRemark.value = ''
    },
  })
}
</script>

<style scoped>
.adoption-detail-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
