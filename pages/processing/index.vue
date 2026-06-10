<template>
  <div class="processing-page">
    <div class="page-header">
      <h2>处理视图</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadViews">
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="tab in bizTypeTabs"
          :key="tab.value"
          :class="['tab', { active: selectedBizType === tab.value }]"
          @click="selectBizType(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>状态</label>
        <select v-model="searchForm.status">
          <option value="">全部状态</option>
          <option value="PENDING_ACCEPT">待接单</option>
          <option value="OPEN">待处理</option>
          <option value="SUBMITTED">已提交</option>
          <option value="NEW">新建</option>
          <option value="PROCESSING">处理中</option>
          <option value="ASSIGNED">已分派</option>
          <option value="RESOLVED">已解决</option>
          <option value="DELIVERED">已完成</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>业务类型</th>
            <th>业务ID</th>
            <th>状态</th>
            <th>优先级</th>
            <th>当前处理人</th>
            <th>最近处理时间</th>
            <th>最近备注</th>
            <th>分派次数</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="view in viewList" :key="view.id">
            <td>
              <StatusTag :type="getBizTypeTag(view.bizType)">
                {{ getBizTypeLabel(view.bizType) }}
              </StatusTag>
            </td>
            <td class="biz-id">#{{ view.bizId }}</td>
            <td>
              <StatusTag :type="getStatusTag(view.status)">
                {{ view.status }}
              </StatusTag>
            </td>
            <td>
              <StatusTag v-if="view.priority" :type="getPriorityTag(view.priority)">
                {{ getPriorityLabel(view.priority) }}
              </StatusTag>
              <span v-else>-</span>
            </td>
            <td>{{ view.currentHandler?.realName || view.currentHandlerName || '-' }}</td>
            <td>
              <span v-if="view.lastProcessedAt">{{ formatDate(view.lastProcessedAt) }}</span>
              <span v-else>-</span>
            </td>
            <td class="last-remark">{{ view.lastRemark || '-' }}</td>
            <td>{{ view.assignmentCount }}</td>
            <td class="text-secondary text-sm">{{ formatDate(view.updatedAt) }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewDetail(view)">
                查看
              </button>
              <button class="btn btn-text btn-sm" @click="viewNotes(view)">
                记录
              </button>
            </td>
          </tr>
          <tr v-if="viewList.length === 0">
            <td colspan="10">
              <div class="empty">暂无数据</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadViews"
      />
    </div>

    <AppModal v-model:visible="notesVisible" title="处理记录" width="600px">
      <div class="notes-list">
        <div
          v-for="(note, index) in noteList"
          :key="note.id || index"
          class="note-item"
        >
          <div class="note-header">
            <StatusTag :type="getActionTag(note.actionType)">
              {{ getActionLabel(note.actionType) }}
            </StatusTag>
            <span class="note-time">{{ formatDate(note.createdAt) }}</span>
          </div>
          <div class="note-operator">
            操作人：{{ note.operatorName || note.operator?.realName || '系统' }}
          </div>
          <div v-if="note.fromStatus || note.toStatus" class="note-status">
            <span v-if="note.fromStatus">{{ note.fromStatus }}</span>
            <span v-if="note.fromStatus && note.toStatus"> → </span>
            <span v-if="note.toStatus">{{ note.toStatus }}</span>
          </div>
          <div v-if="note.remark" class="note-remark">
            {{ note.remark }}
          </div>
        </div>
        <div v-if="noteList.length === 0" class="empty">
          暂无处理记录
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const viewList = ref<any[]>([])
const notesVisible = ref(false)
const noteList = ref<any[]>([])
const selectedBizType = ref('')

const searchForm = reactive({
  status: '',
})

const bizTypeTabs = [
  { label: '全部', value: '' },
  { label: '配送订单', value: 'DELIVERY_ORDER' },
  { label: '温度告警', value: 'TEMPERATURE_ALERT' },
  { label: '赔付工单', value: 'CLAIM_ORDER' },
  { label: '接口异常', value: 'API_EXCEPTION' },
  { label: '安全报表', value: 'SAFETY_REPORT' },
]

const loadViews = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
    }
    if (selectedBizType.value) {
      params.bizType = selectedBizType.value
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const res: any = await $fetch('/api/processing', {
      query: params,
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      viewList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载处理视图失败', e)
  }
}

const selectBizType = (type: string) => {
  selectedBizType.value = type
  reset()
  loadViews()
}

const handleSearch = () => {
  reset()
  loadViews()
}

const handleReset = () => {
  searchForm.status = ''
  reset()
  loadViews()
}

const viewDetail = (view: any) => {
  const bizType = view.bizType
  const routes: Record<string, string> = {
    DELIVERY_ORDER: `/orders/${view.bizId}`,
    TEMPERATURE_ALERT: '/alerts',
    CLAIM_ORDER: '/claims',
    API_EXCEPTION: '/exceptions',
    SAFETY_REPORT: '/reports',
  }
  const route = routes[bizType]
  if (route) {
    navigateTo(route)
  } else {
    alert('暂不支持查看该类型单据')
  }
}

const viewNotes = async (view: any) => {
  try {
    const res: any = await $fetch('/api/processing/notes', {
      query: { viewId: view.id, pageSize: 50 },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      noteList.value = res.data.list
      notesVisible.value = true
    }
  } catch (e) {
    console.error('加载处理记录失败', e)
  }
}

const getBizTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    DELIVERY_ORDER: '配送订单',
    TEMPERATURE_ALERT: '温度告警',
    CLAIM_ORDER: '赔付工单',
    API_EXCEPTION: '接口异常',
    SAFETY_REPORT: '安全报表',
  }
  return labels[type] || type
}

const getBizTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    DELIVERY_ORDER: 'primary',
    TEMPERATURE_ALERT: 'danger',
    CLAIM_ORDER: 'warning',
    API_EXCEPTION: 'danger',
    SAFETY_REPORT: 'info',
  }
  return tags[type] || 'default'
}

const getStatusTag = (status: string) => {
  if (!status) return 'default'
  const successStatuses = ['DELIVERED', 'RESOLVED', 'CLOSED', 'PAID', 'APPROVED', 'ARCHIVED', 'CONFIRMED']
  const warningStatuses = ['PENDING_ACCEPT', 'OPEN', 'SUBMITTED', 'NEW', 'UNDER_REVIEW', 'EXCEPTION']
  const processingStatuses = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'PROCESSING', 'ACKNOWLEDGED']

  if (successStatuses.includes(status)) return 'success'
  if (warningStatuses.includes(status)) return 'warning'
  if (processingStatuses.includes(status)) return 'primary'
  return 'default'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    LOW: '低',
    NORMAL: '普通',
    HIGH: '高',
    URGENT: '紧急',
  }
  return labels[priority] || priority
}

const getPriorityTag = (priority: string) => {
  const tags: Record<string, string> = {
    LOW: 'default',
    NORMAL: 'default',
    HIGH: 'warning',
    URGENT: 'danger',
  }
  return tags[priority] || 'default'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    ASSIGN: '分派',
    UNASSIGN: '取消分派',
    COMMENT: '评论',
    STATUS_CHANGE: '状态变更',
    ESCALATE: '升级',
    ATTACH: '附加',
  }
  return labels[action] || action
}

const getActionTag = (action: string) => {
  const tags: Record<string, string> = {
    ASSIGN: 'primary',
    UNASSIGN: 'default',
    COMMENT: 'info',
    STATUS_CHANGE: 'warning',
    ESCALATE: 'danger',
    ATTACH: 'success',
  }
  return tags[action] || 'default'
}

onMounted(() => {
  loadViews()
})
</script>

<style lang="scss" scoped>
.processing-page {
  .filter-bar {
    background: #fff;
    border-radius: $border-radius;
    padding: 12px 20px;
    margin-bottom: 16px;

    .filter-tabs {
      display: flex;
      gap: 4px;

      .tab {
        padding: 8px 16px;
        border: none;
        background: transparent;
        color: $text-secondary;
        font-size: 14px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: $bg-hover;
        }

        &.active {
          background: rgba($primary, 0.1);
          color: $primary;
          font-weight: 500;
        }
      }
    }
  }

  .biz-id {
    font-family: monospace;
    font-size: 13px;
    color: $text-secondary;
  }

  .last-remark {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $text-secondary;
  }
}

.notes-list {
  max-height: 400px;
  overflow-y: auto;

  .note-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #fafafa;
    border-radius: 6px;
    border-left: 3px solid $primary;

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .note-time {
        font-size: 12px;
        color: $text-tertiary;
      }
    }

    .note-operator {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 6px;
    }

    .note-status {
      font-size: 13px;
      color: $text-primary;
      margin-bottom: 6px;
    }

    .note-remark {
      font-size: 13px;
      color: $text-secondary;
      line-height: 1.5;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
    }
  }
}
</style>
