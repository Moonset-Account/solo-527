<template>
  <n-config-provider :theme-overrides="themeOverrides" :inline-theme-disabled="true">
    <n-message-provider :max="3">
      <n-dialog-provider>
        <n-notification-provider :max="5" placement="top-right">
          <n-loading-bar-provider>
            <RouterView />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import {
  NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider
} from 'naive-ui'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.restoreFromStorage()
})

const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#0B4F8C',
    primaryColorHover: '#1469B9',
    primaryColorPressed: '#0A467E',
    primaryColorSuppl: '#1469B9',
    infoColor: '#D4A853',
    infoColorHover: '#DFB567',
    infoColorPressed: '#C59237',
    infoColorSuppl: '#DFB567',
    warningColor: '#F59E0B',
    errorColor: '#DC2626',
    successColor: '#059669',
    borderRadius: '12px',
    borderRadiusSmall: '8px',
    fontFamily: "'Inter Tight', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    lineHeight: '1.55'
  },
  Card: {
    color: '#FFFFFF',
    colorEmbedded: '#F8FAFC',
    borderColor: '#F1F5F9',
    titleFontSize: '15px',
    titleFontWeight: 600
  },
  DataTable: {
    tdColor: '#FFFFFF',
    thColor: '#F8FAFC',
    thColorModal: '#F8FAFC',
    thTextColor: '#475569',
    thFontWeight: 600,
    tdPaddingMedium: '14px 16px',
    thPaddingMedium: '12px 16px',
    borderRadius: '12px',
    borderColor: '#F1F5F9'
  },
  Button: {
    colorPrimary: '#0B4F8C',
    colorHoverPrimary: '#1469B9',
    colorPressedPrimary: '#0A467E',
    colorFocusPrimary: '#1469B9',
    borderRadius: '10px',
    fontWeight: 500,
    paddingSmall: '4px 12px',
    paddingMedium: '7px 16px',
    paddingLarge: '10px 20px'
  },
  Input: {
    color: '#FFFFFF',
    colorFocus: '#FFFFFF',
    colorDisabled: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderHover: '1px solid #94A3B8',
    borderFocus: '1px solid #0B4F8C',
    boxShadowFocus: '0 0 0 3px rgba(11,79,140,0.1)',
    borderRadius: '10px',
    paddingSmall: '6px 12px',
    paddingMedium: '9px 14px',
    paddingLarge: '12px 16px'
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        borderHover: '1px solid #94A3B8',
        borderActive: '1px solid #0B4F8C',
        boxShadowActive: '0 0 0 3px rgba(11,79,140,0.1)',
        paddingMedium: '9px 14px'
      }
    }
  },
  Tag: {
    borderRadius: '8px'
  },
  Modal: {
    borderRadius: '14px',
    color: '#FFFFFF'
  },
  Drawer: {
    color: '#FFFFFF',
    boxShadow: '0 0 50px rgba(0,0,0,0.08)'
  },
  Tabs: {
    tabColorSegment: '#F1F5F9',
    tabColorActiveSegment: '#FFFFFF',
    tabBorderColor: '#E2E8F0',
    tabTextColorActiveLine: '#0B4F8C',
    tabTextColorHoverLine: '#1469B9',
    tabFontWeightActive: 600
  },
  Form: {
    labelTextColor: '#334155',
    labelFontWeight: 500,
    labelFontSizeMedium: '13px',
    labelPaddingVertical: '0 0 8px 0'
  },
  Slider: {
    fillColor: '#0B4F8C',
    railColor: '#E2E8F0'
  },
  Progress: {
    colorInfo: '#0B4F8C',
    colorSuccess: '#059669',
    colorWarning: '#D4A853',
    colorError: '#DC2626'
  },
  Timeline: {
    titleFontWeight: 500
  },
  Steps: {
    iconColorProcess: '#0B4F8C',
    iconColorFinish: '#059669',
    iconColorError: '#DC2626',
    iconTextColorProcess: '#FFFFFF',
    railColorProcess: '#0B4F8C',
    railColorFinish: '#059669'
  },
  Pagination: {
    itemColorActive: '#0B4F8C',
    itemTextColorActive: '#FFFFFF'
  },
  Dropdown: {
    borderRadius: '10px',
    color: '#FFFFFF',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
  },
  Popover: {
    borderRadius: '10px',
    color: '#FFFFFF',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    padding: '8px 12px'
  },
  Switch: {
    railColorActive: '#0B4F8C'
  },
  Badge: {
    color: '#DC2626'
  },
  NCode: {
    borderRadius: '10px',
    border: '1px solid #E2E8F0'
  },
  Nav: {
    color: '#0B4F8C'
  }
}))
</script>

<style>
#app {
  min-height: 100vh;
  width: 100%;
}
</style>
