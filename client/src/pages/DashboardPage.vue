<template>
  <div>
    <PageHeader title="首页仪表盘" subtitle="查看今日运营数据概览" />
    <a-row :gutter="[16, 16]">
      <a-col :xs="12" :md="6">
        <a-card class="stat-card">
          <div class="stat-icon primary">
            <CalendarOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayAppointments }}</div>
            <div class="stat-label">今日预约</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card">
          <div class="stat-icon orange">
            <UserOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayLeads }}</div>
            <div class="stat-label">今日线索</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card">
          <div class="stat-icon green">
            <PhoneOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingFollowups }}</div>
            <div class="stat-label">待回访</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card">
          <div class="stat-icon purple">
            <SafetyOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.qualityPassRate }}%</div>
            <div class="stat-label">质检合格率</div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { CalendarOutlined, UserOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'

const stats = reactive({
  todayAppointments: 0,
  todayLeads: 0,
  pendingFollowups: 0,
  qualityPassRate: 0,
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-bottom: 12px;
}

.stat-icon.primary {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #00b42a 0%, #52c41a 100%);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 4px;
}
</style>
