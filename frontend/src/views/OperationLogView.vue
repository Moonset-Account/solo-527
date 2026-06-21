<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">操作日志</h1>
        <p class="mt-1 text-sm text-slate-500">记录系统中所有用户的关键操作，支持审计追溯</p>
      </div>
      <div class="flex items-center space-x-2">
        <NButton>
          <NIcon :size="14" class="mr-1.5"><DownloadOutlined /></NIcon>
          导出日志
        </NButton>
      </div>
    </div>

    <NCard class="!rounded-2xl shadow-sm" size="large">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <NSelect v-model:value="filterUser" :options="userOptions" placeholder="操作人" clearable filterable />
        <NSelect v-model:value="filterAction" :options="actionOptions" placeholder="操作类型" clearable />
        <NSelect v-model:value="filterModule" :options="moduleOptions" placeholder="资源类型" clearable />
        <NDatePicker
          v-model:value="dateRange"
          type="daterange"
          clearable
          class="!w-full"
        />
        <div class="flex items-center space-x-2">
          <NButton quaternary @click="resetFilters">
            <NIcon :size="14" class="mr-1"><ReloadOutlined /></NIcon>
            重置
          </NButton>
        </div>
      </div>

      <div class="relative pl-8">
        <div class="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-deep-blue-200 via-slate-200 to-transparent"></div>
        <NTimeline :size="'medium'" class="!m-0">
          <NTimelineItem
            v-for="(log, idx) in filteredLogs"
            :key="log.id"
            :type="log.status === 'success' ? 'success' : 'error'"
          >
            <template #icon>
              <div
                class="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                :class="log.status === 'success' ? 'bg-deep-blue-50' : 'bg-red-50'"
              >
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center"
                  :class="log.status === 'success' ? 'bg-deep-blue-500' : 'bg-red-500'"
                >
                  <NIcon :size="11" color="#fff">
                    <component :is="actionIcon(log.action)" />
                  </NIcon>
                </div>
              </div>
            </template>
            <div class="pb-4 -mt-2">
              <div class="flex items-center justify-between flex-wrap gap-3 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-deep-blue-400 to-deep-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {{ log.userName.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-medium text-slate-800 text-sm">{{ log.userName }}</span>
                      <NTag size="tiny" :bordered="false" round :type="moduleTagColor(log.module)">
                        {{ moduleText(log.module) }}
                      </NTag>
                      <span class="text-sm text-deep-blue-700 font-medium">
                        {{ actionText(log.action) }}
                      </span>
                      <span v-if="log.targetName" class="text-sm text-slate-600 truncate max-w-[240px]">
                        「{{ log.targetName }}」
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs text-slate-400 flex items-center">
                    <NIcon :size="11" class="mr-1"><GlobalOutlined /></NIcon>
                    {{ log.ip || '内部操作' }}
                  </span>
                  <span class="text-xs text-slate-500">{{ formatTime(log.createdAt) }}</span>
                  <NTag
                    size="tiny"
                    round
                    :bordered="false"
                    :type="log.status === 'success' ? 'success' : 'error'"
                  >
                    {{ log.status === 'success' ? '成功' : '失败' }}
                  </NTag>
                </div>
              </div>

              <p class="text-sm text-slate-500 ml-10 mb-2">{{ log.description }}</p>
              <p v-if="log.errorMessage" class="text-xs text-red-500 ml-10 mb-2 bg-red-50 rounded px-2 py-1 inline-block">
                错误：{{ log.errorMessage }}
              </p>

              <NButton
                v-if="hasChangeData(log)"
                size="tiny"
                text
                type="primary"
                :on-click="() => toggleExpand(log.id)"
                class="ml-10"
              >
                <NIcon :size="12" class="mr-1">
                  <CaretDownOutlined v-if="!expandedIds.has(log.id)" />
                  <CaretUpOutlined v-else />
                </NIcon>
                {{ expandedIds.has(log.id) ? '收起变更详情' : '查看变更详情' }}
              </NButton>

              <transition name="slide">
                <div v-if="expandedIds.has(log.id) && hasChangeData(log)" class="mt-3 ml-10">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-slate-500 font-bold mb-1.5 flex items-center">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
                        修改前 (old_value)
                      </p>
                      <NCode
                        :code="mockOldValue(log)"
                        language="json"
                        :trim="false"
                        word-wrap
                        class="!text-[11px]"
                      />
                    </div>
                    <div>
                      <p class="text-xs text-slate-500 font-bold mb-1.5 flex items-center">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        修改后 (new_value)
                      </p>
                      <NCode
                        :code="mockNewValue(log)"
                        language="json"
                        :trim="false"
                        word-wrap
                        class="!text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </NTimelineItem>
        </NTimeline>

        <div v-if="filteredLogs.length === 0" class="py-16 text-center -ml-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            <NIcon :size="36" color="#CBD5E1"><FileTextOutlined /></NIcon>
          </div>
          <p class="text-slate-400">暂无符合条件的操作日志</p>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between -ml-8">
          <span class="text-sm text-slate-500">共 {{ filteredLogs.length }} 条记录</span>
          <NPagination
            v-model:page="pagination.page"
            :page-size="pagination.pageSize"
            :item-count="filteredLogs.length"
            size="small"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  NCard, NButton, NIcon, NSelect, NDatePicker, NTimeline, NTimelineItem,
  NTag, NCode, NPagination, type SelectOption
} from 'naive-ui'
import {
  DownloadOutlined, ReloadOutlined, CaretDownOutlined, CaretUpOutlined,
  FileTextOutlined,
  LoginOutlined, LogoutOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined, SendOutlined, GlobalOutlined
} from '@vicons/antd'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockLogs, mockKnowledge, mockTemplates, mockEmails } from '@/mock/data'
import type { OperationLog, LogAction, LogModule } from '@/types'

usePageTitle('操作日志')

const allLogs = ref<OperationLog[]>([...mockLogs])
const filterUser = ref<string | null>(null)
const filterAction = ref<string | null>(null)
const filterModule = ref<string | null>(null)
const dateRange = ref<[number, number] | null>(null)
const expandedIds = ref<Set<string>>(new Set())

const pagination = reactive({ page: 1, pageSize: 10 })

const userOptions = computed<SelectOption[]>(() => {
  const users = new Set(allLogs.value.map(l => l.userName))
  return Array.from(users).map(u => ({ label: u, value: u }))
})

const actionMap: Record<LogAction, string> = {
  login: '登录', logout: '登出', create: '创建', update: '更新', delete: '删除',
  approve: '审批通过', reject: '审批驳回', generate: 'AI生成', send: '发送',
  review: '复核', export: '导出'
}
const actionOptions: SelectOption[] = Object.entries(actionMap).map(([value, label]) => ({ label, value }))

const moduleMap: Record<LogModule, string> = {
  auth: '认证', knowledge: '知识库', template: '话术模板', prompt: '提示词',
  email: '邮件', review: '复核', risk: '风险样本', user: '用户管理', system: '系统', analytics: '统计'
}
const moduleOptions: SelectOption[] = Object.entries(moduleMap).map(([value, label]) => ({ label, value }))

const actionText = (a: LogAction) => actionMap[a] || a
const moduleText = (m: LogModule) => moduleMap[m] || m

const moduleTagColor = (m: LogModule) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    auth: 'info',
    knowledge: 'success',
    template: 'warning',
    prompt: 'info',
    email: 'default',
    review: 'warning',
    risk: 'error',
    user: 'success',
    system: 'info',
    analytics: 'success'
  }
  return map[m] || 'default'
}

const actionIcon = (a: LogAction) => {
  const map: Record<string, any> = {
    login: LoginOutlined, logout: LogoutOutlined, create: PlusOutlined, update: EditOutlined,
    delete: DeleteOutlined, approve: CheckCircleOutlined, reject: CloseCircleOutlined,
    generate: ThunderboltOutlined, send: SendOutlined, review: CheckCircleOutlined, export: DownloadOutlined
  }
  return map[a] || FileTextOutlined
}

const filteredLogs = computed(() => {
  return allLogs.value
    .filter(l => {
      if (filterUser.value && l.userName !== filterUser.value) return false
      if (filterAction.value && l.action !== filterAction.value) return false
      if (filterModule.value && l.module !== filterModule.value) return false
      if (dateRange.value) {
        const t = new Date(l.createdAt).getTime()
        if (t < dateRange.value[0] || t > dateRange.value[1]) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id)
  else expandedIds.value.add(id)
}

function hasChangeData(log: OperationLog) {
  return ['update', 'approve', 'reject', 'create', 'delete'].includes(log.action)
}

function mockOldValue(log: OperationLog) {
  if (log.module === 'knowledge' && log.targetId) {
    const k = mockKnowledge.find(x => x.id === log.targetId)
    if (k) return JSON.stringify({ title: k.title, status: 'draft', version: '1.0.0' }, null, 2)
  }
  if (log.module === 'template' && log.targetId) {
    const t = mockTemplates.find(x => x.id === log.targetId)
    if (t) return JSON.stringify({ name: t.name, version: '1.0.0', status: 'draft' }, null, 2)
  }
  if (log.module === 'email' && log.targetId) {
    const e = mockEmails.find(x => x.id === log.targetId)
    if (e) return JSON.stringify({ status: e.status === 'approved' ? 'pending_review' : 'draft', riskLevel: 'medium' }, null, 2)
  }
  return JSON.stringify({ status: 'inactive' }, null, 2)
}

function mockNewValue(log: OperationLog) {
  if (log.module === 'knowledge' && log.targetId) {
    const k = mockKnowledge.find(x => x.id === log.targetId)
    if (k) return JSON.stringify({ title: k.title, status: k.status, version: k.version }, null, 2)
  }
  if (log.module === 'template' && log.targetId) {
    const t = mockTemplates.find(x => x.id === log.targetId)
    if (t) return JSON.stringify({ name: t.name, version: t.version, status: t.status }, null, 2)
  }
  if (log.module === 'email' && log.targetId) {
    const e = mockEmails.find(x => x.id === log.targetId)
    if (e) return JSON.stringify({ status: e.status, reviewedBy: e.reviewedBy, reviewedAt: e.reviewedAt }, null, 2)
  }
  return JSON.stringify({ status: 'active', updatedAt: new Date().toISOString() }, null, 2)
}

function resetFilters() {
  filterUser.value = null
  filterAction.value = null
  filterModule.value = null
  dateRange.value = null
  pagination.page = 1
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
