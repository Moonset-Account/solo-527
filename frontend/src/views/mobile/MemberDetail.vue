<template>
  <div class="mobile-member-detail" v-if="member">
    <div class="member-header">
      <div class="avatar">
        <van-icon name="user-o" size="40" />
      </div>
      <div class="info">
        <h2>{{ member.name }}</h2>
        <p>
          <van-tag :type="levelTagType(member.level)" size="small">
            {{ member.level_name }}
          </van-tag>
          <span style="margin-left: 8px;">{{ member.phone_display || member.phone }}</span>
        </p>
      </div>
    </div>
    
    <div class="points-card">
      <div class="points-value">{{ member.points }}</div>
      <div class="points-label">当前积分</div>
    </div>
    
    <van-cell-group inset>
      <van-cell title="会员号" :value="member.member_no" />
      <van-cell title="性别" :value="member.gender === 'male' ? '男' : '女'" />
      <van-cell title="生日" :value="member.birthday || '-'" />
      <van-cell title="入会日期" :value="member.join_date" />
      <van-cell title="累计消费" :value="`¥${member.total_spent || 0}`" />
      <van-cell title="状态">
        <template #value>
          <van-tag :type="member.is_active ? 'success' : 'danger'" size="small">
            {{ member.is_active ? '正常' : '停用' }}
          </van-tag>
        </template>
      </van-cell>
    </van-cell-group>
    
    <van-divider>积分记录</van-divider>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
      <van-cell
        v-for="record in pointsHistory"
        :key="record.id"
        :title="record.change_type_display"
        :label="record.created_at"
      >
        <template #value>
          <span :style="{ color: record.points_change >= 0 ? '#52c41a' : '#ff4d4f' }">
            {{ record.points_change >= 0 ? '+' : '' }}{{ record.points_change }}
          </span>
        </template>
      </van-cell>
    </van-list>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { api } from '@/utils/request'

const route = useRoute()
const member = ref(null)
const pointsHistory = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)

const levelTagType = (level) => {
  const types = { 1: 'default', 2: 'primary', 3: 'warning', 4: 'danger' }
  return types[level] || 'default'
}

const loadMember = async () => {
  try {
    const { data } = await api.get(`/members/members/${route.params.id}/`)
    member.value = data
  } catch (e) {
    showToast('加载失败')
  }
}

const loadPointsHistory = async () => {
  try {
    const { data } = await api.get(`/members/members/${route.params.id}/points_history/`, {
      params: { page: page.value, page_size: 20 }
    })
    const results = data.results || data
    pointsHistory.value = [...pointsHistory.value, ...results]
    finished.value = !data.next
    page.value++
  } catch (e) {}
  loading.value = false
}

const onLoad = () => {
  loadPointsHistory()
}

onMounted(() => {
  loadMember()
  loadPointsHistory()
})
</script>

<style lang="scss" scoped>
.mobile-member-detail {
  padding-bottom: 60px;
  
  .member-header {
    display: flex;
    align-items: center;
    padding: 20px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    
    .info {
      h2 {
        margin: 0 0 6px;
        font-size: 20px;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }
    }
  }
  
  .points-card {
    background: #fff;
    margin: -20px 16px 16px;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 2;
    
    .points-value {
      font-size: 36px;
      font-weight: bold;
      color: #409eff;
    }
    
    .points-label {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }
}
</style>
