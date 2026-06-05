<template>
  <div class="mobile-container">
    <van-nav-bar title="我的借用" left-arrow @click-left="$router.back()" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-tabs v-model:active="activeTab" sticky offset-top="46">
        <van-tab title="全部">
          <BorrowList :borrows="borrows" />
        </van-tab>
        <van-tab title="待审核">
          <BorrowList :borrows="pendingBorrows" />
        </van-tab>
        <van-tab title="进行中">
          <BorrowList :borrows="activeBorrows" />
        </van-tab>
        <van-tab title="已完成">
          <BorrowList :borrows="completedBorrows" />
        </van-tab>
      </van-tabs>
    </van-pull-refresh>

    <van-tabbar v-model="tabBar" active-color="#1989fa">
      <van-tabbar-item icon="home-o" @click="tabBar = 0; $router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="tabBar = 1; $router.push('/tools')">工具</van-tabbar-item>
      <van-tabbar-item icon="scan" @click="tabBar = 2; $router.push('/scan')">扫码</van-tabbar-item>
      <van-tabbar-item icon="user-o" @click="tabBar = 3; $router.push('/profile')">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, onActivated } from 'vue';
import { borrowAPI } from '@/api';
import { showToast } from 'vant';
import dayjs from 'dayjs';

const BorrowList = defineComponent({
  props: ['borrows'],
  template: `
    <div class="borrow-list" v-if="borrows.length > 0">
      <van-cell-group v-for="b in borrows" :key="b.id" inset class="borrow-card">
        <van-cell :title="b.tool?.name || '未知工具'" :label="formatDate(b.borrowDate) + ' ~ ' + formatDate(b.expectedReturnDate)">
          <template #right-icon>
            <van-tag :type="getStatusType(b.status)" size="small">{{ getStatusText(b.status) }}</van-tag>
          </template>
        </van-cell>
        <van-cell title="押金" :value="'¥' + (b.depositAmount || 0)" />
        <van-cell title="押金状态">
          <template #value>
            <van-tag :type="getDepositType(b.depositStatus)" size="small">{{ getDepositText(b.depositStatus) }}</van-tag>
          </template>
        </van-cell>
        <van-cell v-if="b.purpose" title="用途" :value="b.purpose" />
        <van-cell v-if="b.actualReturnDate" title="实际归还" :value="formatDate(b.actualReturnDate)" />
        <van-cell v-if="b.rejectReason" title="拒绝原因" :value="b.rejectReason" />
        <van-cell v-if="b.tool?.isValuable && b.status === 'pending'" title="说明" value="贵重工具需管理员审核" class="review-hint">
          <template #icon>
            <van-icon name="warning-o" color="#ff976a" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    <van-empty v-else description="暂无记录" />
  `,
  methods: {
    getStatusText(status) {
      const map = { pending: '待审核', approved: '待取件', borrowed: '借用中', returned: '已归还', rejected: '已拒绝', overdue: '已逾期', damaged: '已损坏' };
      return map[status] || status;
    },
    getStatusType(status) {
      const map = { pending: 'warning', approved: 'primary', borrowed: 'success', returned: 'info', rejected: 'danger', overdue: 'danger', damaged: 'danger' };
      return map[status] || 'default';
    },
    getDepositText(status) {
      const map = { unpaid: '未支付', paid: '已支付', refunded: '已退还', deducted: '已扣除' };
      return map[status] || status;
    },
    getDepositType(status) {
      const map = { unpaid: 'info', paid: 'success', refunded: 'primary', deducted: 'danger' };
      return map[status] || 'default';
    },
    formatDate(d) {
      if (!d) return '-';
      return dayjs(d).format('YYYY-MM-DD');
    }
  }
});

const activeTab = ref(0);
const tabBar = ref(0);
const borrows = ref([]);
const refreshing = ref(false);
const loading = ref(false);

const pendingBorrows = computed(() => borrows.value.filter(b => b.status === 'pending'));
const activeBorrows = computed(() => borrows.value.filter(b => ['approved', 'borrowed', 'overdue'].includes(b.status)));
const completedBorrows = computed(() => borrows.value.filter(b => ['returned', 'rejected', 'damaged'].includes(b.status)));

const fetchBorrows = async () => {
  loading.value = true;
  try {
    const res = await borrowAPI.getMyBorrows();
    borrows.value = res.borrows || [];
  } catch (e) {
    console.error(e);
    if (!navigator.onLine) {
      showToast('网络离线，显示缓存数据');
    }
  } finally {
    loading.value = false;
  }
};

const onRefresh = async () => {
  refreshing.value = true;
  await fetchBorrows();
  refreshing.value = false;
};

onMounted(() => {
  fetchBorrows();
});

onActivated(() => {
  fetchBorrows();
});
</script>

<style scoped>
.borrow-card {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}
.borrow-card :deep(.van-cell__value) {
  max-width: 60%;
  text-align: right;
}
.review-hint {
  background: #fff7e6;
}
.review-hint :deep(.van-cell__title) {
  color: #fa8c16;
}
</style>
