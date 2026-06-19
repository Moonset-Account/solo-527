<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider
} from 'naive-ui'
</script>
