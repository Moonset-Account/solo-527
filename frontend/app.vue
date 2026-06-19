<template>
  <client-only>
    <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme">
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <n-loading-bar-provider>
              <slot />
            </n-loading-bar-provider>
          </n-notification-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </client-only>
</template>

<script setup lang="ts">
import {
  zhCN,
  dateZhCN,
  create,
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider
} from 'naive-ui'
import { computed } from 'vue'

const naive = create({
  components: [
    NConfigProvider,
    NMessageProvider,
    NDialogProvider,
    NNotificationProvider,
    NLoadingBarProvider
  ]
})

const theme = computed(() => undefined)
</script>
