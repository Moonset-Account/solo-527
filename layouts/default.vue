<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="main-wrapper">
      <AppHeader :user-info="userInfo" />
      <main class="main-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { userInfo, initAuth, isLoggedIn } = useAuth()

onMounted(() => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
  }
})
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: $bg-base;
}

.main-wrapper {
  margin-left: $sidebar-width;
  min-height: 100vh;
}

.main-content {
  margin-top: $header-height;
  padding: 20px 24px;
  min-height: calc(100vh - #{$header-height});
}
</style>
