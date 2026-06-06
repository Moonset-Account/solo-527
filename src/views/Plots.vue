<template>
  <div class="plots-page">
    <div class="page-header">
      <h1 class="page-title">地块地图</h1>
      <div class="header-actions">
        <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="showAddPlot = true">
          新增地块
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterZone" placeholder="选择区域" clearable style="width: 150px">
          <el-option label="全部区域" value="" />
          <el-option v-for="zone in zones" :key="zone" :label="`${zone}区`" :value="zone" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px">
          <el-option label="可认领" value="available" />
          <el-option label="已认领" value="claimed" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
        <div class="legend">
          <span class="legend-item"><span class="status-dot available"></span> 可认领</span>
          <span class="legend-item"><span class="status-dot claimed"></span> 已认领</span>
          <span class="legend-item"><span class="status-dot maintenance"></span> 维护中</span>
        </div>
      </div>

      <div class="plots-grid">
        <div
          v-for="plot in filteredPlots"
          :key="plot.id"
          class="plot-card"
          :class="plot.status"
          @click="viewPlotDetail(plot)"
        >
          <div class="plot-number">{{ plot.plotNumber }}</div>
          <div class="plot-name">{{ plot.name }}</div>
          <div class="plot-area">{{ plot.area }}㎡</div>
          <div class="plot-status">
            <span class="status-tag" :class="'status-' + plot.status">
              {{ getStatusText(plot.status) }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showPlotDetail" title="地块详情" width="600px">
      <div v-if="selectedPlot" class="plot-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="地块编号">{{ selectedPlot.plotNumber }}</el-descriptions-item>
          <el-descriptions-item label="地块名称">{{ selectedPlot.name }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ selectedPlot.area }}㎡</el-descriptions-item>
          <el-descriptions-item label="状态">
            <span class="status-tag" :class="'status-' + selectedPlot.status">
              {{ getStatusText(selectedPlot.status) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="区域">{{ selectedPlot.location?.zone }}区</el-descriptions-item>
          <el-descriptions-item label="位置">第{{ selectedPlot.location?.row }}行 第{{ selectedPlot.location?.col }}列</el-descriptions-item>
          <el-descriptions-item label="土壤类型">{{ selectedPlot.soilType }}</el-descriptions-item>
          <el-descriptions-item label="光照条件">{{ selectedPlot.sunlight }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedPlot.description }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions" style="margin-top: 20px">
          <el-button v-if="selectedPlot.status === 'available' && isResident" type="primary" @click="applyClaim">
            申请认领
          </el-button>
          <el-button v-if="isAdmin" type="warning" @click="toggleMaintenance">
            {{ selectedPlot.status === 'maintenance' ? '取消维护' : '设为维护' }}
          </el-button>
          <el-button v-if="isAdmin && selectedPlot.status === 'claimed'" type="danger" @click="releasePlot">
            释放地块
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showAddPlot" title="新增地块" width="500px">
      <el-form :model="plotForm" label-width="100px">
        <el-form-item label="地块编号">
          <el-input v-model="plotForm.plotNumber" placeholder="如：A-01" />
        </el-form-item>
        <el-form-item label="地块名称">
          <el-input v-model="plotForm.name" placeholder="给地块起个名字" />
        </el-form-item>
        <el-form-item label="面积(㎡)">
          <el-input-number v-model="plotForm.area" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="plotForm.zone" placeholder="A/B/C..." />
        </el-form-item>
        <el-form-item label="行">
          <el-input-number v-model="plotForm.row" :min="1" />
        </el-form-item>
        <el-form-item label="列">
          <el-input-number v-model="plotForm.col" :min="1" />
        </el-form-item>
        <el-form-item label="土壤类型">
          <el-input v-model="plotForm.soilType" placeholder="如：壤土、砂土" />
        </el-form-item>
        <el-form-item label="光照条件">
          <el-select v-model="plotForm.sunlight" style="width: 100%">
            <el-option label="全日照" value="full" />
            <el-option label="半日照" value="partial" />
            <el-option label="遮阴" value="shade" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="plotForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPlot = false">取消</el-button>
        <el-button type="primary" @click="createPlot">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showClaimForm" title="认领申请" width="500px">
      <el-form :model="claimForm" label-width="100px">
        <el-form-item label="申请原因">
          <el-input v-model="claimForm.reason" type="textarea" :rows="3" placeholder="请说明您的种植计划和经验" />
        </el-form-item>
        <el-form-item label="计划种植">
          <el-select v-model="claimForm.plannedCrops" multiple placeholder="选择计划种植的作物" style="width: 100%">
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
        <el-button @click="showClaimForm = false">取消</el-button>
        <el-button type="primary" @click="submitClaim">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { plotService, claimService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const plots = ref([])
const filterZone = ref('')
const filterStatus = ref('')
const showAddPlot = ref(false)
const showPlotDetail = ref(false)
const showClaimForm = ref(false)
const selectedPlot = ref(null)

const plotForm = ref({
  plotNumber: '',
  name: '',
  area: 10,
  zone: 'A',
  row: 1,
  col: 1,
  soilType: '',
  sunlight: 'full',
  description: ''
})

const claimForm = ref({
  reason: '',
  plannedCrops: []
})

const isAdmin = computed(() => authStore.isAdmin)
const isResident = computed(() => authStore.isResident || authStore.isAdmin)

const zones = computed(() => {
  const zoneSet = new Set(plots.value.map(p => p.location?.zone).filter(Boolean))
  return Array.from(zoneSet).sort()
})

const filteredPlots = computed(() => {
  return plots.value.filter(plot => {
    if (filterZone.value && plot.location?.zone !== filterZone.value) return false
    if (filterStatus.value && plot.status !== filterStatus.value) return false
    return true
  })
})

onMounted(async () => {
  await loadPlots()
})

async function loadPlots() {
  plots.value = await plotService.getAll({ orderBy: ['plotNumber', 'asc'] })
}

function getStatusText(status) {
  const statusMap = {
    available: '可认领',
    claimed: '已认领',
    maintenance: '维护中'
  }
  return statusMap[status] || status
}

function viewPlotDetail(plot) {
  selectedPlot.value = plot
  showPlotDetail.value = true
}

function applyClaim() {
  showPlotDetail.value = false
  showClaimForm.value = true
}

async function submitClaim() {
  if (!claimForm.value.reason) {
    ElMessage.warning('请填写申请原因')
    return
  }
  
  try {
    await claimService.createClaim(
      selectedPlot.value.id,
      authStore.userId,
      authStore.userData.name,
      selectedPlot.value.plotNumber,
      claimForm.value
    )
    ElMessage.success('申请提交成功')
    showClaimForm.value = false
    claimForm.value = { reason: '', plannedCrops: [] }
  } catch (error) {
    ElMessage.error('申请提交失败')
  }
}

async function createPlot() {
  try {
    await plotService.create({
      plotNumber: plotForm.value.plotNumber,
      name: plotForm.value.name,
      area: plotForm.value.area,
      location: {
        zone: plotForm.value.zone,
        row: plotForm.value.row,
        col: plotForm.value.col
      },
      soilType: plotForm.value.soilType,
      sunlight: plotForm.value.sunlight,
      description: plotForm.value.description,
      status: 'available'
    })
    ElMessage.success('地块创建成功')
    showAddPlot.value = false
    await loadPlots()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

async function toggleMaintenance() {
  try {
    if (selectedPlot.value.status === 'maintenance') {
      await plotService.update(selectedPlot.value.id, { status: 'available' })
    } else {
      await plotService.setMaintenance(selectedPlot.value.id)
    }
    ElMessage.success('状态更新成功')
    await loadPlots()
    selectedPlot.value = await plotService.getById(selectedPlot.value.id)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function releasePlot() {
  ElMessageBox.confirm('确定要释放该地块吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await plotService.releasePlot(selectedPlot.value.id)
      ElMessage.success('地块已释放')
      await loadPlots()
      selectedPlot.value = await plotService.getById(selectedPlot.value.id)
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.plots-page {
  padding: 0;
}
.plots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.plot-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}
.plot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.plot-card.available {
  border-color: #67c23a;
}
.plot-card.claimed {
  border-color: #409eff;
}
.plot-card.maintenance {
  border-color: #f56c6c;
}
.plot-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.plot-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}
.plot-area {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.legend {
  display: flex;
  gap: 20px;
  margin-left: auto;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-dot.available {
  background: #67c23a;
}
.status-dot.claimed {
  background: #409eff;
}
.status-dot.maintenance {
  background: #f56c6c;
}
.plot-detail {
  padding: 10px 0;
}
.detail-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
