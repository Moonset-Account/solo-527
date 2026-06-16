<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="min-h-screen bg-gray-50">
            <slot />
          </div>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  darkTheme,
  lightTheme,
} from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()

const theme = computed(() => {
  return appStore.theme === 'dark' ? darkTheme : null
})
</script>
