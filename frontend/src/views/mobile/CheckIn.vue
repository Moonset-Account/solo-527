<template>
  <div class="mobile-checkin">
    <div class="checkin-header">
      <van-icon name="qr-code" size="60" color="#409eff" />
      <h2>活动签到</h2>
      <p>扫描活动门票二维码完成签到</p>
    </div>
    
    <van-field
      v-model="ticketCode"
      placeholder="请输入票号或扫描二维码"
      center
      clearable
    >
      <template #button>
        <van-button size="small" type="primary" @click="scanQR">扫码</van-button>
      </template>
    </van-field>
    
    <van-dropdown-menu>
      <van-dropdown-item v-model="selectedEvent" :options="eventOptions" :disabled="disabledEventSelect" />
    </van-dropdown-menu>
    
    <div v-if="fromEventDetail && selectedEvent" class="current-event-tip">
      <van-icon name="info-o" />
      <span>当前活动：{{ eventOptions.find(e => e.value === selectedEvent)?.text || '' }}</span>
    </div>
    
    <van-button
      type="primary"
      block
      style="margin: 16px;"
      :disabled="!ticketCode"
      @click="doCheckIn"
    >
      确认签到
    </van-button>
    
    <van-divider>最近签到记录</van-divider>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
      <van-cell
        v-for="item in records"
        :key="item.id"
        :title="item.member.name"
        :label="item.event.title"
        :value="item.checked_in_at ? '已签到' : '未签到'"
      >
        <template #right-icon>
          <van-icon v-if="item.checked_in_at" name="success" color="#52c41a" />
        </template>
      </van-cell>
    </van-list>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { api } from '@/utils/request'

const route = useRoute()
const ticketCode = ref('')
const selectedEvent = ref('')
const eventOptions = ref([])
const records = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)

const fromEventDetail = computed(() => !!route.query.event_id)
const disabledEventSelect = computed(() => fromEventDetail.value)

const scanQR = () => {
  showToast('调用扫码功能')
}

const doCheckIn = async () => {
  if (!ticketCode.value) {
    showToast('请输入票号')
    return
  }
  const eventId = selectedEvent.value
  if (!eventId) {
    showToast('请先选择活动')
    return
  }
  try {
    await api.post(`/events/events/${eventId}/check_in/`, { ticket_no: ticketCode.value })
    showToast('签到成功')
    ticketCode.value = ''
    loadRecords(true)
  } catch (e) {
    const msg = e.response?.data?.error || '签到失败'
    showToast(msg)
  }
}

const loadEvents = async () => {
  try {
    const { data } = await api.get('/events/events/', { params: { page_size: 50 } })
    const events = data.results || []
    eventOptions.value = fromEventDetail.value 
      ? events.map(e => ({ text: e.title, value: e.id }))
      : [{ text: '请选择活动', value: '' }, ...events.map(e => ({ text: e.title, value: e.id }))]
    
    if (route.query.event_id) {
      selectedEvent.value = Number(route.query.event_id)
    }
  } catch (e) {}
}

const loadRecords = async (isRefresh = false) => {
  if (isRefresh) page.value = 1
  try {
    const { data } = await api.get('/events/registrations/', {
      params: { page: page.value, page_size: 20, event: selectedEvent.value }
    })
    if (isRefresh) {
      records.value = data.results
    } else {
      records.value = [...records.value, ...data.results]
    }
    finished.value = !data.next
    page.value++
  } catch (e) {}
  loading.value = false
}

const onLoad = () => {
  loadRecords()
}

onMounted(() => {
  loadEvents()
  loadRecords()
})
</script>

<style lang="scss" scoped>
.mobile-checkin {
  padding-bottom: 60px;
  
  .checkin-header {
    text-align: center;
    padding: 40px 20px;
    
    h2 {
      margin: 16px 0 8px;
      font-size: 20px;
    }
    
    p {
      color: #999;
      margin: 0;
    }
  }
  
  .current-event-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    color: #409eff;
    background: #ecf5ff;
  }
}
</style>
