<template>
  <div class="crops-page">
    <div class="page-header">
      <h1 class="page-title">作物管理</h1>
      <div class="header-actions">
        <el-button v-if="isResident" type="primary" :icon="Plus" @click="showAdd = true">
          新增作物
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterPlot" placeholder="地块筛选" clearable style="width: 150px">
          <el-option v-for="plot in plots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px">
          <el-option label="已种植" value="planted" />
          <el-option label="生长中" value="growing" />
          <el-option label="已收获" value="harvested" />
          <el-option label="种植失败" value="failed" />
        </el-select>
      </div>

      <el-table :data="filteredCrops" stripe>
        <el-table-column prop="name" label="作物名称" width="120" />
        <el-table-column prop="variety" label="品种" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="所属地块" width="100">
          <template #default="{ row }">
            {{ getPlotNumber(row.plotId) }}
          </template>
        </el-table-column>
        <el-table-column label="种植日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.plantedDate) }}
          </template>
        </el-table-column>
        <el-table-column label="预计收获" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expectedHarvestDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plantedByName" label="种植人" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="updateStatus(row)">更新状态</el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" title="新增作物" width="500px">
      <el-form :model="cropForm" label-width="100px">
        <el-form-item label="所属地块">
          <el-select v-model="cropForm.plotId" placeholder="选择地块" style="width: 100%">
            <el-option v-for="plot in myPlots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="作物名称">
          <el-input v-model="cropForm.name" placeholder="如：番茄" />
        </el-form-item>
        <el-form-item label="品种">
          <el-input v-model="cropForm.variety" placeholder="如：樱桃番茄" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="cropForm.category" style="width: 100%">
            <el-option label="蔬菜" value="蔬菜" />
            <el-option label="水果" value="水果" />
            <el-option label="草本" value="草本" />
            <el-option label="花卉" value="花卉" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="种植日期">
          <el-date-picker v-model="cropForm.plantedDate" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计收获">
          <el-date-picker v-model="cropForm.expectedHarvestDate" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="cropForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="createCrop">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatusDialog" title="更新状态" width="400px">
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option label="生长中" value="growing" />
            <el-option label="已收获" value="harvested" />
            <el-option label="种植失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="statusForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateStatus">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="作物详情" width="600px">
      <div v-if="selectedCrop">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="作物名称">{{ selectedCrop.name }}</el-descriptions-item>
          <el-descriptions-item label="品种">{{ selectedCrop.variety }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ selectedCrop.category }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedCrop.status)">
              {{ getStatusText(selectedCrop.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="种植日期">{{ formatDate(selectedCrop.plantedDate) }}</el-descriptions-item>
          <el-descriptions-item label="预计收获">{{ formatDate(selectedCrop.expectedHarvestDate) }}</el-descriptions-item>
          <el-descriptions-item label="实际收获">
            {{ selectedCrop.actualHarvestDate ? formatDate(selectedCrop.actualHarvestDate) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="种植人">{{ selectedCrop.plantedByName }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedCrop.notes }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { cropService, plotService } from '@/services'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const crops = ref([])
const plots = ref([])
const myPlots = ref([])
const filterPlot = ref('')
const filterStatus = ref('')
const showAdd = ref(false)
const showStatusDialog = ref(false)
const showDetail = ref(false)
const selectedCrop = ref(null)

const cropForm = ref({
  plotId: '',
  name: '',
  variety: '',
  category: '蔬菜',
  plantedDate: new Date(),
  expectedHarvestDate: '',
  notes: ''
})

const statusForm = ref({
  status: 'growing',
  notes: ''
})

const isAdmin = computed(() => authStore.isAdmin)
const isResident = computed(() => authStore.isResident || authStore.isAdmin)

const filteredCrops = computed(() => {
  return crops.value.filter(crop => {
    if (filterPlot.value && crop.plotId !== filterPlot.value) return false
    if (filterStatus.value && crop.status !== filterStatus.value) return false
    return true
  })
})

onMounted(async () => {
  await loadCrops()
  await loadPlots()
})

async function loadCrops() {
  crops.value = await cropService.getAll({ orderBy: ['plantedDate', 'desc'] })
}

async function loadPlots() {
  plots.value = await plotService.getAll()
  if (isAdmin.value) {
    myPlots.value = plots.value
  } else {
    myPlots.value = await plotService.getPlotsByUser(authStore.userId)
  }
}

function getPlotNumber(plotId) {
  const plot = plots.value.find(p => p.id === plotId)
  return plot?.plotNumber || '-'
}

function getStatusType(status) {
  const map = {
    planted: 'primary',
    growing: 'success',
    harvested: '',
    failed: 'danger'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    planted: '已种植',
    growing: '生长中',
    harvested: '已收获',
    failed: '种植失败'
  }
  return map[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD')
}

async function createCrop() {
  if (!cropForm.value.plotId || !cropForm.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await cropService.createCrop(cropForm.value, authStore.userId)
    ElMessage.success('作物添加成功')
    showAdd.value = false
    await loadCrops()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

function updateStatus(crop) {
  selectedCrop.value = crop
  statusForm.value = { status: crop.status, notes: '' }
  showStatusDialog.value = true
}

async function confirmUpdateStatus() {
  try {
    await cropService.updateStatus(selectedCrop.value.id, statusForm.value.status, statusForm.value.notes)
    ElMessage.success('状态更新成功')
    showStatusDialog.value = false
    await loadCrops()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

function viewDetail(crop) {
  selectedCrop.value = crop
  showDetail.value = true
}
</script>

<style scoped>
.crops-page {
  padding: 0;
}
</style>
