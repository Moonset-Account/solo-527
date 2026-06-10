<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>温控安全报表</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadReports">
          🔄 刷新
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>客户</label>
        <input v-model="searchForm.customerName" placeholder="请输入客户名称" />
      </div>
      <div class="form-item">
        <label>状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="DRAFT">草稿</option>
          <option value="CONFIRMED">已确认</option>
          <option value="ARCHIVED">已归档</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>报表编号</th>
            <th>报表日期</th>
            <th>客户</th>
            <th>关联订单</th>
            <th>标准费用</th>
            <th>实际费用</th>
            <th>费用差额</th>
            <th>处理时长</th>
            <th>处理人</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reportList" :key="report.id">
            <td class="report-no">{{ report.reportNo }}</td>
            <td>{{ formatDateOnly(report.reportDate) }}</td>
            <td>{{ report.customer?.companyName || '-' }}</td>
            <td>{{ report.order?.orderNo || '-' }}</td>
            <td>{{ formatMoney(report.standardFee) }}</td>
            <td>{{ formatMoney(report.actualFee) }}</td>
            <td :class="['diff-amount', { positive: parseFloat(report.feeDifference) > 0, negative: parseFloat(report.feeDifference) < 0 }]">
              {{ parseFloat(report.feeDifference) > 0 ? '+' : '' }}{{ formatMoney(report.feeDifference) }}
            </td>
            <td>{{ formatDuration(report.handlingDurationMinutes) }}</td>
            <td>{{ report.handler?.realName || report.handlerName || '-' }}</td>
            <td>
              <StatusTag :type="getStatusTag(report.status)">
                {{ getStatusLabel(report.status) }}
              </StatusTag>
            </td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewDetail(report)">
                详情
              </button>
            </td>
          </tr>
          <tr v-if="reportList.length === 0">
            <td colspan="11">
              <div class="empty">暂无数据</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadReports"
      />
    </div>

    <AppModal v-model:visible="detailVisible" title="报表详情" width="650px">
      <div v-if="currentReport" class="report-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">报表编号</span>
              <span class="value">{{ currentReport.reportNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">报表日期</span>
              <span class="value">{{ formatDateOnly(currentReport.reportDate) }}</span>
            </div>
            <div class="info-item">
              <span class="label">客户</span>
              <span class="value">{{ currentReport.customer?.companyName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">关联订单</span>
              <span class="value">{{ currentReport.order?.orderNo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span class="value">
                <StatusTag :type="getStatusTag(currentReport.status)">
                  {{ getStatusLabel(currentReport.status) }}
                </StatusTag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">异常分钟数</span>
              <span class="value text-warning">
                {{ currentReport.abnormalMinutes ? currentReport.abnormalMinutes + ' 分钟' : '-' }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>费用信息</h4>
          <div class="fee-comparison">
            <div class="fee-item">
              <span class="fee-label">标准费用</span>
              <span class="fee-value">{{ formatMoney(currentReport.standardFee) }}</span>
            </div>
            <div class="fee-arrow">→</div>
            <div class="fee-item actual">
              <span class="fee-label">实际费用</span>
              <span class="fee-value">{{ formatMoney(currentReport.actualFee) }}</span>
            </div>
            <div class="fee-item diff">
              <span class="fee-label">差额</span>
              <span :class="['fee-value', { positive: parseFloat(currentReport.feeDifference) > 0, negative: parseFloat(currentReport.feeDifference) < 0 }]">
                {{ parseFloat(currentReport.feeDifference) > 0 ? '+' : '' }}{{ formatMoney(currentReport.feeDifference) }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>费用差异说明</h4>
          <div class="diff-reason">
            {{ currentReport.differenceReason || '暂无说明' }}
          </div>
        </div>

        <div class="detail-section">
          <h4>处理信息</h4>
          <div class="process-info">
            <div class="process-item">
              <span class="label">处理人</span>
              <span class="value">{{ currentReport.handler?.realName || currentReport.handlerName || '-' }}</span>
            </div>
            <div class="process-item">
              <span class="label">处理时长</span>
              <span class="value">{{ formatDuration(currentReport.handlingDurationMinutes) }}</span>
            </div>
            <div class="process-item">
              <span class="label">确认人</span>
              <span class="value">{{ currentReport.confirmer?.realName || '-' }}</span>
            </div>
            <div class="process-item">
              <span class="label">确认时间</span>
              <span class="value">{{ currentReport.confirmedAt ? formatDate(currentReport.confirmedAt) : '-' }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentReport.remark" class="detail-section">
          <h4>备注</h4>
          <p class="remark-text">{{ currentReport.remark }}</p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const request = useRequest()

const { formatDate, formatDateOnly, formatMoney, formatDuration } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const reportList = ref<any[]>([])
const detailVisible = ref(false)
const currentReport = ref<any>(null)

const searchForm = reactive({
  customerName: '',
  status: '',
})

const loadReports = async () => {
  try {
    const res: any = await request('/reports', {
      query: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        status: searchForm.status,
      }
    })
    if (res.code === 0) {
      reportList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载报表失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadReports()
}

const handleReset = () => {
  searchForm.customerName = ''
  searchForm.status = ''
  reset()
  loadReports()
}

const viewDetail = async (report: any) => {
  try {
    const res: any = await request(`/reports/${report.id}`)
    if (res.code === 0) {
      currentReport.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    console.error('加载详情失败', e)
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    ARCHIVED: '已归档',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    DRAFT: 'default',
    CONFIRMED: 'success',
    ARCHIVED: 'info',
  }
  return tags[status] || 'default'
}

onMounted(() => {
  loadReports()
})
</script>

<style lang="scss" scoped>
.reports-page {
  .report-no {
    font-weight: 500;
    color: $primary;
  }

  .diff-amount {
    font-weight: 600;

    &.positive {
      color: $error;
    }

    &.negative {
      color: $success;
    }
  }
}

.report-detail {
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

  .fee-comparison {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
    gap: 12px;

    .fee-item {
      flex: 1;
      text-align: center;

      .fee-label {
        display: block;
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: 8px;
      }

      .fee-value {
        font-size: 20px;
        font-weight: 700;
        color: $text-primary;
      }

      &.actual .fee-value {
        color: $primary;
      }

      &.diff .fee-value {
        font-size: 24px;
      }

      .positive {
        color: $error;
      }

      .negative {
        color: $success;
      }
    }

    .fee-arrow {
      font-size: 24px;
      color: $text-tertiary;
    }
  }

  .diff-reason {
    padding: 16px;
    background: #fffbe6;
    border-left: 4px solid $warning;
    border-radius: 4px;
    line-height: 1.6;
    color: $text-primary;
    font-size: 14px;
  }

  .process-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .process-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #fafafa;
      border-radius: 4px;

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

  .remark-text {
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
    line-height: 1.6;
    color: $text-primary;
  }
}
</style>
