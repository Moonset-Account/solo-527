<template>
  <div>
    <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
      <n-loading-bar-provider>
        <n-message-provider>
          <n-dialog-provider>
            <n-notification-provider>
              <NuxtPage />
            </n-notification-provider>
          </n-dialog-provider>
        </n-message-provider>
      </n-loading-bar-provider>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { zhCN, dateZhCN } from 'naive-ui'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initToken()
})
</script>

<style>
#nprogress .bar {
  background: #18a058 !important;
}
</style>
