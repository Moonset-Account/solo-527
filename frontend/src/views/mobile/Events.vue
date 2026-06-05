<template>
  <div class="mobile-events">
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" name="" />
      <van-tab title="进行中" name="ongoing" />
      <van-tab title="即将开始" name="published" />
      <van-tab title="已结束" name="ended" />
    </van-tabs>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="event in events" :key="event.id" class="event-card" @click="goToDetail(event.id)">
          <div class="cover">
            <img v-if="event.cover_image" :src="event.cover_image" alt="" />
            <div v-else class="no-cover">
              <van-icon name="friends-o" size="32" />
            </div>
          </div>
          <div class="info">
            <h3 class="title">{{ event.title }}</h3>
            <div class="meta">
              <van-tag size="small" type="primary">{{ event.event_type?.name || '-' }}</van-tag>
              <span class="date">
                {{ event.start_date || (event.start_time ? event.start_time.slice(0, 10) : '') }}
                {{ event.start_time_only || (event.start_time ? event.start_time.slice(11, 16) : '') }}
              </span>
            </div>
            <div class="location">
              <van-icon name="location-o" /> {{ event.location }}
            </div>
            <div class="footer">
              <span class="participants">
                {{ event.current_participants || 0 }}/{{ event.max_participants }} 人报名
              </span>
              <van-tag :type="statusTagType(event.status)" size="small">
                {{ event.status_display }}
              </van-tag>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { api } from '@/utils/request'

const router = useRouter()
const activeTab = ref('')
const events = ref([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)

const statusTagType = (status) => {
  const types = { draft: 'default', published: 'primary', ongoing: 'success', ended: 'warning', cancelled: 'danger' }
  return types[status] || 'default'
}

const loadEvents = async (isRefresh = false) => {
  if (isRefresh) page.value = 1
  try {
    const { data } = await api.get('/events/events/', {
      params: { page: page.value, page_size: 20, status: activeTab.value }
    })
    if (isRefresh) {
      events.value = data.results
    } else {
      events.value = [...events.value, ...data.results]
    }
    finished.value = !data.next
    page.value++
  } catch (e) {
    showToast('加载失败')
  }
}

const onLoad = () => {
  loadEvents()
  loading.value = false
}

const onRefresh = () => {
  finished.value = false
  loadEvents(true)
  refreshing.value = false
}

const onTabChange = () => {
  finished.value = false
  loadEvents(true)
}

const goToDetail = (id) => {
  router.push(`/m/events/${id}`)
}

onMounted(() => {
  loadEvents()
})
</script>

<style lang="scss" scoped>
.mobile-events {
  padding-bottom: 60px;
  
  .event-card {
    display: flex;
    background: #fff;
    margin: 10px 12px;
    border-radius: 8px;
    overflow: hidden;
    
    .cover {
      width: 100px;
      height: 130px;
      flex-shrink: 0;
      
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
    }
    
    .info {
      flex: 1;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      
      .title {
        font-size: 15px;
        font-weight: 500;
        margin: 0 0 6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        
        .date {
          font-size: 12px;
          color: #666;
        }
      }
      
      .location {
        font-size: 12px;
        color: #999;
        margin-bottom: auto;
      }
      
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .participants {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}
</style>
