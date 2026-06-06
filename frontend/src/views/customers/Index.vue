<template>
  <div class="customers-page">
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" v-if="hasPermission('customer.create')">
        <el-icon><Plus /></el-icon>
        新建客户
      </el-button>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="客户名称/编码/电话" clearable />
        </el-form-item>
        <el-form-item label="是否VIP">
          <el-select v-model="filters.is_vip" placeholder="全部" clearable>
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.is_active" placeholder="全部" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="customers" style="width: 100%" v-loading="loading">
        <el-table-column prop="customer_code" label="客户编码" width="140" />
        <el-table-column prop="name" label="客户名称" min-width="150" />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="credit_limit" label="赊账额度" width="120">
          <template #default="{ row }">
            ¥{{ row.credit_limit }}
          </template>
        </el-table-column>
        <el-table-column prop="current_debt" label="当前欠款" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.current_debt > 0 }">¥{{ row.current_debt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="VIP" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_vip" type="warning" size="small">VIP</el-tag>
            <span v-else>-</span>
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
              v-if="hasPermission('customer.edit')"
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
const customers = ref([])

const filters = reactive({
  keyword: '',
  is_vip: '',
  is_active: '',
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
    const response = await request.get('/customers', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    customers.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.is_vip = ''
  filters.is_active = ''
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
</script>

<style scoped lang="scss">
.customers-page {
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
  .text-danger {
    color: #F56C6C;
    font-weight: 500;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
