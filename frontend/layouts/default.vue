<template>
  <ClientOnly>
    <NLayout has-sider style="min-height: 100vh">
      <NLayoutSider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="220"
        :collapsed="appStore.collapsed"
        :show-trigger="false"
        :native-scrollbar="false"
      >
        <SidebarMenu />
      </NLayoutSider>
      <NLayout>
        <NLayoutHeader bordered style="height: 64px; z-index: 1;">
          <AppHeader />
        </NLayoutHeader>
        <NLayoutContent style="padding: 0;">
          <div class="page-content">
            <slot />
          </div>
        </NLayoutContent>
        <NLayoutFooter bordered style="height: 40px; padding: 0 16px; display: flex; align-items: center; justify-content: center;">
          <n-text depth="3" style="font-size: 12px;">
            © 2024 艺考培训家校沟通站 · 服务校区校长、教师与家长
          </n-text>
        </NLayoutFooter>
      </NLayout>
    </NLayout>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
const appStore = useAppStore()
</script>

<style scoped>
.page-content {
  min-height: calc(100vh - 64px - 40px);
  background-color: #f5f7fa;
}
</style>
