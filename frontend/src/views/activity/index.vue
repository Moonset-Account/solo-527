<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">会员活跃追踪</h2>
      <div class="date-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="loadSummary"
        />
      </div>
    </div>

    <el-row :gutter="16" class="summary-section">
      <el-col :span="8">
        <div class="summary-card">
          <div class="card-icon">📊</div>
          <div class="card-info">
            <div class="card-value">{{ summary.total || 0 }}</div>
            <div class="card-label">总活跃次数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="summary-card card-2">
          <div class="card-icon">👥</div>
          <div class="card-info">
            <div class="card-value">{{ activeMembers }}</div>
            <div class="card-label">活跃会员数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="summary-card card-3">
          <div class="card-icon">📈</div>
          <div class="card-info">
            <div class="card-value">{{ typeCount }}</div>
            <div class="card-label">行为类型</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-20">
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-title">行为类型分布</div>
          <div class="type-list">
            <div v-for="item in summary.byType || []" :key="item._id" class="type-item">
              <div class="type-left">
                <span class="type-icon">{{ getTypeIcon(item._id) }}</span>
                <span class="type-name">{{ getTypeText(item._id) }}</span>
              </div>
              <div class="type-right">
                <span class="type-count">{{ item.count }}</span>
                <div class="type-bar">
                  <div class="type-bar-inner" :style="{ width: getBarWidth(item.count) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-title">每日活跃趋势</div>
          <div class="chart-container">
            <div ref="chartRef" style="height: 280px;"></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper mt-20">
      <div class="section-header">
        <span class="section-title">活跃明细</span>
        <span class="section-desc">点击记录查看详情，可一路追踪到单条行为</span>
      </div>

      <div class="filter-inline">
        <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 140px" @change="loadList">
          <el-option label="登录" value="login" />
          <el-option label="购买" value="purchase" />
          <el-option label="签到" value="signin" />
          <el-option label="浏览" value="browse" />
          <el-option label="分享" value="share" />
        </el-select>
        <el-input v-model="filterForm.keyword" placeholder="搜索会员/商品/描述" clearable style="width: 240px" @keyup.enter="loadList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="list" stripe style="width: 100%; margin-top: 16px;" @row-click="showDetail">
        <el-table-column prop="activityNo" label="记录编号" width="180" />
        <el-table-column label="会员信息" width="180">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="32">{{ row.memberName?.charAt(0) }}</el-avatar>
              <div class="member-text">
                <div class="name">{{ row.memberName }}</div>
                <div class="phone">{{ row.memberPhone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="行为类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getTypeTag(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="行为描述" min-width="160" />
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">{{ row.amount ? '¥' + row.amount : '-' }}</template>
        </el-table-column>
        <el-table-column label="积分" width="90" align="right">
          <template #default="{ row }">{{ row.points || '-' }}</template>
        </el-table-column>
        <el-table-column label="关联商品" prop="productName" width="180" show-overflow-tooltip />
        <el-table-column label="来源" prop="source" width="100" />
        <el-table-column label="门店" prop="storeName" width="160" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="goMember(row)">会员</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filterForm.page"
          v-model:page-size="filterForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="活跃记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="记录编号">{{ currentDetail.activityNo }}</el-descriptions-item>
        <el-descriptions-item label="行为类型">
          <el-tag :type="getTypeTag(currentDetail.type)">{{ getTypeText(currentDetail.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员">{{ currentDetail.memberName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentDetail.memberPhone }}</el-descriptions-item>
        <el-descriptions-item label="行为描述" :span="2">{{ currentDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentDetail.amount ? '¥' + currentDetail.amount : '-' }}</el-descriptions-item>
        <el-descriptions-item label="获得积分">{{ currentDetail.points || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ currentDetail.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联商品">{{ currentDetail.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ currentDetail.source }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentDetail.storeName }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentDetail.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备信息">{{ currentDetail.deviceInfo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发生时间" :span="2">{{ formatDate(currentDetail.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import request from '@/utils/request'

const router = useRouter()
const chartRef = ref(null)
let chartInstance = null

const list = ref([])
const total = ref(0)
const summary = ref({})
const dateRange = ref([])
const detailVisible = ref(false)
const currentDetail = ref(null)

const filterForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  type: '',
})

const typeMap = {
  login: { text: '登录', type: 'info', icon: '👤' },
  purchase: { text: '购买', type: 'success', icon: '🛒' },
  signin: { text: '签到', type: 'warning', icon: '📅' },
  browse: { text: '浏览', type: 'info', icon: '👀' },
  share: { text: '分享', type: 'primary', icon: '📤' },
}

const activeMembers = computed(() => {
  if (!summary.value?.dailyStats) return 0
  const allMembers = new Set()
  summary.value.dailyStats.forEach(d => {
    allMembers.add(d.activeMembers)
  })
  return allMembers.size || '...'
})

const typeCount = computed(() => summary.value?.byType?.length || 0)

const maxCount = computed(() => {
  if (!summary.value?.byType?.length) return 1
  return Math.max(...summary.value.byType.map(i => i.count))
})

function getTypeText(t) { return typeMap[t]?.text || t }
function getTypeTag(t) { return typeMap[t]?.type || 'info' }
function getTypeIcon(t) { return typeMap[t]?.icon || '📌' }
function getBarWidth(count) {
  return (count / maxCount.value) * 100
}

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm:ss')
}

function showDetail(row) {
  currentDetail.value = row
  detailVisible.value = true
}

function goMember(row) {
  router.push(`/member-detail/${row.memberId}`)
}

async function loadSummary() {
  const params = {}
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  try {
    const res = await request.get('/activities/summary', { params })
    summary.value = res
    nextTick(() => {
      renderChart()
    })
  } catch (e) {
    console.error(e)
  }
}

async function loadList() {
  const params = { ...filterForm }
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  try {
    const res = await request.get('/activities', { params })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    console.error(e)
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const data = summary.value.dailyStats || []
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['活跃次数', '活跃会员'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.date), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '活跃次数',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: { color: '#ec4899', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '活跃会员',
        type: 'line',
        data: data.map(d => d.activeMembers || 0),
        smooth: true,
        itemStyle: { color: '#8b5cf6' },
      },
    ],
  }
  chartInstance.setOption(option)
}

watch(() => dateRange.value, () => {
  filterForm.page = 1
  loadSummary()
  loadList()
}, { deep: true })

onMounted(() => {
  loadSummary()
  loadList()
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style lang="scss" scoped>
.summary-section {
  .summary-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .card-icon {
    font-size: 36px;
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f7;
  }
  .card-2 .card-icon { background: #eff6ff; }
  .card-3 .card-icon { background: #f0fdf4; }
  .card-value {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
  }
  .card-label {
    font-size: 14px;
    color: #6b7280;
    margin-top: 4px;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.section-desc {
  font-size: 13px;
  color: #9ca3af;
}

.filter-inline {
  display: flex;
  gap: 12px;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.type-icon {
  font-size: 20px;
}
.type-name {
  font-size: 14px;
  color: #374151;
}
.type-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 200px;
}
.type-count {
  font-size: 16px;
  font-weight: 600;
  color: #ec4899;
  min-width: 40px;
  text-align: right;
}
.type-bar {
  flex: 1;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}
.type-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s;
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.member-text {
  .name { font-size: 14px; color: #1f2937; }
  .phone { font-size: 12px; color: #9ca3af; margin-top: 2px; }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-table {
  cursor: pointer;
}
</style>
