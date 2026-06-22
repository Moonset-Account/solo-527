<template>
  <div class="container">
    <div class="tabs">
      <NuxtLink to="/admin/approvals" :class="['tab', $route.path === '/admin/approvals' ? 'active' : '']">审批管理</NuxtLink>
      <NuxtLink to="/admin/users" :class="['tab', $route.path === '/admin/users' ? 'active' : '']">用户管理</NuxtLink>
      <NuxtLink to="/admin/logs" :class="['tab', $route.path === '/admin/logs' ? 'active' : '']">操作日志</NuxtLink>
    </div>
    <NuxtPage />
  </div>
</template>
