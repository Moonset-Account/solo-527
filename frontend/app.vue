<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="themeOverrides"
  >
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { zhCN, dateZhCN, darkTheme, createThemeOverrides } from 'naive-ui'
import { computed } from 'vue'

const themeOverrides = computed(() =>
  createThemeOverrides({
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      primaryColorSuppl: '#4098fc',
      borderRadius: '8px',
      fontSize: '14px',
    },
    Layout: {
      headerColor: '#ffffff',
      siderColor: '#001529',
    },
  })
)
</script>

<style>
#nprogress .bar {
  background: #2080f0 !important;
}
</style>
