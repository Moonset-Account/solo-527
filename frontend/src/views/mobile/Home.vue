<template>
  <div class="mobile-home">
    <div class="user-card">
      <div class="user-info">
        <div class="avatar">
          <van-icon name="user-circle-o" size="48" />
        </div>
        <div class="info">
          <div class="name">{{ user?.first_name || user?.username }}</div>
          <div class="role">{{ roleName }}</div>
        </div>
      </div>
    </div>

    <div class="grid-menu">
      <div class="menu-item" @click="$router.push('/m/scan')">
        <van-icon name="scan" size="32" color="#1890ff" />
        <span>扫码查书</span>
      </div>
      <div class="menu-item" @click="$router.push('/m/reservations/create')">
        <van-icon name="add-o" size="32" color="#52c41a" />
        <span>创建预留</span>
      </div>
      <div class="menu-item" @click="$router.push('/m/events')">
        <van-icon name="calendar-o" size="32" color="#fa8c16" />
        <span>活动报名</span>
      </div>
      <div class="menu-item" @click="$router.push('/m/members')">
        <van-icon name="friends-o" size="32" color="#eb2f96" />
        <span>会员查询</span>
      </div>
      <div class="menu-item" @click="$router.push('/m/checkin')">
        <van-icon name="log-o" size="32" color="#722ed1" />
        <span>活动签到</span>
      </div>
      <div class="menu-item" @click="$router.push('/m/offline')">
        <van-icon name="cloud-offline-o" size="32" color="#faad14" />
        <span>离线数据</span>
        <van-badge v-if="pendingCount > 0" :content="pendingCount" class="badge" />
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">待办提醒</span>
      </div>
      <van-cell-group inset>
        <van-cell
          v-if="alerts.expired_reservations_count > 0"
          is-link
          :title="`过期预留单`"
          :label="`有 ${alerts.expired_reservations_count} 个预留单已过期`"
          :border="false"
          @click="$router.push('/m/reservations')"
        >
          <template #right-icon>
            <van-tag type="danger">{{ alerts.expired_reservations_count }}</van-tag>
          </template>
        </van-cell>
        <van-cell
          v-if="alerts.low_stock_count > 0"
          is-link
          :title="`库存预警`"
          :label="`有 ${alerts.low_stock_count} 本图书库存不足`"
          :border="false"
          @click="$router.push('/m/books?low=1')"
        >
          <template #right-icon>
            <van-tag type="warning">{{ alerts.low_stock_count }}</van-tag>
          </template>
        </van-cell>
        <van-cell v-if="alerts.expired_reservations_count === 0 && alerts.low_stock_count === 0">
          <span style="color: #999;">暂无待办事项</span>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">近期活动</span>
        <span class="section-more" @click="$router.push('/m/events')">全部</span>
      </div>
      <van-list v-model:loading="loading" :finished="eventsFinished" finished-text="没有更多了" @load="loadEvents">
        <van-cell-group inset v-for="event in events" :key="event.id" class="event-card">
          <van-cell
            is-link
            :title="event.title"
            :label="formatDate(event.start_time, 'MM-DD HH:mm')"
            :border="false"
            @click="$router.push(`/m/events/${event.id}`)"
          >
            <template #right-icon>
              <van-tag :type="event.status === 'registration_open' ? 'success' : 'default'">
                {{ event.status === 'registration_open' ? '报名中' : '已结束' }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'
import { formatDate, getPendingQueue } from '@/utils/device'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const roleName = computed(() => {
  const roles = { admin: '管理员', manager: '店长', staff: '员工' }
  return roles[user.value?.role] || '员工'
})

const pendingCount = ref(0)
const alerts = ref({ low_stock_count: 0, expired_reservations_count: 0, upcoming_events: [] })
const events = ref([])
const loading = ref(false)
const eventsFinished = ref(false)

const loadAlerts = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/alerts/')
    alerts.value = data
  } catch (e) {
  }
}

const loadEvents = async () => {
  try {
    const { data } = await api.get('/events/events/', { params: { upcoming: 'true', page_size: 5 } })
    events.value = data.results
    eventsFinished.value = true
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const refreshPending = () => {
  pendingCount.value = getPendingQueue().length
}

onMounted(() => {
  loadAlerts()
  loadEvents()
  refreshPending()
})
</script>

<style lang="scss" scoped>
.mobile-home {
  .user-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    margin-bottom: 16px;
    
    .user-info {
      display: flex;
      align-items: center;
      
      .avatar {
        margin-right: 16px;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .role {
        font-size: 13px;
        opacity: 0.8;
      }
    }
  }
  
  .grid-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    
    .menu-item {
      background: #fff;
      border-radius: 12px;
      padding: 20px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      
      span {
        margin-top: 8px;
        font-size: 13px;
        color: #333;
      }
      
      .badge {
        position: absolute;
        top: 10px;
        right: 10px;
      }
    }
  }
  
  .section {
    margin-bottom: 20px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px 12px;
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      .section-more {
        font-size: 13px;
        color: #1890ff;
      }
    }
    
    .event-card {
      margin-bottom: 10px;
    }
  }
}
</style>
