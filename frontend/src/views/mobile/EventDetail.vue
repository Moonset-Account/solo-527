<template>
  <div class="mobile-event-detail" v-if="event">
    <div class="event-cover">
      <img v-if="event.cover" :src="event.cover" alt="" />
      <div v-else class="no-cover">
        <van-icon name="friends-o" size="60" />
      </div>
      <div class="event-meta">
        <h1 class="title">{{ event.title }}</h1>
        <div class="tags">
          <van-tag type="primary">{{ event.event_type?.name || '-' }}</van-tag>
          <van-tag :type="statusTagType(event.status)">
            {{ event.status_display }}
          </van-tag>
        </div>
      </div>
    </div>
    
    <van-cell-group inset style="margin-top: -20px; position: relative; z-index: 2; border-radius: 8px;">
      <van-cell title="活动时间" :value="`${event.start_date} ${event.start_time}-${event.end_time}`" />
      <van-cell title="活动地点" :value="event.location" />
      <van-cell title="报名人数" :value="`${event.current_participants || 0}/${event.max_participants} 人`" />
      <van-cell title="活动费用" :value="event.fee > 0 ? `¥${event.fee}` : '免费'" />
      <van-cell title="需要签到" :value="event.need_checkin ? '是' : '否'" />
    </van-cell-group>
    
    <van-divider>活动简介</van-divider>
    <div class="description">
      {{ event.description || '暂无简介' }}
    </div>
    
    <div class="bottom-actions">
      <van-button
        v-if="canRegister"
        type="primary"
        block
        :disabled="isFull"
        @click="registerEvent"
      >
        {{ isFull ? '名额已满' : '立即报名' }}
      </van-button>
      <van-button
        v-if="isRegistered"
        type="success"
        block
        disabled
      >
        已报名
      </van-button>
      <van-button
        v-if="event.need_checkin && isRegistered"
        type="warning"
        block
        style="margin-top: 8px;"
        @click="goCheckIn"
      >
        前往签到
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const event = ref(null)
const isRegistered = ref(false)

const statusTagType = (status) => {
  const types = { draft: 'default', published: 'primary', ongoing: 'success', ended: 'warning' }
  return types[status] || 'default'
}

const isFull = computed(() => {
  return event.value && (event.value.current_participants || 0) >= event.value.max_participants
})

const canRegister = computed(() => {
  return event.value && ['published', 'ongoing'].includes(event.value.status) && !isRegistered.value
})

const loadEvent = async () => {
  try {
    const { data } = await api.get(`/events/events/${route.params.id}/`)
    event.value = data
  } catch (e) {
    showToast('加载失败')
  }
}

const registerEvent = async () => {
  try {
    await showConfirmDialog({ title: '确认报名', message: `确定要报名「${event.value.title}」吗？` })
    
    const { data: members } = await api.get('/members/members/', { params: { page_size: 1 } })
    if (!members.results || members.results.length === 0) {
      showToast('请先创建会员档案')
      return
    }
    
    await api.post(`/events/events/${event.value.id}/register/`, {
      member_id: members.results[0].id
    })
    showToast('报名成功')
    isRegistered.value = true
    loadEvent()
  } catch (e) {
    if (e !== 'cancel') {
      const msg = e.response?.data?.error || '报名失败'
      showToast(msg)
    }
  }
}

const goCheckIn = () => {
  router.push({ path: '/m/checkin', query: { event_id: event.value.id } })
}

onMounted(loadEvent)
</script>

<style lang="scss" scoped>
.mobile-event-detail {
  padding-bottom: 140px;
  
  .event-cover {
    position: relative;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .no-cover {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .event-meta {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px 16px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: #fff;
      
      .title {
        font-size: 20px;
        font-weight: bold;
        margin: 0 0 8px;
      }
      
      .tags {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .description {
    padding: 0 16px;
    color: #666;
    font-size: 14px;
    line-height: 1.8;
  }
  
  .bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }
}
</style>
