<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">积分权益</h2>
    </div>

    <div class="stat-row">
      <div class="stat-card card-success">
        <div class="stat-label">累计获取积分</div>
        <div class="stat-value">{{ totalEarn }}</div>
      </div>
      <div class="stat-card card-danger">
        <div class="stat-label">累计消耗积分</div>
        <div class="stat-value">{{ totalConsume }}</div>
      </div>
      <div class="stat-card card-primary">
        <div class="stat-label">记录总数</div>
        <div class="stat-value">{{ total }}</div>
      </div>
    </div>

    <div class="filter-bar mt-20">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="会员/手机号/来源" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 130px">
            <el-option label="获取" value="earn" />
            <el-option label="消耗" value="consume" />
            <el-option label="过期" value="expire" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="recordNo" label="记录编号" width="180" />
        <el-table-column label="会员信息" width="200">
          <template #default="{ row }">
            <div class="member-cell">
              <span class="name">{{ row.memberName }}</span>
              <span class="phone">{{ row.memberPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="140" />
        <el-table-column label="变动积分" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.points > 0 ? 'positive' : 'negative'">
              {{ row.points > 0 ? '+' : '' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动后余额" width="120" align="right">
          <template #default="{ row }">{{ row.balanceAfter }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="关联订单" width="150" />
        <el-table-column label="门店" prop="storeName" width="160" />
        <el-table-column label="操作人" prop="operatorName" width="100" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const dateRange = ref([])
const byType = ref([])

const filterForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  type: '',
  startDate: '',
  endDate: '',
})

const totalEarn = computed(() => {
  const item = byType.value.find(i => i._id === 'earn')
  return item?.totalPoints || 0
})

const totalConsume = computed(() => {
  const item = byType.value.find(i => i._id === 'consume')
  return Math.abs(item?.totalPoints || 0)
})

const typeMap = {
  earn: { text: '获取', type: 'success' },
  consume: { text: '消耗', type: 'danger' },
  expire: { text: '过期', type: 'info' },
}

function typeText(t) { return typeMap[t]?.text || t }
function typeTag(t) { return typeMap[t]?.type || 'info' }

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.type = ''
  dateRange.value = []
  filterForm.startDate = ''
  filterForm.endDate = ''
  filterForm.page = 1
  loadList()
}

async function loadList() {
  if (dateRange.value && dateRange.value.length === 2) {
    filterForm.startDate = dateRange.value[0]
    filterForm.endDate = dateRange.value[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
  try {
    const res = await request.get('/points', { params: filterForm })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    console.error(e)
  }
}

async function loadStats() {
  try {
    const res = await request.get('/points/stats')
    byType.value = res.byType
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadList()
  loadStats()
})
</script>

<style lang="scss" scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.card-success .stat-value { color: #67c23a; }
.card-danger .stat-value { color: #f56c6c; }
.card-primary .stat-value { color: #ec4899; }

.member-cell {
  display: flex;
  flex-direction: column;

  .name {
    font-size: 14px;
    color: #1f2937;
  }
  .phone {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
  }
}

.positive { color: #67c23a; font-weight: 600; }
.negative { color: #f56c6c; font-weight: 600; }

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
