<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">权益中心</h2>
      <div class="filter-tabs">
        <el-radio-group v-model="filterLevel" size="default" @change="loadData">
          <el-radio-button value="">全部等级</el-radio-button>
          <el-radio-button v-for="lvl in levels" :key="lvl.level" :value="lvl.level">
            {{ lvl.levelName }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="benefit-section">
      <h3 class="section-title">
        <span class="title-icon">🎁</span>
        专属权益
      </h3>
      <div class="benefit-grid">
        <div v-for="benefit in benefitList" :key="benefit._id" class="benefit-card">
          <div class="benefit-header">
            <div class="benefit-icon">{{ benefit.icon }}</div>
            <el-tag size="small" :type="benefitTypeTag(benefit.type)">
              {{ benefitTypeText(benefit.type) }}
            </el-tag>
          </div>
          <div class="benefit-name">{{ benefit.name }}</div>
          <div class="benefit-value">{{ benefit.value }}</div>
          <div class="benefit-desc">{{ benefit.description }}</div>
          <div class="benefit-levels">
            <span class="levels-label">适用等级:</span>
            <span v-for="lv in benefit.applicableLevels" :key="lv" class="level-tag">
              {{ getLevelName(lv) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="benefit-section mt-20">
      <h3 class="section-title">
        <span class="title-icon">🏆</span>
        等级说明
      </h3>
      <div class="level-cards">
        <div v-for="level in levels" :key="level.level" class="level-card" :style="{ borderColor: level.color }">
          <div class="level-badge" :style="{ background: level.color }">
            {{ level.icon }}
          </div>
          <div class="level-name" :style="{ color: level.color }">{{ level.levelName }}</div>
          <div class="level-rules">
            <div class="rule-item">
              <span class="rule-label">所需积分</span>
              <span class="rule-value">{{ level.minPoints }}</span>
            </div>
            <div class="rule-item">
              <span class="rule-label">累计消费</span>
              <span class="rule-value">¥{{ level.minConsumption }}</span>
            </div>
            <div class="rule-item">
              <span class="rule-label">订单数量</span>
              <span class="rule-value">{{ level.minOrderCount }}单</span>
            </div>
          </div>
          <div class="level-multiplier">
            积分倍率: <strong>{{ level.pointsMultiplier }}x</strong>
          </div>
          <div class="level-desc">{{ level.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const filterLevel = ref('')
const benefitList = ref([])
const levels = ref([])

const benefitTypeMap = {
  coupon: { text: '优惠券', type: 'danger' },
  points: { text: '积分', type: 'warning' },
  service: { text: '服务', type: 'success' },
  gift: { text: '礼品', type: 'info' },
  discount: { text: '折扣', type: 'primary' },
}

function benefitTypeText(type) {
  return benefitTypeMap[type]?.text || type
}

function benefitTypeTag(type) {
  return benefitTypeMap[type]?.type || 'info'
}

function getLevelName(level) {
  const found = levels.value.find(l => l.level === level)
  return found?.levelName || level
}

async function loadData() {
  try {
    const params = { enabledOnly: true }
    if (filterLevel.value) params.level = filterLevel.value
    const [benefits, levelList] = await Promise.all([
      request.get('/benefits', { params }),
      request.get('/levels', { params: { enabledOnly: true } }),
    ])
    benefitList.value = benefits
    levels.value = levelList
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.filter-tabs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.benefit-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.benefit-card {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
  background: linear-gradient(135deg, #fdf2f8 0%, #fff 60%);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.12);
    border-color: #fce7f3;
  }
}

.benefit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.benefit-icon {
  font-size: 40px;
}

.benefit-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.benefit-value {
  font-size: 24px;
  font-weight: bold;
  color: #ec4899;
  margin-bottom: 8px;
}

.benefit-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.benefit-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

.levels-label {
  color: #9ca3af;
}

.level-tag {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.level-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.level-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  }
}

.level-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}

.level-rules {
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.rule-label {
  color: #9ca3af;
}

.rule-value {
  color: #1f2937;
  font-weight: 600;
}

.level-multiplier {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;

  strong {
    color: #ec4899;
  }
}

.level-desc {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}
</style>
