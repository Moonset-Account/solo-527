<template>
  <div>
    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title flex items-center gap-2">
          操作日志
          <span class="text-sm font-normal text-gray-500">共 {{ total }} 条</span>
        </div>
        <div class="flex items-center gap-3">
          <select v-model="filters.action" class="form-select" style="width:160px" @change="fetchLogs">
            <option value="ALL">全部操作</option>
            <option value="CREATE_CONTRACT">创建合同</option>
            <option value="UPLOAD_VERSION">上传版本</option>
            <option value="ASSIGN_LAWYER">分派律师</option>
            <option value="ASSIGN_REVIEWER">分派复核人</option>
            <option value="SUBMIT_OPINION">提交意见</option>
            <option value="CHANGE_STATUS">状态变更</option>
            <option value="DOWNLOAD">下载文件</option>
            <option value="COMPLETE">完成审阅</option>
            <option value="ERROR">异常处理</option>
          </select>
          <input v-model="filters.keyword" class="form-input" style="width:200px" placeholder="搜索用户/合同号" @keyup.enter="fetchLogs" />
          <input v-model="filters.dateFrom" type="date" class="form-input" style="width:160px" @change="fetchLogs" />
          <span class="text-gray-400">至</span>
          <input v-model="filters.dateTo" type="date" class="form-input" style="width:160px" @change="fetchLogs" />
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div class="timeline" style="padding:24px">
          <div v-for="log in logs" :key="log.id" class="timeline-item mb-4">
            <div class="timeline-dot" :class="getLogDotClass(log.action)"></div>
            <div class="timeline-content" style="padding:16px">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="log-avatar">{{ log.user?.name?.charAt(0) || 'U' }}</div>
                  <span class="font-semibold">{{ log.user?.name || '系统' }}</span>
                  <span class="badge" :class="getRoleBadgeClass(log.user?.role)">{{ getRoleLabel(log.user?.role) }}</span>
                  <span class="badge badge-info">{{ getLogActionLabel(log.action) }}</span>
                  <span v-if="log.contract" class="badge badge-new">
                    <NuxtLink :to="`/contracts/${log.contract.id}`" class="text-primary" style="text-decoration:none">
                      {{ log.contract.contractNo }}
                    </NuxtLink>
                  </span>
                  <span v-if="log.fromStatus && log.toStatus" class="flex items-center gap-1">
                    <span class="badge" :class="getStatusBadgeClass(log.fromStatus)">{{ getStatusLabel(log.fromStatus) }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--gray-400)">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span class="badge" :class="getStatusBadgeClass(log.toStatus)">{{ getStatusLabel(log.toStatus) }}</span>
                  </span>
                </div>
                <span class="text-sm text-gray-500 whitespace-nowrap ml-4">
                  {{ formatDate(log.createdAt) }}
                </span>
              </div>
              <div v-if="log.description" class="text-gray-700 text-sm" style="margin-left:48px">
                {{ log.description }}
                <span v-if="log.contract" class="text-gray-500 ml-2">
                  · 合同: <NuxtLink :to="`/contracts/${log.contract.id}`" class="text-primary">{{ log.contract.title }}</NuxtLink>
                </span>
              </div>
              <div v-if="log.ipAddress || log.userAgent" class="text-xs text-gray-400 mt-2" style="margin-left:48px">
                <span v-if="log.ipAddress">IP: {{ log.ipAddress }}</span>
                <span v-if="log.userAgent" class="ml-3">设备: {{ truncateUa(log.userAgent) }}</span>
              </div>
            </div>
          </div>

          <div v-if="logs.length === 0" class="empty-state py-8">
            <div style="font-size:40px;margin-bottom:12px">📋</div>
            <div>暂无操作记录</div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="card-header" style="border-top:1px solid var(--gray-200);border-bottom:none">
        <div class="text-sm text-gray-500">第 {{ page }} / {{ totalPages }} 页</div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header">
          <div class="card-title">操作类型统计</div>
        </div>
        <div class="card-body">
          <div v-for="(v, k) in actionStats" :key="k" class="flex items-center justify-between py-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-info">{{ getLogActionLabel(k as string) }}</span>
            </div>
            <span class="font-semibold">{{ v }}</span>
          </div>
          <div v-if="Object.keys(actionStats).length === 0" class="text-gray-400 text-center py-4 text-sm">暂无数据</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">活跃用户 Top 5</div>
        </div>
        <div class="card-body">
          <div v-for="(u, idx) in topUsers" :key="u.userId" class="flex items-center gap-3 py-2">
            <span class="text-gray-500 font-semibold w-6">{{ idx + 1 }}</span>
            <div class="log-avatar-sm">{{ u.name?.charAt(0) }}</div>
            <div style="flex:1;min-width:0">
              <div class="font-semibold truncate">{{ u.name }}</div>
              <div class="text-xs text-gray-500">{{ getRoleLabel(u.role) }}</div>
            </div>
            <span class="font-semibold text-primary">{{ u.count }}</span>
          </div>
          <div v-if="topUsers.length === 0" class="text-gray-400 text-center py-4 text-sm">暂无数据</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">日志信息</div>
        </div>
        <div class="card-body text-sm">
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-500">日志保留</span>
            <span class="font-semibold">90 天</span>
          </div>
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-500">记录级别</span>
            <span class="badge badge-info">INFO</span>
          </div>
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-500">敏感操作</span>
            <span class="badge badge-warning">含状态变更</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-gray-500">下载记录</span>
            <span class="font-semibold">{{ downloadCount }} 次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const ui = useUiStore()

const logs = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const loading = ref(false)

const filters = reactive({
  action: 'ALL',
  keyword: '',
  dateFrom: '',
  dateTo: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const actionStats = computed(() => {
  const map: Record<string, number> = {}
  for (const l of logs.value) {
    map[l.action] = (map[l.action] || 0) + 1
  }
  return map
})

const topUsers = computed(() => {
  const map: Record<string, any> = {}
  for (const l of logs.value) {
    if (!l.userId) continue
    if (!map[l.userId]) {
      map[l.userId] = { userId: l.userId, name: l.user?.name, role: l.user?.role, count: 0 }
    }
    map[l.userId].count++
  }
  return Object.values(map).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
})

const downloadCount = computed(() =>
  logs.value.filter((l: any) => l.action === 'DOWNLOAD').length
)

function getLogDotClass(action: string): string {
  if (action === 'CREATE_CONTRACT' || action === 'COMPLETE') return 'success'
  if (action === 'ERROR') return 'danger'
  if (action === 'SUBMIT_OPINION' || action === 'ASSIGN_LAWYER' || action === 'ASSIGN_REVIEWER') return 'primary'
  if (action === 'CHANGE_STATUS') return 'warning'
  return ''
}

function truncateUa(ua: string): string {
  if (!ua) return '-'
  const m = ua.match(/\(([^)]+)\)/)
  return m ? m[1].split(';')[0] : ua.slice(0, 30)
}

async function fetchLogs() {
  loading.value = true
  ui.showLoading()
  try {
    const res: any = await $fetch('/api/logs', {
      params: {
        action: filters.action,
        page: page.value,
        pageSize: pageSize.value,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      }
    })
    logs.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}

function changePage(p: number) {
  page.value = p
  fetchLogs()
}

onMounted(() => {
  ui.setPageTitle('操作日志')
  ui.setActiveNav('logs')
  fetchLogs()
})
</script>

<style scoped>
.log-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.log-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--info);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}
</style>
