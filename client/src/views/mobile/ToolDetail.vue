<template>
  <div class="mobile-container">
    <van-nav-bar :title="tool?.name || '工具详情'" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" class="loading-wrap">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    
    <div v-else-if="tool" class="tool-detail">
      <div class="tool-hero">
        <div class="tool-image-large">
          <span style="font-size:80px;">🔧</span>
        </div>
        <div class="tool-header-info">
          <h2>{{ tool.name }}</h2>
          <p class="category">{{ tool.category }}</p>
          <div class="status-row">
            <span :class="['status-tag', 'status-' + tool.status]">{{ getStatusText(tool.status) }}</span>
            <van-tag v-if="tool.isValuable" type="warning">贵重工具·需管理员审核</van-tag>
          </div>
        </div>
      </div>

      <van-cell-group inset class="detail-group">
        <van-cell title="押金" :value="'¥' + tool.deposit" />
        <van-cell title="存放位置" :value="tool.location || '社区服务中心'" />
        <van-cell title="累计借用" :value="tool.totalBorrows + ' 次'" />
        <van-cell title="工具编号" :value="tool.qrCode" />
      </van-cell-group>

      <van-cell-group inset v-if="tool.description" class="detail-group">
        <van-cell title="工具描述" />
        <div class="description">{{ tool.description }}</div>
      </van-cell-group>

      <van-cell-group inset class="detail-group" v-if="bookings.length > 0">
        <van-cell title="预约日历" />
        <div class="calendar-preview">
          <div v-for="b in bookings" :key="b.id" class="booking-item">
            <span class="booking-date">{{ formatDate(b.borrowDate) }} - {{ formatDate(b.expectedReturnDate) }}</span>
            <span class="booking-user">{{ b.user?.realName || b.user?.username }}</span>
          </div>
        </div>
      </van-cell-group>

      <div class="action-bar">
        <van-button 
          type="primary" 
          block 
          size="large"
          :disabled="tool.status !== 'available'"
          @click="goBorrow"
        >
          {{ tool.status === 'available' ? '立即借用' : '暂不可借' }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toolAPI } from '@/api';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const tool = ref(null);
const bookings = ref([]);
const loading = ref(true);

const getStatusText = (status) => {
  const map = { available: '可借', borrowed: '借出', maintenance: '维修', retired: '报废' };
  return map[status] || status;
};

const formatDate = (d) => dayjs(d).format('MM-DD');

const goBorrow = () => {
  router.push(`/borrow/${route.params.id}`);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await toolAPI.getTool(route.params.id);
    tool.value = res.tool;
    
    const calendarRes = await toolAPI.getCalendar({
      toolId: route.params.id,
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(30, 'day').format('YYYY-MM-DD')
    });
    bookings.value = calendarRes.bookings;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.tool-hero {
  background: #fff;
  padding: 20px;
  text-align: center;
  margin-bottom: 12px;
}
.tool-image-large {
  width: 140px;
  height: 140px;
  margin: 0 auto 16px;
  background: #f7f8fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-header-info h2 {
  margin: 0 0 8px;
  font-size: 22px;
}
.category {
  margin: 0 0 12px;
  color: #969799;
}
.status-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: center;
}
.detail-group {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}
.description {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #646566;
}
.calendar-preview {
  padding: 12px 16px;
}
.booking-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 13px;
}
.booking-date {
  color: #323233;
}
.booking-user {
  color: #969799;
}
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
</style>
