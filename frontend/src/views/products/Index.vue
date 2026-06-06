<template>
  <div class="products-page">
    <div class="page-header">
      <h2>商品管理</h2>
      <el-button type="primary" v-if="hasPermission('product.create')">
        <el-icon><Plus /></el-icon>
        新建商品
      </el-button>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="商品名称/SKU/条码" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="filters.category" placeholder="商品分类" clearable />
        </el-form-item>
        <el-form-item label="低库存">
          <el-switch v-model="filters.is_low_stock" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="products" style="width: 100%" v-loading="loading">
        <el-table-column prop="sku" label="SKU" width="140" />
        <el-table-column prop="barcode" label="条码" width="140" />
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="standard_price" label="标准价" width="100">
          <template #default="{ row }">
            ¥{{ row.standard_price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="wholesale_price" label="批发价" width="100">
          <template #default="{ row }">
            ¥{{ row.wholesale_price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="总库存" width="100">
          <template #default="{ row }">
            <el-tag :type="row.total_stock < row.warning_stock ? 'danger' : 'success'" size="small">
              {{ row.total_stock || 0 }}
            </el-tag>
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
              v-if="hasPermission('product.edit')"
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
const products = ref([])

const filters = reactive({
  keyword: '',
  category: '',
  is_low_stock: false,
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
    const response = await request.get('/products', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    products.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.category = ''
  filters.is_low_stock = false
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
.products-page {
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
