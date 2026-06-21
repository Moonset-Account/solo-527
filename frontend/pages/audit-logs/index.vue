<template>
  <div class="audit-logs-page space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">操作历史</h1>
        <p class="text-sm text-gray-500 mt-1">系统操作记录与变更追踪</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" type="primary" ghost @click="refreshLogs">
          <template #icon>
            <n-icon><RefreshSharp /></n-icon>
          </template>
          刷新
        </n-button>
        <n-button size="small">
          <template #icon>
            <n-icon><DownloadSharp /></n-icon>
          </template>
          导出
        </n-button>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 16px 20px 20px;">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <div class="text-xs text-gray-500 mb-1.5">操作人</div>
          <n-select
            v-model:value="filterOperator"
            :options="auditLogsStore.operatorOptions"
            clearable
            placeholder="全部操作人"
            size="small"
            style="width: 180px;"
          />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1.5">操作类型</div>
          <n-select
            v-model:value="filterType"
            :options="auditLogsStore.typeOptions"
            clearable
            placeholder="全部类型"
            size="small"
            style="width: 160px;"
          />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1.5">日期范围</div>
          <n-date-picker v-model:value="filterDateRange" type="daterange" clearable size="small" style="width: 280px;" />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1.5">关键词</div>
          <n-input v-model:value="filterKeyword" clearable placeholder="搜索操作内容" size="small" style="width: 200px;">
            <template #prefix>
              <n-icon><SearchSharp /></n-icon>
            </template>
          </n-input>
        </div>
        <n-button size="small" type="primary" @click="applyFilter">
          <template #icon>
            <n-icon><SearchSharp /></n-icon>
          </template>
          筛选
        </n-button>
        <n-button size="small" quaternary @click="resetFilter">重置</n-button>
      </div>
    </n-card>

    <n-card class="!rounded-2xl !border-0" title="操作记录" content-style="padding: 16px 20px 20px;">
      <template #header-extra>
        <n-tag size="small" type="info" round>共 {{ filteredLogs.length }} 条记录</n-tag>
      </template>

      <div v-if="filteredLogs.length === 0" class="py-16 text-center text-gray-400">
        <n-icon size="40" class="mb-3"><FileTrayOutlineSharp /></n-icon>
        <div class="text-sm">暂无符合条件的操作记录</div>
      </div>

      <div v-else class="relative pl-2">
        <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 via-gray-200 to-gray-100"></div>

        <div class="space-y-5">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="relative flex gap-4"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 relative z-10 shadow-md ring-4 ring-white"
              :style="{ backgroundColor: log.avatarColor }"
            >
              {{ log.userName.charAt(0) }}
            </div>

            <div class="flex-1 min-w-0 pb-1">
              <div
                class="p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-teal-200 transition-all duration-200 cursor-pointer"
                @click="openDetailModal(log)"
              >
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-gray-800">{{ log.userName }}</span>
                    <n-tag
                      size="small"
                      round
                      :type="getLogTypeInfo(log.type).tagType"
                      :color="getLogTypeInfo(log.type).color"
                      style="font-weight: 500;"
                    >
                      {{ getLogTypeInfo(log.type).label }}
                    </n-tag>
                    <n-tag size="small" round type="info" style="background-color: #F3F4F6; color: #6B7280;">
                      {{ log.module }}
                    </n-tag>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400">{{ formatTime(log.timestamp) }}</span>
                    <n-icon size="14" class="text-gray-300">
                      <ChevronForwardSharp />
                    </n-icon>
                  </div>
                </div>

                <div class="mt-2 text-sm text-gray-700">
                  <span class="font-medium">{{ log.action }}</span>
                  <span class="text-gray-500"> · {{ log.targetName }}</span>
                </div>

                <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">{{ log.description }}</p>

                <div v-if="log.changes && log.changes.length > 0" class="mt-3 pt-3 border-t border-gray-100">
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <n-icon size="12"><CreateSharp /></n-icon>
                    <span>包含 {{ log.changes.length }} 项变更，点击查看详情</span>
                  </div>
                </div>

                <div v-if="log.ip" class="mt-2 text-[11px] text-gray-400">
                  操作IP：{{ log.ip }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-modal v-model:show="detailModalVisible" preset="card" title="操作详情" style="width: 560px; max-width: 90vw;">
      <div v-if="currentLog" class="space-y-5">
        <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-medium flex-shrink-0 shadow-sm"
            :style="{ backgroundColor: currentLog.avatarColor }"
          >
            {{ currentLog.userName.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base font-semibold text-gray-800">{{ currentLog.userName }}</span>
              <n-tag size="small" round :type="getLogTypeInfo(currentLog.type).tagType">
                {{ getLogTypeInfo(currentLog.type).label }}
              </n-tag>
            </div>
            <div class="text-sm text-gray-500 mt-0.5">{{ currentLog.userRole }}</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ formatFullTime(currentLog.timestamp) }}
              <span v-if="currentLog.ip" class="ml-3">IP：{{ currentLog.ip }}</span>
            </div>
          </div>
        </div>

        <div>
          <div class="text-xs text-gray-500 mb-1.5">操作模块</div>
          <div class="text-sm text-gray-800 font-medium">{{ currentLog.module }}</div>
        </div>

        <div>
          <div class="text-xs text-gray-500 mb-1.5">操作对象</div>
          <div class="text-sm text-gray-800 font-medium">{{ currentLog.targetName }}</div>
          <div class="text-xs text-gray-400 mt-0.5">ID：{{ currentLog.targetId }}</div>
        </div>

        <div>
          <div class="text-xs text-gray-500 mb-1.5">操作描述</div>
          <div class="text-sm text-gray-700 leading-relaxed">{{ currentLog.description }}</div>
        </div>

        <div v-if="currentLog.changes && currentLog.changes.length > 0">
          <div class="text-xs text-gray-500 mb-2">变更详情</div>
          <div class="space-y-2">
            <div
              v-for="(change, idx) in currentLog.changes"
              :key="idx"
              class="border border-gray-100 rounded-xl overflow-hidden"
            >
              <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span class="text-sm font-medium text-gray-700">{{ change.fieldLabel }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ change.field }})</span>
              </div>
              <div class="grid grid-cols-2 divide-x divide-gray-100">
                <div class="p-3">
                  <div class="text-[11px] text-gray-400 mb-1">变更前</div>
                  <div class="text-sm">
                    <template v-if="change.oldValue === null || change.oldValue === ''">
                      <span class="text-gray-300 italic">（空）</span>
                    </template>
                    <template v-else>
                      <span class="text-red-600 bg-red-50 px-2 py-0.5 rounded">{{ String(change.oldValue) }}</span>
                    </template>
                  </div>
                </div>
                <div class="p-3">
                  <div class="text-[11px] text-gray-400 mb-1">变更后</div>
                  <div class="text-sm">
                    <template v-if="change.newValue === null || change.newValue === ''">
                      <span class="text-gray-300 italic">（空）</span>
                    </template>
                    <template v-else>
                      <span class="text-green-600 bg-green-50 px-2 py-0.5 rounded">{{ String(change.newValue) }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">
          该操作无字段变更记录
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <n-button type="primary" @click="detailModalVisible = false">知道了</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { AuditLog } from '~/stores/auditLogs'
import { getLogTypeInfo } from '~/stores/auditLogs'
import {
  RefreshSharp,
  DownloadSharp,
  SearchSharp,
  FileTrayOutlineSharp,
  ChevronForwardSharp,
  CreateSharp,
} from '@vicons/ionicons5'

const auditLogsStore = useAuditLogsStore()
const message = useMessage()

const filterOperator = ref<string | null>(null)
const filterType = ref<string | null>(null)
const filterDateRange = ref<[number, number] | null>(null)
const filterKeyword = ref<string>('')

const filteredLogs = computed<AuditLog[]>(() => {
  return auditLogsStore.getFilteredLogs({
    operatorId: filterOperator.value || undefined,
    type: (filterType.value as any) || undefined,
    startDate: filterDateRange.value ? dayjs(filterDateRange.value[0]).format('YYYY-MM-DD') : undefined,
    endDate: filterDateRange.value ? dayjs(filterDateRange.value[1]).format('YYYY-MM-DD') : undefined,
    keyword: filterKeyword.value || undefined,
  })
})

const detailModalVisible = ref(false)
const currentLog = ref<AuditLog | null>(null)

function formatTime(timestamp: string) {
  const now = dayjs()
  const t = dayjs(timestamp)
  const diffMinutes = now.diff(t, 'minute')
  const diffHours = now.diff(t, 'hour')
  const diffDays = now.diff(t, 'day')
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return t.format('MM-DD HH:mm')
}

function formatFullTime(timestamp: string) {
  return dayjs(timestamp).format('YYYY年MM月DD日 HH:mm:ss')
}

function openDetailModal(log: AuditLog) {
  currentLog.value = log
  detailModalVisible.value = true
}

function applyFilter() {
  message.success('筛选已应用')
}

function resetFilter() {
  filterOperator.value = null
  filterType.value = null
  filterDateRange.value = null
  filterKeyword.value = ''
}

function refreshLogs() {
  message.success('日志已刷新')
}
</script>

<style scoped>
.audit-logs-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
