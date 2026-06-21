<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'

const collapsed = ref(false)
const route = useRoute()

const sidebarWidth = computed(() =>
  collapsed.value ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
)

const pageTitle = computed(() => {
  return (route.meta?.title as string) || '试剂管理系统'
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

    <div class="main-area" :style="{ marginLeft: sidebarWidth }">
      <header class="top-bar">
        <div class="breadcrumb">
          <span class="breadcrumb-root">试剂管理系统</span>
          <ChevronRight :size="14" class="breadcrumb-sep" />
          <span class="breadcrumb-current">{{ pageTitle }}</span>
        </div>
      </header>

      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.main-area {
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: var(--header-height);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.breadcrumb-root {
  color: var(--color-text-muted);
}

.breadcrumb-sep {
  color: var(--color-text-muted);
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-weight: 500;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}
</style>
