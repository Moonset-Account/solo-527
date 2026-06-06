<template>
  <div class="book-list">
    <div class="page-header">
      <h2>绘本浏览</h2>
      <div class="header-actions">
        <el-button v-if="isLibrarian" type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon>
          新增绘本
        </el-button>
        <el-button v-if="isLibrarian" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <div class="filter-bar">
      <el-input
        v-model="filters.search"
        placeholder="搜索书名、作者、ISBN"
        clearable
        style="width: 280px"
        @keyup.enter="loadBooks"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select v-model="filters.category" placeholder="分类" clearable @change="loadBooks">
        <el-option
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>
      
      <el-select v-model="filters.theme" placeholder="主题" clearable @change="loadBooks">
        <el-option
          v-for="theme in themes"
          :key="theme.id"
          :label="theme.name"
          :value="theme.id"
        />
      </el-select>
      
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadBooks">
        <el-option label="可外借" value="available" />
        <el-option label="已借出" value="borrowed" />
        <el-option label="修复中" value="repairing" />
        <el-option label="已下架" value="off_shelf" />
      </el-select>
      
      <el-select v-model="filters.age" placeholder="适合年龄" clearable @change="loadBooks">
        <el-option label="2-4岁" :value="3" />
        <el-option label="4-6岁" :value="5" />
        <el-option label="6-8岁" :value="7" />
        <el-option label="8-12岁" :value="10" />
      </el-select>
    </div>
    
    <div class="book-grid">
      <el-card
        v-for="book in books"
        :key="book.id"
        class="book-card"
        shadow="hover"
        @click="goToDetail(book.id)"
      >
        <div class="book-cover">
          <img :src="book.cover || placeholderCover" :alt="book.title" />
          <div v-if="book.status !== 'available'" class="status-badge" :class="book.status">
            {{ getStatusLabel(book.status) }}
          </div>
        </div>
        <div class="book-info">
          <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
          <p class="book-author">{{ book.author }}</p>
          <div class="book-meta">
            <span class="age-tag">{{ book.age_min }}-{{ book.age_max }}岁</span>
            <span class="available">可借 {{ book.available_copies }}/{{ book.total_copies }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadBooks"
      @current-change="loadBooks"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Plus, Download } from '@element-plus/icons-vue'
import { api } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLibrarian = computed(() => userStore.isLibrarian)
const placeholderCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" fill="%23e4e7ed"%3E%3Crect width="200" height="280"/%3E%3Ctext x="100" y="140" text-anchor="middle" fill="%23909399"%3E暂无封面%3C/text%3E%3C/svg%3E'

const books = ref([])
const categories = ref([])
const themes = ref([])
const showCreate = ref(false)

const filters = reactive({
  search: '',
  category: '',
  theme: '',
  status: '',
  age: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

function getStatusLabel(status) {
  const map = {
    available: '可外借',
    borrowed: '已借出',
    repairing: '修复中',
    reserved: '已预约',
    off_shelf: '已下架',
    lost: '已丢失'
  }
  return map[status] || status
}

async function loadBooks() {
  try {
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
  }
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

function goToDetail(id) {
  router.push({
    path: `/books/${id}`,
    query: { ...filters, page: pagination.page }
  })
}

function handleExport() {
  ElMessage.info('导出功能已触发')
}

onMounted(() => {
  loadCategories()
  loadThemes()
  loadBooks()
})
</script>

<style scoped>
.book-list {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.book-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.book-card:hover {
  transform: translateY(-4px);
}

.book-cover {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 12px;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  color: white;
}

.status-badge.available { background: #67c23a; }
.status-badge.borrowed { background: #e6a23c; }
.status-badge.repairing { background: #909399; }
.status-badge.off_shelf { background: #f56c6c; }
.status-badge.reserved { background: #409eff; }

.book-info {
  padding: 0 4px;
}

.book-title {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.age-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 4px;
}

.available {
  color: #67c23a;
}

.pagination {
  justify-content: center;
}
</style>
