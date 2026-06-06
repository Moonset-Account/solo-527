<template>
  <div class="claims-page">
    <div class="page-header">
      <h1 class="page-title">认领申请</h1>
      <div class="header-actions">
        <el-button v-if="isResident" type="primary" :icon="Plus" @click="showApply = true">
          提交申请
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-if="isAdmin" v-model="filterApplicant" placeholder="申请人筛选" clearable style="width: 150px">
          <el-option v-for="user in residents" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
      </div>

      <el-table :data="filteredClaims" stripe>
        <el-table-column prop="plotNumber" label="地块编号" width="120" />
        <el-table-column prop="applicantName" label="申请人" width="120" />
        <el-table-column prop="reason" label="申请原因" show-overflow-tooltip />
        <el-table-column label="计划种植" width="200">
          <template #default="{ row }">
            <el-tag v-for="crop in row.plannedCrops" :key="crop" size="small" style="margin-right: 4px">
              {{ crop }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isAdmin && row.status === 'pending'" type="primary" size="small" @click="approveClaim(row)">
              通过
            </el-button>
            <el-button v-if="isAdmin && row.status === 'pending'" type="danger" size="small" @click="rejectClaim(row)">
              拒绝
            </el-button>
            <el-button v-if="!isAdmin && row.applicantId === userId && row.status === 'pending'" type="warning" size="small" @click="cancelClaim(row)">
              取消
            </el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showApply" title="提交认领申请" width="500px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="选择地块">
          <el-select v-model="applyForm.plotId" placeholder="请选择地块" style="width: 100%">
            <el-option v-for="plot in availablePlots" :key="plot.id" :label="`${plot.plotNumber} - ${plot.name}`" :value="plot.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请原因">
          <el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="请说明您的种植计划和经验" />
        </el-form-item>
        <el-form-item label="计划种植">
          <el-select v-model="applyForm.plannedCrops" multiple placeholder="选择计划种植的作物" style="width: 100%">
            <el-option label="番茄" value="番茄" />
            <el-option label="黄瓜" value="黄瓜" />
            <el-option label="辣椒" value="辣椒" />
            <el-option label="茄子" value="茄子" />
            <el-option label="青菜" value="青菜" />
            <el-option label="萝卜" value="萝卜" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApply = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="申请详情" width="600px">
      <div v-if="selectedClaim">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="地块编号">{{ selectedClaim.plotNumber }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ selectedClaim.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedClaim.status)">
              {{ getStatusText(selectedClaim.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDate(selectedClaim.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ selectedClaim.reason }}</el-descriptions-item>
          <el-descriptions-item label="计划种植" :span="2">
            <el-tag v-for="crop in selectedClaim.plannedCrops" :key="crop" size="small" style="margin-right: 4px">
              {{ crop }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedClaim.reviewedAt" label="审批时间">{{ formatDate(selectedClaim.reviewedAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedClaim.reviewComment" label="审批意见" :span="2">{{ selectedClaim.reviewComment }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { claimService, plotService, userService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const claims = ref([])
const availablePlots = ref([])
const residents = ref([])
const filterStatus = ref('')
const filterApplicant = ref('')
const showApply = ref(false)
const showDetail = ref(false)
const selectedClaim = ref(null)

const applyForm = ref({
  plotId: '',
  reason: '',
  plannedCrops: []
})

const isAdmin = computed(() => authStore.isAdmin)
const isResident = computed(() => authStore.isResident || authStore.isAdmin)
const userId = computed(() => authStore.userId)

const filteredClaims = computed(() => {
  let result = claims.value
  
  if (!isAdmin.value) {
    result = result.filter(c => c.applicantId === userId.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value)
  }
  
  if (filterApplicant.value) {
    result = result.filter(c => c.applicantId === filterApplicant.value)
  }
  
  return result
})

onMounted(async () => {
  await loadClaims()
  await loadAvailablePlots()
  if (isAdmin.value) {
    await loadResidents()
  }
})

async function loadClaims() {
  claims.value = await claimService.getAll({ orderBy: ['createdAt', 'desc'] })
}

async function loadAvailablePlots() {
  availablePlots.value = await plotService.getAvailablePlots()
}

async function loadResidents() {
  residents.value = await userService.getResidents()
}

function getStatusType(status) {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return typeMap[status] || 'info'
}

function getStatusText(status) {
  const textMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return textMap[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD HH:mm')
}

function viewDetail(claim) {
  selectedClaim.value = claim
  showDetail.value = true
}

async function submitApply() {
  if (!applyForm.value.plotId || !applyForm.value.reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const plot = availablePlots.value.find(p => p.id === applyForm.value.plotId)
  
  try {
    await claimService.createClaim(
      applyForm.value.plotId,
      userId.value,
      authStore.userData.name,
      plot.plotNumber,
      applyForm.value
    )
    ElMessage.success('申请提交成功')
    showApply.value = false
    applyForm.value = { plotId: '', reason: '', plannedCrops: [] }
    await loadClaims()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

async function approveClaim(claim) {
  ElMessageBox.prompt('请输入审批意见（可选）', '通过申请', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea'
  }).then(async ({ value }) => {
    try {
      await claimService.approveClaim(claim.id, userId.value, value)
      ElMessage.success('已通过申请')
      await loadClaims()
      await loadAvailablePlots()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

async function rejectClaim(claim) {
  ElMessageBox.prompt('请输入拒绝原因', '拒绝申请', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea'
  }).then(async ({ value }) => {
    try {
      await claimService.rejectClaim(claim.id, userId.value, value)
      ElMessage.success('已拒绝申请')
      await loadClaims()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

async function cancelClaim(claim) {
  ElMessageBox.confirm('确定要取消该申请吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await claimService.cancelClaim(claim.id)
      ElMessage.success('已取消申请')
      await loadClaims()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.claims-page {
  padding: 0;
}
</style>
