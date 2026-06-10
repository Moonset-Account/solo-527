<template>
  <div class="page-container">
    <div class="stat-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card card-1">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.memberTotal || 0 }}</div>
              <div class="stat-label">会员总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-2">
            <div class="stat-icon">🎫</div>
            <div class="stat-info">
              <div class="stat-value">{{ couponTotal }}</div>
              <div class="stat-label">优惠券数量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-3">
            <div class="stat-icon">✨</div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.activityTotal || 0 }}</div>
              <div class="stat-label">活跃记录</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-4">
            <div class="stat-icon">📨</div>
            <div class="stat-info">
              <div class="stat-value">{{ reachTotal }}</div>
              <div class="stat-label">触达次数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16" class="mt-20">
      <el-col :span="16">
        <div class="card-wrapper">
          <div class="card-header">
            <span class="card-title">会员等级分布</span>
          </div>
          <div class="level-list">
            <div v-for="level in levels" :key="level.level" class="level-item">
              <div class="level-icon" :style="{ background: level.color + '20', color: level.color }">
                {{ level.icon }}
              </div>
              <div class="level-info">
                <div class="level-name">{{ level.levelName }}</div>
                <div class="level-desc">{{ level.description }}</div>
              </div>
              <div class="level-count">
                <span class="count">{{ getLevelCount(level.level) }}</span>
                <span class="unit">人</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header">
            <span class="card-title">快速入口</span>
          </div>
          <div class="quick-actions">
            <div v-for="item in quickActions" :key="item.path" class="quick-item" @click="goTo(item.path)">
              <div class="quick-icon">{{ item.icon }}</div>
              <div class="quick-text">{{ item.title }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-20">
      <el-col :span="24">
        <div class="card-wrapper">
          <div class="card-header">
            <span class="card-title">我的权益</span>
            <el-button type="primary" link @click="goTo('/benefits')">查看全部</el-button>
          </div>
          <div class="benefit-grid">
            <div v-for="benefit in benefits" :key="benefit._id" class="benefit-card">
              <div class="benefit-icon">{{ benefit.icon }}</div>
              <div class="benefit-name">{{ benefit.name }}</div>
              <div class="benefit-desc">{{ benefit.description }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

const overview = ref({})
const levels = ref([])
const benefits = ref([])

const couponTotal = computed(() => {
  if (!overview.value?.couponStats) return 0
  return overview.value.couponStats.reduce((sum, item) => sum + item.count, 0)
})

const reachTotal = computed(() => {
  if (!overview.value?.reachStats) return 0
  return overview.value.reachStats.reduce((sum, item) => sum + item.count, 0)
})

const quickActions = [
  { path: '/coupons', title: '复购券查询', icon: '🎫' },
  { path: '/points', title: '积分查询', icon: '💰' },
  { path: '/redeems', title: '兑换记录', icon: '🎁' },
  { path: '/members', title: '会员列表', icon: '👤' },
  { path: '/activities', title: '活跃追踪', icon: '📊' },
  { path: '/benefits', title: '权益中心', icon: '✨' },
]

function getLevelCount(level) {
  const stats = overview.value?.levelStats || []
  const item = stats.find(s => s._id === level)
  return item?.count || 0
}

function goTo(path) {
  router.push(path)
}

async function loadData() {
  try {
    const [overviewRes, levelsRes, benefitsRes] = await Promise.all([
      request.get('/reports/overview'),
      request.get('/levels', { params: { enabledOnly: true } }),
      request.get('/benefits', { params: { enabledOnly: true } }),
    ])
    overview.value = overviewRes
    levels.value = levelsRes
    benefits.value = benefitsRes.slice(0, 6)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.stat-cards {
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .stat-icon {
    font-size: 36px;
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f2;
  }
  .card-1 .stat-icon { background: #fef2f2; }
  .card-2 .stat-icon { background: #eff6ff; }
  .card-3 .stat-icon { background: #f0fdf4; }
  .card-4 .stat-icon { background: #fdf4ff; }

  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-top: 4px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.level-list {
  .level-item {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 16px;

    &:last-child {
      border-bottom: none;
    }
  }
  .level-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .level-info {
    flex: 1;
  }
  .level-name {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }
  .level-desc {
    font-size: 13px;
    color: #9ca3af;
    margin-top: 4px;
  }
  .level-count {
    text-align: right;
    .count {
      font-size: 24px;
      font-weight: bold;
      color: #ec4899;
    }
    .unit {
      font-size: 13px;
      color: #9ca3af;
      margin-left: 4px;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.quick-item {
  text-align: center;
  padding: 20px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;

  &:hover {
    background: #fef2f7;
    transform: translateY(-2px);
  }
}
.quick-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.quick-text {
  font-size: 13px;
  color: #374151;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
.benefit-card {
  text-align: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #fdf2f8 0%, #faf5ff 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.15);
  }
}
.benefit-icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.benefit-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}
.benefit-desc {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}
</style>
