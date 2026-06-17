<template>
  <div class="portal-dashboard">
    <div class="page-header">
      <h2 class="page-title">首页概览</h2>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff">
          <div class="stat-title" style="color: rgba(255,255,255,0.8)">试剂总数</div>
          <div class="stat-value" style="color: #fff">{{ stats.reagents?.total || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff">
          <div class="stat-title" style="color: rgba(255,255,255,0.8)">库存预警</div>
          <div class="stat-value" style="color: #fff">{{ stats.reagents?.lowStock || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff">
          <div class="stat-title" style="color: rgba(255,255,255,0.8)">待我审核</div>
          <div class="stat-value" style="color: #fff">{{ stats.applications?.pending || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #fff">
          <div class="stat-title" style="color: rgba(255,255,255,0.8)">样本去向不明</div>
          <div class="stat-value" style="color: #fff">{{ stats.samples?.unknown || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="16">
        <div class="card-shadow">
          <div class="section-title" style="margin-bottom: 16px">我的最近申请</div>
          <el-table :data="myApplications" v-loading="loading" stripe>
            <el-table-column prop="applicationNo" label="申请单号" width="180" />
            <el-table-column prop="applicantName" label="申请人" width="100" />
            <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="ApplicationStatusType[row.status] as any">
                  {{ ApplicationStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/portal/applications/${row._id}`)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="card-shadow">
          <div class="section-title" style="margin-bottom: 16px">快捷操作</div>
          <div class="quick-actions">
            <el-button type="primary" style="width: 100%; margin-bottom: 12px" @click="$router.push('/portal/applications/new')">
              <el-icon><Plus /></el-icon>新建领用申请
            </el-button>
            <el-button style="width: 100%; margin-bottom: 12px" @click="$router.push('/portal/reagents')">
              <el-icon><Search /></el-icon>查询试剂库存
            </el-button>
            <el-button style="width: 100%; margin-bottom: 12px" @click="$router.push('/portal/instruments')">
              <el-icon><Cpu /></el-icon>预约仪器
            </el-button>
            <el-button
              v-if="userStore.isManager"
              type="warning"
              style="width: 100%"
              @click="$router.push('/admin/approvals')"
            >
              <el-icon><Check /></el-icon>审核申请
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { applicationApi, reagentApi, sampleApi, dashboardApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ApplicationStatusLabel, ApplicationStatusType, type Application } from '@/types'
import { Plus, Search, Cpu, Check } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const stats = ref<any>({
  reagents: { total: 0, lowStock: 0 },
  applications: { pending: 0 },
  samples: { unknown: 0 },
})
const myApplications = ref<Application[]>([])

async function loadData() {
  loading.value = true
  try {
    const [reagentStats, appStats, sampleStats, myApps] = await Promise.all([
      reagentApi.statistics().catch(() => ({ total: 0, lowStock: 0 })),
      applicationApi.statistics().catch(() => ({ pending: 0 })),
      sampleApi.statistics().catch(() => ({ unknown: 0 })),
      applicationApi.list({ pageSize: 5, page: 1 }).catch(() => ({ list: [] })),
    ])
    stats.value.reagents = reagentStats
    stats.value.applications = appStats
    stats.value.samples = sampleStats
    myApplications.value = myApps.list
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .stat-title {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 600;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}
</style>
