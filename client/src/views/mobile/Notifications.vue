<template>
  <div class="mobile-container">
    <van-nav-bar title="消息通知" left-arrow @click-left="$router.back()">
      <template #right>
        <span class="read-all" @click="markAllRead">全部已读</span>
      </template>
    </van-nav-bar>

    <div class="notification-list" v-if="notifications.length > 0">
      <van-cell-group v-for="n in notifications" :key="n.id" inset class="notification-card" :class="{ unread: !n.read }">
        <van-cell @click="handleRead(n)">
          <template #title>
            <div class="notification-title">
              <span :class="['type-dot', 'type-' + n.type]"></span>
              <span>{{ n.title }}</span>
            </div>
          </template>
          <template #label>
            <div class="notification-content">{{ n.content }}</div>
            <div class="notification-time">{{ formatTime(n.createdAt) }}</div>
          </template>
          <template #right-icon>
            <van-badge v-if="!n.read" content="" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    <van-empty v-else description="暂无通知" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { notificationAPI } from '@/api';
import { showToast } from 'vant';
import dayjs from 'dayjs';

const notifications = ref([]);

const formatTime = (t) => dayjs(t).format('MM-DD HH:mm');

const handleRead = async (n) => {
  if (!n.read) {
    try {
      await notificationAPI.markAsRead(n.id);
      n.read = true;
    } catch (e) {
      console.error(e);
    }
  }
};

const markAllRead = async () => {
  try {
    await notificationAPI.markAllAsRead();
    notifications.value.forEach(n => n.read = true);
    showToast('已全部标记为已读');
  } catch (e) {
    console.error(e);
  }
};

const fetchNotifications = async () => {
  try {
    const res = await notificationAPI.getNotifications();
    notifications.value = res.notifications;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped>
.notification-card {
  margin: 8px 12px;
  border-radius: 10px;
  overflow: hidden;
}
.notification-card.unread {
  background: #e8f3ff;
}
.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.type-overdue { background: #ee0a24; }
.type-return_reminder { background: #ff976a; }
.type-approval { background: #1989fa; }
.type-system { background: #07c160; }
.type-maintenance { background: #ff976a; }
.notification-content {
  font-size: 13px;
  color: #646566;
  margin: 4px 0;
  line-height: 1.5;
}
.notification-time {
  font-size: 12px;
  color: #c8c9cc;
}
.read-all {
  font-size: 14px;
  color: #1989fa;
}
</style>
