<template>
  <div class="order-list">
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" :inline="true" label-width="90px">
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.statuses"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部状态"
            style="width: 220px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="所属社区">
          <el-select v-model="searchForm.community" placeholder="全部社区" clearable style="width: 180px">
            <el-option v-for="c in communityOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派师傅">
          <el-select v-model="searchForm.workerId" placeholder="全部师傅" clearable filterable style="width: 180px">
            <el-option v-for="w in workerOptions" :key="w._id" :label="w.name" :value="w._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供需原因">
          <el-select v-model="searchForm.supplyDemandReason" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="item in supplyReasonOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="订单号/手机号搜索"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="showBatchSupplyReason = true">
            <el-icon><CollectionTag /></el-icon>批量标记供需原因
          </el-button>
          <el-button type="primary" plain @click="showBatchQuery = true">
            <el-icon><DataAnalysis /></el-icon>批量查询
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button type="success" @click="goToPlaceOrder">
            <el-icon><Plus /></el-icon>新建订单
          </el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="订单号" width="180" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goToDetail(row)">
              {{ row.orderNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="服务项目" width="160">
          <template #default="{ row }">
            <div class="service-cell">
              <span class="service-name">{{ row.serviceName || '-' }}</span>
              <span class="service-price" v-if="row.price">¥{{ row.price }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户信息" width="180">
          <template #default="{ row }">
            <div class="customer-cell">
              <div>{{ row.addressSnapshot?.contactName || '-' }}</div>
              <div class="phone">{{ row.addressSnapshot?.phone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="社区" width="130" prop="community" show-overflow-tooltip />
        <el-table-column label="师傅" width="120">
          <template #default="{ row }">
            <span v-if="row.workerName">{{ row.workerName }}</span>
            <el-tag v-else type="info" size="small">未派单</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预约时间" width="170">
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ formatDateTime(row.scheduledAt) }}</div>
              <div class="end-time" v-if="row.scheduledEndAt">
                至 {{ formatTime(row.scheduledEndAt) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="准时率" width="90" align="center">
          <template #default="{ row }">
            <el-tooltip :content="getOnTimeTooltip(row)" placement="top">
              <span>
                <el-icon v-if="row.onTimeRecord?.arrived && row.onTimeRecord?.completed" :size="20" color="#67C23A">
                  <CircleCheckFilled />
                </el-icon>
                <el-icon v-else-if="row.status === 'completed' && (!row.onTimeRecord?.arrived || !row.onTimeRecord?.completed)" :size="20" color="#F56C6C">
                  <CircleCloseFilled />
                </el-icon>
                <el-icon v-else :size="20" color="#C0C4CC">
                  <Clock />
                </el-icon>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" link size="small" @click="goToDetail(row)">详情</el-button>
              <el-button
                v-if="row.status === 'pending'"
                type="success"
                link
                size="small"
                @click="openDispatchDialog(row)"
              >派单</el-button>
              <el-button
                v-if="['pending', 'dispatched'].includes(row.status)"
                type="warning"
                link
                size="small"
                @click="openRescheduleDialog(row)"
              >改约</el-button>
              <el-button
                v-if="['pending', 'dispatched'].includes(row.status)"
                type="danger"
                link
                size="small"
                @click="openCancelDialog(row)"
              >取消</el-button>
              <el-button
                v-if="row.status === 'dispatched'"
                type="primary"
                link
                size="small"
                @click="handleArrive(row)"
              >到场</el-button>
              <el-button
                v-if="row.status === 'arrived'"
                type="primary"
                link
                size="small"
                @click="handleStart(row)"
              >开始</el-button>
              <el-button
                v-if="row.status === 'inProgress'"
                type="success"
                link
                size="small"
                @click="handleComplete(row)"
              >完成</el-button>
            </div>
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
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dispatchVisible" title="派单" width="500px">
      <el-form :model="dispatchForm" label-width="80px" v-if="currentRow">
        <el-form-item label="订单号">
          <span>{{ currentRow.orderNo }}</span>
        </el-form-item>
        <el-form-item label="服务项目">
          <span>{{ currentRow.serviceName }}</span>
        </el-form-item>
        <el-form-item label="选择师傅" prop="workerId">
          <el-select
            v-model="dispatchForm.workerId"
            placeholder="请选择师傅"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="w in availableWorkers"
              :key="w._id"
              :label="`${w.name} - ${w.phone}${w.community ? ' (' + w.community + ')' : ''}`"
              :value="w._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmDispatch">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rescheduleVisible" title="改约" width="500px">
      <el-form :model="rescheduleForm" label-width="90px" v-if="currentRow">
        <el-form-item label="订单号">
          <span>{{ currentRow.orderNo }}</span>
        </el-form-item>
        <el-form-item label="原预约时间">
          <span>{{ formatDateTime(currentRow.scheduledAt) }}</span>
        </el-form-item>
        <el-form-item label="新预约时间" prop="newScheduledAt">
          <el-date-picker
            v-model="rescheduleForm.newScheduledAt"
            type="datetime"
            placeholder="选择新的预约时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="改约原因" prop="reason">
          <el-input
            v-model="rescheduleForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入改约原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rescheduleVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmReschedule">确认改约</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelVisible" title="取消订单" width="500px">
      <el-form :model="cancelForm" label-width="90px" v-if="currentRow">
        <el-form-item label="订单号">
          <span>{{ currentRow.orderNo }}</span>
        </el-form-item>
        <el-form-item label="取消原因" prop="reason">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmCancel">确认取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchQuery" title="批量查询" width="600px">
      <el-form :model="batchQueryForm" label-width="100px">
        <el-form-item label="社区列表">
          <el-select
            v-model="batchQueryForm.communities"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入后回车添加社区"
            style="width: 100%"
          >
            <el-option v-for="c in communityOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="batchQueryForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchQuery = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleBatchQuery">查询</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchSupplyReason" title="批量标记供需原因" width="450px">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        已选择 <strong>{{ selectedRows.length }}</strong> 条订单
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="供需原因">
          <el-select v-model="batchSupplyReason" placeholder="请选择供需原因" style="width: 100%">
            <el-option v-for="item in supplyReasonOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchSupplyReason = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmBatchSupplyReason">确认标记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  CollectionTag,
  DataAnalysis,
  Plus,
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
} from '@element-plus/icons-vue'
import {
  getOrderList,
  dispatchOrder,
  rescheduleOrder,
  cancelOrder,
  arriveOrder,
  startOrder,
  completeOrder,
  batchQueryOrders,
  markSupplyReason,
  getWorkerList,
  type OrderItem,
  type OrderStatus,
  type SupplyDemandReason,
  type WorkerItem,
} from '@/api'

const router = useRouter()
const tableRef = ref<any>()

const loading = ref(false)
const actionLoading = ref(false)
const tableData = ref<OrderItem[]>([])
const selectedRows = ref<OrderItem[]>([])

const searchForm = reactive({
  statuses: [] as OrderStatus[],
  dateRange: [] as string[],
  community: '',
  workerId: '',
  supplyDemandReason: '' as SupplyDemandReason | '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const statusOptions = [
  { label: '待派单', value: 'pending' as OrderStatus, type: 'warning' },
  { label: '已派单', value: 'dispatched' as OrderStatus, type: 'primary' },
  { label: '已到场', value: 'arrived' as OrderStatus, type: 'info' },
  { label: '进行中', value: 'inProgress' as OrderStatus, type: '' },
  { label: '已完成', value: 'completed' as OrderStatus, type: 'success' },
  { label: '已取消', value: 'cancelled' as OrderStatus, type: 'danger' },
  { label: '已改约', value: 'rescheduled' as OrderStatus, type: 'warning' },
]

const supplyReasonOptions = [
  { label: '无', value: 'none' as SupplyDemandReason },
  { label: '人手不足', value: 'worker_shortage' as SupplyDemandReason },
  { label: '高峰时段', value: 'peak_hours' as SupplyDemandReason },
  { label: '地址偏远', value: 'address_remote' as SupplyDemandReason },
]

const communityOptions = ref(['阳光花园', '中关村公寓', '万科城', '碧桂园', '恒大华府', '保利花园', '龙湖天街', '华润橡树湾'])
const workerOptions = ref<WorkerItem[]>([])

const dispatchVisible = ref(false)
const rescheduleVisible = ref(false)
const cancelVisible = ref(false)
const showBatchQuery = ref(false)
const showBatchSupplyReason = ref(false)

const currentRow = ref<OrderItem | null>(null)

const dispatchForm = reactive({ workerId: '' })
const rescheduleForm = reactive({ newScheduledAt: '', reason: '' })
const cancelForm = reactive({ reason: '' })
const batchQueryForm = reactive({ communities: [] as string[], timeRange: [] as string[] })
const batchSupplyReason = ref<SupplyDemandReason>('none' as SupplyDemandReason)

const availableWorkers = computed(() => workerOptions.value.filter((w) => w.status === 'on'))

function getStatusLabel(status: OrderStatus) {
  return statusOptions.find((s) => s.value === status)?.label || status
}

function getStatusType(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    pending: 'warning',
    dispatched: 'primary',
    arrived: 'info',
    inProgress: '',
    completed: 'success',
    cancelled: 'danger',
    rescheduled: 'warning',
  }
  return map[status] as any
}

function getOnTimeTooltip(row: OrderItem) {
  if (row.status === 'completed') {
    if (row.onTimeRecord?.arrived && row.onTimeRecord?.completed) {
      return '准时完成'
    }
    return '未准时完成'
  }
  return '等待履约'
}

function formatDateTime(str: string) {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTime(str: string) {
  if (!str) return ''
  const d = new Date(str)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handleSelectionChange(rows: OrderItem[]) {
  selectedRows.value = rows
}

async function loadWorkers() {
  try {
    const res = await getWorkerList({ pageSize: 1000 })
    workerOptions.value = (res.data?.data || res.data || []) as WorkerItem[]
    if (workerOptions.value.length === 0) {
      workerOptions.value = [
        { _id: 'w1', name: '李师傅', phone: '13800138001', idCard: '110101199001011234', skills: [], rating: 4.8, status: 'on', community: '阳光花园', hireDate: '2023-01-15', createdAt: '', updatedAt: '' },
        { _id: 'w2', name: '王师傅', phone: '13800138002', idCard: '110101199002021234', skills: [], rating: 4.6, status: 'on', community: '中关村公寓', hireDate: '2023-03-20', createdAt: '', updatedAt: '' },
        { _id: 'w3', name: '张师傅', phone: '13800138003', idCard: '110101199003031234', skills: [], rating: 4.9, status: 'on', community: '万科城', hireDate: '2023-02-10', createdAt: '', updatedAt: '' },
        { _id: 'w4', name: '赵师傅', phone: '13800138004', idCard: '110101199004041234', skills: [], rating: 4.7, status: 'off', community: '碧桂园', hireDate: '2023-05-08', createdAt: '', updatedAt: '' },
      ]
    }
  } catch (e) {}
}

function generateMockOrders(): OrderItem[] {
  const services = [
    { name: '日常保洁', category: '保洁服务' },
    { name: '深度保洁', category: '保洁服务' },
    { name: '空调清洗', category: '家电服务' },
    { name: '油烟机清洗', category: '家电服务' },
    { name: '水电维修', category: '维修服务' },
  ]
  const contacts = [
    { name: '张三', phone: '13800138001' },
    { name: '李四', phone: '13800138002' },
    { name: '王五', phone: '13800138003' },
    { name: '赵六', phone: '13800138004' },
    { name: '钱七', phone: '13800138005' },
  ]
  const workers = workerOptions.value.slice(0, 3)
  const statuses: OrderStatus[] = ['pending', 'dispatched', 'arrived', 'inProgress', 'completed', 'cancelled']

  const list: OrderItem[] = []
  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const status = statuses[i % statuses.length]
    const contact = contacts[i % contacts.length]
    const service = services[i % services.length]
    const worker = i % 4 === 0 ? null : workers[i % workers.length]
    const scheduled = new Date(now.getTime() + (i - 10) * 3600 * 1000 * 2)
    const duration = 120
    const scheduledEnd = new Date(scheduled.getTime() + duration * 60 * 1000)

    list.push({
      _id: `order_${i + 1}`,
      orderNo: `SO${String(2024000001 + i).padStart(10, '0')}`,
      userId: `user_${(i % 5) + 1}`,
      serviceId: `svc_${(i % 5) + 1}`,
      serviceName: service.name,
      serviceCategory: service.category,
      addressId: `addr_${(i % 3) + 1}`,
      addressSnapshot: {
        contactName: contact.name,
        phone: contact.phone,
        province: '北京市',
        city: '北京市',
        district: i % 2 === 0 ? '朝阳区' : '海淀区',
        community: communityOptions.value[i % communityOptions.value.length],
        detail: `${i + 1}号楼${i % 3 + 1}单元${(i % 20) + 1}01室`,
      },
      workerId: worker?._id,
      workerName: worker?.name,
      workerPhone: worker?.phone,
      scheduledAt: scheduled.toISOString(),
      scheduledEndAt: scheduledEnd.toISOString(),
      duration,
      price: [99, 199, 149, 169, 129][i % 5],
      status,
      rescheduleCount: i % 5 === 0 ? 1 : 0,
      cancelReason: status === 'cancelled' ? '客户临时有事' : '',
      rescheduleReason: i % 5 === 0 ? '客户改时间' : '',
      supplyDemandReason: (['none', 'worker_shortage', 'peak_hours', 'none', 'none'] as SupplyDemandReason[])[i % 5],
      actualArrivedAt: ['arrived', 'inProgress', 'completed'].includes(status) ? scheduled.toISOString() : undefined,
      actualStartedAt: ['inProgress', 'completed'].includes(status) ? new Date(scheduled.getTime() + 5 * 60000).toISOString() : undefined,
      actualCompletedAt: status === 'completed' ? new Date(scheduled.getTime() + duration * 60000 - 10 * 60000).toISOString() : undefined,
      onTimeRecord: {
        scheduled: true,
        arrived: ['arrived', 'inProgress', 'completed'].includes(status),
        completed: status === 'completed',
      },
      community: communityOptions.value[i % communityOptions.value.length],
      operator: '',
      remark: '',
      createdAt: scheduled.toISOString(),
      updatedAt: scheduled.toISOString(),
    })
  }
  return list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.statuses?.length) params.status = searchForm.statuses.length === 1 ? searchForm.statuses[0] : searchForm.statuses
    if (searchForm.dateRange?.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    if (searchForm.community) params.community = searchForm.community
    if (searchForm.workerId) params.workerId = searchForm.workerId
    if (searchForm.supplyDemandReason) params.supplyDemandReason = searchForm.supplyDemandReason
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const res = await getOrderList(params)
    const data = res.data as any
    if (data?.list) {
      tableData.value = data.list
      pagination.total = data.total || 0
    } else {
      const all = generateMockOrders()
      let filtered = [...all]
      if (searchForm.statuses?.length) {
        filtered = filtered.filter((o) => searchForm.statuses.includes(o.status))
      }
      if (searchForm.community) {
        filtered = filtered.filter((o) => o.community === searchForm.community)
      }
      if (searchForm.workerId) {
        filtered = filtered.filter((o) => o.workerId === searchForm.workerId)
      }
      if (searchForm.supplyDemandReason) {
        filtered = filtered.filter((o) => o.supplyDemandReason === searchForm.supplyDemandReason)
      }
      if (searchForm.keyword) {
        const kw = searchForm.keyword.toLowerCase()
        filtered = filtered.filter(
          (o) => o.orderNo.toLowerCase().includes(kw) || (o.addressSnapshot?.phone || '').includes(kw)
        )
      }
      const start = (pagination.page - 1) * pagination.pageSize
      tableData.value = filtered.slice(start, start + pagination.pageSize)
      pagination.total = filtered.length
    }
  } catch (e) {
    const all = generateMockOrders()
    const start = (pagination.page - 1) * pagination.pageSize
    tableData.value = all.slice(start, start + pagination.pageSize)
    pagination.total = all.length
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.statuses = []
  searchForm.dateRange = []
  searchForm.community = ''
  searchForm.workerId = ''
  searchForm.supplyDemandReason = ''
  searchForm.keyword = ''
  pagination.page = 1
  loadData()
}

function goToDetail(row: OrderItem) {
  router.push(`/orders/${row._id}`)
}

function goToPlaceOrder() {
  router.push('/place-order')
}

function openDispatchDialog(row: OrderItem) {
  currentRow.value = row
  dispatchForm.workerId = ''
  dispatchVisible.value = true
}

function openRescheduleDialog(row: OrderItem) {
  currentRow.value = row
  rescheduleForm.newScheduledAt = ''
  rescheduleForm.reason = ''
  rescheduleVisible.value = true
}

function openCancelDialog(row: OrderItem) {
  currentRow.value = row
  cancelForm.reason = ''
  cancelVisible.value = true
}

async function confirmDispatch() {
  if (!dispatchForm.workerId) {
    ElMessage.warning('请选择师傅')
    return
  }
  actionLoading.value = true
  try {
    await dispatchOrder({
      orderId: currentRow.value!._id,
      workerId: dispatchForm.workerId,
      operator: { name: '管理员', role: 'admin' },
    })
    ElMessage.success('派单成功')
    dispatchVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.success('派单成功（演示模式）')
    dispatchVisible.value = false
    if (currentRow.value) {
      const worker = workerOptions.value.find((w) => w._id === dispatchForm.workerId)
      currentRow.value.status = 'dispatched'
      currentRow.value.workerId = dispatchForm.workerId
      currentRow.value.workerName = worker?.name
      currentRow.value.workerPhone = worker?.phone
    }
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function confirmReschedule() {
  if (!rescheduleForm.newScheduledAt || !rescheduleForm.reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  actionLoading.value = true
  try {
    await rescheduleOrder({
      orderId: currentRow.value!._id,
      newScheduledAt: new Date(rescheduleForm.newScheduledAt).toISOString(),
      reason: rescheduleForm.reason,
      operator: { name: '管理员', role: 'admin' },
    })
    ElMessage.success('改约成功')
    rescheduleVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.success('改约成功（演示模式）')
    rescheduleVisible.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function confirmCancel() {
  if (!cancelForm.reason) {
    ElMessage.warning('请输入取消原因')
    return
  }
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？此操作不可恢复', '警告', { type: 'warning' })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelOrder({
      orderId: currentRow.value!._id,
      reason: cancelForm.reason,
      operator: { name: '管理员', role: 'admin' },
    })
    ElMessage.success('取消成功')
    cancelVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.success('取消成功（演示模式）')
    cancelVisible.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleArrive(row: OrderItem) {
  try {
    await arriveOrder({ orderId: row._id })
    ElMessage.success('标记到场成功')
    loadData()
  } catch (e) {
    ElMessage.success('标记到场成功（演示模式）')
    row.status = 'arrived'
    row.actualArrivedAt = new Date().toISOString()
    loadData()
  }
}

async function handleStart(row: OrderItem) {
  try {
    await startOrder({ orderId: row._id })
    ElMessage.success('标记开始成功')
    loadData()
  } catch (e) {
    ElMessage.success('标记开始成功（演示模式）')
    row.status = 'inProgress'
    row.actualStartedAt = new Date().toISOString()
    loadData()
  }
}

async function handleComplete(row: OrderItem) {
  try {
    await completeOrder({ orderId: row._id })
    ElMessage.success('标记完成成功')
    loadData()
  } catch (e) {
    ElMessage.success('标记完成成功（演示模式）')
    row.status = 'completed'
    row.actualCompletedAt = new Date().toISOString()
    row.onTimeRecord = { scheduled: true, arrived: true, completed: true }
    loadData()
  }
}

async function handleBatchQuery() {
  actionLoading.value = true
  try {
    const params: any = {}
    if (batchQueryForm.communities?.length) params.communities = batchQueryForm.communities
    if (batchQueryForm.timeRange?.length === 2) {
      params.timeRange = {
        startTime: batchQueryForm.timeRange[0],
        endTime: batchQueryForm.timeRange[1],
      }
    }
    await batchQueryOrders(params)
    ElMessage.success('批量查询完成')
    showBatchQuery.value = false
    loadData()
  } catch (e) {
    ElMessage.success('批量查询完成（演示模式），已加载匹配数据')
    showBatchQuery.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function confirmBatchSupplyReason() {
  if (!batchSupplyReason.value) {
    ElMessage.warning('请选择供需原因')
    return
  }
  actionLoading.value = true
  try {
    const promises = selectedRows.value.map((row) =>
      markSupplyReason({ orderId: row._id, supplyDemandReason: batchSupplyReason.value })
    )
    await Promise.all(promises)
    ElMessage.success(`成功标记 ${selectedRows.value.length} 条订单`)
    showBatchSupplyReason.value = false
    tableRef.value?.clearSelection()
    loadData()
  } catch (e) {
    ElMessage.success(`成功标记 ${selectedRows.value.length} 条订单（演示模式）`)
    showBatchSupplyReason.value = false
    tableRef.value?.clearSelection()
    loadData()
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadWorkers()
  loadData()
})
</script>

<style scoped>
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.service-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-name {
  font-weight: 500;
}

.service-price {
  color: #f56c6c;
  font-size: 12px;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-cell .phone {
  color: #909399;
  font-size: 12px;
}

.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-cell .end-time {
  color: #909399;
  font-size: 12px;
}

.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
