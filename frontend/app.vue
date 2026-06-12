<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :inline-theme-disabled="true">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <MessageHolder />
            <nuxt-layout>
              <nuxt-page />
            </nuxt-layout>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted } from 'vue'
import { useMessage, create, darkTheme, zhCN, dateZhCN } from 'naive-ui'

const MessageHolder = defineComponent({
  setup() {
    const message = useMessage()
    onMounted(() => {
      (window as any).__n_msg = message
    })
    return () => h('span', { style: { display: 'none' } })
  },
})

const theme = null
const themeOverrides = {
  common: {
    primaryColor: '#2d8a5e',
    primaryColorHover: '#3aa26e',
    primaryColorPressed: '#1b6b46',
    primaryColorSuppl: '#3aa26e',
    infoColor: '#1d6ff2',
    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    borderRadius: '8px',
    fontSize: '14px',
  },
  Layout: { color: '#f4f6f5' },
  Card: { borderRadius: '12px' },
}

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  auth.hydrate()
  if (!auth.isLoggedIn && useRoute().path !== '/login') {
    router.push('/login')
  }
})
</script>
