<template>
  <div class="rotation-page">
    <div class="page-header">
      <h1 class="page-title">轮值表</h1>
      <div class="header-actions">
        <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="showAdd = true">
          安排轮值
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px">
          <el-option label="待执行" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已缺席" value="absent" />
        </el-select>
        <el-select v-if="isAdmin" v-model="filterAssignee" placeholder="负责人筛选" clearable style="width: 150px">
          <el-option v-for="user in residents" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
        <el-button type="info" @click="loadRotations">查询</el-button>
      </div>

      <el-table :data="filteredRotations" stripe>
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="任务描述" show-overflow-tooltip />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="assigneeName" label="负责人" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="连续缺席" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.consecutiveAbsences >= 3" type="danger">
              {{ row.consecutiveAbsences }}次
            </el-tag>
            <span v-else>{{ row.consecutiveAbsences || 0 }}次</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending' && row.assigneeId === userId" type="primary" size="small" @click="startRotation(row)">
              开始
            </el-button>
            <el-button v-if="row.status === 'in_progress' && row.assigneeId === userId" type="success" size="small" @click="completeRotation(row)">
              完成
            </el-button>
            <el-button v-if="isAdmin && row.status === 'pending'" type="warning" size="small" @click="markAbsent(row)">
              标记缺席
            </el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" title="安排轮值" width="500px">
      <el-form :model="rotationForm" label-width="100px">
        <el-form-item label="日期">
          <el-date-picker v-model="rotationForm.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="rotationForm.type" style="width: 100%">
            <el-option label="浇水" value="water" />
            <el-option label="施肥" value="fertilize" />
            <el-option label="除草" value="weed" />
            <el-option label="防虫" value="pest" />
            <el-option label="清理" value="clean" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="rotationForm.assigneeId" placeholder="选择负责人" style="width: 100%" @change="onAssigneeChange">
            <el-option v-for="user in residents" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker v-model="rotationForm.startTime" format="HH:mm" value-format="HH:mm" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker v-model="rotationForm.endTime" format="HH:mm" value-format="HH:mm" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="涉及地块">
          <el-select v-model="rotationForm.plotIds" multiple placeholder="选择地块" style="width: 100%">
            <el-option v-for="plot in plots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="rotationForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="createRotation">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="轮值详情" width="600px">
      <div v-if="selectedRotation">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日期">{{ formatDate(selectedRotation.date) }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeText(selectedRotation.type) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedRotation.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedRotation.status)">
              {{ getStatusText(selectedRotation.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ selectedRotation.startTime }} - {{ selectedRotation.endTime }}</el-descriptions-item>
          <el-descriptions-item label="实际开始">
            {{ selectedRotation.actualStartTime ? formatDate(selectedRotation.actualStartTime) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="实际结束">
            {{ selectedRotation.actualEndTime ? formatDate(selectedRotation.actualEndTime) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRotation.notes || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog v-model="showCompleteForm" title="完成轮值" width="400px">
      <el-form :model="completeForm" label-width="80px">
        <el-form-item label="完成备注">
          <el-input v-model="completeForm.notes" type="textarea" :rows="3" placeholder="请输入完成情况说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteForm = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确定完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { rotationService, userService, plotService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const rotations = ref([])
const residents = ref([])
const plots = ref([])
const dateRange = ref([])
const filterStatus = ref('')
const filterAssignee = ref('')
const showAdd = ref(false)
const showDetail = ref(false)
const showCompleteForm = ref(false)
const selectedRotation = ref(null)

const rotationForm = ref({
  date: null,
  type: 'water',
  assigneeId: '',
  assigneeName: '',
  startTime: '09:00',
  endTime: '11:00',
  plotIds: [],
  description: ''
})

const completeForm = ref({
  notes: ''
})

const isAdmin = computed(() => authStore.isAdmin)
const userId = computed(() => authStore.userId)

const filteredRotations = computed(() => {
  let result = rotations.value
  
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value)
  }
  
  if (filterAssignee.value) {
    result = result.filter(r => r.assigneeId === filterAssignee.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(r => {
      const date = r.date?.seconds ? new Date(r.date.seconds * 1000) : new Date(r.date)
      return date >= start && date <= end
    })
  }
  
  return result
})

onMounted(async () => {
  await loadRotations()
  await loadResidents()
  await loadPlots()
})

async function loadRotations() {
  rotations.value = await rotationService.getAll({ orderBy: ['date', 'desc'] })
  
  for (const rotation of rotations.value) {
    if (rotation.assigneeId) {
      rotation.consecutiveAbsences = await rotationService.countConsecutiveAbsences(rotation.assigneeId)
    }
  }
}

async function loadResidents() {
  residents.value = await userService.getResidents()
}

async function loadPlots() {
  plots.value = await plotService.getAll()
}

function onAssigneeChange(assigneeId) {
  const user = residents.value.find(u => u.id === assigneeId)
  if (user) {
    rotationForm.value.assigneeName = user.name
  }
}

function getTypeText(type) {
  const typeMap = {
    water: '浇水',
    fertilize: '施肥',
    weed: '除草',
    pest: '防虫',
    clean: '清理',
    other: '其他'
  }
  return typeMap[type] || type
}

function getStatusType(status) {
  const typeMap = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    absent: 'danger'
  }
  return typeMap[status] || 'info'
}

function getStatusText(status) {
  const textMap = {
    pending: '待执行',
    in_progress: '进行中',
    completed: '已完成',
    absent: '已缺席'
  }
  return textMap[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD')
}

function viewDetail(rotation) {
  selectedRotation.value = rotation
  showDetail.value = true
}

async function createRotation() {
  if (!rotationForm.value.date || !rotationForm.value.assigneeId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await rotationService.createRotation({
      ...rotationForm.value,
      date: dayjs(rotationForm.value.date).toDate()
    })
    ElMessage.success('轮值安排成功')
    showAdd.value = false
    await loadRotations()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

async function startRotation(rotation) {
  try {
    await rotationService.startRotation(rotation.id)
    ElMessage.success('已开始轮值')
    await loadRotations()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function completeRotation(rotation) {
  selectedRotation.value = rotation
  completeForm.value = { notes: '' }
  showCompleteForm.value = true
}

async function confirmComplete() {
  try {
    await rotationService.completeRotation(selectedRotation.value.id, completeForm.value.notes)
    ElMessage.success('轮值已完成')
    showCompleteForm.value = false
    await loadRotations()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function markAbsent(rotation) {
  ElMessageBox.confirm(`确定要将 ${rotation.assigneeName} 标记为缺席吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await rotationService.markAbsent(rotation.id, userId.value)
      ElMessage.success('已标记缺席')
      await loadRotations()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.rotation-page {
  padding: 0;
}
</style>
