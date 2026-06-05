<template>
  <div class="mobile-container">
    <van-nav-bar title="社区工具共享">
      <template #right>
        <van-icon name="scan" size="20" @click="goScan" />
      </template>
    </van-nav-bar>
    
    <div class="page-content">
      <div class="welcome-card">
        <h3>你好，{{ userStore.user?.realName || userStore.user?.username }} 👋</h3>
        <p>欢迎使用社区工具借还系统</p>
      </div>

      <van-grid :column-num="4" class="shortcut-grid">
        <van-grid-item icon="scan" text="扫码借还" @click="goScan" />
        <van-grid-item icon="list" text="工具列表" @click="$router.push('/tools')" />
        <van-grid-item icon="records" text="我的借用" @click="$router.push('/my-borrows')" />
        <van-grid-item icon="bell" text="消息通知" @click="$router.push('/notifications')" />
      </van-grid>

      <van-cell-group inset class="section-card">
        <van-cell title="常用工具" is-link @click="$router.push('/tools')" />
        <div class="tools-preview">
          <div v-for="tool in popularTools" :key="tool.id" class="tool-mini-card" @click="goToolDetail(tool.id)">
            <div class="tool-icon">🔧</div>
            <p class="tool-name">{{ tool.name }}</p>
            <span :class="['status-tag', 'status-' + tool.status]">{{ getStatusText(tool.status) }}</span>
          </div>
        </div>
      </van-cell-group>

      <van-cell-group inset class="section-card">
        <van-cell title="待处理" is-link @click="$router.push('/my-borrows')" />
        <div v-if="pendingBorrows.length > 0">
          <van-cell v-for="b in pendingBorrows" :key="b.id" :title="b.tool?.name" :label="getBorrowStatusText(b.status)">
            <template #right-icon>
              <span :class="['status-tag', 'status-' + b.status]">{{ getBorrowStatusText(b.status) }}</span>
            </template>
          </van-cell>
        </div>
        <van-empty v-else description="暂无待处理事项" />
      </van-cell-group>

      <van-cell-group inset v-if="userStore.isVolunteer" class="section-card">
        <van-cell title="管理后台" is-link @click="$router.push('/admin')" />
      </van-cell-group>
    </div>

    <van-tabbar v-model="activeTab" active-color="#1989fa">
      <van-tabbar-item icon="home-o" @click="activeTab = 0; $router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="activeTab = 1; $router.push('/tools')">工具</van-tabbar-item>
      <van-tabbar-item icon="scan" @click="activeTab = 2; goScan">扫码</van-tabbar-item>
      <van-tabbar-item icon="user-o" @click="activeTab = 3; $router.push('/profile')">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { toolAPI, borrowAPI } from '@/api';

const router = useRouter();
const userStore = useUserStore();
const activeTab = ref(0);
const tools = ref([]);
const myBorrows = ref([]);

const popularTools = computed(() => tools.value.slice(0, 4));
const pendingBorrows = computed(() => myBorrows.value.filter(b => ['pending', 'approved', 'borrowed'].includes(b.status)));

const getStatusText = (status) => {
  const map = { available: '可借', borrowed: '借出', maintenance: '维修', retired: '报废' };
  return map[status] || status;
};

const getBorrowStatusText = (status) => {
  const map = { pending: '待审核', approved: '待取件', borrowed: '借用中', returned: '已归还', rejected: '已拒绝', overdue: '已逾期', damaged: '已损坏' };
  return map[status] || status;
};

const goScan = () => router.push('/scan');
const goToolDetail = (id) => router.push(`/tools/${id}`);

const fetchData = async () => {
  try {
    const [toolsRes, borrowsRes] = await Promise.all([
      toolAPI.getTools(),
      borrowAPI.getMyBorrows()
    ]);
    tools.value = toolsRes.tools;
    myBorrows.value = borrowsRes.borrows;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.welcome-card {
  background: linear-gradient(135deg, #1989fa, #07c160);
  color: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.welcome-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
}
.welcome-card p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}
.shortcut-grid {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 12px;
}
.section-card {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}
.tools-preview {
  display: flex;
  padding: 12px;
  gap: 12px;
  overflow-x: auto;
}
.tool-mini-card {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
}
.tool-icon {
  width: 60px;
  height: 60px;
  background: #f7f8fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 8px;
}
.tool-name {
  font-size: 12px;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
