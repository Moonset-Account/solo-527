<template>
  <div class="claims-page">
    <div class="page-header">
      <h2>赔付工单</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadClaims">
          🔄 刷新
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>订单号</label>
        <input v-model="searchForm.keyword" placeholder="请输入订单号" />
      </div>
      <div class="form-item">
        <label>状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="SUBMITTED">已提交</option>
          <option value="UNDER_REVIEW">审核中</option>
          <option value="APPROVED">已批准</option>
          <option value="REJECTED">已驳回</option>
          <option value="PAID">已赔付</option>
          <option value="CLOSED">已关闭</option>
        </select>
      </div>
      <div class="form-item">
        <label>赔付类型</label>
        <select v-model="searchForm.claimType">
          <option value="">全部</option>
          <option value="DAMAGE">破损</option>
          <option value="LOSS">丢失</option>
          <option value="DELAY">延误</option>
          <option value="TEMPERATURE">温度异常</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>赔付单号</th>
            <th>关联订单</th>
            <th>赔付类型</th>
            <th>申请金额</th>
            <th>批准金额</th>
            <th>来源单据</th>
            <th>状态</th>
            <th>申请人</th>
            <th>提交时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="claim in claimList" :key="claim.id">
            <td class="claim-no">{{ claim.claimNo }}</td>
            <td>{{ claim.order?.orderNo || '-' }}</td>
            <td>
              <StatusTag :type="getClaimTypeTag(claim.claimType)">
                {{ getClaimTypeLabel(claim.claimType) }}
              </StatusTag>
            </td>
            <td class="amount">{{ formatMoney(claim.claimAmount) }}</td>
            <td class="amount approved">
              {{ claim.approvedAmount ? formatMoney(claim.approvedAmount) : '-' }}
            </td>
            <td>
              <span v-if="claim.sourceDocType" class="source-tag">
                {{ getSourceTypeLabel(claim.sourceDocType) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <StatusTag :type="getStatusTag(claim.status)">
                {{ getStatusLabel(claim.status) }}
              </StatusTag>
            </td>
            <td>{{ claim.applicant?.realName || '-' }}</td>
            <td class="text-secondary text-sm">{{ formatDate(claim.createdAt) }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewDetail(claim)">
                详情
              </button>
            </td>
          </tr>
          <tr v-if="claimList.length === 0">
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
        @change="loadClaims"
      />
    </div>

    <AppModal v-model:visible="detailVisible" title="赔付工单详情" width="700px">
      <div v-if="currentClaim" class="claim-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">赔付单号</span>
              <span class="value">{{ currentClaim.claimNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">关联订单</span>
              <span class="value">{{ currentClaim.order?.orderNo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">赔付类型</span>
              <span class="value">
                <StatusTag :type="getClaimTypeTag(currentClaim.claimType)">
                  {{ getClaimTypeLabel(currentClaim.claimType) }}
                </StatusTag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span class="value">
                <StatusTag :type="getStatusTag(currentClaim.status)">
                  {{ getStatusLabel(currentClaim.status) }}
                </StatusTag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">申请金额</span>
              <span class="value text-danger">{{ formatMoney(currentClaim.claimAmount) }}</span>
            </div>
            <div class="info-item">
              <span class="label">批准金额</span>
              <span class="value text-primary">
                {{ currentClaim.approvedAmount ? formatMoney(currentClaim.approvedAmount) : '-' }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section source-section">
          <h4>来源单据</h4>
          <div v-if="currentClaim.sourceDocType" class="source-info">
            <div class="source-type">
              <span class="label">来源类型：</span>
              <StatusTag :type="info">
                {{ getSourceTypeLabel(currentClaim.sourceDocType) }}
              </StatusTag>
            </div>
            <div v-if="currentClaim.tempAlert" class="source-detail">
              <div class="source-item">
                <span class="label">告警类型：</span>
                <span>{{ getAlertTypeLabel(currentClaim.tempAlert.alertType) }}</span>
              </div>
              <div class="source-item">
                <span class="label">温度值：</span>
                <span class="text-danger">{{ currentClaim.tempAlert.temperature }}°C</span>
              </div>
              <div class="source-item">
                <span class="label">阈值范围：</span>
                <span>{{ currentClaim.tempAlert.thresholdMin }}°C ~ {{ currentClaim.tempAlert.thresholdMax }}°C</span>
              </div>
            </div>
            <div v-else class="source-detail">
              <span class="text-secondary">来源单据ID: {{ currentClaim.sourceDocId }}</span>
            </div>
            <button class="btn btn-text" @click="goToSource(currentClaim)">
              查看来源单据 →
            </button>
          </div>
          <div v-else class="empty-source">
            无明确来源单据
          </div>
        </div>

        <div class="detail-section">
          <h4>赔付原因</h4>
          <p class="reason-text">{{ currentClaim.reason }}</p>
        </div>

        <div v-if="currentClaim.description" class="detail-section">
          <h4>详细描述</h4>
          <p class="desc-text">{{ currentClaim.description }}</p>
        </div>

        <div class="detail-section">
          <h4>审核流程</h4>
          <div class="review-flow">
            <div class="flow-item">
              <span class="flow-label">申请人</span>
              <span class="flow-value">
                {{ currentClaim.applicant?.realName || '-' }}
                <span class="flow-time">{{ formatDate(currentClaim.submittedAt) }}</span>
              </span>
            </div>
            <div class="flow-item">
              <span class="flow-label">审核人</span>
              <span class="flow-value">
                {{ currentClaim.reviewer?.realName || '待审核' }}
                <span v-if="currentClaim.reviewedAt" class="flow-time">{{ formatDate(currentClaim.reviewedAt) }}</span>
              </span>
            </div>
            <div class="flow-item">
              <span class="flow-label">批准人</span>
              <span class="flow-value">
                {{ currentClaim.approver?.realName || '-' }}
                <span v-if="currentClaim.approvedAt" class="flow-time">{{ formatDate(currentClaim.approvedAt) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const request = useRequest()

const { formatDate, formatMoney } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const claimList = ref<any[]>([])
const detailVisible = ref(false)
const currentClaim = ref<any>(null)

const searchForm = reactive({
  keyword: '',
  status: '',
  claimType: '',
})

const loadClaims = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      ...searchForm,
    }
    if (searchForm.keyword) {
      params.orderId = searchForm.keyword
    }

    const res: any = await request('/claims', {
      query: params
    })
    if (res.code === 0) {
      claimList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载赔付工单失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadClaims()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.claimType = ''
  reset()
  loadClaims()
}

const viewDetail = async (claim: any) => {
  try {
    const res: any = await request(`/claims/${claim.id}`)
    if (res.code === 0) {
      currentClaim.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    console.error('加载详情失败', e)
  }
}

const goToSource = (claim: any) => {
  if (claim.sourceDocType === 'TEMPERATURE_ALERT') {
    navigateTo('/alerts')
  } else if (claim.sourceDocType === 'TIMELINE_RECORD') {
    navigateTo(`/orders/${claim.orderId}`)
  } else {
    alert('来源单据页面暂未实现')
  }
}

const getClaimTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    DAMAGE: '破损',
    LOSS: '丢失',
    DELAY: '延误',
    TEMPERATURE: '温度异常',
    OTHER: '其他',
  }
  return labels[type] || type
}

const getClaimTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    DAMAGE: 'danger',
    LOSS: 'danger',
    DELAY: 'warning',
    TEMPERATURE: 'info',
    OTHER: 'default',
  }
  return tags[type] || 'default'
}

const getSourceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    TEMPERATURE_ALERT: '温度告警',
    TIMELINE_RECORD: '时效记录',
    COMPLAINT: '客户投诉',
    OTHER: '其他',
  }
  return labels[type] || type
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    SUBMITTED: '已提交',
    UNDER_REVIEW: '审核中',
    APPROVED: '已批准',
    REJECTED: '已驳回',
    PAID: '已赔付',
    CLOSED: '已关闭',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    SUBMITTED: 'warning',
    UNDER_REVIEW: 'primary',
    APPROVED: 'success',
    REJECTED: 'danger',
    PAID: 'success',
    CLOSED: 'default',
  }
  return tags[status] || 'default'
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
  loadClaims()
})
</script>

<style lang="scss" scoped>
.claims-page {
  .claim-no {
    font-weight: 500;
    color: $primary;
  }

  .amount {
    font-weight: 600;

    &.approved {
      color: $success;
    }
  }

  .source-tag {
    font-size: 12px;
    color: $info;
  }
}

.claim-detail {
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

  .source-section {
    .source-info {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 6px;

      .source-type {
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          color: $text-secondary;
        }
      }

      .source-detail {
        margin-bottom: 12px;
        padding: 12px;
        background: #fff;
        border-radius: 4px;
      }

      .source-item {
        font-size: 13px;
        margin-bottom: 6px;

        .label {
          color: $text-secondary;
        }
      }
    }

    .empty-source {
      color: $text-tertiary;
      font-size: 14px;
    }
  }

  .reason-text,
  .desc-text {
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
    line-height: 1.6;
    color: $text-primary;
    font-size: 14px;
  }

  .review-flow {
    .flow-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #fafafa;

      &:last-child {
        border-bottom: none;
      }

      .flow-label {
        width: 80px;
        color: $text-secondary;
        font-size: 13px;
      }

      .flow-value {
        flex: 1;
        color: $text-primary;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .flow-time {
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }
}
</style>
