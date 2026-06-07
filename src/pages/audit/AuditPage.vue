<script setup lang="ts">
import { ref, computed } from 'vue'
import { Image, Check, X, Filter, Clock, AlertCircle, User, FileText, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import { useUserStore } from '@/stores/user'
import { ClickHouseService } from '@/data/query-service'
import type { InspectionPhoto, AuditStatus } from '@/types'
import NavBar from '@/components/NavBar.vue'

const dataStore = useDataStore()
const userStore = useUserStore()

const activeTab = ref<'pending' | 'approved' | 'rejected'>('pending')
const selectedPhoto = ref<InspectionPhoto | null>(null)
const showRejectModal = ref(false)
const rejectReason = ref('')
const selectedCommunity = ref<string>('all')
const showRejectLog = ref(false)

const rejectReasons = [
  '照片模糊，无法识别',
  '拍摄角度不正确',
  '未拍摄到完整桶点',
  '照片与桶点不匹配',
  '光线过暗，无法判断',
  '其他原因'
]

const rejectLogs = computed(() => ClickHouseService.queryAuditLogsWithRejectReason({ limit: 100 }))

const filteredPhotos = computed(() => {
  let photos = dataStore.inspectionPhotos

  if (activeTab.value === 'pending') {
    photos = photos.filter(p => p.auditStatus === 'pending')
  } else if (activeTab.value === 'approved') {
    photos = photos.filter(p => p.auditStatus === 'approved')
  } else {
    photos = photos.filter(p => p.auditStatus === 'rejected')
  }

  if (selectedCommunity.value !== 'all') {
    const binIds = new Set(
      dataStore.getBinPointsByCommunity(selectedCommunity.value).map(b => b.id)
    )
    photos = photos.filter(p => binIds.has(p.binPointId))
  }

  return photos.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())
})

const stats = computed(() => ({
  pending: dataStore.pendingPhotos.length,
  approved: dataStore.inspectionPhotos.filter(p => p.auditStatus === 'approved').length,
  rejected: dataStore.inspectionPhotos.filter(p => p.auditStatus === 'rejected').length
}))

function getBinName(binPointId: string) {
  return dataStore.getBinPointById(binPointId)?.name || '未知'
}

function getCommunityName(binPointId: string) {
  const bin = dataStore.getBinPointById(binPointId)
  return bin ? dataStore.getCommunityById(bin.communityId)?.name || '未知' : '未知'
}

function getAuditLog(photoId: string) {
  return dataStore.auditLogs.find(l => l.photoId === photoId)
}

function handleApprove(photo: InspectionPhoto) {
  dataStore.approvePhoto(photo.id, userStore.currentUser?.name || '系统')
  if (selectedPhoto.value?.id === photo.id) {
    selectedPhoto.value = null
  }
}

function handleRejectClick(photo: InspectionPhoto) {
  selectedPhoto.value = photo
  rejectReason.value = ''
  showRejectModal.value = true
}

function handleConfirmReject() {
  if (!selectedPhoto.value || !rejectReason.value) return
  dataStore.rejectPhoto(
    selectedPhoto.value.id,
    userStore.currentUser?.name || '系统',
    rejectReason.value
  )
  showRejectModal.value = false
  selectedPhoto.value = null
  rejectReason.value = ''
}

function handleBatchApprove() {
  if (activeTab.value !== 'pending') return
  const pendingPhotos = filteredPhotos.value.slice(0, 10)
  pendingPhotos.forEach(photo => {
    dataStore.approvePhoto(photo.id, userStore.currentUser?.name || '系统')
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />

    <div class="flex-1 p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Image class="w-7 h-7 text-amber-500" />
            照片审核中心
          </h1>
          <p class="text-gray-500 mt-1">审核巡查照片，驳回时必须记录原因</p>
        </div>
        <div class="flex gap-2">
          <button
            class="btn-secondary"
            @click="showRejectLog = !showRejectLog"
          >
            <FileText class="w-4 h-4 mr-1" />
            驳回记录
            <component :is="showRejectLog ? ChevronUp : ChevronDown" class="w-4 h-4 ml-1" />
          </button>
          <button
            v-if="activeTab === 'pending' && stats.pending > 0"
            class="btn-success"
            @click="handleBatchApprove"
          >
            <Check class="w-4 h-4 mr-1" />
            批量通过前10条
          </button>
        </div>
      </div>

      <div v-if="showRejectLog" class="card p-4 mb-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-red-500" />
          驳回原因记录（最近 {{ rejectLogs.length }} 条）
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-2 px-3 text-gray-500 font-medium">审核时间</th>
                <th class="text-left py-2 px-3 text-gray-500 font-medium">桶点</th>
                <th class="text-left py-2 px-3 text-gray-500 font-medium">社区</th>
                <th class="text-left py-2 px-3 text-gray-500 font-medium">上传人</th>
                <th class="text-left py-2 px-3 text-gray-500 font-medium">审核人</th>
                <th class="text-left py-2 px-3 text-gray-500 font-medium">驳回原因</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in rejectLogs.slice(0, 20)"
                :key="log.id"
                class="border-b border-gray-50 hover:bg-gray-50"
              >
                <td class="py-2 px-3 text-gray-600">{{ new Date(log.auditTime).toLocaleString('zh-CN') }}</td>
                <td class="py-2 px-3 text-gray-900 font-medium">{{ log.binName }}</td>
                <td class="py-2 px-3 text-gray-600">{{ log.communityName }}</td>
                <td class="py-2 px-3 text-gray-600">{{ log.uploader }}</td>
                <td class="py-2 px-3 text-gray-600">{{ log.auditor }}</td>
                <td class="py-2 px-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                    <AlertCircle class="w-3 h-3" />
                    {{ log.rejectReason }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          驳回数据保留但不计入排名统计，仅审核通过的数据进入社区排名
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div
          class="card p-4 cursor-pointer transition-all border-2"
          :class="activeTab === 'pending' ? 'border-amber-400 bg-amber-50' : 'border-transparent hover:shadow-md'"
          @click="activeTab = 'pending'"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">待审核</p>
              <p class="text-2xl font-bold text-amber-600">{{ stats.pending }}</p>
            </div>
          </div>
        </div>

        <div
          class="card p-4 cursor-pointer transition-all border-2"
          :class="activeTab === 'approved' ? 'border-green-400 bg-green-50' : 'border-transparent hover:shadow-md'"
          @click="activeTab = 'approved'"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Check class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">已通过</p>
              <p class="text-2xl font-bold text-green-600">{{ stats.approved }}</p>
            </div>
          </div>
        </div>

        <div
          class="card p-4 cursor-pointer transition-all border-2"
          :class="activeTab === 'rejected' ? 'border-red-400 bg-red-50' : 'border-transparent hover:shadow-md'"
          @click="activeTab = 'rejected'"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <X class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">已驳回</p>
              <p class="text-2xl font-bold text-red-600">{{ stats.rejected }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-6">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-gray-400" />
            <span class="text-sm text-gray-600">社区筛选</span>
            <select v-model="selectedCommunity" class="select !py-1 !text-sm !w-48">
              <option value="all">全部社区</option>
              <option v-for="c in dataStore.communities" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="filteredPhotos.length === 0" class="card p-12 text-center">
        <Image class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500 text-lg">暂无照片数据</p>
        <p class="text-gray-400 text-sm mt-1">
          {{ activeTab === 'pending' ? '所有照片已完成审核' : '切换到其他标签查看' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="photo in filteredPhotos"
          :key="photo.id"
          class="card overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div class="relative aspect-[4/3] bg-gray-100">
            <img
              :src="photo.photoUrl"
              :alt="getBinName(photo.binPointId)"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
              :class="[
                photo.auditStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                photo.auditStatus === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              ]"
            >
              {{ photo.auditStatus === 'pending' ? '待审核' : photo.auditStatus === 'approved' ? '已通过' : '已驳回' }}
            </div>
          </div>

          <div class="p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 text-sm">{{ getBinName(photo.binPointId) }}</span>
            </div>
            <p class="text-xs text-gray-500 mb-2">{{ getCommunityName(photo.binPointId) }}</p>
            <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <User class="w-3 h-3" />
              <span>{{ photo.uploader }}</span>
              <span>·</span>
              <Clock class="w-3 h-3" />
              <span>{{ new Date(photo.uploadTime).toLocaleDateString('zh-CN') }}</span>
            </div>

            <div v-if="photo.auditStatus === 'rejected'" class="mb-3 p-2 bg-red-50 rounded-lg">
              <p class="text-xs text-red-600">
                <AlertCircle class="w-3 h-3 inline mr-1" />
                驳回原因: {{ getAuditLog(photo.id)?.rejectReason || '未填写' }}
              </p>
            </div>

            <div v-if="photo.auditStatus === 'pending'" class="flex gap-2">
              <button
                class="flex-1 btn-success !py-1.5 !text-xs"
                @click="handleApprove(photo)"
              >
                <Check class="w-3 h-3 mr-1" />
                通过
              </button>
              <button
                class="flex-1 btn-danger !py-1.5 !text-xs"
                @click="handleRejectClick(photo)"
              >
                <X class="w-3 h-3 mr-1" />
                驳回
              </button>
            </div>

            <div v-else class="text-xs text-gray-400">
              <span v-if="getAuditLog(photo.id)">
                审核人: {{ getAuditLog(photo.id)?.auditor }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showRejectModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showRejectModal = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-2">驳回照片</h3>
          <p class="text-sm text-gray-500 mb-4">请选择驳回原因（驳回原因将永久记录）</p>

          <div class="space-y-2 mb-4">
            <button
              v-for="reason in rejectReasons"
              :key="reason"
              :class="[
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                rejectReason === reason
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              ]"
              @click="rejectReason = reason"
            >
              {{ reason }}
            </button>
          </div>

          <div class="flex gap-3">
            <button class="btn-secondary flex-1" @click="showRejectModal = false">
              取消
            </button>
            <button
              class="btn-danger flex-1"
              :disabled="!rejectReason"
              @click="handleConfirmReject"
            >
              确认驳回
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
