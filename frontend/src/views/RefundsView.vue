<template>
  <div class="refunds-view">
    <div class="page-header">
      <h2 class="page-title">退款异常池</h2>
    </div>

    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="24" :xs="12" :sm="12" :md="8" :lg="4.8">
          <el-card class="stat-card stat-pending" shadow="hover">
            <div class="stat-icon">
              <el-icon :size="28"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">待处理</div>
              <div class="stat-value">{{ stats.pending || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="24" :xs="12" :sm="12" :md="8" :lg="4.8">
          <el-card class="stat-card stat-processing" shadow="hover">
            <div class="stat-icon">
              <el-icon :size="28"><Loading /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">处理中</div>
              <div class="stat-value">{{ stats.processing || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="24" :xs="12" :sm="12" :md="8" :lg="4.8">
          <el-card class="stat-card stat-approved" shadow="hover">
            <div class="stat-icon">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">本月批准</div>
              <div class="stat-value">{{ stats.monthApproved || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="24" :xs="12" :sm="12" :md="8" :lg="4.8">
          <el-card class="stat-card stat-rejected" shadow="hover">
            <div class="stat-icon">
              <el-icon :size="28"><CircleClose /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">本月驳回</div>
              <div class="stat-value">{{ stats.monthRejected || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="24" :xs="12" :sm="12" :md="8" :lg="4.8">
          <el-card class="stat-card stat-amount" shadow="hover">
            <div class="stat-icon">
              <el-icon :size="28"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">涉及总金额</div>
              <div class="stat-value amount">¥{{ formatMoney(stats.totalAmount) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent="loadData">
        <el-form-item label="异常状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 130px;">
            <el-option v-for="s in dictStore.getDict('refund_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 140px;">
            <el-option v-for="t in dictStore.getDict('refund_type')" :key="t.key" :label="t.label" :value="t.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人">
          <el-select v-model="filters.handlerId" placeholder="全部" clearable filterable style="width: 140px;">
            <el-option v-for="u in handlerList" :key="u.id" :label="u.username" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额范围">
          <el-input v-model="filters.minAmount" placeholder="最小" type="number" style="width: 100px;" />
          <span class="range-separator">-</span>
          <el-input v-model="filters.maxAmount" placeholder="最大" type="number" style="width: 100px;" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="订单号/退款ID" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 查询</el-button>
          <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderNo" label="关联订单号" width="160" />
        <el-table-column label="关联用户" width="130">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="24" v-if="row.user?.avatarUrl" :src="row.user.avatarUrl" />
              <el-avatar :size="24" v-else>{{ row.user?.username?.charAt(0) || 'U' }}</el-avatar>
              <span class="username">{{ row.user?.username || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ dictStore.getDictLabel('refund_type', row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ dictStore.getDictLabel('refund_status', row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="120">
          <template #default="{ row }">
            <span class="text-danger font-medium">¥{{ formatMoney(row.refundAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="原订单金额" width="120">
          <template #default="{ row }">
            <span>¥{{ formatMoney(row.orderAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因简述" min-width="160" show-overflow-tooltip />
        <el-table-column label="申请人" width="110">
          <template #default="{ row }">{{ row.applicant?.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="处理人" width="110">
          <template #default="{ row }">{{ row.handler?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="conclusion" label="处理结论" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.conclusion">{{ row.conclusion }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            <el-tooltip :content="formatDateTime(row.createdAt)" placement="top">
              <span>{{ fromNow(row.createdAt) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="canProcess"
              link
              type="warning"
              size="small"
              @click="openProcess(row)"
            >处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerMode === 'process' ? '处理退款异常' : '退款异常详情'"
      size="680px"
      :destroy-on-close="true"
    >
      <div v-if="currentDetail" class="detail-container">
        <el-descriptions :column="2" border class="info-section">
          <el-descriptions-item label="退款ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="关联订单号">{{ currentDetail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="关联用户">
            <div class="user-cell inline">
              <el-avatar :size="24" v-if="currentDetail.user?.avatarUrl" :src="currentDetail.user.avatarUrl" />
              <el-avatar :size="24" v-else>{{ currentDetail.user?.username?.charAt(0) || 'U' }}</el-avatar>
              <span class="username">{{ currentDetail.user?.username || '-' }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag type="info" size="small">{{ dictStore.getDictLabel('refund_type', currentDetail.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentDetail.status)" size="small">
              {{ dictStore.getDictLabel('refund_status', currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="text-danger font-medium">¥{{ formatMoney(currentDetail.refundAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原订单金额">¥{{ formatMoney(currentDetail.orderAmount) }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentDetail.applicant?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentDetail.handler?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDateTime(currentDetail.appliedAt) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="原因简述">{{ currentDetail.reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="详细描述" :span="2">
            <div class="description-text">{{ currentDetail.description || '暂无详细描述' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="process-section">
          <div class="section-title">
            <el-icon><Edit /></el-icon>
            <span>处理区域</span>
          </div>
          <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="100px">
            <el-form-item label="处理状态" prop="status">
              <el-select v-model="processForm.status" :disabled="!canEdit" style="width: 100%;">
                <el-option label="批准" value="approved" />
                <el-option label="驳回" value="rejected" />
                <el-option label="完成" value="completed" />
              </el-select>
            </el-form-item>
            <el-form-item label="处理结论" prop="conclusion">
              <el-input
                v-model="processForm.conclusion"
                type="textarea"
                :rows="4"
                :disabled="!canEdit"
                placeholder="请输入处理结论"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="timeline-section">
          <div class="section-title">
            <el-icon><Clock /></el-icon>
            <span>操作日志</span>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in currentDetail.logs || []"
              :key="index"
              :timestamp="formatDateTime(log.createdAt)"
              :type="getTimelineType(log.action)"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-action">{{ log.actionLabel || log.action }}</div>
                <div class="timeline-user">
                  <el-icon><User /></el-icon>
                  {{ log.operator?.username || '系统' }}
                </div>
                <div v-if="log.remark" class="timeline-remark">{{ log.remark }}</div>
              </div>
            </el-timeline-item>
            <el-timeline-item
              :timestamp="formatDateTime(currentDetail.createdAt)"
              type="primary"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-action">创建退款异常</div>
                <div class="timeline-user">
                  <el-icon><User /></el-icon>
                  {{ currentDetail.applicant?.username || '系统' }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button
            v-if="canEdit"
            type="primary"
            :loading="submitting"
            @click="handleSubmitProcess"
          >保存处理结论</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Clock,
  Loading,
  CircleCheck,
  CircleClose,
  Money,
  Search,
  Refresh,
  Edit,
  User
} from '@element-plus/icons-vue'
import { refundApi, userApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { useUserStore } from '@/stores/user'
import { formatMoney, formatDateTime, fromNow } from '@/utils'

const dictStore = useDictStore()
const userStore = useUserStore()

const canProcess = computed(() => userStore.hasRole(['video_team', 'admin', 'finance']))
const canEdit = computed(() => canProcess.value && drawerMode.value === 'process')

const loading = ref(false)
const submitting = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const dateRange = ref<string[]>([])
const handlerList = ref<any[]>([])

const stats = reactive({
  pending: 0,
  processing: 0,
  monthApproved: 0,
  monthRejected: 0,
  totalAmount: 0
})

const filters = reactive({
  status: '',
  type: '',
  handlerId: '' as number | string,
  minAmount: '' as number | string,
  maxAmount: '' as number | string,
  startDate: '',
  endDate: '',
  keyword: ''
})

const drawerVisible = ref(false)
const drawerMode = ref<'detail' | 'process'>('detail')
const currentDetail = ref<any>(null)
const processFormRef = ref<FormInstance>()
const processForm = reactive({
  status: '',
  conclusion: ''
})

const processRules: FormRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  conclusion: [{ required: true, message: '请输入处理结论', trigger: 'blur' }]
}

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    approved: 'success',
    rejected: 'danger',
    completed: 'info'
  }
  return map[status] || 'info'
}

const getTimelineType = (action: string) => {
  const map: Record<string, string> = {
    approve: 'success',
    approved: 'success',
    reject: 'danger',
    rejected: 'danger',
    process: 'primary',
    processing: 'primary',
    complete: 'info',
    completed: 'info',
    create: 'primary'
  }
  return map[action] || ''
}

const handleDateChange = (val: string[] | null) => {
  if (val && val.length === 2) {
    filters.startDate = val[0]
    filters.endDate = val[1]
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, perPage: perPage.value, ...filters }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const res: any = await refundApi.list(params)
    list.value = res.data || []
    total.value = res.meta?.total || res.total || 0
    if (res.meta?.stats) {
      Object.assign(stats, res.meta.stats)
    }
  } finally {
    loading.value = false
  }
}

const loadHandlers = async () => {
  try {
    const res: any = await userApi.list({ perPage: 100, role: ['video_team', 'admin', 'finance'].join(',') })
    handlerList.value = res.data || []
  } catch {
    handlerList.value = []
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    type: '',
    handlerId: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    keyword: ''
  })
  dateRange.value = []
  page.value = 1
  loadData()
}

const openDetail = async (row: any) => {
  drawerMode.value = 'detail'
  await loadDetail(row.id)
}

const openProcess = async (row: any) => {
  drawerMode.value = 'process'
  await loadDetail(row.id)
  processForm.status = currentDetail.value.status === 'pending' ? 'processing' : currentDetail.value.status
  processForm.conclusion = currentDetail.value.conclusion || ''
}

const loadDetail = async (id: number) => {
  try {
    const res: any = await refundApi.detail(id)
    currentDetail.value = res.data || res
    drawerVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败')
  }
}

const handleSubmitProcess = async () => {
  if (!processFormRef.value || !currentDetail.value) return
  await processFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      await refundApi.process(currentDetail.value.id, {
        status: processForm.status,
        conclusion: processForm.conclusion
      })
      ElMessage.success('处理成功')
      drawerVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadData()
  loadHandlers()
})
</script>

<style lang="scss" scoped>
.refunds-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .page-title {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

.stats-cards {
  margin-bottom: 20px;

  .stat-card {
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease;

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;

        &.amount {
          font-size: 20px;
        }
      }
    }

    &.stat-pending {
      background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);

      .stat-icon {
        background: rgba(230, 162, 60, 0.15);
        color: #e6a23c;
      }
    }

    &.stat-processing {
      background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);

      .stat-icon {
        background: rgba(64, 158, 255, 0.15);
        color: #409eff;
      }
    }

    &.stat-approved {
      background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);

      .stat-icon {
        background: rgba(103, 194, 58, 0.15);
        color: #67c23a;
      }
    }

    &.stat-rejected {
      background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);

      .stat-icon {
        background: rgba(245, 108, 108, 0.15);
        color: #f56c6c;
      }
    }

    &.stat-amount {
      background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);

      .stat-icon {
        background: rgba(144, 147, 153, 0.15);
        color: #909399;
      }
    }
  }
}

.filter-bar {
  background: #fff;
  padding: 18px 20px 4px;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .range-separator {
    margin: 0 6px;
    color: #909399;
  }
}

.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  &.inline {
    gap: 6px;
  }

  .username {
    font-size: 14px;
    color: #303133;
  }
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
}

.font-medium {
  font-weight: 500;
}

.detail-container {
  padding-right: 8px;
}

.info-section {
  margin-bottom: 24px;

  .description-text {
    line-height: 1.7;
    color: #606266;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.process-section,
.timeline-section {
  margin-bottom: 24px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }
}

.timeline-section {
  :deep(.el-timeline-item__timestamp) {
    color: #909399;
    font-size: 12px;
  }

  .timeline-content {
    .timeline-action {
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }

    .timeline-user {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }

    .timeline-remark {
      font-size: 13px;
      color: #909399;
      background: #f5f7fa;
      padding: 8px 12px;
      border-radius: 6px;
      line-height: 1.6;
      margin-top: 6px;
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .refunds-view {
    padding: 12px;
  }

  .stats-cards {
    :deep(.el-col) {
      margin-bottom: 12px;
    }
  }
}
</style>
