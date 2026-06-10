<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">会员管理</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="姓名/手机号/会员号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="filterForm.level" placeholder="全部等级" clearable style="width: 150px">
            <el-option label="青铜会员" value="bronze" />
            <el-option label="白银会员" value="silver" />
            <el-option label="黄金会员" value="gold" />
            <el-option label="铂金会员" value="platinum" />
            <el-option label="钻石会员" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <el-table :data="memberList" stripe style="width: 100%" @row-click="goToDetail">
        <el-table-column prop="memberNo" label="会员号" width="140" />
        <el-table-column label="会员信息" width="220">
          <template #default="{ row }">
            <div class="member-info">
              <el-avatar :size="40">{{ row.name?.charAt(0) }}</el-avatar>
              <div class="member-text">
                <div class="member-name">{{ row.name }}</div>
                <div class="member-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="会员等级" width="140">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" effect="light">
              {{ getLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可用积分" prop="availablePoints" width="120" align="right" />
        <el-table-column label="累计积分" prop="totalPoints" width="120" align="right" />
        <el-table-column label="累计消费" width="120" align="right">
          <template #default="{ row }">¥{{ row.totalConsumption }}</template>
        </el-table-column>
        <el-table-column label="订单数" prop="orderCount" width="100" align="center" />
        <el-table-column label="最近活跃" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastActiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="门店" prop="storeName" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goToDetail(row)">详情</el-button>
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
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import request from '@/utils/request'

const router = useRouter()

const memberList = ref([])
const total = ref(0)

const filterForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  level: '',
})

const levelNames = {
  bronze: '青铜会员',
  silver: '白银会员',
  gold: '黄金会员',
  platinum: '铂金会员',
  diamond: '钻石会员',
}

const levelTagTypes = {
  bronze: 'info',
  silver: 'info',
  gold: 'warning',
  platinum: 'success',
  diamond: 'danger',
}

function getLevelName(level) {
  return levelNames[level] || level
}

function levelTagType(level) {
  return levelTagTypes[level] || 'info'
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function goToDetail(row) {
  router.push(`/member-detail/${row._id}`)
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.level = ''
  filterForm.page = 1
  loadList()
}

async function loadList() {
  try {
    const res = await request.get('/members', { params: filterForm })
    memberList.value = res.list
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
.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-text {
  .member-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }
  .member-phone {
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

.el-table {
  cursor: pointer;
}
</style>
