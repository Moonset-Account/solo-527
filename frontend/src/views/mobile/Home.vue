<template>
  <div class="space-y-4">
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
      <div class="text-lg font-bold mb-1">欢迎回来，{{ user?.full_name }}</div>
      <div class="text-sm opacity-90">{{ user?.department || '实验室管理员' }}</div>
    </div>
    
    <div class="grid grid-cols-4 gap-3">
      <div class="bg-white rounded-xl p-3 text-center shadow-sm" @click="$router.push('/m/scan')">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <el-icon :size="24" color="#3b82f6"><QRCode /></el-icon>
        </div>
        <div class="text-sm text-gray-700">扫码查询</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm" @click="$router.push('/m/stock-in')">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <el-icon :size="24" color="#22c55e"><Upload /></el-icon>
        </div>
        <div class="text-sm text-gray-700">入库登记</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm" @click="$router.push('/m/requisition')">
        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <el-icon :size="24" color="#f97316"><Download /></el-icon>
        </div>
        <div class="text-sm text-gray-700">领用申请</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm" @click="$router.push('/m/inventory')">
        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <el-icon :size="24" color="#8b5cf6"><Checked /></el-icon>
        </div>
        <div class="text-sm text-gray-700">库存盘点</div>
      </div>
    </div>
    
    <div v-if="notifications.length > 0" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium text-gray-800">预警通知</div>
        <el-button type="primary" link size="small" @click="$router.push('/notifications')">全部</el-button>
      </div>
      <div class="space-y-2">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="flex items-start p-2 rounded-lg"
          :class="item.type === 'LOW_STOCK' ? 'bg-orange-50' : item.type === 'EXPIRY_WARNING' ? 'bg-red-50' : 'bg-blue-50'"
        >
          <el-icon class="mt-0.5 mr-2" :color="item.type === 'LOW_STOCK' ? '#f97316' : item.type === 'EXPIRY_WARNING' ? '#ef4444' : '#3b82f6'">
            <component :is="item.type === 'LOW_STOCK' ? 'Warning' : item.type === 'EXPIRY_WARNING' ? 'Clock' : 'Bell'" />
          </el-icon>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-gray-800 truncate">{{ item.title }}</div>
            <div class="text-xs text-gray-500">{{ item.message }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium text-gray-800">我的申请</div>
        <el-button type="primary" link size="small" @click="$router.push('/m/requisitions')">全部</el-button>
      </div>
      <div v-if="recentRequisitions.length === 0" class="text-center text-gray-400 py-4 text-sm">
        暂无申请记录
      </div>
      <div v-else class="space-y-2">
        <div v-for="req in recentRequisitions" :key="req.id" class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div>
            <div class="text-sm font-medium text-gray-700">{{ req.requisition_number }}</div>
            <div class="text-xs text-gray-500">{{ req.items_count || 0 }} 种试剂</div>
          </div>
          <el-tag size="small" :class="`status-${req.status}`">
            {{ statusText(req.status) }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div v-if="isMember" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium text-gray-800">待确认领用</div>
        <el-badge :value="pendingConfirmCount" :hidden="pendingConfirmCount === 0" />
      </div>
      <div v-if="pendingConfirmCount === 0" class="text-center text-gray-400 py-4 text-sm">
        暂无待确认记录
      </div>
      <div v-else class="space-y-2">
        <div v-for="req in pendingConfirms" :key="req.id" class="flex items-center justify-between p-2 bg-red-50 rounded-lg" @click="$router.push(`/requisitions/${req.id}`)">
          <div>
            <div class="text-sm font-medium text-gray-700">{{ req.requisition_number }}</div>
            <div class="text-xs text-red-500">高危试剂需双人确认</div>
          </div>
          <el-icon color="#ef4444"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { QRCode, Upload, Download, Checked, Warning, Clock, Bell, ArrowRight } from '@element-plus/icons-vue'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isMember = computed(() => userStore.isMember)

const notifications = ref<any[]>([])
const recentRequisitions = ref<any[]>([])
const pendingConfirms = ref<any[]>([])
const pendingConfirmCount = ref(0)

function statusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    PICKED_UP: '已领用',
    RETURNED: '已归还'
  }
  return map[status] || status
}

async function loadData() {
  try {
    const [notifData, reqData, confirmData] = await Promise.all([
      api.get('/notifications?limit=3'),
      api.get('/requisitions/my?limit=3'),
      api.get('/requisitions/pending-confirmation?limit=3')
    ]) as any[]
    notifications.value = notifData || []
    recentRequisitions.value = reqData || []
    pendingConfirms.value = confirmData || []
    pendingConfirmCount.value = confirmData?.length || 0
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>
