<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 150px" @change="loadRequisitions">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="待审批" value="PENDING" />
            <el-option label="待双人确认" value="PENDING_CONFIRM" />
            <el-option label="已批准" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
            <el-option label="已领用" value="PICKED_UP" />
            <el-option label="已归还" value="RETURNED" />
          </el-select>
          <el-checkbox v-model="filterDoubleConfirm" @change="loadRequisitions">需双人确认</el-checkbox>
        </div>
        <el-button type="primary" @click="$router.push('/m/requisition')">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建申请
        </el-button>
      </div>
      
      <el-table :data="requisitions" v-loading="loading">
        <el-table-column label="申请编号" width="160">
          <template #default="{ row }">
            <span class="font-medium">{{ row.requisition_number }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="120">
          <template #default="{ row }">
            {{ row.created_by_user?.full_name || row.created_by_user?.username }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :class="`status-${row.status}`" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领用项" width="80">
          <template #default="{ row }">
            {{ row.items?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="双人确认" width="120">
          <template #default="{ row }">
            <span v-if="row.requires_double_confirm">
              <el-tag v-if="row.first_confirmer_id && row.second_confirmer_id" type="success" size="small">已完成</el-tag>
              <el-tag v-else type="warning" size="small">{{ row.first_confirmer_id ? '1/2' : '0/2' }}</el-tag>
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="用途" min-width="200">
          <template #default="{ row }">
            <div class="truncate" :title="row.purpose">{{ row.purpose }}</div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/requisitions/${row.id}`)">详情</el-button>
            <el-button
              v-if="canConfirm(row)"
              type="success"
              link
              @click="handleConfirm(row)"
            >
              {{ getConfirmText(row) }}
            </el-button>
            <el-button
              v-if="canApprove(row)"
              type="primary"
              link
              @click="handleApprove(row)"
            >
              审批
            </el-button>
            <el-button
              v-if="canPickUp(row)"
              type="success"
              link
              @click="handlePickUp(row)"
            >
              领用
            </el-button>
            <el-button
              v-if="canReturn(row)"
              type="warning"
              link
              @click="handleReturn(row)"
            >
              归还
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mt-4 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRequisitions"
          @current-change="loadRequisitions"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const requisitions = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filterStatus = ref('')
const filterDoubleConfirm = ref(false)

function statusText(status: string) {
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function canConfirm(row: any) {
  if (!row.requires_double_confirm) return false
  if (row.status !== 'PENDING') return false
  if (!userStore.isMember) return false
  if (row.created_by === userStore.user?.id) return false
  if (row.first_confirmer_id === userStore.user?.id) return false
  if (row.second_confirmer_id) return false
  return true
}

function getConfirmText(row: any) {
  return row.first_confirmer_id ? '第二确认人' : '第一确认人'
}

function canApprove(row: any) {
  if (!userStore.isAdmin) return false
  if (row.status !== 'PENDING') return false
  if (row.requires_double_confirm && (!row.first_confirmer_id || !row.second_confirmer_id)) return false
  return true
}

function canPickUp(row: any) {
  return row.status === 'APPROVED' && (row.created_by === userStore.user?.id || userStore.isAdmin)
}

function canReturn(row: any) {
  return row.status === 'PICKED_UP' && (row.created_by === userStore.user?.id || userStore.isAdmin)
}

async function loadRequisitions() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      limit: pageSize.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (filterDoubleConfirm.value) {
      params.requires_double_confirm = true
    }
    
    const data = await api.get('/requisitions', { params }) as any
    requisitions.value = data.items || data || []
    total.value = data.total || data.length || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleConfirm(row: any) {
  try {
    await ElMessageBox.confirm('确定要确认此领用申请吗？', '确认操作')
    await api.post(`/requisitions/${row.id}/confirm`)
    ElMessage.success('确认成功')
    loadRequisitions()
  } catch (e) {
    console.error(e)
  }
}

async function handleApprove(row: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入审批意见（可选）', '审批申请', {
      confirmButtonText: '批准',
      cancelButtonText: '拒绝',
      inputType: 'textarea',
      distinguishCancelAndClose: true
    })
    
    if (value !== undefined) {
      await api.post(`/requisitions/${row.id}/approve`, { comment: value })
      ElMessage.success('已批准')
    } else {
      await api.post(`/requisitions/${row.id}/reject`, { comment: '拒绝' })
      ElMessage.success('已拒绝')
    }
    loadRequisitions()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handlePickUp(row: any) {
  try {
    await ElMessageBox.confirm('确认已领取试剂？', '领用确认')
    await api.post(`/requisitions/${row.id}/pick-up`)
    ElMessage.success('领用成功')
    loadRequisitions()
  } catch (e) {
    console.error(e)
  }
}

async function handleReturn(row: any) {
  try {
    await ElMessageBox.confirm('确认已归还试剂？', '归还确认')
    await api.post(`/requisitions/${row.id}/return`)
    ElMessage.success('归还成功')
    loadRequisitions()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadRequisitions()
})
</script>
