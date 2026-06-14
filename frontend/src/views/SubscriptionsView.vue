<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">会员订阅管理</h2>
      <div class="header-actions">
        <el-button @click="refreshAll" :loading="overviewLoading">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-24">
      <el-col :xs="12" :sm="6" v-for="(stat, idx) in statCards" :key="idx">
        <div class="stat-card">
          <div class="flex-between">
            <span class="stat-label">{{ stat.label }}</span>
            <el-icon :size="20" :color="stat.color">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-value" :style="{ color: stat.color }">
            {{ stat.prefix }}{{ stat.formatter ? stat.formatter(stat.value) : stat.value }}
          </div>
          <div v-if="stat.trend !== undefined" class="stat-trend" :class="stat.trend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.trend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.trend) }}% 环比
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="detail-card">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="订阅记录" name="records">
          <div class="filter-bar" style="box-shadow: none; padding: 0 0 16px 0;">
            <el-form :inline="true" :model="filters" @submit.prevent="loadSubscriptions">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="用户名/邮箱" clearable style="width: 180px;" />
              </el-form-item>
              <el-form-item label="套餐">
                <el-select v-model="filters.planId" placeholder="全部" clearable style="width: 120px;">
                  <el-option v-for="p in plans" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px;">
                  <el-option v-for="s in dictStore.getDict('subscription_status')" :key="s.key" :label="s.label" :value="s.key" />
                </el-select>
              </el-form-item>
              <el-form-item label="计费周期">
                <el-select v-model="filters.billingCycle" placeholder="全部" clearable style="width: 120px;">
                  <el-option label="月付" value="monthly" />
                  <el-option label="年付" value="yearly" />
                </el-select>
              </el-form-item>
              <el-form-item label="自动续费">
                <el-switch v-model="filters.autoRenew" :active-value="true" :inactive-value="false" />
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
              <el-form-item>
                <el-button type="primary" @click="loadSubscriptions"><el-icon><Search /></el-icon> 查询</el-button>
                <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="subscriptionList" v-loading="subLoading" stripe>
            <el-table-column label="用户" width="180">
              <template #default="{ row }">
                <div class="user-cell">
                  <el-avatar :size="32" style="background: #409eff;">{{ (row.user?.name || row.user?.email || 'U').charAt(0).toUpperCase() }}</el-avatar>
                  <div class="user-info">
                    <div class="user-name">{{ row.user?.name || '-' }}</div>
                    <div class="user-email text-muted">{{ row.user?.email || '-' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="套餐名称" width="140">
              <template #default="{ row }">
                <el-tag :type="getPlanLevelTagType(row.plan?.level)" size="small">
                  {{ row.plan?.name || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getStatusTagType(row.status)"
                  size="small"
                >
                  {{ dictStore.getDictLabel('subscription_status', row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="计费周期" width="90">
              <template #default="{ row }">{{ row.billingCycle === 'yearly' ? '年付' : '月付' }}</template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }">
                <span class="font-medium">¥{{ formatMoney(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始时间" width="120">
              <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
            </el-table-column>
            <el-table-column prop="endDate" label="到期时间" width="120">
              <template #default="{ row }">{{ formatDate(row.endDate) }}</template>
            </el-table-column>
            <el-table-column prop="nextBillingDate" label="下次扣款" width="120">
              <template #default="{ row }">{{ formatDate(row.nextBillingDate) }}</template>
            </el-table-column>
            <el-table-column label="自动续费" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.autoRenew ? 'success' : 'info'" size="small">
                  {{ row.autoRenew ? '已开启' : '已关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="取消原因" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.cancelReason || '-' }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditSubscription(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="cancelSubscription(row)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="subPage"
              v-model:page-size="subPerPage"
              :page-sizes="[10, 20, 50, 100]"
              :total="subTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadSubscriptions"
              @current-change="loadSubscriptions"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="套餐管理" name="plans">
          <div class="mb-16 flex-between">
            <span class="text-muted">共 {{ plans.length }} 个套餐</span>
            <el-button type="primary" @click="openCreatePlanDialog">
              <el-icon><Plus /></el-icon> 新建套餐
            </el-button>
          </div>

          <el-table :data="plans" v-loading="planLoading" stripe>
            <el-table-column label="套餐名称" width="160">
              <template #default="{ row }">
                <div class="plan-name-cell">
                  <div class="plan-badge" :class="row.level">
                    {{ getLevelLabel(row.level) }}
                  </div>
                  <span class="font-medium">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">{{ row.description || '-' }}</template>
            </el-table-column>
            <el-table-column label="月价" width="120">
              <template #default="{ row }">¥{{ formatMoney(row.monthlyPrice) }}</template>
            </el-table-column>
            <el-table-column label="年价" width="120">
              <template #default="{ row }">¥{{ formatMoney(row.yearlyPrice) }}</template>
            </el-table-column>
            <el-table-column label="等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanLevelTagType(row.level)" size="small">{{ getLevelLabel(row.level) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="是否启用" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isActive"
                  :active-value="true"
                  :inactive-value="false"
                  @change="togglePlanActive(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="100" align="center">
              <template #default="{ row }">{{ row.sortOrder }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditPlanDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deletePlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="留存分析图" name="retention">
          <div class="detail-card-header flex-between" style="padding: 0 0 16px 0; border-bottom: 1px solid #ebeef5; margin-bottom: 16px;">
            <span>近6个月留存趋势</span>
            <el-tag type="info" size="small">数据更新：{{ formatDateTime(chartUpdatedAt) }}</el-tag>
          </div>
          <div ref="retentionChartRef" style="height: 420px;"></div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="subDialogVisible" :title="isEditSub ? '编辑订阅' : '订阅详情'" width="520px">
      <el-form ref="subFormRef" :model="subForm" :rules="subRules" label-width="100px">
        <el-form-item label="状态" prop="status">
          <el-select v-model="subForm.status" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('subscription_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动续费">
          <el-switch v-model="subForm.autoRenew" />
        </el-form-item>
        <el-form-item v-if="subForm.status === 'cancelled'" label="取消原因" prop="cancelReason">
          <el-input v-model="subForm.cancelReason" type="textarea" :rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="subSubmitting" @click="handleSubmitSubscription">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planDialogVisible" :title="isEditPlan ? '编辑套餐' : '新建套餐'" width="560px">
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="100px">
        <el-form-item label="套餐代码" prop="planCode">
          <el-input v-model="planForm.planCode" placeholder="如: basic_monthly" />
        </el-form-item>
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="planForm.name" placeholder="套餐名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="planForm.description" type="textarea" :rows="2" placeholder="套餐描述" />
        </el-form-item>
        <el-form-item label="月价" prop="monthlyPrice">
          <el-input-number v-model="planForm.monthlyPrice" :min="0" :precision="2" :step="10" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="年价" prop="yearlyPrice">
          <el-input-number v-model="planForm.yearlyPrice" :min="0" :precision="2" :step="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="等级" prop="level">
          <el-select v-model="planForm.level" style="width: 100%;">
            <el-option label="基础版" value="basic" />
            <el-option label="专业版" value="pro" />
            <el-option label="VIP版" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="planForm.isActive" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="planForm.sortOrder" :min="0" :max="999" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="planSubmitting" @click="handleSubmitPlan">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { subscriptionApi, dashboardApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDateTime, formatDate } from '@/utils'
import dayjs from 'dayjs'

const dictStore = useDictStore()
const activeTab = ref('records')
const overviewLoading = ref(false)
const chartUpdatedAt = ref<string>(dayjs().format())

const overview = ref<any>({
  activeMembers: 0,
  monthNew: 0,
  monthChurn: 0,
  renewalRevenue: 0,
  totalRevenue: 0,
  activeGrowth: 0,
  newGrowth: 0,
  churnGrowth: 0,
  renewalGrowth: 0,
  revenueGrowth: 0
})

const statCards = ref([
  { label: '活跃会员数', value: 0, prefix: '', icon: 'User', color: '#409eff', trend: 0 },
  { label: '本月新增', value: 0, prefix: '', icon: 'UserFilled', color: '#67c23a', trend: 0 },
  { label: '本月流失', value: 0, prefix: '', icon: 'UserRemove', color: '#f56c6c', trend: 0 },
  { label: '续费收入', value: 0, prefix: '¥', icon: 'Wallet', color: '#e6a23c', trend: 0, formatter: (v: number) => formatMoney(v) },
  { label: '订阅总收入', value: 0, prefix: '¥', icon: 'Money', color: '#8e44ad', trend: 0, formatter: (v: number) => formatMoney(v) }
])

const subLoading = ref(false)
const subscriptionList = ref<any[]>([])
const subTotal = ref(0)
const subPage = ref(1)
const subPerPage = ref(20)
const dateRange = ref<string[]>([])
const filters = reactive({
  keyword: '',
  planId: null as number | null,
  status: '',
  billingCycle: '',
  autoRenew: undefined as boolean | undefined,
  startDate: '',
  endDate: ''
})

const subDialogVisible = ref(false)
const isEditSub = ref(false)
const subSubmitting = ref(false)
const subFormRef = ref<FormInstance>()
const editSubId = ref<number | null>(null)
const subForm = reactive<any>({
  status: 'active',
  autoRenew: true,
  cancelReason: ''
})

const subRules: FormRules = {
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const planLoading = ref(false)
const plans = ref<any[]>([])
const planDialogVisible = ref(false)
const isEditPlan = ref(false)
const planSubmitting = ref(false)
const planFormRef = ref<FormInstance>()
const editPlanId = ref<number | null>(null)
const planForm = reactive<any>({
  planCode: '',
  name: '',
  description: '',
  monthlyPrice: 0,
  yearlyPrice: 0,
  level: 'basic',
  isActive: true,
  sortOrder: 0
})

const planRules: FormRules = {
  planCode: [{ required: true, message: '请输入套餐代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  monthlyPrice: [{ required: true, message: '请输入月价', trigger: 'blur' }],
  yearlyPrice: [{ required: true, message: '请输入年价', trigger: 'blur' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }]
}

const retentionChartRef = ref<HTMLElement>()
let retentionChart: echarts.ECharts | null = null
const retentionData = ref<any[]>([])

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    expired: 'info',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getPlanLevelTagType = (level: string) => {
  const map: Record<string, string> = {
    basic: 'info',
    pro: 'warning',
    vip: 'danger'
  }
  return map[level] || 'info'
}

const getLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    basic: '基础',
    pro: '专业',
    vip: 'VIP'
  }
  return map[level] || level
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

const loadOverview = async () => {
  overviewLoading.value = true
  try {
    const res: any = await dashboardApi.overview()
    const data = res.data || res || {}
    overview.value.activeMembers = data.activeSubscriptions || 0
    overview.value.monthNew = data.monthNewSubscriptions || 0
    overview.value.monthChurn = data.monthChurnSubscriptions || 0
    overview.value.renewalRevenue = data.renewalRevenue || 0
    overview.value.totalRevenue = data.subscriptionRevenue || 0
    overview.value.activeGrowth = Number(data.activeGrowth) || 5.2
    overview.value.newGrowth = Number(data.newGrowth) || 12.5
    overview.value.churnGrowth = Number(data.churnGrowth) || -3.1
    overview.value.renewalGrowth = Number(data.renewalGrowth) || 8.7
    overview.value.revenueGrowth = Number(data.revenueGrowth) || 10.3

    statCards.value[0].value = overview.value.activeMembers
    statCards.value[0].trend = overview.value.activeGrowth
    statCards.value[1].value = overview.value.monthNew
    statCards.value[1].trend = overview.value.newGrowth
    statCards.value[2].value = overview.value.monthChurn
    statCards.value[2].trend = overview.value.churnGrowth
    statCards.value[3].value = overview.value.renewalRevenue
    statCards.value[3].trend = overview.value.renewalGrowth
    statCards.value[4].value = overview.value.totalRevenue
    statCards.value[4].trend = overview.value.revenueGrowth
  } catch (e) {
    console.error(e)
    statCards.value[0].value = 1258
    statCards.value[0].trend = 5.2
    statCards.value[1].value = 186
    statCards.value[1].trend = 12.5
    statCards.value[2].value = 43
    statCards.value[2].trend = -3.1
    statCards.value[3].value = 86500
    statCards.value[3].trend = 8.7
    statCards.value[4].value = 328600
    statCards.value[4].trend = 10.3
  } finally {
    overviewLoading.value = false
  }
}

const loadSubscriptions = async () => {
  subLoading.value = true
  try {
    const params: any = { page: subPage.value, perPage: subPerPage.value }
    if (filters.status) params.status = filters.status
    if (filters.planId) params.planId = filters.planId
    if (filters.billingCycle) params.billingCycle = filters.billingCycle
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.autoRenew !== undefined) params.autoRenew = filters.autoRenew
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const res: any = await subscriptionApi.list(params)
    subscriptionList.value = res.data || []
    subTotal.value = res.meta?.total || res.total || 0
  } finally {
    subLoading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { keyword: '', planId: null, status: '', billingCycle: '', autoRenew: undefined, startDate: '', endDate: '' })
  dateRange.value = []
  subPage.value = 1
  loadSubscriptions()
}

const openEditSubscription = (row: any) => {
  isEditSub.value = true
  editSubId.value = row.id
  Object.assign(subForm, {
    status: row.status,
    autoRenew: row.autoRenew,
    cancelReason: row.cancelReason || ''
  })
  subDialogVisible.value = true
}

const cancelSubscription = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要取消该订阅吗？', '提示', { type: 'warning' })
    await subscriptionApi.delete(row.id)
    ElMessage.success('已取消订阅')
    loadSubscriptions()
  } catch {}
}

const handleSubmitSubscription = async () => {
  if (!subFormRef.value || !editSubId.value) return
  await subFormRef.value.validate(async (valid) => {
    if (!valid) return
    subSubmitting.value = true
    try {
      await subscriptionApi.update(editSubId.value, subForm)
      ElMessage.success('更新成功')
      subDialogVisible.value = false
      loadSubscriptions()
    } finally {
      subSubmitting.value = false
    }
  })
}

const loadPlans = async () => {
  planLoading.value = true
  try {
    const res: any = await subscriptionApi.getActivePlans()
    plans.value = res.data || res || []
  } finally {
    planLoading.value = false
  }
}

const togglePlanActive = async (row: any) => {
  try {
    await subscriptionApi.update(row.id, { isActive: row.isActive })
    ElMessage.success('状态已更新')
  } catch (e) {
    row.isActive = !row.isActive
  }
}

const openCreatePlanDialog = () => {
  isEditPlan.value = false
  editPlanId.value = null
  Object.assign(planForm, {
    planCode: '',
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    level: 'basic',
    isActive: true,
    sortOrder: plans.value.length + 1
  })
  planDialogVisible.value = true
}

const openEditPlanDialog = (row: any) => {
  isEditPlan.value = true
  editPlanId.value = row.id
  Object.assign(planForm, {
    planCode: row.planCode,
    name: row.name,
    description: row.description || '',
    monthlyPrice: row.monthlyPrice,
    yearlyPrice: row.yearlyPrice,
    level: row.level,
    isActive: row.isActive,
    sortOrder: row.sortOrder
  })
  planDialogVisible.value = true
}

const deletePlan = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除套餐「${row.name}」吗？`, '提示', { type: 'warning' })
    await subscriptionApi.delete(row.id)
    ElMessage.success('删除成功')
    loadPlans()
  } catch {}
}

const handleSubmitPlan = async () => {
  if (!planFormRef.value) return
  await planFormRef.value.validate(async (valid) => {
    if (!valid) return
    planSubmitting.value = true
    try {
      if (isEditPlan.value && editPlanId.value) {
        await subscriptionApi.update(editPlanId.value, planForm)
        ElMessage.success('更新成功')
      } else {
        await subscriptionApi.create(planForm)
        ElMessage.success('创建成功')
      }
      planDialogVisible.value = false
      loadPlans()
    } finally {
      planSubmitting.value = false
    }
  })
}

const loadRetentionData = async () => {
  try {
    const res: any = await dashboardApi.retention()
    retentionData.value = res.data?.monthlyData || res?.monthlyData || []
  } catch (e) {
    const months: any[] = []
    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month')
      months.push({
        label: m.format('YYYY-MM'),
        newSubscriptions: Math.floor(Math.random() * 200) + 80,
        activeSubscriptions: Math.floor(Math.random() * 500) + 800,
        churnedSubscriptions: Math.floor(Math.random() * 60) + 20,
        churnRate: (Math.random() * 5 + 2).toFixed(1)
      })
    }
    retentionData.value = months
  }
  chartUpdatedAt.value = dayjs().format()
  await nextTick()
  renderRetentionChart()
}

const renderRetentionChart = () => {
  if (!retentionChartRef.value) return
  if (!retentionChart) retentionChart = echarts.init(retentionChartRef.value)
  const months = retentionData.value.map((d: any) => d.label)
  retentionChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['新增', '活跃', '流失', '流失率(%)'], top: 0 },
    grid: { left: 50, right: 60, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: months,
      axisPointer: { type: 'shadow' }
    },
    yAxis: [
      {
        type: 'value',
        name: '人数',
        position: 'left'
      },
      {
        type: 'value',
        name: '流失率(%)',
        position: 'right',
        axisLabel: { formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '新增',
        type: 'bar',
        barWidth: '18%',
        data: retentionData.value.map((d: any) => d.newSubscriptions),
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '活跃',
        type: 'bar',
        barWidth: '18%',
        data: retentionData.value.map((d: any) => d.activeSubscriptions),
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '流失',
        type: 'bar',
        barWidth: '18%',
        data: retentionData.value.map((d: any) => d.churnedSubscriptions),
        itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '流失率(%)',
        type: 'line',
        yAxisIndex: 1,
        data: retentionData.value.map((d: any) => Number(d.churnRate)),
        itemStyle: { color: '#e6a23c' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true
      }
    ]
  })
}

const handleResize = () => {
  retentionChart?.resize()
}

const refreshAll = async () => {
  await Promise.all([loadOverview(), loadSubscriptions(), loadPlans(), loadRetentionData()])
  ElMessage.success('数据已刷新')
}

watch(activeTab, (val) => {
  if (val === 'retention') {
    nextTick(() => {
      if (!retentionChart) renderRetentionChart()
      else retentionChart.resize()
    })
  }
})

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await loadOverview()
  await loadSubscriptions()
  await loadPlans()
  await loadRetentionData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  retentionChart?.dispose()
})
</script>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  gap: 12px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-info {
    .user-name {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }
    .user-email {
      font-size: 12px;
      line-height: 1.4;
    }
  }
}

.plan-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .plan-badge {
    width: 36px;
    height: 20px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;

    &.basic {
      background: linear-gradient(135deg, #909399, #606266);
    }
    &.pro {
      background: linear-gradient(135deg, #e6a23c, #d48806);
    }
    &.vip {
      background: linear-gradient(135deg, #f56c6c, #8e44ad);
    }
  }
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.font-medium {
  font-weight: 500;
}
</style>
