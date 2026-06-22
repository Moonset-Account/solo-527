<template>
  <div class="card">
    <div class="header">
      <h2>审批管理</h2>
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
        <input v-model="filters.keyword" @keyup.enter="handleSearch" />
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
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
          <th>提交时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in change.list.value" :key="item.id">
          <td style="font-family: monospace;">{{ item.changeNo }}</td>
          <td>{{ item.title }}</td>
          <td>{{ item.alert?.alertNo || '-' }}</td>
          <td><span :class="`badge badge-${item.status}`">{{ statusLabel(item.status) }}</span></td>
          <td>{{ item.submitter?.realName || '-' }}</td>
          <td>{{ formatDate(item.createdAt) }}</td>
          <td>
            <button v-if="item.status === 'PENDING'" class="btn btn-sm btn-success" @click="handleApprove(item, true)">批准</button>
            <button v-if="item.status === 'PENDING'" class="btn btn-sm btn-danger" @click="handleApprove(item, false)">驳回</button>
            <button class="btn btn-sm" @click="navigateTo(`/changes/${item.id}`)">详情</button>
          </td>
        </tr>
        <tr v-if="change.list.value.length === 0">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="change.page.value <= 1" @click="changePage(change.page.value - 1)">上一页</button>
      <span>共 {{ change.total.value }} 条</span>
      <button :disabled="change.page.value >= Math.ceil(change.total.value / change.pageSize.value)" @click="changePage(change.page.value + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChangeItem } from '~/composables/useChange'

const change = useChange()
const filters = reactive({ status: 'PENDING', keyword: '' })

const statusLabels: Record<string, string> = {
  PENDING: '待审批', APPROVED: '已批准', REJECTED: '已驳回',
  IMPLEMENTING: '执行中', COMPLETED: '已完成', ROLLED_BACK: '已回滚',
  ABNORMAL_ENDED: '异常结束'
}
function statusLabel(s: string) { return statusLabels[s] || s }
function formatDate(s: string) { return new Date(s).toLocaleString() }

async function handleSearch() {
  change.page.value = 1
  await loadData()
}
async function changePage(p: number) {
  change.page.value = p
  await loadData()
}
async function loadData() {
  await change.fetchList(filters)
}

async function handleApprove(item: ChangeItem, approved: boolean) {
  const note = prompt(approved ? '请输入批准意见（可选）:' : '请输入驳回原因:')
  if (approved === false && !note) {
    alert('驳回必须填写原因')
    return
  }
  try {
    await change.approve(item.id, approved, note || undefined)
    await loadData()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}

onMounted(loadData)
</script>
