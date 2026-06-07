<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">❄</div>
        <h1 class="sidebar-title">冷链追踪</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">📊</span>
          <span class="nav-text">仪表盘</span>
        </router-link>
        <router-link to="/vehicles" class="nav-item" :class="{ active: $route.path.startsWith('/vehicles') }">
          <span class="nav-icon">🚛</span>
          <span class="nav-text">车辆监控</span>
        </router-link>
        <router-link to="/routes" class="nav-item" :class="{ active: $route.path.startsWith('/routes') }">
          <span class="nav-icon">🗺</span>
          <span class="nav-text">路线分析</span>
        </router-link>
        <router-link to="/batches" class="nav-item" :class="{ active: $route.path.startsWith('/batches') }">
          <span class="nav-icon">📦</span>
          <span class="nav-text">批次追踪</span>
        </router-link>
        <router-link to="/exceptions" class="nav-item" :class="{ active: $route.path.startsWith('/exceptions') }">
          <span class="nav-icon">⚠</span>
          <span class="nav-text">异常管理</span>
        </router-link>
        <router-link to="/calibrations" class="nav-item" :class="{ active: $route.path.startsWith('/calibrations') }">
          <span class="nav-icon">🔧</span>
          <span class="nav-text">校准状态</span>
        </router-link>
      </nav>
    </aside>
    <div class="main-wrapper">
      <header class="app-header">
        <UpdateTimeBanner />
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import UpdateTimeBanner from './components/UpdateTimeBanner.vue'
</script>
