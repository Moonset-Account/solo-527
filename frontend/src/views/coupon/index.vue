<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">优惠券管理</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="券名称/会员/手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 130px">
            <el-option label="复购券" value="repurchase" />
            <el-option label="折扣券" value="discount" />
            <el-option label="现金券" value="cash" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="未使用" value="unused" />
            <el-option label="已使用" value="used" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="领取日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="责任人">
          <el-input v-model="filterForm.responsiblePerson" placeholder="责任人" clearable style="width: 130px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="couponNo" label="券编号" width="150" />
        <el-table-column prop="name" label="券名称" min-width="180" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ typeText(row.type) }}</template>
        </el-table-column>
        <el-table-column label="面值" width="100" align="right">
          <template #default="{ row }">{{ row.value ? '¥' + row.value : '-' }}</template>
        </el-table-column>
        <el-table-column label="使用门槛" width="120" align="right">
          <template #default="{ row }">{{ row.threshold ? '满' + row.threshold : '无门槛' }}</template>
        </el-table-column>
        <el-table-column label="会员" width="140">
          <template #default="{ row }">
            <div class="member-cell">
              <span>{{ row.memberName }}</span>
              <span class="phone">{{ row.memberPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="220">
          <template #default="{ row }">
            <div class="valid-period">
              <div>{{ formatDate(row.validFrom) }}</div>
              <div class="to">至</div>
              <div>{{ formatDate(row.validTo) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="门店" prop="storeName" width="160" />
        <el-table-column label="责任人" prop="responsiblePerson" width="100" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small">详情</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const dateRange = ref([])

const filterForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  type: '',
  status: '',
  startDate: '',
  endDate: '',
  responsiblePerson: '',
})

const typeMap = { repurchase: '复购券', discount: '折扣券', cash: '现金券' }
const statusMap = {
  unused: { text: '未使用', type: 'warning' },
  used: { text: '已使用', type: 'success' },
  expired: { text: '已过期', type: 'info' },
}

function typeText(t) { return typeMap[t] || t }
function statusText(s) { return statusMap[s]?.text || s }
function statusType(s) { return statusMap[s]?.type || 'info' }

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
  filterForm.responsiblePerson = ''
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
    const res = await request.get('/coupons', { params: filterForm })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.member-cell {
  display: flex;
  flex-direction: column;
  font-size: 13px;

  .phone {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 2px;
  }
}

.valid-period {
  font-size: 12px;
  color: #6b7280;

  .to {
    color: #9ca3af;
    margin: 2px 0;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
