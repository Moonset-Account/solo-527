<template>
  <div class="alerts-page">
    <div class="page-header">
      <h2>告警中心</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadAlerts">
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="alert-stats">
      <div class="stat-item open">
        <span class="label">待处理</span>
        <span class="count">{{ stats.open || 0 }}</span>
      </div>
      <div class="stat-item ack">
        <span class="label">已确认</span>
        <span class="count">{{ stats.acknowledged || 0 }}</span>
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
        <label>订单号</label>
        <input v-model="searchForm.keyword" placeholder="请输入订单号" />
      </div>
      <div class="form-item">
        <label>告警状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="OPEN">待处理</option>
          <option value="ACKNOWLEDGED">已确认</option>
          <option value="RESOLVED">已解决</option>
          <option value="IGNORED">已忽略</option>
        </select>
      </div>
      <div class="form-item">
        <label>告警级别</label>
        <select v-model="searchForm.alertLevel">
          <option value="">全部</option>
          <option value="INFO">信息</option>
          <option value="WARNING">警告</option>
          <option value="DANGER">危险</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>告警ID</th>
            <th>订单号</th>
            <th>告警类型</th>
            <th>告警级别</th>
            <th>当前温度</th>
            <th>阈值范围</th>
            <th>状态</th>
            <th>确认人</th>
            <th>解决人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in alertList" :key="alert.id">
            <td>#{{ alert.id }}</td>
            <td class="order-no">{{ alert.order?.orderNo || '-' }}</td>
            <td>
              <StatusTag :type="getAlertTypeTag(alert.alertType)">
                {{ getAlertTypeLabel(alert.alertType) }}
              </StatusTag>
            </td>
            <td>
              <StatusTag :type="getAlertLevelTag(alert.alertLevel)">
                {{ getAlertLevelLabel(alert.alertLevel) }}
              </StatusTag>
            </td>
            <td class="temp-value">
              {{ alert.temperature }}°C
            </td>
            <td class="threshold">
              {{ alert.thresholdMin }}°C ~ {{ alert.thresholdMax }}°C
            </td>
            <td>
              <StatusTag :type="getStatusTag(alert.status)">
                {{ getStatusLabel(alert.status) }}
              </StatusTag>
            </td>
            <td>{{ alert.ackUser?.realName || '-' }}</td>
            <td>{{ alert.resUser?.realName || '-' }}</td>
            <td class="text-secondary text-sm">{{ formatDate(alert.createdAt) }}</td>
            <td>
              <button
                v-if="alert.status === 'OPEN'"
                class="btn btn-text btn-sm"
                @click="handleAcknowledge(alert)"
              >
                确认
              </button>
              <button
                v-if="alert.status === 'ACKNOWLEDGED'"
                class="btn btn-text btn-sm text-success"
                @click="handleResolve(alert)"
              >
                解决
              </button>
              <button class="btn btn-text btn-sm" @click="viewDetail(alert)">
                详情
              </button>
            </td>
          </tr>
          <tr v-if="alertList.length === 0">
            <td colspan="11">
              <div class="empty">暂无告警</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadAlerts"
      />
    </div>

    <AppModal v-model:visible="detailVisible" title="告警详情" width="600px">
      <div v-if="currentAlert" class="alert-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">告警ID</span>
              <span class="value">#{{ currentAlert.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">订单号</span>
              <span class="value">{{ currentAlert.order?.orderNo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">告警类型</span>
              <span class="value">{{ getAlertTypeLabel(currentAlert.alertType) }}</span>
            </div>
            <div class="info-item">
              <span class="label">告警级别</span>
              <span class="value">
                <StatusTag :type="getAlertLevelTag(currentAlert.alertLevel)">
                  {{ getAlertLevelLabel(currentAlert.alertLevel) }}
                </StatusTag>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>温度信息</h4>
          <div class="temp-display">
            <div class="current-temp">{{ currentAlert.temperature }}°C</div>
            <div class="temp-range">
              阈值范围: {{ currentAlert.thresholdMin }}°C ~ {{ currentAlert.thresholdMax }}°C
            </div>
          </div>
        </div>

        <div v-if="currentAlert.resolution" class="detail-section">
          <h4>解决方案</h4>
          <p class="resolution-text">{{ currentAlert.resolution }}</p>
        </div>

        <div class="detail-section">
          <h4>处理记录</h4>
          <div class="process-info">
            <div class="info-row">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(currentAlert.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="label">确认人</span>
              <span class="value">{{ currentAlert.ackUser?.realName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">确认时间</span>
              <span class="value">{{ currentAlert.acknowledgedAt ? formatDate(currentAlert.acknowledgedAt) : '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">解决人</span>
              <span class="value">{{ currentAlert.resUser?.realName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">解决时间</span>
              <span class="value">{{ currentAlert.resolvedAt ? formatDate(currentAlert.resolvedAt) : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>

    <AppModal v-model:visible="resolveVisible" title="处理告警" width="500px">
      <div class="resolve-form">
        <div class="form-item">
          <label>解决方案</label>
          <textarea v-model="resolveText" placeholder="请输入解决方案和处理说明" rows="4"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="resolveVisible = false">取消</button>
        <button class="btn btn-primary" @click="confirmResolve">确认解决</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const request = useRequest()

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const alertList = ref<any[]>([])
const detailVisible = ref(false)
const resolveVisible = ref(false)
const currentAlert = ref<any>(null)
const resolveText = ref('')
const stats = reactive({
  open: 0,
  acknowledged: 0,
  resolved: 0,
  ignored: 0,
})

const searchForm = reactive({
  keyword: '',
  status: '',
  alertLevel: '',
})

const loadAlerts = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      ...searchForm,
    }

    const res: any = await request('/alerts', {
      query: params
    })
    if (res.code === 0) {
      alertList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载告警失败', e)
  }
}

const loadStats = async () => {
  try {
    const res: any = await request('/alerts', {
      query: { pageSize: 100 }
    })
    if (res.code === 0) {
      const list = res.data.list
      stats.open = list.filter((a: any) => a.status === 'OPEN').length
      stats.acknowledged = list.filter((a: any) => a.status === 'ACKNOWLEDGED').length
      stats.resolved = list.filter((a: any) => a.status === 'RESOLVED').length
      stats.ignored = list.filter((a: any) => a.status === 'IGNORED').length
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadAlerts()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.alertLevel = ''
  reset()
  loadAlerts()
}

const viewDetail = (alert: any) => {
  currentAlert.value = alert
  detailVisible.value = true
}

const handleAcknowledge = async (alert: any) => {
  if (!confirm('确认处理此告警？')) return

  try {
    const res: any = await request(`/alerts/${alert.id}/action`, {
      method: 'POST',
      body: { action: 'acknowledge' }
    })
    if (res.code === 0) {
      alert('确认成功')
      loadAlerts()
      loadStats()
    } else {
      alert(res.message || '操作失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

const handleResolve = (alert: any) => {
  currentAlert.value = alert
  resolveText.value = ''
  resolveVisible.value = true
}

const confirmResolve = async () => {
  if (!resolveText.value) {
    alert('请输入解决方案')
    return
  }

  try {
    const res: any = await request(`/alerts/${currentAlert.value.id}/action`, {
      method: 'POST',
      body: { action: 'resolve', resolution: resolveText.value }
    })
    if (res.code === 0) {
      alert('处理成功')
      resolveVisible.value = false
      loadAlerts()
      loadStats()
    } else {
      alert(res.message || '操作失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

const getAlertTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    TOO_HIGH: '温度过高',
    TOO_LOW: '温度过低',
    DEVICE_OFFLINE: '设备离线',
  }
  return labels[type] || type
}

const getAlertTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    TOO_HIGH: 'danger',
    TOO_LOW: 'warning',
    DEVICE_OFFLINE: 'warning',
  }
  return tags[type] || 'default'
}

const getAlertLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    INFO: '信息',
    WARNING: '警告',
    DANGER: '危险',
  }
  return labels[level] || level
}

const getAlertLevelTag = (level: string) => {
  const tags: Record<string, string> = {
    INFO: 'info',
    WARNING: 'warning',
    DANGER: 'danger',
  }
  return tags[level] || 'default'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    OPEN: '待处理',
    ACKNOWLEDGED: '已确认',
    RESOLVED: '已解决',
    IGNORED: '已忽略',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    OPEN: 'danger',
    ACKNOWLEDGED: 'warning',
    RESOLVED: 'success',
    IGNORED: 'default',
  }
  return tags[status] || 'default'
}

onMounted(() => {
  loadAlerts()
  loadStats()
})
</script>

<style lang="scss" scoped>
.alerts-page {
  .alert-stats {
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

      &.open {
        border-left-color: $error;

        .count {
          color: $error;
        }
      }

      &.ack {
        border-left-color: $warning;

        .count {
          color: $warning;
        }
      }

      &.resolved {
        border-left-color: $success;

        .count {
          color: $success;
        }
      }

      &.ignored {
        border-left-color: $text-tertiary;

        .count {
          color: $text-tertiary;
        }
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

  .order-no {
    font-weight: 500;
    color: $primary;
  }

  .temp-value {
    font-weight: 600;
    color: $error;
    font-size: 16px;
  }

  .threshold {
    font-size: 13px;
    color: $text-secondary;
  }
}

.alert-detail {
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
  }

  .info-item {
    .label {
      font-size: 13px;
      color: $text-secondary;
      display: block;
      margin-bottom: 4px;
    }

    .value {
      font-size: 14px;
      color: $text-primary;
    }
  }

  .temp-display {
    text-align: center;
    padding: 20px;
    background: #fff1f0;
    border-radius: 8px;

    .current-temp {
      font-size: 48px;
      font-weight: 700;
      color: $error;
      line-height: 1;
      margin-bottom: 8px;
    }

    .temp-range {
      font-size: 14px;
      color: $text-secondary;
    }
  }

  .resolution-text {
    padding: 12px;
    background: #f6ffed;
    border-radius: 6px;
    color: $text-primary;
    line-height: 1.6;
  }

  .process-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #fafafa;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: $text-secondary;
        font-size: 13px;
      }

      .value {
        color: $text-primary;
        font-size: 13px;
      }
    }
  }
}

.resolve-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 6px;
      color: $text-secondary;
      font-size: 13px;
    }

    textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: 4px;
      resize: vertical;
    }
  }
}
</style>
