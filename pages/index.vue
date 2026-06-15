<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">工作台</h1>
    </div>

    <div class="grid-4 mb-24">
      <div class="stat-card">
        <div class="stat-value" style="color: #1890ff;">{{ stats.total }}</div>
        <div class="stat-label">全部工单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #fa8c16;">{{ stats.pending }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #1890ff;">{{ stats.processing }}</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #52c41a;">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 class="mb-16">今日工单</h3>
        <div class="text-center py-24">
          <div style="font-size: 48px; font-weight: 600; color: #1890ff;">{{ stats.today }}</div>
          <div class="text-secondary mt-8">今日新增工单</div>
        </div>
        <button class="btn btn-primary" style="width: 100%;" @click="navigateTo('/workorders')">
          查看全部工单
        </button>
      </div>

      <div class="card">
        <h3 class="mb-16">超时提醒</h3>
        <div v-if="stats.overdue > 0" class="alert alert-error">
          有 <strong>{{ stats.overdue }}</strong> 个工单已超期，请及时处理！
        </div>
        <div v-else class="alert alert-info">
          当前没有超期工单，继续保持！
        </div>
        <button v-if="user?.role !== 'TENANT'" class="btn" style="width: 100%; margin-top: 16px;" @click="navigateTo('/workorders?status=OVERDUE')">
          查看超期工单
        </button>
      </div>
    </div>

    <div v-if="user?.role !== 'TENANT'" class="card mt-16">
      <h3 class="mb-16">快捷操作</h3>
      <div class="grid-4">
        <div v-if="user?.role === 'OPERATOR' || user?.role === 'ADMIN'" class="text-center cursor-pointer" @click="navigateTo('/workorders/create')">
          <div style="font-size: 32px;">📝</div>
          <div class="mt-8">创建工单</div>
        </div>
        <div v-if="user?.role === 'OPERATOR' || user?.role === 'ADMIN'" class="text-center cursor-pointer" @click="navigateTo('/inspections/create')">
          <div style="font-size: 32px;">🔍</div>
          <div class="mt-8">创建巡检</div>
        </div>
        <div v-if="user?.role === 'OPERATOR' || user?.role === 'ADMIN'" class="text-center cursor-pointer" @click="navigateTo('/engineering-repairs/create')">
          <div style="font-size: 32px;">🔧</div>
          <div class="mt-8">工程报修</div>
        </div>
        <div class="text-center cursor-pointer" @click="navigateTo('/satisfaction')">
          <div style="font-size: 32px;">⭐</div>
          <div class="mt-8">满意度统计</div>
        </div>
      </div>
    </div>

    <div v-if="user?.role === 'TENANT'" class="card mt-16">
      <h3 class="mb-16">快捷操作</h3>
      <div class="grid-3">
        <div class="text-center cursor-pointer" @click="navigateTo('/workorders/create')">
          <div style="font-size: 32px;">📝</div>
          <div class="mt-8">提交报修</div>
        </div>
        <div class="text-center cursor-pointer" @click="navigateTo('/visitors/create')">
          <div style="font-size: 32px;">👤</div>
          <div class="mt-8">访客预约</div>
        </div>
        <div class="text-center cursor-pointer" @click="navigateTo('/workorders')">
          <div style="font-size: 32px;">📋</div>
          <div class="mt-8">我的工单</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { user, initAuth, isLoggedIn } = useAuth()

const stats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  today: 0,
  overdue: 0
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await loadStats()
})

async function loadStats() {
  try {
    const res: any = await useApiFetch('/workorders/statistics')
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  padding: 16px;
  border-radius: 4px;
  transition: background 0.3s;
}

.cursor-pointer:hover {
  background: #f5f5f5;
}

.py-24 {
  padding-top: 24px;
  padding-bottom: 24px;
}
</style>
