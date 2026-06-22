<template>
  <div class="card">
    <div class="header">
      <h2>操作日志</h2>
      <button class="btn" @click="handleExport">导出CSV</button>
    </div>

    <div class="filters">
      <div class="filter-item">
        <label>操作类型</label>
        <select v-model="filters.actionType" @change="handleSearch">
          <option value="">全部</option>
          <option value="ALERT_ACKNOWLEDGE">告警确认</option>
          <option value="ALERT_STATUS_CHANGE">告警状态变更</option>
          <option value="CHANGE_REQUEST_SUBMIT">变更申请提交</option>
          <option value="CHANGE_REQUEST_APPROVE">变更申请批准</option>
          <option value="CHANGE_REQUEST_REJECT">变更申请驳回</option>
          <option value="CHANGE_WINDOW_OPEN">变更窗口开启</option>
          <option value="CHANGE_WINDOW_CLOSE">变更窗口关闭</option>
          <option value="ROLLBACK_EXECUTE">执行回滚</option>
          <option value="ACCOUNT_APPLY">账号申请</option>
          <option value="DEVICE_INSPECT">设备巡检</option>
          <option value="ABNORMAL_END">异常结束</option>
          <option value="USER_LOGIN">用户登录</option>
          <option value="USER_LOGOUT">用户登出</option>
        </select>
      </div>
      <div class="filter-item">
        <label>开始日期</label>
        <input v-model="filters.startDate" type="date" @change="handleSearch" />
      </div>
      <div class="filter-item">
        <label>结束日期</label>
        <input v-model="filters.endDate" type="date" @change="handleSearch" />
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
      <div class="filter-item">
        <button class="btn" @click="handleReset">重置</button>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>操作类型</th>
          <th>操作人</th>
          <th>关联告警</th>
          <th>关联变更</th>
          <th>变更前</th>
          <th>变更后</th>
          <th>备注/IP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in list" :key="log.id">
          <td style="font-size: 12px;">{{ formatDate(log.createdAt) }}</td>
          <td><span :class="`badge badge-IN_PROGRESS`">{{ actionLabel(log.actionType) }}</span></td>
          <td>{{ log.user?.realName || '-' }}</td>
          <td>
            <NuxtLink v-if="log.alert" :to="`/alerts/${log.alert.id}`" style="font-size: 12px;">
              {{ log.alert.alertNo }}
            </NuxtLink>
            <span v-else>-</span>
          </td>
          <td>
            <NuxtLink v-if="log.changeRequest" :to="`/changes/${log.changeRequest.id}`" style="font-size: 12px;">
              {{ log.changeRequest.changeNo }}
            </NuxtLink>
            <span v-else>-</span>
          </td>
          <td style="font-size: 11px; font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
            {{ log.beforeData ? JSON.stringify(log.beforeData) : '-' }}
          </td>
          <td style="font-size: 11px; font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
            {{ log.afterData ? JSON.stringify(log.afterData) : '-' }}
          </td>
          <td style="font-size: 12px;">
            <div v-if="log.note">{{ log.note }}</div>
            <div v-if="log.ip" style="color: #999;">{{ log.ip }}</div>
          </td>
        </tr>
        <tr v-if="list.length === 0">
          <td colspan="8" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span>共 {{ total }} 条</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)

const filters = reactive({ actionType: '', startDate: '', endDate: '' })

const actionLabels: Record<string, string> = {
  ALERT_ACKNOWLEDGE: '告警确认', ALERT_STATUS_CHANGE: '告警状态变更',
  CHANGE_REQUEST_SUBMIT: '变更申请提交', CHANGE_REQUEST_APPROVE: '变更申请批准',
  CHANGE_REQUEST_REJECT: '变更申请驳回', CHANGE_WINDOW_OPEN: '变更窗口开启',
  CHANGE_WINDOW_CLOSE: '变更窗口关闭', ROLLBACK_EXECUTE: '执行回滚',
  ACCOUNT_APPLY: '账号申请', DEVICE_INSPECT: '设备巡检',
  ABNORMAL_END: '异常结束', USER_LOGIN: '用户登录', USER_LOGOUT: '用户登出'
}
function actionLabel(s: string) { return actionLabels[s] || s }
function formatDate(s: string) { return new Date(s).toLocaleString() }

async function handleSearch() {
  page.value = 1
  await loadData()
}
function handleReset() {
  Object.assign(filters, { actionType: '', startDate: '', endDate: '' })
  handleSearch()
}
async function changePage(p: number) {
  page.value = p
  await loadData()
}
async function loadData() {
  const query = new URLSearchParams()
  query.set('page', String(page.value))
  query.set('pageSize', String(pageSize.value))
  if (filters.actionType) query.set('actionType', filters.actionType)
  if (filters.startDate) query.set('startDate', filters.startDate)
  if (filters.endDate) query.set('endDate', filters.endDate)

  const res = await $fetch<{ data: any[]; total: number }>(`/api/logs?${query.toString()}`)
  list.value = res.data
  total.value = res.total
}

function handleExport() {
  const query = new URLSearchParams()
  if (filters.actionType) query.set('actionType', filters.actionType)
  if (filters.startDate) query.set('startDate', filters.startDate)
  if (filters.endDate) query.set('endDate', filters.endDate)
  window.open(`/api/logs/export?${query.toString()}`, '_blank')
}

onMounted(loadData)
</script>
