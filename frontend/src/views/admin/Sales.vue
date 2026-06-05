<template>
  <div class="admin-sales">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-label">今日销售额</div>
              <div class="stat-value primary">¥{{ salesSummary.today_amount || 0 }}</div>
              <div class="stat-desc">{{ salesSummary.today_orders || 0 }} 笔订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本周销售额</div>
              <div class="stat-value success">¥{{ salesSummary.week_amount || 0 }}</div>
              <div class="stat-desc">{{ salesSummary.week_orders || 0 }} 笔订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本月销售额</div>
              <div class="stat-value warning">¥{{ salesSummary.month_amount || 0 }}</div>
              <div class="stat-desc">{{ salesSummary.month_orders || 0 }} 笔订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">累计销售额</div>
              <div class="stat-value danger">¥{{ salesSummary.total_amount || 0 }}</div>
              <div class="stat-desc">{{ salesSummary.total_orders || 0 }} 笔订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="chartType" size="small" @change="loadSalesTrend">
                <el-radio-button label="day">今日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span>图书销量排行 Top 10</span></template>
          <div class="rank-list">
            <div v-for="(book, idx) in topBooks" :key="idx" class="rank-item">
              <span class="rank-num" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
              <div class="rank-info">
                <div class="rank-title">{{ book.title }}</div>
                <div class="rank-meta">销售 {{ book.sold_quantity }} 本 · ¥{{ book.total_amount }}</div>
              </div>
            </div>
            <div v-if="topBooks.length === 0" class="empty">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>销售订单</span>
              <div>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  style="margin-right: 12px;"
                  @change="loadOrders"
                />
                <el-button type="primary" icon="Plus" size="small" @click="openCreateOrder">新建订单</el-button>
              </div>
            </div>
          </template>
          <el-table :data="orders" v-loading="loading" stripe border>
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column label="会员" width="150">
              <template #default="{ row }">
                <span v-if="row.member">{{ row.member.name }} (会员)</span>
                <span v-else>散客</span>
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <div v-for="(item, idx) in row.items" :key="idx" style="font-size: 13px;">
                  {{ item.book.title }} x {{ item.quantity }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="总金额" width="120" align="right">
              <template #default="{ row }" style="font-weight: bold; color: #409eff;">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column label="支付方式" width="100">
              <template #default="{ row }">{{ row.payment_method_display || '-' }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewOrderDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.page_size"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="loadOrders"
              @current-change="loadOrders"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="orderDialogVisible" title="订单详情" width="600px">
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="success">已完成</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="会员">
            {{ currentOrder.member ? currentOrder.member.name : '散客' }}
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ currentOrder.payment_method_display }}
          </el-descriptions-item>
          <el-descriptions-item label="销售时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="收银员">
            {{ currentOrder.cashier?.username || '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px;">商品明细</h4>
        <el-table :data="currentOrder.items" stripe size="small" border>
          <el-table-column prop="book.title" label="书名" />
          <el-table-column prop="book.isbn" label="ISBN" width="140" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">¥{{ row.unit_price }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">¥{{ (row.unit_price * row.quantity).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <div style="text-align: right; margin-top: 16px; font-size: 18px;">
          合计：<span style="color: #ff4d4f; font-weight: bold;">¥{{ currentOrder.total_amount }}</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="createOrderVisible" title="新建销售订单" width="700px">
      <el-form label-width="100px">
        <el-form-item label="会员">
          <el-select
            v-model="orderForm.member_id"
            filterable
            clearable
            placeholder="选择会员（可选）"
            style="width: 100%;"
          >
            <el-option
              v-for="m in memberOptions"
              :key="m.id"
              :label="`${m.name} - ${m.phone_display || m.phone}`"
              :value="m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图书">
          <div style="margin-bottom: 10px;">
            <el-autocomplete
              v-model="searchBookKeyword"
              :fetch-suggestions="searchBooks"
              placeholder="搜索书名/ISBN添加"
              style="width: 300px;"
              @select="addOrderItem"
            />
          </div>
          <el-table :data="orderForm.items" size="small" border>
            <el-table-column prop="book.title" label="书名" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.book.price }}</template>
            </el-table-column>
            <el-table-column label="数量" width="140">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="right">
              <template #default="{ row }">¥{{ (row.book.price * row.quantity).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeOrderItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="orderForm.payment_method">
            <el-radio label="cash">现金</el-radio>
            <el-radio label="wechat">微信</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单总额">
          <span style="font-size: 24px; color: #ff4d4f; font-weight: bold;">
            ¥{{ calculateTotal().toFixed(2) }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOrderVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/request'
import * as echarts from 'echarts'

const loading = ref(false)
const orders = ref([])
const salesSummary = ref({})
const topBooks = ref([])
const chartType = ref('week')
const chartRef = ref(null)
const dateRange = ref(null)
let chart = null

const orderDialogVisible = ref(false)
const createOrderVisible = ref(false)
const currentOrder = ref(null)
const memberOptions = ref([])
const searchBookKeyword = ref('')

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const orderForm = reactive({
  member_id: null,
  items: [],
  payment_method: 'wechat'
})

const loadDashboard = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/summary/')
    salesSummary.value = {
      today_amount: data.today_sales || 0,
      today_orders: data.today_orders || 0,
      week_amount: data.week_sales || 0,
      week_orders: 0,
      month_amount: data.month_sales || 0,
      month_orders: 0,
      total_amount: 0,
      total_orders: 0,
      total_members: data.total_members || 0,
      active_members: data.active_members || 0,
      ...data
    }
  } catch (e) {}
  try {
    const { data } = await api.get('/sales/dashboard/top_books/')
    const rawList = data.results || data
    topBooks.value = rawList.map(item => ({
      title: item.book?.title || item.title || '未知图书',
      isbn: item.book?.isbn || '',
      sold_quantity: item.total_quantity || item.sold_quantity || 0,
      total_amount: item.total_amount || 0
    }))
  } catch (e) {}
}

const loadSalesTrend = async () => {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  const xData = chartType.value === 'day'
    ? ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    : chartType.value === 'week'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
  
  const mockData = xData.map(() => Math.round(Math.random() * 500 + 100))
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xData },
    yAxis: { type: 'value' },
    series: [{
      name: '销售额',
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
      lineStyle: { color: '#409eff' },
      itemStyle: { color: '#409eff' },
      data: mockData
    }]
  })
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, page_size: pagination.page_size }
    if (dateRange.value?.length) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const { data } = await api.get('/sales/orders/', { params })
    orders.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  const { data } = await api.get('/members/members/', { params: { page_size: 100 } })
  memberOptions.value = data.results
}

const viewOrderDetail = async (row) => {
  try {
    const { data } = await api.get(`/sales/orders/${row.id}/`)
    currentOrder.value = data
    orderDialogVisible.value = true
  } catch (e) {}
}

const openCreateOrder = () => {
  orderForm.member_id = null
  orderForm.items = []
  orderForm.payment_method = 'wechat'
  createOrderVisible.value = true
}

const searchBooks = async (queryString, cb) => {
  try {
    const { data } = await api.get('/books/books/', {
      params: { search: queryString, page_size: 20, status: 'in_stock' }
    })
    cb(data.results.map(b => ({ ...b, value: b.title })))
  } catch (e) {
    cb([])
  }
}

const addOrderItem = (book) => {
  const exists = orderForm.items.find(i => i.book_id === book.id)
  if (exists) {
    exists.quantity++
  } else {
    orderForm.items.push({ book_id: book.id, book, quantity: 1 })
  }
  searchBookKeyword.value = ''
}

const removeOrderItem = (index) => {
  orderForm.items.splice(index, 1)
}

const calculateTotal = () => {
  return orderForm.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0)
}

const submitOrder = async () => {
  if (orderForm.items.length === 0) {
    ElMessage.warning('请添加商品')
    return
  }
  try {
    await api.post('/sales/orders/', {
      member_id: orderForm.member_id,
      payment_method: orderForm.payment_method,
      items: orderForm.items.map(i => ({ book_id: i.book_id, quantity: i.quantity, unit_price: i.book.price }))
    })
    ElMessage.success('订单创建成功')
    createOrderVisible.value = false
    loadOrders()
    loadDashboard()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

watch(() => chartType.value, () => {
  nextTick(() => loadSalesTrend())
})

onMounted(() => {
  loadDashboard()
  loadOrders()
  loadMembers()
  nextTick(() => loadSalesTrend())
})
</script>

<style lang="scss" scoped>
.admin-sales {
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    
    .stat-item {
      text-align: center;
      
      .stat-label {
        color: #999;
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        
        &.primary { color: #409eff; }
        &.success { color: #52c41a; }
        &.warning { color: #faad14; }
        &.danger { color: #ff4d4f; }
      }
      
      .stat-desc {
        color: #999;
        font-size: 12px;
        margin-top: 4px;
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .rank-list {
    .rank-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child { border-bottom: none; }
      
      .rank-num {
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        font-weight: bold;
        border-radius: 4px;
        margin-right: 12px;
        background: #f0f0f0;
        color: #999;
        font-size: 12px;
        
        &.rank-1 { background: #ff4d4f; color: #fff; }
        &.rank-2 { background: #faad14; color: #fff; }
        &.rank-3 { background: #409eff; color: #fff; }
      }
      
      .rank-info {
        flex: 1;
        
        .rank-title {
          font-size: 14px;
          color: #303133;
        }
        
        .rank-meta {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
        }
      }
    }
    
    .empty {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }
  }
  
  .pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
