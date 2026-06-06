<template>
  <div class="locations-page">
    <div class="page-header">
      <h2>仓位管理</h2>
      <el-button type="primary" v-if="hasPermission('location.create')">
        <el-icon><Plus /></el-icon>
        新建仓位
      </el-button>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="仓位编码/名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable>
            <el-option label="货架" value="rack" />
            <el-option label="货位" value="bin" />
            <el-option label="区域" value="area" />
            <el-option label="冷藏" value="cold" />
            <el-option label="特殊" value="special" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="filters.zone" placeholder="区域" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="locations" style="width: 100%" v-loading="loading">
        <el-table-column prop="code" label="仓位编码" width="140" />
        <el-table-column prop="name" label="仓位名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ getTypeName(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="zone" label="区域" width="100" />
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column prop="used_capacity" label="已用容量" width="100" />
        <el-table-column label="利用率" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.capacity > 0 ? Math.round((row.used_capacity / row.capacity) * 100) : 0"
              :status="getUtilizationStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small">查看</el-button>
            <el-button
              type="primary"
              link
              size="small"
              v-if="hasPermission('location.edit')"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const locations = ref([])

const filters = reactive({
  keyword: '',
  type: '',
  zone: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const hasPermission = (p) => userStore.hasPermission(p)

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const response = await request.get('/locations', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    locations.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.type = ''
  filters.zone = ''
  pagination.page = 1
  fetchData()
}

function handlePageChange(page) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  fetchData()
}

function getTypeName(type) {
  const map = {
    rack: '货架',
    bin: '货位',
    area: '区域',
    cold: '冷藏',
    special: '特殊',
  }
  return map[type] || type
}

function getUtilizationStatus(row) {
  if (row.capacity === 0) return null
  const percent = (row.used_capacity / row.capacity) * 100
  if (percent >= 90) return 'exception'
  if (percent >= 70) return 'warning'
  return 'success'
}
</script>

<style scoped lang="scss">
.locations-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
