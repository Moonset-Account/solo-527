<template>
  <div class="mobile-container">
    <van-nav-bar title="我的借用" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab">
      <van-tab title="全部">
        <BorrowList :borrows="borrows" />
      </van-tab>
      <van-tab title="进行中">
        <BorrowList :borrows="activeBorrows" />
      </van-tab>
      <van-tab title="已完成">
        <BorrowList :borrows="completedBorrows" />
      </van-tab>
    </van-tabs>

    <van-tabbar v-model="tabBar" active-color="#1989fa">
      <van-tabbar-item icon="home-o" @click="tabBar = 0; $router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="tabBar = 1; $router.push('/tools')">工具</van-tabbar-item>
      <van-tabbar-item icon="scan" @click="tabBar = 2; $router.push('/scan')">扫码</van-tabbar-item>
      <van-tabbar-item icon="user-o" @click="tabBar = 3; $router.push('/profile')">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent } from 'vue';
import { borrowAPI } from '@/api';
import dayjs from 'dayjs';

const BorrowList = defineComponent({
  props: ['borrows'],
  template: `
    <div class="borrow-list" v-if="borrows.length > 0">
      <van-cell-group v-for="b in borrows" :key="b.id" inset class="borrow-card">
        <van-cell :title="b.tool?.name" :label="formatDate(b.borrowDate) + ' ~ ' + formatDate(b.expectedReturnDate)">
          <template #right-icon>
            <span :class="['status-tag', 'status-' + b.status]">{{ getStatusText(b.status) }}</span>
          </template>
        </van-cell>
        <van-cell title="押金" :value="'¥' + b.depositAmount" />
        <van-cell title="押金状态" :value="getDepositText(b.depositStatus)" />
        <van-cell v-if="b.purpose" title="用途" :value="b.purpose" />
        <van-cell v-if="b.actualReturnDate" title="实际归还" :value="formatDate(b.actualReturnDate)" />
        <van-cell v-if="b.approver" title="审核人" :value="b.approver?.realName || b.approver?.username" />
      </van-cell-group>
    </div>
    <van-empty v-else description="暂无记录" />
  `,
  methods: {
    getStatusText(status) {
      const map = { pending: '待审核', approved: '待取件', borrowed: '借用中', returned: '已归还', rejected: '已拒绝', overdue: '已逾期', damaged: '已损坏' };
      return map[status] || status;
    },
    getDepositText(status) {
      const map = { unpaid: '未支付', paid: '已支付', refunded: '已退还', deducted: '已扣除' };
      return map[status] || status;
    },
    formatDate(d) {
      return dayjs(d).format('YYYY-MM-DD');
    }
  }
});

const activeTab = ref(0);
const tabBar = ref(0);
const borrows = ref([]);

const activeBorrows = computed(() => borrows.value.filter(b => ['pending', 'approved', 'borrowed', 'overdue'].includes(b.status)));
const completedBorrows = computed(() => borrows.value.filter(b => ['returned', 'rejected', 'damaged'].includes(b.status)));

const fetchBorrows = async () => {
  try {
    const res = await borrowAPI.getMyBorrows();
    borrows.value = res.borrows;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchBorrows();
});
</script>

<style scoped>
.borrow-card {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
