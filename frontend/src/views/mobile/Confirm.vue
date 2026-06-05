<template>
  <div class="space-y-4">
    <div v-if="pendingList.length === 0" class="bg-white rounded-xl p-8 text-center text-gray-400">
      暂无待确认记录
    </div>
    
    <div
      v-for="req in pendingList"
      :key="req.id"
      class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium text-gray-800">{{ req.requisition_number }}</span>
        <el-tag size="small" type="warning">待确认</el-tag>
      </div>
      <div class="text-sm text-gray-600 mb-2">申请人：{{ req.created_by_user?.full_name }}</div>
      <div class="text-sm text-gray-600 mb-3 line-clamp-2">用途：{{ req.purpose }}</div>
      
      <div class="mb-3 p-2 bg-red-50 rounded">
        <div class="text-xs text-red-600 font-medium mb-1">高危试剂列表</div>
        <div v-for="(item, idx) in req.items" :key="idx" class="text-xs text-gray-600">
          {{ item.reagent_batch?.reagent?.name }} - {{ item.quantity }}{{ item.reagent_batch?.reagent?.unit }}
        </div>
      </div>
      
      <div class="flex gap-2">
        <el-button type="success" class="flex-1" @click="handleConfirm(req)">确认</el-button>
        <el-button class="flex-1" @click="$router.push(`/requisitions/${req.id}`)">详情</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const pendingList = ref<any[]>([])

async function loadPending() {
  try {
    const data = await api.get('/requisitions/pending-confirmation?limit=50') as any
    pendingList.value = data || []
  } catch (e) {
    console.error(e)
  }
}

async function handleConfirm(req: any) {
  try {
    await ElMessageBox.confirm('确定要确认此领用申请吗？此操作不可撤销。', '双人确认', {
      type: 'warning',
      confirmButtonText: '确认'
    })
    await api.post(`/requisitions/${req.id}/confirm`)
    ElMessage.success('确认成功')
    loadPending()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  loadPending()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
