<template>
  <div class="book-manage">
    <div class="page-header">
      <h2>绘本管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon>
          新建绘本
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="绘本名称">
          <el-input v-model="filters.search" placeholder="请输入" clearable @keyup.enter="loadBooks" />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部" clearable @change="loadBooks">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="loadBooks">
            <el-option label="可外借" value="available" />
            <el-option label="已借出" value="borrowed" />
            <el-option label="修复中" value="repairing" />
            <el-option label="已预约" value="reserved" />
            <el-option label="已下架" value="off_shelf" />
            <el-option label="已丢失" value="lost" />
          </el-select>
        </el-form-item>

        <el-form-item label="是否可借">
          <el-select v-model="filters.can_borrow" placeholder="全部" clearable @change="loadBooks">
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadBooks">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="books" stripe v-loading="loading" @row-click="goToDetail" row-key="id">
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <el-image :src="row.cover" fit="cover" class="mini-cover" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="书名" min-width="180" />
      <el-table-column prop="author" label="作者" width="120" />
      <el-table-column prop="isbn" label="ISBN" width="130" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column prop="status_display" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否可借" width="80">
        <template #default="{ row }">
          <el-tag :type="row.can_borrow ? 'success' : 'info'" size="small">
            {{ row.can_borrow ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="馆藏" width="100">
        <template #default="{ row }">
          <span>{{ row.available_copies }}/{{ row.total_copies }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="age_min" label="适合年龄" width="100">
        <template #default="{ row }">{{ row.age_min }}-{{ row.age_max }}岁</template>
      </el-table-column>
      <el-table-column prop="location" label="馆藏位置" width="100" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click.stop="goToBookDetail(row)">
            详情
          </el-button>
          <template v-if="row.status !== 'off_shelf'">
            <el-button type="warning" size="small" link @click.stop="handleOffShelf(row)">
              下架
            </el-button>
          </template>
          <template v-else>
            <el-button type="success" size="small" link @click.stop="handleOnShelf(row)">
              上架
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadBooks"
      @current-change="loadBooks"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Refresh } from '@element-plus/icons-vue'
import { api } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const books = ref([])
const categories = ref([])
const themes = ref([])
const loading = ref(false)
const showCreate = ref(false)

const filters = reactive({
  search: '',
  category: '',
  status: '',
  can_borrow: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

function initFiltersFromQuery() {
  const query = route.query
  if (query.search) filters.search = query.search
  if (query.category) filters.category = query.category
  if (query.status) filters.status = query.status
  if (query.can_borrow) filters.can_borrow = query.can_borrow
  if (query.page) pagination.page = parseInt(query.page)
  if (query.pageSize) pagination.pageSize = parseInt(query.pageSize)
}

function updateQueryParams() {
  const query = {
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  Object.keys(query).forEach(key => {
    if (!query[key]) delete query[key]
  })
  router.replace({ query })
}

function getStatusType(status) {
  const map = {
    available: 'success',
    borrowed: 'warning',
    repairing: 'info',
    reserved: 'primary',
    off_shelf: 'danger',
    lost: 'danger'
  }
  return map[status] || 'info'
}

async function loadBooks() {
  loading.value = true
  try {
    updateQueryParams()
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    }
    const data = await api.books.list(params)
    books.value = data.results || data
    pagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载绘本列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
  filters.status = ''
  filters.can_borrow = ''
  pagination.page = 1
  loadBooks()
}

async function loadCategories() {
  try {
    const data = await api.books.categories()
    categories.value = data.results || data
  } catch (error) {}
}

async function loadThemes() {
  try {
    const data = await api.books.themes()
    themes.value = data.results || data
  } catch (error) {}
}

function goToDetail(row) {
  router.push({
    path: `/admin/books/${row.id}`,
    query: { ...route.query }
  })
}

function goToBookDetail(row) {
  router.push({
    path: `/books/${row.id}`,
    query: { ...route.query }
  })
}

async function handleOffShelf(row) {
  try {
    await ElMessageBox.confirm(
      '下架后将自动取消所有预约，确定要下架这本绘本吗？',
      '确认下架',
      { type: 'warning' }
    )
    await api.books.offShelf(row.id)
    ElMessage.success('绘本已下架，相关预约将被取消')
    loadBooks()
  } catch (error) {}
}

async function handleOnShelf(row) {
  try {
    await api.books.onShelf(row.id)
    ElMessage.success('绘本已上架')
    loadBooks()
  } catch (error) {}
}

function handleExport() {
  const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
  api.books.export(params).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `绘本列表_${dayjs().format('YYYYMMDD')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

onMounted(() => {
  initFiltersFromQuery()
  loadCategories()
  loadThemes()
  loadBooks()
})
</script>

<style scoped>
.book-manage {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.mini-cover {
  width: 50px;
  height: 65px;
  border-radius: 4px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
