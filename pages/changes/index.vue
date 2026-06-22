<template>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>变更管理</h1>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label>状态</label>
          <select v-model="filters.status" @change="handleSearch">
            <option value="">全部</option>
            <option value="PENDING">待审批</option>
            <option value="APPROVED">已批准</option>
            <option value="REJECTED">已驳回</option>
            <option value="IMPLEMENTING">执行中</option>
            <option value="COMPLETED">已完成</option>
            <option value="ROLLED_BACK">已回滚</option>
            <option value="ABNORMAL_ENDED">异常结束</option>
          </select>
        </div>
        <div class="filter-item">
          <label>关键字</label>
          <input v-model="filters.keyword" placeholder="变更编号/标题" @keyup.enter="handleSearch" />
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
            <th>变更编号</th>
            <th>标题</th>
            <th>关联告警</th>
            <th>状态</th>
            <th>提交人</th>
            <th>审批人</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in change.list.value" :key="item.id">
            <td style="font-family: monospace;">{{ item.changeNo }}</td>
            <td>{{ item.title }}</td>
            <td>
              <NuxtLink v-if="item.alert" :to="`/alerts/${item.alert.id}`" style="font-size: 12px;">
                {{ item.alert.alertNo }}
              </NuxtLink>
              <span v-else>-</span>
            </td>
            <td><span :class="`badge badge-${item.status}`">{{ statusLabel(item.status) }}</span></td>
            <td>{{ item.submitter?.realName || '-' }}</td>
            <td>{{ item.approver?.realName || '-' }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <button class="btn btn-sm" @click="navigateTo(`/changes/${item.id}`)">详情</button>
            </td>
          </tr>
          <tr v-if="change.list.value.length === 0">
            <td colspan="8" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="change.page.value <= 1" @click="changePage(change.page.value - 1)">上一页</button>
        <span>第 {{ change.page.value }} / {{ Math.ceil(change.total.value / change.pageSize.value) || 1 }} 页，共 {{ change.total.value }} 条</span>
        <button :disabled="change.page.value >= Math.ceil(change.total.value / change.pageSize.value)" @click="changePage(change.page.value + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const change = useChange()

const filters = reactive({ status: '', keyword: '' })

const statusLabels: Record<string, string> = {
  PENDING: '待审批', APPROVED: '已批准', REJECTED: '已驳回',
  IMPLEMENTING: '执行中', COMPLETED: '已完成', ROLLED_BACK: '已回滚',
  ABNORMAL_ENDED: '异常结束', CANCELLED: '已取消'
}
function statusLabel(s: string) { return statusLabels[s] || s }
function formatDate(s: string) { return new Date(s).toLocaleString() }

async function handleSearch() {
  change.page.value = 1
  await loadData()
}
function handleReset() {
  Object.assign(filters, { status: '', keyword: '' })
  handleSearch()
}
async function changePage(p: number) {
  change.page.value = p
  await loadData()
}
async function loadData() {
  await change.fetchList(filters)
}

onMounted(loadData)
</script>
