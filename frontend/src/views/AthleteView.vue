<template>
  <div class="athlete-view">
    <div class="profile-card">
      <el-avatar :size="80" style="background: #409eff">
        {{ currentUser?.name?.charAt(0) || currentUser?.athleteName?.charAt(0) }}
      </el-avatar>
      <div class="profile-info">
        <h2>{{ currentUser?.name || currentUser?.athleteName }}</h2>
        <p>
          <el-tag size="small">{{ currentUser?.sport }}</el-tag>
          <el-tag size="small" type="info">{{ currentUser?.position }}</el-tag>
          <el-tag size="small" type="success">{{ currentUser?.level }}</el-tag>
        </p>
        <p class="meta">年龄: {{ currentUser?.age }} | 性别: {{ currentUser?.gender }}</p>
      </div>
      <div class="profile-stats">
        <div class="ps-item">
          <div class="ps-value">{{ acwr.acwr || '-' }}</div>
          <div class="ps-label">ACWR</div>
          <div class="ps-tag">
            <el-tag :type="acwrRiskType" size="small">{{ acwr.risk || '-' }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <LoadCurveChart
          :data="loadData"
          :anomalies="loadAnomalies"
          metric="load"
          :loading="loading.load"
          @point-click="handlePointClick"
        />
      </el-col>
      <el-col :span="12">
        <RadarChart
          :data="radarData"
          :team-avg="teamAvg"
          :athlete-name="currentUser?.name"
          :loading="loading.radar"
        />
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <RecoveryTrendChart
          :data="recoveryData"
          :anomalies="recoveryAnomalies"
          :loading="loading.recovery"
        />
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-container">
          <div class="chart-title">
            <el-icon><List /></el-icon>
            <span>近期训练计划</span>
          </div>
          <el-table :data="planList" size="small" v-loading="loading.plans">
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column prop="exercise" label="动作" width="100" />
            <el-table-column label="计划" width="180">
              <template #default="{ row }">
                {{ row.plannedSets }}组 × {{ row.plannedReps }}次 @ {{ row.plannedIntensity }}%
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.adjusted" type="warning" size="small">已调整</el-tag>
                <el-tag v-else type="info" size="small">原计划</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原计划强度" width="120" v-if="userRole === 'coach'">
              <template #default="{ row }">
                <span v-if="row.originalIntensity" style="color: #f56c6c; text-decoration: line-through">
                  {{ row.originalIntensity }}%
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="实际完成" width="150">
              <template #default="{ row }">
                <span v-if="row.actual">
                  {{ row.actual.actualSets }}组 × {{ row.actual.actualReps }}次
                  <span :style="{ color: row.actual.completionRate >= 90 ? '#67c23a' : '#f56c6c' }">
                    ({{ row.actual.completionRate }}%)
                  </span>
                </span>
                <span v-else style="color: #c0c4cc">未完成</span>
              </template>
            </el-table-column>
            <el-table-column prop="adjustmentReason" label="调整原因" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="!row.actual"
                  @click="viewDetail(row.actual?.id)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { List } from '@element-plus/icons-vue'
import LoadCurveChart from '@/components/charts/LoadCurveChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import RecoveryTrendChart from '@/components/charts/RecoveryTrendChart.vue'
import { trainingApi, recoveryApi } from '@/api'

const router = useRouter()

const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const userRole = computed(() => currentUser.value.role || 'athlete')
const athleteId = computed(() => currentUser.value.id)

const loading = reactive({
  load: false,
  radar: false,
  recovery: false,
  plans: false
})

const loadData = ref([])
const loadAnomalies = ref([])
const radarData = ref([])
const teamAvg = ref([])
const recoveryData = ref([])
const recoveryAnomalies = ref([])
const planList = ref([])
const acwr = ref({})

const acwrRiskType = computed(() => {
  switch (acwr.value.risk) {
    case 'high': return 'danger'
    case 'low': return 'warning'
    case 'optimal': return 'success'
    default: return 'info'
  }
})

const loadDataAll = async () => {
  loading.load = true
  loading.radar = true
  loading.recovery = true
  loading.plans = true

  try {
    const [loadRes, radarRes, recRes, plansRes, acwrRes] = await Promise.all([
      trainingApi.getLoadCurve({ athleteId: athleteId.value }),
      trainingApi.getRadar({ athleteId: athleteId.value }),
      recoveryApi.getTrend({ athleteId: athleteId.value }),
      trainingApi.getPlans({ athleteId: athleteId.value }),
      trainingApi.getACWR({ athleteId: athleteId.value })
    ])

    loadData.value = loadRes.data.data
    loadAnomalies.value = loadRes.data.anomalies
    radarData.value = radarRes.data.radarData
    teamAvg.value = radarRes.data.teamAvg
    recoveryData.value = recRes.data
    recoveryAnomalies.value = recRes.data.anomalies
    planList.value = plansRes.data.slice(-30).reverse()
    acwr.value = acwrRes.data
  } finally {
    loading.load = false
    loading.radar = false
    loading.recovery = false
    loading.plans = false
  }
}

const handlePointClick = (d) => {
  const plans = planList.value.filter(p => p.date === d.key)
  if (plans.length > 0 && plans[0].actual) {
    viewDetail(plans[0].actual.id)
  }
}

const viewDetail = (id) => {
  if (id) router.push(`/training/${id}`)
}

onMounted(loadDataAll)
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-info h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

.profile-info p {
  margin: 4px 0;
}

.meta {
  color: #909399;
  font-size: 13px;
}

.profile-stats {
  margin-left: auto;
  text-align: center;
}

.ps-item .ps-value {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
}

.ps-item .ps-label {
  font-size: 13px;
  color: #909399;
}

.ps-tag {
  margin-top: 4px;
}
</style>
