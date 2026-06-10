<template>
  <div class="temperature-page">
    <div class="page-header">
      <h2>温控监控</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadRecords">
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="label">温控记录</span>
        <span class="value">{{ stats.total || 0 }}</span>
      </div>
      <div class="stat-card danger">
        <span class="label">告警记录</span>
        <span class="value">{{ stats.alertCount || 0 }}</span>
      </div>
      <div class="stat-card warning">
        <span class="label">温度过高</span>
        <span class="value">{{ stats.highCount || 0 }}</span>
      </div>
      <div class="stat-card info">
        <span class="label">温度过低</span>
        <span class="value">{{ stats.lowCount || 0 }}</span>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>订单号</label>
        <select v-model="selectedOrderId">
          <option value="">全部订单</option>
          <option v-for="order in coldChainOrders" :key="order.id" :value="String(order.id)">
            {{ order.orderNo }}
          </option>
        </select>
      </div>
      <div class="form-item">
        <label>记录类型</label>
        <select v-model="filterAlert">
          <option value="">全部</option>
          <option value="true">仅告警</option>
          <option value="false">仅正常</option>
        </select>
      </div>
    </SearchBar>

    <div class="content-row">
      <div class="chart-card">
        <div class="card-title">温度趋势</div>
        <div class="chart-container">
          <div v-if="recordList.length === 0" class="empty">暂无数据</div>
          <svg v-else class="temp-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="600" y2="50" stroke="#52c41a" stroke-dasharray="5,5" stroke-width="1" opacity="0.5" />
            <line x1="0" y1="150" x2="600" y2="150" stroke="#52c41a" stroke-dasharray="5,5" stroke-width="1" opacity="0.5" />
            <polyline
              :points="chartPoints"
              fill="none"
              stroke="#1890ff"
              stroke-width="2"
            />
            <circle
              v-for="(point, index) in chartPointList"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              :fill="point.isAlert ? '#ff4d4f' : '#1890ff'"
            />
          </svg>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="dot normal"></span>
              正常
            </span>
            <span class="legend-item">
              <span class="dot alert"></span>
              告警
            </span>
            <span class="legend-item">
              <span class="line-threshold"></span>
              阈值范围
            </span>
          </div>
        </div>
      </div>

      <div class="list-card">
        <div class="card-title">温控记录</div>
        <div class="record-list">
          <div
            v-for="record in recordList.slice(0, 10)"
            :key="record.id"
            :class="['record-item', { alert: record.isAlert }]"
          >
            <div class="record-temp">
              {{ record.temperature }}°C
            </div>
            <div class="record-info">
              <div class="record-time">{{ formatDate(record.collectedAt) }}</div>
              <div class="record-detail">
                <span v-if="record.humidity">湿度: {{ record.humidity }}%</span>
                <span v-if="record.deviceNo">设备: {{ record.deviceNo }}</span>
              </div>
              <div v-if="record.isAlert" class="record-alert">
                <StatusTag type="danger" size="sm">
                  {{ getAlertTypeLabel(record.alertType) }}
                </StatusTag>
                <span v-if="record.remark" class="alert-remark">{{ record.remark }}</span>
              </div>
            </div>
          </div>
          <div v-if="recordList.length === 0" class="empty">暂无记录</div>
        </div>

        <AppPagination
          v-model:page="pageInfo.page"
          v-model:page-size="pageInfo.pageSize"
          :total="pageInfo.total"
          @change="loadRecords"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const request = useRequest()

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const selectedOrderId = ref('')
const filterAlert = ref('')
const recordList = ref<any[]>([])
const coldChainOrders = ref<any[]>([])
const stats = reactive({
  total: 0,
  alertCount: 0,
  highCount: 0,
  lowCount: 0,
})

const chartPoints = computed(() => {
  if (recordList.value.length === 0) return ''
  const points = chartPointList.value
  return points.map(p => `${p.x},${p.y}`).join(' ')
})

const chartPointList = computed(() => {
  if (recordList.value.length === 0) return []
  const temps = recordList.value.map((r: any) => parseFloat(r.temperature))
  const minT = Math.min(...temps, 0)
  const maxT = Math.max(...temps, 10)
  const range = maxT - minT || 1

  const list = [...recordList.value].reverse()
  const len = list.length

  return list.map((r: any, i: number) => ({
    x: (i / (len - 1 || 1)) * 580 + 10,
    y: 180 - ((parseFloat(r.temperature) - minT) / range) * 160,
    isAlert: r.isAlert,
    temperature: r.temperature,
  }))
})

const loadOrders = async () => {
  try {
    const res: any = await request('/orders', {
      query: { orderType: 'COLD_CHAIN', pageSize: 50 }
    })
    if (res.code === 0) {
      coldChainOrders.value = res.data.list
    }
  } catch (e) {
    console.error('加载订单失败', e)
  }
}

const loadRecords = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
    }
    if (selectedOrderId.value) {
      params.orderId = selectedOrderId.value
    }
    if (filterAlert.value) {
      params.isAlert = filterAlert.value
    }

    const res: any = await request('/temperature/records', {
      query: params
    })
    if (res.code === 0) {
      recordList.value = res.data.list
      setTotal(res.data.total)

      stats.total = res.data.total
      stats.alertCount = res.data.list.filter((r: any) => r.isAlert).length
      stats.highCount = res.data.list.filter((r: any) => r.alertType === 'TOO_HIGH').length
      stats.lowCount = res.data.list.filter((r: any) => r.alertType === 'TOO_LOW').length
    }
  } catch (e) {
    console.error('加载温控记录失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadRecords()
}

const handleReset = () => {
  selectedOrderId.value = ''
  filterAlert.value = ''
  reset()
  loadRecords()
}

const getAlertTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    TOO_HIGH: '温度过高',
    TOO_LOW: '温度过低',
    DEVICE_OFFLINE: '设备离线',
  }
  return labels[type] || type
}

onMounted(() => {
  loadOrders()
  loadRecords()
})
</script>

<style lang="scss" scoped>
.temperature-page {
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .stat-card {
      background: #fff;
      border-radius: $border-radius;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: $shadow-sm;
      border-left: 4px solid $primary;

      &.danger {
        border-left-color: $error;

        .value {
          color: $error;
        }
      }

      &.warning {
        border-left-color: $warning;

        .value {
          color: $warning;
        }
      }

      &.info {
        border-left-color: $info;

        .value {
          color: $info;
        }
      }

      .label {
        font-size: 14px;
        color: $text-secondary;
      }

      .value {
        font-size: 28px;
        font-weight: 700;
        color: $text-primary;
      }
    }
  }

  .content-row {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 16px;
  }

  .chart-card,
  .list-card {
    background: #fff;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    overflow: hidden;
  }

  .card-title {
    padding: 16px 20px;
    border-bottom: 1px solid $border-light;
    font-size: 16px;
    font-weight: 600;
  }

  .chart-container {
    padding: 20px;

    .temp-chart {
      width: 100%;
      height: 200px;
    }

    .chart-legend {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-top: 12px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: $text-secondary;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;

          &.normal {
            background: $primary;
          }

          &.alert {
            background: $error;
          }
        }

        .line-threshold {
          width: 16px;
          height: 2px;
          background: $success;
          opacity: 0.5;
        }
      }
    }
  }

  .record-list {
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .record-item {
    display: flex;
    gap: 16px;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    background: #fafafa;
    border-left: 3px solid $success;

    &.alert {
      border-left-color: $error;
      background: #fff1f0;
    }

    .record-temp {
      font-size: 24px;
      font-weight: 700;
      color: $primary;
      min-width: 80px;
      flex-shrink: 0;
    }

    .record-info {
      flex: 1;

      .record-time {
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: 4px;
      }

      .record-detail {
        font-size: 12px;
        color: $text-tertiary;
        display: flex;
        gap: 12px;
        margin-bottom: 4px;
      }

      .record-alert {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;

        .alert-remark {
          font-size: 12px;
          color: $error;
        }
      }
    }
  }
}
</style>
