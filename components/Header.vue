<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold text-slate-800">{{ pageTitle }}</h2>
      <span v-if="pageSubtitle" class="text-sm text-slate-500">{{ pageSubtitle }}</span>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="搜索指标、数据集..."
          class="pl-9 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
        />
      </div>

      <button class="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
      </button>

      <button class="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
        <Settings class="w-5 h-5" />
      </button>

      <div class="h-6 w-px bg-slate-200"></div>

      <div class="flex items-center gap-2">
        <div class="text-right">
          <p class="text-sm font-medium text-slate-700">张总监</p>
          <p class="text-xs text-slate-400">销售总监</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold text-sm">
          张
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, Bell, Settings } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '经营总览', subtitle: '实时掌握销售经营动态' },
  '/alerts': { title: '告警中心', subtitle: '异常波动监控与处理' },
  '/alerts/fluctuations': { title: '异常波动', subtitle: '详细异常记录' },
  '/alerts/rules': { title: '告警规则', subtitle: '配置监控阈值' },
  '/alerts/summary': { title: '摘要推送', subtitle: '定期报告订阅' },
  '/reports': { title: '复盘报表', subtitle: '月度经营分析' },
  '/reports/monthly': { title: '月度复盘', subtitle: '详细月度报告' },
  '/permissions': { title: '权限管理', subtitle: '访问控制与审批' },
  '/permissions/approvals': { title: '权限审批', subtitle: '待处理申请' },
  '/permissions/data-masking': { title: '数据脱敏', subtitle: '敏感数据保护' },
  '/datasets': { title: '数据集管理', subtitle: '数据资产目录' },
  '/datasets/todos': { title: '负责人待办', subtitle: '按角色拆分任务' },
  '/settings': { title: '系统设置', subtitle: '系统配置管理' }
}

const pageTitle = computed(() => {
  return pageTitles[route.path]?.title || '数据门户'
})

const pageSubtitle = computed(() => {
  return pageTitles[route.path]?.subtitle || ''
})
</script>
