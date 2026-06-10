<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">兑换记录</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="会员/兑换商品" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="待处理" value="pending" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换日期">
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
          <el-input v-model="filterForm.operatorName" placeholder="操作人" clearable style="width: 130px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="redeemNo" label="兑换编号" width="180" />
        <el-table-column label="会员信息" width="180">
          <template #default="{ row }">
            <div class="member-cell">
              <span class="name">{{ row.memberName }}</span>
              <span class="phone">{{ row.memberPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="benefitName" label="兑换商品" min-width="180" />
        <el-table-column label="消耗积分" prop="pointsCost" width="120" align="right" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="门店" prop="storeName" width="160" />
        <el-table-column label="操作人" prop="operatorName" width="100" />
        <el-table-column label="兑换时间" width="170">
          <template #default="{ row }">{{ formatDate(row.redeemTime) }}</template>
        </el-table-column>
        <el-table-column prop="failReason" label="失败原因" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="success" link size="small">通过</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" link size="small">拒绝</el-button>
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
  status: '',
  startDate: '',
  endDate: '',
  operatorName: '',
})

const statusMap = {
  pending: { text: '待处理', type: 'warning' },
  success: { text: '成功', type: 'success' },
  failed: { text: '失败', type: 'danger' },
}

function statusText(s) { return statusMap[s]?.text || s }
function statusType(s) { return statusMap[s]?.type || 'info' }

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.operatorName = ''
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
    const res = await request.get('/redeems', { params: filterForm })
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
