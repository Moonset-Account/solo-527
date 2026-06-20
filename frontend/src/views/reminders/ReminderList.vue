<template>
  <div class="reminder-list">
    <div class="page-header">
      <h2 class="page-title">提醒配置</h2>
    </div>

    <el-alert
      title="提醒规则说明"
      type="info"
      :closable="false"
      class="mb-20"
      show-icon
    >
      <template #default>
        <p>系统按讲师时间不足配置提醒规则。<strong>普通提示（INFO）</strong>用于日常通知，<strong>警告（WARNING）</strong>用于需要关注的事项，<strong>阻断告警（BLOCKING）</strong>是紧急重要事项，单独展示，不会与普通提示混在一起。</p>
      </template>
    </el-alert>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <span>提醒配置列表</span>
            </div>
          </template>
          <el-table :data="configs" v-loading="loading" style="width: 100%" stripe>
            <el-table-column label="规则名称" min-width="160">
              <template #default="{ row }">
                <div class="rule-name">
                  <el-tag :type="getReminderTagType(row.type)" effect="dark" size="small">{{ ReminderTypeLabel[row.type as keyof typeof ReminderTypeLabel] }}</el-tag>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="trigger" label="触发条件" width="180" />
            <el-table-column label="阈值配置" width="200">
              <template #default="{ row }">
                <span v-if="row.config.timeThresholdMinutes">{{ row.config.timeThresholdMinutes }}分钟前</span>
                <span v-else-if="row.config.dailyTime">每日 {{ row.config.dailyTime }}</span>
                <span v-else-if="row.config.checkInGraceMinutes">签到宽限 {{ row.config.checkInGraceMinutes }}分钟</span>
                <span v-else-if="row.config.quotaWarningPercentage">使用率 {{ row.config.quotaWarningPercentage }}%</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="目标角色" width="180">
              <template #default="{ row }">
                <el-tag v-for="role in row.targetRoles" :key="role" size="small" style="margin-right: 4px">
                  {{ RoleLabel[role as keyof typeof RoleLabel] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleConfig(row)" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="80">
              <template #default="{ row }">
                {{ row.sortOrder }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <span>阻断告警</span>
              <el-tag type="danger" size="small">{{ blockingCount }} 条未读</el-tag>
            </div>
          </template>
          <div class="blocking-list">
            <div
              v-for="item in blockingReminders"
              :key="item._id"
              class="blocking-item"
              :class="{ 'is-read': item.isRead }"
              @click="markAsRead(item._id)"
            >
              <el-icon color="#f56c6c" class="blocking-icon"><WarningFilled /></el-icon>
              <div class="blocking-content">
                <div class="blocking-title">{{ item.title }}</div>
                <div class="blocking-desc">{{ item.content }}</div>
                <div class="blocking-time">{{ item.createdAt }}</div>
              </div>
            </div>
          </div>
          <el-empty v-if="blockingReminders.length === 0" description="暂无阻断告警" />
          <div class="blocking-footer" v-if="blockingReminders.length > 0">
            <el-button type="danger" link @click="markAllAsRead">全部标记已读</el-button>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>普通提示</span>
              <el-tag type="info" size="small">{{ unreadInfoCount }} 条未读</el-tag>
            </div>
          </template>
          <div class="info-list">
            <div
              v-for="item in infoReminders"
              :key="item._id"
              class="info-item"
              :class="{ 'is-read': item.isRead }"
              @click="markInfoAsRead(item._id)"
            >
              <el-icon color="#409eff" class="info-icon"><InfoFilled /></el-icon>
              <div class="info-content">
                <div class="info-title">{{ item.title }}</div>
                <div class="info-time">{{ item.createdAt }}</div>
              </div>
            </div>
          </div>
          <el-empty v-if="infoReminders.length === 0" description="暂无普通提示" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { WarningFilled, InfoFilled } from '@element-plus/icons-vue';
import * as remindersApi from '../../api/reminders';
import { ReminderTypeLabel, RoleLabel, type ReminderConfig, type Reminder } from '../../types';

const loading = ref(false);
const configs = ref<ReminderConfig[]>([]);
const blockingReminders = ref<Reminder[]>([]);
const infoReminders = ref<Reminder[]>([]);

const blockingCount = computed(() => blockingReminders.value.filter(r => !r.isRead).length);
const unreadInfoCount = computed(() => infoReminders.value.filter(r => !r.isRead).length);

function getReminderTagType(type: string) {
  const map: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    blocking: 'danger',
  };
  return map[type] || 'info';
}

async function fetchConfigs() {
  loading.value = true;
  try {
    const result = await remindersApi.getConfigs();
    configs.value = result;
  } finally {
    loading.value = false;
  }
}

async function fetchReminders() {
  try {
    const [blocking, info] = await Promise.all([
      remindersApi.getBlockingReminders(),
      remindersApi.getMyReminders({ type: 'info', pageSize: 10 } as any),
    ]);
    blockingReminders.value = blocking;
    infoReminders.value = info.data;
  } catch (e) {
    console.error('Failed to fetch reminders:', e);
  }
}

async function toggleConfig(row: ReminderConfig) {
  try {
    await remindersApi.updateConfig(row._id, { enabled: row.enabled });
    ElMessage.success(row.enabled ? '已启用' : '已禁用');
  } catch (e: any) {
    row.enabled = !row.enabled;
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

async function markAsRead(id: string) {
  try {
    await remindersApi.markAsRead(id);
    const item = blockingReminders.value.find(r => r._id === id);
    if (item) item.isRead = true;
  } catch (e) {
    console.error('Failed to mark as read:', e);
  }
}

async function markInfoAsRead(id: string) {
  try {
    await remindersApi.markAsRead(id);
    const item = infoReminders.value.find(r => r._id === id);
    if (item) item.isRead = true;
  } catch (e) {
    console.error('Failed to mark as read:', e);
  }
}

async function markAllAsRead() {
  try {
    await remindersApi.markAllAsRead();
    blockingReminders.value.forEach(r => r.isRead = true);
    infoReminders.value.forEach(r => r.isRead = true);
    ElMessage.success('已全部标记为已读');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

onMounted(() => {
  fetchConfigs();
  fetchReminders();
});
</script>

<style scoped>
.reminder-list {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blocking-list,
.info-list {
  max-height: 350px;
  overflow-y: auto;
}

.blocking-item,
.info-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.blocking-item {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.blocking-item.is-read,
.info-item.is-read {
  opacity: 0.6;
}

.info-item {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
}

.blocking-item:hover,
.info-item:hover {
  background: #f5f7fa;
}

.blocking-icon,
.info-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.blocking-content,
.info-content {
  flex: 1;
  min-width: 0;
}

.blocking-title {
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
  margin-bottom: 4px;
}

.blocking-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  line-height: 1.4;
}

.blocking-time,
.info-time {
  font-size: 12px;
  color: #909399;
}

.info-title {
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 4px;
}

.blocking-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
