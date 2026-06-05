<template>
  <div class="mobile-book-detail">
    <div class="book-header" v-if="book">
      <div class="cover">
        <img v-if="book.cover" :src="book.cover" alt="封面" />
        <div v-else class="no-cover">
          <el-icon><Reading /></el-icon>
        </div>
      </div>
      <div class="info">
        <h2 class="title">{{ book.title }}</h2>
        <p class="author">{{ book.author }} · {{ book.publisher }}</p>
        <p class="isbn">ISBN: {{ book.isbn }}</p>
        <div class="price">
          <span class="current">¥{{ book.price }}</span>
        </div>
        <div class="stock-info">
          <el-tag :type="statusTagType(book.status)" size="small">
            {{ book.status_display }}
          </el-tag>
          <span style="margin-left: 8px;">
            可借: {{ book.stock_quantity - book.reserved_quantity }} / {{ book.stock_quantity }}
          </span>
        </div>
      </div>
    </div>
    
    <van-divider>内容简介</van-divider>
    <div class="summary">
      {{ book?.summary || '暂无简介' }}
    </div>
    
    <van-divider>图书信息</van-divider>
    <van-cell-group inset>
      <van-cell title="分类" :value="book?.category?.name || '-'" />
      <van-cell title="位置" :value="book?.location || '-'" />
      <van-cell title="出版日期" :value="book?.publish_date || '-'" />
      <van-cell title="页数" :value="book?.pages || '-'" />
    </van-cell-group>
    
    <div class="bottom-actions">
      <van-button
        type="primary"
        block
        :disabled="!book?.allow_reservation || (book?.stock_quantity - book?.reserved_quantity) <= 0"
        @click="goToReserve"
      >
        {{ book?.allow_reservation ? '预约图书' : '不可预留' }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Reading } from '@element-plus/icons-vue'
import { showToast } from 'vant'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const book = ref(null)

const statusTagType = (status) => {
  const types = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' }
  return types[status] || 'default'
}

const loadBook = async () => {
  try {
    const { data } = await api.get(`/books/books/${route.params.id}/`)
    book.value = data
  } catch (e) {
    showToast('加载失败')
  }
}

const goToReserve = () => {
  router.push({
    path: '/m/reservations/create',
    query: { book_id: book.value.id }
  })
}

onMounted(loadBook)
</script>

<style lang="scss" scoped>
.mobile-book-detail {
  padding-bottom: 80px;
  
  .book-header {
    display: flex;
    padding: 16px;
    background: #fff;
    
    .cover {
      width: 100px;
      height: 140px;
      margin-right: 16px;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
      
      .no-cover {
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        color: #ccc;
        font-size: 40px;
      }
    }
    
    .info {
      flex: 1;
      
      .title {
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 8px;
      }
      
      .author {
        color: #666;
        font-size: 14px;
        margin: 0 0 4px;
      }
      
      .isbn {
        color: #999;
        font-size: 12px;
        margin: 0 0 8px;
      }
      
      .price {
        margin: 8px 0;
        
        .current {
          color: #ff4d4f;
          font-size: 20px;
          font-weight: bold;
        }
      }
      
      .stock-info {
        font-size: 13px;
        color: #666;
      }
    }
  }
  
  .summary {
    padding: 0 16px;
    color: #666;
    font-size: 14px;
    line-height: 1.8;
  }
  
  .bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }
}
</style>
