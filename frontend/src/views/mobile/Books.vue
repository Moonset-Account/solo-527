<template>
  <div class="books-page">
    <van-search
      v-model="keyword"
      placeholder="搜索书名/ISBN/作者"
      shape="round"
      background="#fff"
      @search="handleSearch"
    />
    
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filterStatus" :options="statusOptions" />
        <van-dropdown-item v-model="filterCategory" :options="categoryOptions" />
      </van-dropdown-menu>
    </div>

    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadBooks">
      <van-cell-group inset>
        <van-cell
          v-for="book in books"
          :key="book.id"
          is-link
          :title="book.title"
          :label="`${book.author} · ¥${book.price}`"
          size="large"
          @click="$router.push(`/m/books/${book.id}`)"
        >
          <template #icon>
            <div class="book-cover">
              <van-icon name="book-o" size="32" />
            </div>
          </template>
          <template #right-icon>
            <div class="stock-info">
              <span :class="`stock-${book.status}`">
                {{ book.available_quantity }}册
              </span>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </van-list>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/request'

const keyword = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const books = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)

const statusOptions = [
  { text: '全部状态', value: '' },
  { text: '有库存', value: 'in_stock' },
  { text: '库存不足', value: 'low_stock' },
  { text: '缺货', value: 'out_of_stock' },
]

const categoryOptions = [
  { text: '全部分类', value: '' },
  { text: '文学', value: 1 },
  { text: '历史', value: 2 },
  { text: '科学', value: 3 },
]

const loadBooks = async () => {
  try {
    const { data } = await api.get('/books/books/', {
      params: {
        page: page.value,
        page_size: 20,
        search: keyword.value,
        status: filterStatus.value,
        category: filterCategory.value
      }
    })
    books.value = [...books.value, ...data.results]
    page.value++
    if (data.results.length < 20) {
      finished.value = true
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  books.value = []
  page.value = 1
  finished.value = false
  loadBooks()
}

onMounted(() => {
  loadBooks()
})
</script>

<style lang="scss" scoped>
.books-page {
  .filter-bar {
    margin: 12px 0;
  }
  
  .book-cover {
    width: 48px;
    height: 60px;
    background: #f0f0f0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
  
  .stock-info {
    font-size: 12px;
    
    .stock-in_stock {
      color: #52c41a;
    }
    .stock-low_stock {
      color: #faad14;
    }
    .stock-out_of_stock {
      color: #ff4d4f;
    }
  }
}
</style>
