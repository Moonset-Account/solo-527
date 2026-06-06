<template>
  <div class="harvest-page">
    <div class="page-header">
      <h1 class="page-title">收获记录</h1>
      <div class="header-actions">
        <el-button v-if="isResident" type="primary" :icon="Plus" @click="showAdd = true">
          记录收获
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="card-wrapper">
          <div class="filter-bar">
            <el-select v-model="filterPlot" placeholder="地块筛选" clearable style="width: 150px">
              <el-option v-for="plot in myPlots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 300px"
            />
          </div>

          <el-table :data="filteredHarvests" stripe>
            <el-table-column label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.harvestDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="cropName" label="作物名称" width="120" />
            <el-table-column label="产量" width="120">
              <template #default="{ row }">
                {{ row.quantity }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="quality" label="品质" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getQualityText(row.quality) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="harvestedByName" label="收获人" width="120" />
            <el-table-column prop="notes" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card-wrapper">
          <template #header>收获统计</template>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalHarvests }}</div>
              <div class="stat-label">总记录数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalQuantity }}</div>
              <div class="stat-label">总产量</div>
            </div>
          </div>
          <div class="chart-wrapper">
            <h4>各作物产量</h4>
            <div v-if="Object.keys(stats.byCrop).length === 0" class="empty">
              <el-empty description="暂无数据" :image-size="60" />
            </div>
            <div v-else class="crop-stats">
              <div v-for="(value, key) in stats.byCrop" :key="key" class="crop-stat-item">
                <span>{{ key }}</span>
                <el-progress :percentage="Math.round((value / stats.totalQuantity) * 100)" :show-text="false" />
                <span>{{ value }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAdd" title="记录收获" width="500px">
      <el-form :model="harvestForm" label-width="100px">
        <el-form-item label="选择地块">
          <el-select v-model="harvestForm.plotId" placeholder="请选择地块" style="width: 100%">
            <el-option v-for="plot in myPlots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="作物名称">
          <el-select v-model="harvestForm.cropName" placeholder="请选择或输入作物" allow-create filterable style="width: 100%">
            <el-option label="番茄" value="番茄" />
            <el-option label="黄瓜" value="黄瓜" />
            <el-option label="辣椒" value="辣椒" />
            <el-option label="茄子" value="茄子" />
            <el-option label="青菜" value="青菜" />
            <el-option label="萝卜" value="萝卜" />
          </el-select>
        </el-form-item>
        <el-form-item label="收获日期">
          <el-date-picker v-model="harvestForm.harvestDate" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="harvestForm.quantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="harvestForm.unit" style="width: 100%">
            <el-option label="公斤" value="公斤" />
            <el-option label="斤" value="斤" />
            <el-option label="个" value="个" />
            <el-option label="把" value="把" />
          </el-select>
        </el-form-item>
        <el-form-item label="品质">
          <el-select v-model="harvestForm.quality" style="width: 100%">
            <el-option label="优秀" value="excellent" />
            <el-option label="良好" value="good" />
            <el-option label="一般" value="fair" />
            <el-option label="较差" value="poor" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="harvestForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="createHarvest">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { harvestService, plotService } from '@/services'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const harvests = ref([])
const myPlots = ref([])
const filterPlot = ref('')
const dateRange = ref([])
const showAdd = ref(false)
const stats = ref({
  totalHarvests: 0,
  totalQuantity: 0,
  byCrop: {}
})

const harvestForm = ref({
  plotId: '',
  cropName: '',
  harvestDate: new Date(),
  quantity: 0,
  unit: '公斤',
  quality: 'good',
  notes: ''
})

const isResident = computed(() => authStore.isResident || authStore.isAdmin)

const filteredHarvests = computed(() => {
  let result = harvests.value
  
  if (filterPlot.value) {
    result = result.filter(h => h.plotId === filterPlot.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(h => {
      const date = h.harvestDate?.seconds ? new Date(h.harvestDate.seconds * 1000) : new Date(h.harvestDate)
      return date >= start && date <= end
    })
  }
  
  return result
})

onMounted(async () => {
  await loadHarvests()
  await loadMyPlots()
})

async function loadHarvests() {
  harvests.value = await harvestService.getAll({ orderBy: ['harvestDate', 'desc'] })
  const statsData = await harvestService.getHarvestStatistics()
  stats.value = statsData
}

async function loadMyPlots() {
  if (authStore.isAdmin) {
    myPlots.value = await plotService.getAll()
  } else {
    myPlots.value = await plotService.getPlotsByUser(authStore.userId)
  }
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD')
}

function getQualityText(quality) {
  const map = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return map[quality] || quality
}

async function createHarvest() {
  if (!harvestForm.value.plotId || !harvestForm.value.cropName) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await harvestService.createHarvest(
      harvestForm.value,
      authStore.userId,
      authStore.userData.name
    )
    ElMessage.success('记录成功')
    showAdd.value = false
    await loadHarvests()
  } catch (error) {
    ElMessage.error('记录失败')
  }
}
</script>

<style scoped>
.harvest-page {
  padding: 0;
}
.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 14px;
  color: #606266;
}
.chart-wrapper {
  margin-top: 20px;
}
.chart-wrapper h4 {
  margin-bottom: 16px;
}
.crop-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.crop-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.crop-stat-item span:first-child {
  width: 60px;
  font-size: 13px;
}
.crop-stat-item span:last-child {
  width: 50px;
  text-align: right;
  font-size: 13px;
}
.crop-stat-item .el-progress {
  flex: 1;
}
.empty {
  padding: 20px 0;
}
</style>
