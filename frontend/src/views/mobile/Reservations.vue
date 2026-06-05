<template>
  <div class="mobile-reservations">
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" name="" />
      <van-tab title="待确认" name="pending" />
      <van-tab title="已确认" name="confirmed" />
      <van-tab title="已完成" name="completed" />
    </van-tabs>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-for="item in reservations" :key="item.id" class="reservation-card" @click="viewDetail(item)">
          <div class="card-header">
            <span class="order-no">{{ item.reservation_no }}</span>
            <van-tag :type="statusTagType(item.status)" size="small">
              {{ item.status_display }}
            </van-tag>
          </div>
          <div class="card-body">
            <div class="customer">
              <van-icon name="contact" />
              <span v-if="item.member">{{ item.member.name }} (会员)</span>
              <span v-else>{{ item.customer_name || '散客' }}</span>
            </div>
            <div class="books">
              <div v-for="(book, idx) in item.items" :key="idx" class="book-item">
                {{ book.book.title }} x {{ book.quantity }}
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="expire">
              过期: {{ formatDate(item.expire_at) }}
            </span>
            <div class="actions">
              <van-button
                v-if="item.status === 'pending'"
                size="small"
                type="success"
                @click.stop="confirmItem(item)"
              >
                确认
              </van-button>
              <van-button
                v-if="['pending', 'confirmed'].includes(item.status)"
                size="small"
                type="warning"
                @click.stop="completeItem(item)"
              >
                取书
              </van-button>
              <van-button
                v-if="['pending', 'confirmed'].includes(item.status)"
                size="small"
                type="danger"
                @click.stop="cancelItem(item)"
              >
                取消
              </van-button>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
    
    <van-fab
      icon="plus"
      type="primary"
      @click="goToCreate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { api } from '@/utils/request'

const router = useRouter()
const activeTab = ref('')
const reservations = ref([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)

const statusTagType = (status) => {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success',
    cancelled: 'default',
    expired: 'danger'
  }
  return types[status] || 'default'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.slice(5, 16).replace('T', ' ')
}

const loadReservations = async (isRefresh = false) => {
  if (isRefresh) page.value = 1
  try {
    const { data } = await api.get('/reservations/reservations/', {
      params: { page: page.value, page_size: 20, status: activeTab.value }
    })
    if (isRefresh) {
      reservations.value = data.results
    } else {
      reservations.value = [...reservations.value, ...data.results]
    }
    finished.value = !data.next
    page.value++
  } catch (e) {
    showToast('加载失败')
  }
}

const onLoad = () => {
  loadReservations()
  loading.value = false
}

const onRefresh = () => {
  finished.value = false
  loadReservations(true)
  refreshing.value = false
}

const onTabChange = () => {
  finished.value = false
  loadReservations(true)
}

const viewDetail = (item) => {
  // 简单提示，实际可跳转到详情页
  showToast(item.reservation_no)
}

const confirmItem = async (item) => {
  try {
    await api.post(`/reservations/reservations/${item.id}/confirm/`)
    showToast('确认成功')
    loadReservations(true)
  } catch (e) {
    showToast('操作失败')
  }
}

const completeItem = async (item) => {
  try {
    await api.post(`/reservations/reservations/${item.id}/complete/`)
    showToast('已完成取书')
    loadReservations(true)
  } catch (e) {
    showToast('操作失败')
  }
}

const cancelItem = async (item) => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定取消这个预留吗？' })
    await api.post(`/reservations/reservations/${item.id}/cancel/`)
    showToast('已取消')
    loadReservations(true)
  } catch (e) {
    if (e !== 'cancel') showToast('操作失败')
  }
}

const goToCreate = () => {
  router.push('/m/reservations/create')
}

onMounted(() => {
  loadReservations()
})
</script>

<style lang="scss" scoped>
.mobile-reservations {
  padding-bottom: 80px;
  
  .reservation-card {
    background: #fff;
    margin: 10px 12px;
    border-radius: 8px;
    padding: 12px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .order-no {
        font-weight: 500;
        font-size: 14px;
      }
    }
    
    .card-body {
      .customer {
        display: flex;
        align-items: center;
        color: #666;
        font-size: 13px;
        margin-bottom: 6px;
        
        .van-icon {
          margin-right: 4px;
        }
      }
      
      .books {
        .book-item {
          font-size: 13px;
          color: #333;
          padding: 2px 0;
        }
      }
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
      
      .expire {
        font-size: 12px;
        color: #999;
      }
      
      .actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
