<template>
  <div class="admin-audit">
    <div class="admin-card">
      <h3 style="margin-bottom: 16px;">审计日志</h3>
      <el-table :data="logs" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="user.realName" label="操作人" width="120" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="entityType" label="对象类型" width="100" />
        <el-table-column prop="entityId" label="对象ID" width="80" />
        <el-table-column prop="details" label="详情" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.details">{{ JSON.stringify(row.details) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="120" />
        <el-table-column prop="createdAt" label="时间" :formatter="formatTime" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { notificationAPI } from '@/api';
import dayjs from 'dayjs';

const logs = ref([]);

const formatTime = (row, col, v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss');

const fetchLogs = async () => {
  try {
    const res = await notificationAPI.getAuditLogs({ limit: 200 });
    logs.value = res.logs;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchLogs();
});
</script>
