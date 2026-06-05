<template>
  <div class="mobile-container">
    <van-nav-bar title="维修申报" left-arrow @click-left="$router.back()">
      <template #right>
        <span class="report-btn" @click="goReport">申报</span>
      </template>
    </van-nav-bar>

    <div class="maint-list" v-if="maintenances.length > 0">
      <van-cell-group v-for="m in maintenances" :key="m.id" inset class="maint-card">
        <van-cell :title="m.tool?.name" :label="m.description">
          <template #right-icon>
            <span :class="['status-tag', 'status-' + m.status]">{{ getStatusText(m.status) }}</span>
          </template>
        </van-cell>
        <van-cell title="申报时间" :value="formatTime(m.createdAt)" />
        <van-cell v-if="m.repairNote" title="维修备注" :value="m.repairNote" />
        <van-cell v-if="m.repairCost > 0" title="维修费用" :value="'¥' + m.repairCost" />
      </van-cell-group>
    </div>
    <van-empty v-else description="暂无维修记录">
      <template #description>
        <p>暂无维修记录</p>
        <van-button type="primary" size="small" @click="goReport">我要申报</van-button>
      </template>
    </van-empty>

    <van-action-sheet v-model:show="showToolSelect" title="选择要申报的工具">
      <van-cell v-for="t in borrowableTools" :key="t.id" is-link :title="t.name" @click="selectTool(t)" />
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { maintenanceAPI, borrowAPI } from '@/api';
import dayjs from 'dayjs';

const router = useRouter();
const maintenances = ref([]);
const borrowableTools = ref([]);
const showToolSelect = ref(false);

const getStatusText = (status) => {
  const map = { reported: '已申报', repairing: '维修中', completed: '已完成', cancelled: '已取消' };
  return map[status] || status;
};

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm');

const goReport = async () => {
  try {
    const res = await borrowAPI.getMyBorrows();
    const borrows = res.borrows.filter(b => ['borrowed', 'overdue'].includes(b.status));
    borrowableTools.value = borrows.map(b => ({ id: b.toolId, name: b.tool?.name }));
    
    if (borrowableTools.value.length === 0) {
      router.push('/tools');
    } else {
      showToolSelect.value = true;
    }
  } catch (e) {
    console.error(e);
  }
};

const selectTool = (tool) => {
  showToolSelect.value = false;
  router.push(`/maintenance/report/${tool.id}`);
};

const fetchData = async () => {
  try {
    const res = await maintenanceAPI.getMyMaintenances();
    maintenances.value = res.maintenances;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.maint-card {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}
.report-btn {
  font-size: 14px;
  color: #1989fa;
}
</style>
