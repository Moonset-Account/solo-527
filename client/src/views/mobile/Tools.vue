<template>
  <div class="mobile-container">
    <van-nav-bar title="工具列表" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="scan" size="20" @click="$router.push('/scan')" />
      </template>
    </van-nav-bar>

    <van-search v-model="searchKeyword" placeholder="搜索工具" shape="round" @search="fetchTools" />

    <van-tabs v-model:active="activeTab" sticky offset-top="52px">
      <van-tab title="全部">
        <div class="tools-list">
          <div v-for="tool in filteredTools" :key="tool.id" class="tool-card" @click="goDetail(tool.id)">
            <div class="tool-image">
              <span v-if="tool.image" style="font-size:40px;">🔧</span>
              <span v-else style="font-size:40px;">🔧</span>
            </div>
            <div class="tool-info">
              <h4 class="tool-name">{{ tool.name }}</h4>
              <p class="tool-category">{{ tool.category }}</p>
              <div class="tool-meta">
                <span :class="['status-tag', 'status-' + tool.status]">{{ getStatusText(tool.status) }}</span>
                <span class="deposit">押金 ¥{{ tool.deposit }}</span>
              </div>
              <div v-if="tool.isValuable" class="valuable-tag">
                <van-tag type="warning" size="mini">贵重工具·需审核</van-tag>
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
          <van-empty v-if="filteredTools.length === 0 && !loading" description="暂无工具" />
        </div>
      </van-tab>
      <van-tab v-for="cat in categories" :key="cat" :title="cat">
        <div class="tools-list">
          <div v-for="tool in getToolsByCategory(cat)" :key="tool.id" class="tool-card" @click="goDetail(tool.id)">
            <div class="tool-image">
              <span style="font-size:40px;">🔧</span>
            </div>
            <div class="tool-info">
              <h4 class="tool-name">{{ tool.name }}</h4>
              <p class="tool-category">{{ tool.category }}</p>
              <div class="tool-meta">
                <span :class="['status-tag', 'status-' + tool.status]">{{ getStatusText(tool.status) }}</span>
                <span class="deposit">押金 ¥{{ tool.deposit }}</span>
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <van-tabbar v-model="tabBar" active-color="#1989fa">
      <van-tabbar-item icon="home-o" @click="tabBar = 0; $router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="tabBar = 1">工具</van-tabbar-item>
      <van-tabbar-item icon="scan" @click="tabBar = 2; $router.push('/scan')">扫码</van-tabbar-item>
      <van-tabbar-item icon="user-o" @click="tabBar = 3; $router.push('/profile')">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toolAPI } from '@/api';

const router = useRouter();
const tools = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const activeTab = ref(0);
const tabBar = ref(1);

const categories = computed(() => [...new Set(tools.value.map(t => t.category))]);

const filteredTools = computed(() => {
  if (!searchKeyword.value) return tools.value;
  const kw = searchKeyword.value.toLowerCase();
  return tools.value.filter(t => 
    t.name.toLowerCase().includes(kw) || 
    t.category.toLowerCase().includes(kw)
  );
});

const getToolsByCategory = (cat) => tools.value.filter(t => t.category === cat);

const getStatusText = (status) => {
  const map = { available: '可借', borrowed: '借出', maintenance: '维修', retired: '报废' };
  return map[status] || status;
};

const goDetail = (id) => router.push(`/tools/${id}`);

const fetchTools = async () => {
  loading.value = true;
  try {
    const res = await toolAPI.getTools({ search: searchKeyword.value });
    tools.value = res.tools;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTools();
});
</script>

<style scoped>
.tools-list {
  padding: 12px;
}
.tool-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.tool-image {
  width: 70px;
  height: 70px;
  background: #f7f8fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}
.tool-info {
  flex: 1;
  min-width: 0;
}
.tool-name {
  margin: 0 0 4px;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tool-category {
  margin: 0 0 8px;
  font-size: 12px;
  color: #969799;
}
.tool-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.deposit {
  font-size: 12px;
  color: #ff6034;
}
.valuable-tag {
  margin-top: 6px;
}
</style>
