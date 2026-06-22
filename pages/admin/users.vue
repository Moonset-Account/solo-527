<template>
  <div class="card">
    <div class="header">
      <h2>用户管理</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th>用户名</th>
          <th>姓名</th>
          <th>角色</th>
          <th>门店</th>
          <th>手机</th>
          <th>邮箱</th>
          <th>状态</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.username }}</td>
          <td>{{ u.realName }}</td>
          <td><span :class="`badge badge-${u.role}`">{{ u.role === 'ADMIN' ? '管理员' : '门店运维' }}</span></td>
          <td>{{ u.storeCode || '-' }}</td>
          <td>{{ u.phone || '-' }}</td>
          <td>{{ u.email || '-' }}</td>
          <td><span :class="`badge ${u.isActive ? 'badge-IN_PROGRESS' : 'badge-ABNORMAL_ENDED'}`">{{ u.isActive ? '启用' : '禁用' }}</span></td>
          <td>{{ formatDate(u.createdAt) }}</td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="8" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const users = ref<Array<{
  id: number; username: string; realName: string; role: string;
  storeCode: string | null; phone: string | null; email: string | null;
  isActive: boolean; createdAt: string
}>>([])

function formatDate(s: string) { return new Date(s).toLocaleString() }

onMounted(async () => {
  try {
    const res = await $fetch<{ data: typeof users.value }>('/api/users')
    users.value = res.data
  } catch {
    // ignore
  }
})
</script>
