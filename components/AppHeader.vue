<template>
  <header class="app-header">
    <div class="header-left">
      <h2 class="page-title">{{ pageTitle }}</h2>
    </div>

    <div class="header-right">
      <div class="header-notification" title="消息通知">
        <span class="icon">🔔</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>

      <div class="header-user">
        <div class="user-avatar">
          {{ userInitial }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ userInfo?.realName || userInfo?.username }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
        <div class="user-dropdown">
          <button class="btn btn-text" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface UserInfo {
  userId: string
  username: string
  role: string
  realName?: string
}

const props = defineProps<{
  userInfo?: UserInfo | null
}>()

const route = useRoute()
const unreadCount = ref(3)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '工作台',
    '/orders': '订单管理',
    '/orders/pending': '待接单',
    '/dispatch': '调度中心',
    '/riders': '骑手管理',
    '/routes': '路线规划',
    '/tracking': '轨迹回放',
    '/temperature': '温控监控',
    '/alerts': '告警中心',
    '/claims': '赔付工单',
    '/reports': '安全报表',
    '/exceptions': '异常日志',
    '/processing': '处理视图',
  }
  return titles[route.path] || '青禾配送时效台'
})

const userInitial = computed(() => {
  const name = props.userInfo?.realName || props.userInfo?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const roles: Record<string, string> = {
    ADMIN: '管理员',
    DISPATCHER: '调度员',
    SUPERVISOR: '主管',
  }
  return roles[props.userInfo?.role || ''] || '用户'
})

const handleLogout = () => {
  const { logout } = useAuth()
  logout()
}

onMounted(() => {
  // fetchUnreadCount()
})
</script>

<style lang="scss" scoped>
.app-header {
  height: $header-height;
  background: #fff;
  border-bottom: 1px solid $border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: $sidebar-width;
  right: 0;
  z-index: 99;
}

.header-left {
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-notification {
  position: relative;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: $error;
    color: #fff;
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    border-radius: 8px;
    padding: 0 4px;
  }
}

.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
  }

  .user-info {
    .user-name {
      font-size: 14px;
      color: $text-primary;
      font-weight: 500;
    }

    .user-role {
      font-size: 12px;
      color: $text-tertiary;
    }
  }

  .user-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border-radius: 4px;
    box-shadow: $shadow-md;
    padding: 8px 0;
    min-width: 120px;
    margin-top: 8px;
  }

  &:hover .user-dropdown {
    display: block;
  }
}
</style>
