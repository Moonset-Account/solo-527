<template>
  <div class="exceptions-page">
    <div class="page-header">
      <h2>接口异常日志</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadExceptions">
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="exception-stats">
      <div class="stat-item new">
        <span class="label">新建</span>
        <span class="count">{{ stats.new || 0 }}</span>
      </div>
      <div class="stat-item processing">
        <span class="label">处理中</span>
        <span class="count">{{ stats.processing || 0 }}</span>
      </div>
      <div class="stat-item resolved">
        <span class="label">已解决</span>
        <span class="count">{{ stats.resolved || 0 }}</span>
      </div>
      <div class="stat-item ignored">
        <span class="label">已忽略</span>
        <span class="count">{{ stats.ignored || 0 }}</span>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>搜索</label>
        <input v-model="searchForm.keyword" placeholder="接口名/错误信息" />
      </div>
      <div class="form-item">
        <label>状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="NEW">新建</option>
          <option value="PROCESSING">处理中</option>
          <option value="RESOLVED">已解决</option>
          <option value="IGNORED">已忽略</option>
        </select>
      </div>
      <div class="form-item">
        <label>关联单据</label>
        <input v-model="searchForm.docId" placeholder="业务单据ID" />
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>请求ID</th>
            <th>接口名称</th>
            <th>方法</th>
            <th>错误码</th>
            <th>错误信息</th>
            <th>关联单据</th>
            <th>重试次数</th>
            <th>状态</th>
            <th>处理人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exc in exceptionList" :key="exc.id">
            <td class="req-id">{{ exc.requestId || exc.id }}</td>
            <td class="api-name">{{ exc.apiName }}</td>
            <td>
              <StatusTag :type="getMethodTag(exc.method)">
                {{ exc.method }}
              </StatusTag>
            </td>
            <td class="error-code">{{ exc.errorCode || '-' }}</td>
            <td class="error-msg">{{ exc.errorMessage }}</td>
            <td>
              <span v-if="exc.docId" class="doc-link" @click="goToDoc(exc)">
                {{ exc.docType || '-' }} #{{ exc.docId }}
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ exc.retryCount }}</td>
            <td>
              <StatusTag :type="getStatusTag(exc.status)">
                {{ getStatusLabel(exc.status) }}
              </StatusTag>
            </td>
            <td>{{ exc.handler?.realName || '-' }}</td>
            <td class="text-secondary text-sm">{{ formatDate(exc.createdAt) }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewDetail(exc)">
                详情
              </button>
              <button
                v-if="exc.status === 'NEW' || exc.status === 'PROCESSING'"
                class="btn btn-text btn-sm text-success"
                @click="handleProcess(exc)"
              >
                处理
              </button>
            </td>
          </tr>
          <tr v-if="exceptionList.length === 0">
            <td colspan="11">
              <div class="empty">暂无异常日志</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadExceptions"
      />
    </div>

    <AppModal v-model:visible="detailVisible" title="异常详情" width="700px">
      <div v-if="currentException" class="exception-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">请求ID</span>
              <span class="value">{{ currentException.requestId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">接口名称</span>
              <span class="value">{{ currentException.apiName }}</span>
            </div>
            <div class="info-item">
              <span class="label">请求方法</span>
              <span class="value">{{ currentException.method }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span class="value">
                <StatusTag :type="getStatusTag(currentException.status)">
                  {{ getStatusLabel(currentException.status) }}
                </StatusTag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">错误码</span>
              <span class="value text-danger">{{ currentException.errorCode || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">重试次数</span>
              <span class="value">{{ currentException.retryCount }}</span>
            </div>
            <div class="info-item full">
              <span class="label">请求URL</span>
              <span class="value url">{{ currentException.url || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>关联业务</h4>
          <div v-if="currentException.docId" class="doc-info">
            <span>单据类型：{{ currentException.docType || '-' }}</span>
            <span>单据ID：{{ currentException.docId }}</span>
            <button class="btn btn-text btn-sm" @click="goToDoc(currentException)">
              查看来源单据 →
            </button>
          </div>
          <div v-else class="text-secondary">无关联业务单据</div>
        </div>

        <div class="detail-section">
          <h4>错误信息</h4>
          <div class="error-message">
            {{ currentException.errorMessage }}
          </div>
        </div>

        <div v-if="currentException.stackTrace" class="detail-section">
          <h4>堆栈信息</h4>
          <pre class="stack-trace">{{ currentException.stackTrace }}</pre>
        </div>

        <div v-if="currentException.handlerRemark" class="detail-section">
          <h4>处理备注</h4>
          <div class="handler-remark">
            {{ currentException.handlerRemark }}
          </div>
        </div>

        <div class="detail-section">
          <h4>时间信息</h4>
          <div class="time-info">
            <div class="time-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(currentException.createdAt) }}</span>
            </div>
            <div class="time-item">
              <span class="label">最后重试</span>
              <span class="value">{{ currentException.lastRetryAt ? formatDate(currentException.lastRetryAt) : '-' }}</span>
            </div>
            <div class="time-item">
              <span class="label">解决时间</span>
              <span class="value">{{ currentException.resolvedAt ? formatDate(currentException.resolvedAt) : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>

    <AppModal v-model:visible="processVisible" title="处理异常" width="500px">
      <div class="process-form">
        <div class="form-item">
          <label>处理状态</label>
          <select v-model="processForm.status">
            <option value="PROCESSING">处理中</option>
            <option value="RESOLVED">已解决</option>
            <option value="IGNORED">已忽略</option>
          </select>
        </div>
        <div class="form-item">
          <label>处理备注</label>
          <textarea v-model="processForm.remark" placeholder="请输入处理备注" rows="4"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="processVisible = false">取消</button>
        <button class="btn btn-primary" @click="confirmProcess">确认处理</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const request = useRequest()

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const exceptionList = ref<any[]>([])
const detailVisible = ref(false)
const processVisible = ref(false)
const currentException = ref<any>(null)
const stats = reactive({
  new: 0,
  processing: 0,
  resolved: 0,
  ignored: 0,
})

const searchForm = reactive({
  keyword: '',
  status: '',
  docId: '',
})

const processForm = reactive({
  status: 'PROCESSING',
  remark: '',
})

const loadExceptions = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      status: searchForm.status,
      keyword: searchForm.keyword,
    }
    if (searchForm.docId) {
      params.docId = searchForm.docId
    }

    const res: any = await request('/exceptions', {
      query: params
    })
    if (res.code === 0) {
      exceptionList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载异常日志失败', e)
  }
}

const loadStats = async () => {
  try {
    const res: any = await request('/exceptions', {
      query: { pageSize: 100 }
    })
    if (res.code === 0) {
      const list = res.data.list
      stats.new = list.filter((e: any) => e.status === 'NEW').length
      stats.processing = list.filter((e: any) => e.status === 'PROCESSING').length
      stats.resolved = list.filter((e: any) => e.status === 'RESOLVED').length
      stats.ignored = list.filter((e: any) => e.status === 'IGNORED').length
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadExceptions()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.docId = ''
  reset()
  loadExceptions()
}

const viewDetail = (exc: any) => {
  currentException.value = exc
  detailVisible.value = true
}

const handleProcess = (exc: any) => {
  currentException.value = exc
  processForm.status = exc.status === 'NEW' ? 'PROCESSING' : exc.status
  processForm.remark = ''
  processVisible.value = true
}

const confirmProcess = async () => {
  try {
    const res: any = await request(`/exceptions/${currentException.value.id}/update`, {
      method: 'POST',
      body: {
        status: processForm.status,
        handlerRemark: processForm.remark,
      }
    })
    if (res.code === 0) {
      alert('处理成功')
      processVisible.value = false
      loadExceptions()
      loadStats()
    } else {
      alert(res.message || '处理失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '处理失败')
  }
}

const goToDoc = (exc: any) => {
  const docType = exc.docType
  if (docType === 'DELIVERY_ORDER') {
    navigateTo(`/orders/${exc.docId}`)
  } else if (docType === 'TEMPERATURE_ALERT') {
    navigateTo('/alerts')
  } else if (docType === 'CLAIM_ORDER') {
    navigateTo('/claims')
  } else {
    alert('暂不支持查看该类型单据')
  }
}

const getMethodTag = (method: string) => {
  const tags: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
  }
  return tags[method] || 'default'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    NEW: '新建',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    IGNORED: '已忽略',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    NEW: 'danger',
    PROCESSING: 'warning',
    RESOLVED: 'success',
    IGNORED: 'default',
  }
  return tags[status] || 'default'
}

onMounted(() => {
  loadExceptions()
  loadStats()
})
</script>

<style lang="scss" scoped>
.exceptions-page {
  .exception-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .stat-item {
      background: #fff;
      border-radius: $border-radius;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: $shadow-sm;
      border-left: 4px solid;

      &.new {
        border-left-color: $error;
        .count { color: $error; }
      }

      &.processing {
        border-left-color: $warning;
        .count { color: $warning; }
      }

      &.resolved {
        border-left-color: $success;
        .count { color: $success; }
      }

      &.ignored {
        border-left-color: $text-tertiary;
        .count { color: $text-tertiary; }
      }

      .label {
        font-size: 14px;
        color: $text-secondary;
      }

      .count {
        font-size: 28px;
        font-weight: 700;
      }
    }
  }

  .req-id {
    font-family: monospace;
    font-size: 12px;
    color: $text-secondary;
  }

  .api-name {
    font-size: 13px;
    font-family: monospace;
    color: $primary;
  }

  .error-code {
    font-family: monospace;
    color: $error;
  }

  .error-msg {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $text-secondary;
  }

  .doc-link {
    color: $primary;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.exception-detail {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid $border-light;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .info-item {
      &.full {
        grid-column: span 2;
      }

      .label {
        font-size: 13px;
        color: $text-secondary;
        display: block;
        margin-bottom: 4px;
      }

      .value {
        font-size: 14px;
        color: $text-primary;

        &.url {
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }
      }
    }
  }

  .doc-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #f0f5ff;
    border-radius: 6px;
    font-size: 13px;
  }

  .error-message {
    padding: 16px;
    background: #fff1f0;
    border-left: 4px solid $error;
    border-radius: 4px;
    color: $error;
    line-height: 1.6;
    font-size: 14px;
  }

  .stack-trace {
    padding: 12px;
    background: #262626;
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
  }

  .handler-remark {
    padding: 12px;
    background: #f6ffed;
    border-radius: 4px;
    line-height: 1.6;
  }

  .time-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .time-item {
      padding: 10px 12px;
      background: #fafafa;
      border-radius: 4px;

      .label {
        display: block;
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 4px;
      }

      .value {
        font-size: 13px;
        color: $text-primary;
      }
    }
  }
}

.process-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 6px;
      color: $text-secondary;
      font-size: 13px;
    }

    select, textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: 4px;
    }

    textarea {
      resize: vertical;
    }
  }
}
</style>
