<template>
  <n-config-provider
    :theme-overrides="themeOverrides"
    :theme="theme"
  >
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <div class="layout-default h-screen w-screen flex overflow-hidden bg-gray-50">
            <div
              class="sidebar-container h-full flex-shrink-0 transition-all duration-300"
              :class="sidebarCollapsed ? 'w-16' : 'w-60'"
            >
              <AppSidebar ref="sidebarRef" />
            </div>

            <div class="main-container flex-1 flex flex-col min-w-0">
              <AppHeader @toggle-sidebar="handleToggleSidebar" />

              <div class="content-wrapper flex-1 overflow-auto">
                <div class="content-inner p-6">
                  <slot />
                </div>
              </div>
            </div>
          </div>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  darkTheme,
  dateZhCN,
  zhCN,
  create,
} from 'naive-ui'

const sidebarRef = ref<InstanceType<typeof AppSidebar> | null>(null)
const sidebarCollapsed = ref(false)
const isDark = ref(false)

const naive = create({
  components: [],
})

const theme = computed(() => (isDark.value ? darkTheme : null))

const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#1A8A7D',
    primaryColorHover: '#2AA89A',
    primaryColorPressed: '#126B60',
    primaryColorSuppl: '#1A8A7D',
    warningColor: '#FF8C42',
    warningColorHover: '#FFA56B',
    warningColorPressed: '#E67A2E',
    infoColor: '#1A8A7D',
    successColor: '#1A8A7D',
    borderRadius: '8px',
    fontSize: '14px',
  },
  Button: {
    colorPrimary: '#1A8A7D',
    colorHoverPrimary: '#2AA89A',
    colorPressedPrimary: '#126B60',
    colorFocusPrimary: '#1A8A7D',
    colorDisabledPrimary: 'rgba(26, 138, 125, 0.5)',
    borderPrimary: '#1A8A7D',
    textColorPrimary: '#FFFFFF',
  },
  Tabs: {
    tabTextColorActive: '#1A8A7D',
    tabTextColorHoverBar: '#1A8A7D',
    barColor: '#1A8A7D',
  },
  Menu: {
    itemColorActive: 'rgba(26, 138, 125, 0.1)',
    itemTextColorActive: '#1A8A7D',
    itemTextColorHover: '#1A8A7D',
  },
  DataTable: {
    colorPrimary: '#1A8A7D',
    colorHoverPrimary: '#2AA89A',
    colorPressedPrimary: '#126B60',
  },
  Tag: {
    colorPrimary: '#1A8A7D',
    colorHoverPrimary: '#2AA89A',
  },
}))

function handleToggleSidebar() {
  sidebarRef.value?.toggleCollapse()
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
</script>

<style scoped>
.layout-default {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.sidebar-container {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
}

.content-wrapper {
  background-color: #f5f7fa;
}

.content-inner {
  min-height: 100%;
}
</style>
