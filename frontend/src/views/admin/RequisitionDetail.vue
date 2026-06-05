<template>
  <div class="space-y-6">
    <el-page-header @back="$router.back()" :content="requisition?.requisition_number || '领用详情'" />
    
    <el-card v-if="requisition" shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-medium">基本信息</div>
          <el-tag :class="`status-${requisition.status}`" size="large">
            {{ statusText(requisition.status) }}
          </el-tag>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div class="text-sm text-gray-500">申请人</div>
          <div class="font-medium">{{ requisition.created_by_user?.full_name }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">申请时间</div>
          <div class="font-medium">{{ formatDate(requisition.created_at) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">领用用途</div>
          <div class="font-medium">{{ requisition.purpose }}</div>
        </div>
      </div>
      
      <div v-if="requisition.requires_double_confirm" class="mt-6 p-4 bg-red-50 rounded-lg">
        <div class="text-red-600 font-medium mb-2">
          <el-icon class="mr-1"><Warning /></el-icon>
          高危试剂 - 需双人确认
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-gray-500">第一确认人</div>
            <div class="font-medium">
              {{ requisition.first_confirmer?.full_name || '待确认' }}
              <el-tag v-if="requisition.first_confirmer_id" type="success" size="small" class="ml-2">已确认</el-tag>
            </div>
          </div>
          <div>
            <div class="text-gray-500">第二确认人</div>
            <div class="font-medium">
              {{ requisition.second_confirmer?.full_name || '待确认' }}
              <el-tag v-if="requisition.second_confirmer_id" type="success" size="small" class="ml-2">已确认</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <el-card shadow="hover">
      <template #header>
        <div class="text-lg font-medium">领用明细</div>
      </template>
      <el-table :data="requisition?.items || []" border>
        <el-table-column label="试剂名称">
          <template #default="{ row }">
            {{ row.reagent_batch?.reagent?.name }}
          </template>
        </el-table-column>
        <el-table-column label="批号" width="120">
          <template #default="{ row }">
            {{ row.reagent_batch?.batch_number }}
          </template>
        </el-table-column>
        <el-table-column label="危险等级" width="100">
          <template #default="{ row }">
            <el-tag :class="`bg-hazard-level-${row.reagent_batch?.reagent?.hazard_level?.toLowerCase()}`" size="small">
              {{ row.reagent_batch?.reagent?.hazard_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="申请数量" width="100" />
        <el-table-column prop="returned_quantity" label="已归还" width="100" />
        <el-table-column prop="purpose" label="用途" />
      </el-table>
    </el-card>
    
    <el-card v-if="requisition?.attachments?.length > 0" shadow="hover">
      <template #header>
        <div class="text-lg font-medium">附件</div>
      </template>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="att in requisition.attachments" :key="att.id" class="text-center">
          <el-image :src="att.file_path" fit="cover" class="w-full h-32 rounded-lg" />
          <div class="text-xs text-gray-500 mt-1 truncate">{{ att.file_name }}</div>
        </div>
      </div>
    </el-card>
    
    <div class="flex gap-3 justify-end">
      <el-button v-if="canConfirm" type="success" @click="handleConfirm">
        {{ confirmText }}
      </el-button>
      <el-button v-if="canApprove" type="primary" @click="handleApprove">批准</el-button>
      <el-button v-if="canApprove" type="danger" @click="handleReject">拒绝</el-button>
      <el-button v-if="canPickUp" type="success" @click="handlePickUp">确认领用</el-button>
      <el-button v-if="canReturn" type="warning" @click="handleReturn">确认归还</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const requisition = ref<any>(null)

const statusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    PENDING_CONFIRM: '待确认',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    PICKED_UP: '已领用',
    RETURNED: '已归还'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN')

const canConfirm = computed(() => {
  const r = requisition.value
  if (!r?.requires_double_confirm) return false
  if (r.status !== 'PENDING') return false
  if (!userStore.isMember) return false
  if (r.created_by === userStore.user?.id) return false
  if (r.first_confirmer_id === userStore.user?.id) return false
  if (r.second_confirmer_id) return false
  return true
})

const confirmText = computed(() => {
  return requisition.value?.first_confirmer_id ? '作为第二确认人确认' : '作为第一确认人确认'
})

const canApprove = computed(() => {
  const r = requisition.value
  if (!userStore.isAdmin) return false
  if (r?.status !== 'PENDING') return false
  if (r?.requires_double_confirm && (!r?.first_confirmer_id || !r?.second_confirmer_id)) return false
  return true
})

const canPickUp = computed(() => {
  return requisition.value?.status === 'APPROVED'
})

const canReturn = computed(() => {
  return requisition.value?.status === 'PICKED_UP'
})

async function loadData() {
  try {
    requisition.value = await api.get(`/requisitions/${route.params.id}`)
  } catch (e) {
    console.error(e)
  }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确定要确认此领用申请吗？', '确认操作')
    await api.post(`/requisitions/${route.params.id}/confirm`)
    ElMessage.success('确认成功')
    loadData()
  } catch (e) {}
}

async function handleApprove() {
  try {
    await ElMessageBox.confirm('确定批准此申请？', '审批')
    await api.post(`/requisitions/${route.params.id}/approve`)
    ElMessage.success('已批准')
    loadData()
  } catch (e) {}
}

async function handleReject() {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请')
    await api.post(`/requisitions/${route.params.id}/reject`, { comment: value })
    ElMessage.success('已拒绝')
    loadData()
  } catch (e) {}
}

async function handlePickUp() {
  try {
    await ElMessageBox.confirm('确认已领取所有试剂？', '领用确认')
    await api.post(`/requisitions/${route.params.id}/pick-up`)
    ElMessage.success('领用成功')
    loadData()
  } catch (e) {}
}

async function handleReturn() {
  try {
    await ElMessageBox.confirm('确认已归还所有试剂？', '归还确认')
    await api.post(`/requisitions/${route.params.id}/return`)
    ElMessage.success('归还成功')
    loadData()
  } catch (e) {}
}

onMounted(() => {
  loadData()
})
</script>
