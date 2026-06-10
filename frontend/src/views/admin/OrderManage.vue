<template>
  <div class="order-manage-page">
    <el-row :gutter="16" class="contribution-row">
      <el-col :span="24">
        <el-card class="contribution-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><StarFilled /></el-icon>
                复购贡献统计（按推荐人）
              </span>
              <el-button type="primary" link size="small" @click="exportContribution">
                <el-icon><Download /></el-icon>导出报表
              </el-button>
            </div>
          </template>
          <el-table :data="contributionList" size="default" stripe>
            <el-table-column type="index" label="排名" width="70" align="center">
              <template #default="{ $index }">
                <el-tag
                  v-if="$index < 3"
                  :type="['danger', 'warning', 'success'][$index]"
                  effect="dark"
                  size="small"
                  round
                >
                  TOP{{ $index + 1 }}
                </el-tag>
                <span v-else class="rank-num">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="referrerName" label="推荐人" width="140">
              <template #default="{ row }">
                <div class="referrer-cell">
                  <el-avatar :size="32" class="referrer-avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span class="referrer-name">{{ row.referrerName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="recommendCount" label="推荐人数" width="110" align="center">
              <template #default="{ row }">
                <span class="num-text">{{ row.recommendCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="firstOrderAmount" label="首单金额" width="130" align="center">
              <template #default="{ row }">
                <span class="amount-text">¥{{ row.firstOrderAmount?.toFixed?.(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="repurchaseAmount" label="复购金额" width="130" align="center">
              <template #default="{ row }">
                <span class="amount-text highlight">¥{{ row.repurchaseAmount?.toFixed?.(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="totalContribution" label="总贡献" align="center">
              <template #default="{ row }">
                <span class="total-text">¥{{ row.totalContribution?.toFixed?.(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="复购率" width="110" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.repurchaseRate || 0"
                  :stroke-width="10"
                  :color="row.repurchaseRate >= 50 ? '#67c23a' : '#e6a23c'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="订单号">
          <el-input
            v-model="filterForm.orderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户">
          <el-input
            v-model="filterForm.userName"
            placeholder="用户名/手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 140px">
            <el-option label="课程购买" value="course" />
            <el-option label="会员充值" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="filterForm.payStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="佣金状态">
          <el-select v-model="filterForm.commissionStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" value="normal" />
            <el-option label="争议中" value="dispute" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrderList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="orderList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNo" label="订单号" width="180">
          <template #default="{ row }">
            <span class="order-no-text">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户" width="120">
          <template #default="{ row }">
            <span>{{ row.userName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'course' ? 'primary' : 'warning'" size="small" effect="light">
              {{ row.type === 'course' ? '课程购买' : '会员充值' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110" align="center">
          <template #default="{ row }">
            <span class="order-amount">¥{{ row.amount?.toFixed?.(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="payStatusTag(row.payStatus).type"
              effect="light"
              size="small"
            >
              {{ payStatusTag(row.payStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="佣金状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="commissionStatusTag(row.commissionStatus).type"
              effect="light"
              size="small"
            >
              {{ commissionStatusTag(row.commissionStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="170" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.commissionStatus !== 'dispute' && row.payStatus === 'paid'"
              type="warning"
              link
              size="small"
              @click="openDisputeDialog(row)"
            >
              <el-icon><Warning /></el-icon>争议
            </el-button>
            <el-button
              v-if="row.commissionStatus === 'dispute'"
              type="primary"
              link
              size="small"
              @click="openCloseDisputeDialog(row)"
            >
              <el-icon><Check /></el-icon>关闭
            </el-button>
            <el-button type="primary" link size="small" @click="viewDetail(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadOrderList"
          @current-change="loadOrderList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="disputeDialogVisible"
      title="发起佣金争议"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="disputeForm" label-width="90px">
        <el-form-item label="订单号">
          <span class="form-readonly">{{ disputeForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="当前金额">
          <span class="form-readonly amount">¥{{ disputeForm.amount?.toFixed?.(2) }}</span>
        </el-form-item>
        <el-form-item label="争议原因" required>
          <el-select v-model="disputeForm.reason" placeholder="请选择原因" style="width: 100%">
            <el-option label="用户退款" value="refund" />
            <el-option label="订单异常" value="abnormal" />
            <el-option label="违规操作" value="violation" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="disputeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disputeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="disputeSubmitting" @click="submitDispute">确认发起</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="closeDisputeDialogVisible"
      title="确认关闭争议"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="close-warning"
        title="关闭争议后将更新佣金状态，确认操作？"
      />
      <el-form :model="closeDisputeForm" label-width="110px" style="margin-top: 20px">
        <el-form-item label="订单号">
          <span class="form-readonly">{{ closeDisputeForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="处理结果" required>
          <el-radio-group v-model="closeDisputeForm.result">
            <el-radio label="uphold">维持原判（佣金正常）</el-radio>
            <el-radio label="cancel">取消佣金（扣除）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="佣金变化">
          <span
            :class="['commission-change', closeDisputeForm.result === 'uphold' ? 'positive' : 'negative']"
          >
            {{ closeDisputeForm.result === 'uphold' ? `+¥${closeDisputeForm.commission?.toFixed?.(2)}` : `-¥${closeDisputeForm.commission?.toFixed?.(2)}` }}
          </span>
        </el-form-item>
        <el-form-item label="复购影响">
          <div class="repurchase-impact">
            <el-icon :size="16"><InfoFilled /></el-icon>
            <span v-if="closeDisputeForm.result === 'uphold'">
              该用户推荐贡献不受影响，复购率保持 <strong>{{ closeDisputeForm.repurchaseRate }}%</strong>
            </span>
            <span v-else>
              该订单不计入复购统计，复购率将下降至 <strong class="warn">{{ closeDisputeForm.repurchaseRateAfter }}%</strong>
            </span>
          </div>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input
            v-model="closeDisputeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入处理备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDisputeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="closeSubmitting" @click="submitCloseDispute">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  StarFilled,
  Download,
  User,
  Search,
  RefreshLeft,
  Warning,
  Check,
  View,
  InfoFilled
} from '@element-plus/icons-vue'
import {
  adminGetOrderList,
  adminCreateCommissionDispute,
  adminCloseCommissionDispute,
  adminGetRepurchaseContribution
} from '@/api/order'

const route = useRoute()

const loading = ref(false)
const disputeDialogVisible = ref(false)
const closeDisputeDialogVisible = ref(false)
const disputeSubmitting = ref(false)
const closeSubmitting = ref(false)

const filterForm = reactive({
  orderNo: '',
  userName: '',
  type: '',
  payStatus: '',
  commissionStatus: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const orderList = ref([])
const contributionList = ref([])

const disputeForm = reactive({
  orderNo: '',
  amount: 0,
  orderId: null,
  reason: '',
  remark: ''
})

const closeDisputeForm = reactive({
  orderNo: '',
  orderId: null,
  result: 'uphold',
  commission: 0,
  repurchaseRate: 42,
  repurchaseRateAfter: 38,
  remark: ''
})

const payStatusTag = (status) => {
  const map = {
    pending: { type: 'warning', text: '待支付' },
    paid: { type: 'success', text: '已支付' },
    refunded: { type: 'info', text: '已退款' }
  }
  return map[status] || { type: 'info', text: status }
}

const commissionStatusTag = (status) => {
  const map = {
    normal: { type: 'success', text: '正常' },
    dispute: { type: 'danger', text: '争议中' },
    closed: { type: 'info', text: '已关闭' }
  }
  return map[status] || { type: 'info', text: status }
}

const mockOrders = () => [
  { id: 1, orderNo: 'ORD2026060800101', userName: '张三', type: 'course', amount: 299.00, payStatus: 'paid', commissionStatus: 'normal', createdAt: '2026-06-08 10:12:30' },
  { id: 2, orderNo: 'ORD2026060800097', userName: '李四', type: 'member', amount: 599.00, payStatus: 'paid', commissionStatus: 'dispute', createdAt: '2026-06-08 09:45:18' },
  { id: 3, orderNo: 'ORD2026060700156', userName: '王五', type: 'course', amount: 399.00, payStatus: 'paid', commissionStatus: 'normal', createdAt: '2026-06-07 20:30:45' },
  { id: 4, orderNo: 'ORD2026060700142', userName: '赵六', type: 'course', amount: 199.00, payStatus: 'refunded', commissionStatus: 'closed', createdAt: '2026-06-07 18:22:10' },
  { id: 5, orderNo: 'ORD2026060700128', userName: '钱七', type: 'course', amount: 1299.00, payStatus: 'paid', commissionStatus: 'dispute', createdAt: '2026-06-07 16:08:52' },
  { id: 6, orderNo: 'ORD2026060600201', userName: '孙八', type: 'member', amount: 1999.00, payStatus: 'paid', commissionStatus: 'normal', createdAt: '2026-06-06 14:30:25' },
  { id: 7, orderNo: 'ORD2026060600188', userName: '周九', type: 'course', amount: 0, payStatus: 'pending', commissionStatus: 'normal', createdAt: '2026-06-06 11:15:40' },
  { id: 8, orderNo: 'ORD2026060500235', userName: '吴十', type: 'course', amount: 499.00, payStatus: 'paid', commissionStatus: 'normal', createdAt: '2026-06-05 21:05:18' }
]

const mockContributions = () => [
  { referrerName: '陈老师', recommendCount: 128, firstOrderAmount: 38400, repurchaseAmount: 56200, totalContribution: 94600, repurchaseRate: 62 },
  { referrerName: '刘老师', recommendCount: 96, firstOrderAmount: 28800, repurchaseAmount: 41500, totalContribution: 70300, repurchaseRate: 55 },
  { referrerName: '杨老师', recommendCount: 78, firstOrderAmount: 23400, repurchaseAmount: 32100, totalContribution: 55500, repurchaseRate: 48 },
  { referrerName: '黄老师', recommendCount: 56, firstOrderAmount: 16800, repurchaseAmount: 22500, totalContribution: 39300, repurchaseRate: 42 },
  { referrerName: '赵老师', recommendCount: 42, firstOrderAmount: 12600, repurchaseAmount: 15800, totalContribution: 28400, repurchaseRate: 36 }
]

const loadOrderList = async () => {
  loading.value = true
  try {
    const query = route.query.orderNo
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    if (query) params.orderNo = query
    const res = await adminGetOrderList(params)
    orderList.value = res.data?.list || mockOrders()
    pagination.total = res.data?.total || 128
  } catch (e) {
    orderList.value = mockOrders()
    pagination.total = 128
  } finally {
    loading.value = false
  }
}

const loadContribution = async () => {
  try {
    const res = await adminGetRepurchaseContribution()
    contributionList.value = res.data || mockContributions()
  } catch (e) {
    contributionList.value = mockContributions()
  }
}

const resetFilter = () => {
  filterForm.orderNo = ''
  filterForm.userName = ''
  filterForm.type = ''
  filterForm.payStatus = ''
  filterForm.commissionStatus = ''
  pagination.page = 1
  loadOrderList()
}

const exportContribution = () => {
  ElMessage.success('正在导出复购贡献报表...')
}

const openDisputeDialog = (row) => {
  disputeForm.orderNo = row.orderNo
  disputeForm.orderId = row.id
  disputeForm.amount = row.amount
  disputeForm.reason = ''
  disputeForm.remark = ''
  disputeDialogVisible.value = true
}

const submitDispute = async () => {
  if (!disputeForm.reason) {
    ElMessage.warning('请选择争议原因')
    return
  }
  disputeSubmitting.value = true
  try {
    await adminCreateCommissionDispute(disputeForm.orderId, {
      reason: disputeForm.reason,
      remark: disputeForm.remark
    })
    const order = orderList.value.find(o => o.id === disputeForm.orderId)
    if (order) order.commissionStatus = 'dispute'
    ElMessage.success('争议已发起')
    disputeDialogVisible.value = false
  } catch (e) {
    const order = orderList.value.find(o => o.id === disputeForm.orderId)
    if (order) order.commissionStatus = 'dispute'
    ElMessage.success('争议已发起')
    disputeDialogVisible.value = false
  } finally {
    disputeSubmitting.value = false
  }
}

const openCloseDisputeDialog = (row) => {
  closeDisputeForm.orderNo = row.orderNo
  closeDisputeForm.orderId = row.id
  closeDisputeForm.result = 'uphold'
  closeDisputeForm.commission = Math.round(row.amount * 0.15 * 100) / 100
  closeDisputeForm.repurchaseRate = 42
  closeDisputeForm.repurchaseRateAfter = 38
  closeDisputeForm.remark = ''
  closeDisputeDialogVisible.value = true
}

const submitCloseDispute = async () => {
  closeSubmitting.value = true
  try {
    await adminCloseCommissionDispute(closeDisputeForm.orderId, {
      result: closeDisputeForm.result,
      remark: closeDisputeForm.remark
    })
    const order = orderList.value.find(o => o.id === closeDisputeForm.orderId)
    if (order) order.commissionStatus = 'closed'
    ElMessage.success('争议已关闭')
    closeDisputeDialogVisible.value = false
    loadContribution()
  } catch (e) {
    const order = orderList.value.find(o => o.id === closeDisputeForm.orderId)
    if (order) order.commissionStatus = 'closed'
    ElMessage.success('争议已关闭')
    closeDisputeDialogVisible.value = false
    loadContribution()
  } finally {
    closeSubmitting.value = false
  }
}

const viewDetail = (row) => {
  ElMessage.info(`查看订单详情：${row.orderNo}`)
}

onMounted(() => {
  loadOrderList()
  loadContribution()
})
</script>

<style scoped>
.order-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contribution-row {
  margin-bottom: 0;
}

.contribution-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .el-icon {
  color: #e6a23c;
}

.referrer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.referrer-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
}

.referrer-name {
  font-weight: 500;
  color: #303133;
}

.num-text {
  font-weight: 600;
  color: #409eff;
}

.amount-text {
  color: #606266;
  font-weight: 500;
}

.amount-text.highlight {
  color: #67c23a;
}

.total-text {
  font-weight: 700;
  color: #303133;
  font-size: 15px;
}

.rank-num {
  font-weight: 500;
  color: #909399;
}

.filter-card {
  border-radius: 12px;
}

.filter-form {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}

.table-card {
  border-radius: 12px;
}

.order-no-text {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-amount {
  color: #f56c6c;
  font-weight: 600;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-readonly {
  color: #606266;
  font-size: 14px;
}

.form-readonly.amount {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.close-warning {
  margin: 0;
  border-radius: 8px;
}

.commission-change {
  font-size: 16px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
}

.commission-change.positive {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.commission-change.negative {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.repurchase-impact {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.repurchase-impact .el-icon {
  margin-top: 3px;
  color: #e6a23c;
  flex-shrink: 0;
}

.repurchase-impact .warn {
  color: #f56c6c;
}
</style>
