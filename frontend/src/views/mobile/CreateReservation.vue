<template>
  <div class="create-reservation-page">
    <van-form @submit="handleSubmit">
      <van-cell-group inset title="会员信息">
        <van-field
          v-model="selectedMember?.name"
          readonly
          is-link
          label="会员"
          placeholder="请选择会员"
          required
          @click="showMemberPicker = true"
        >
          <template #right-icon>
            <van-icon name="search" size="18" />
          </template>
        </van-field>
        <van-field
          v-if="selectedMember"
          readonly
          label="手机号"
          :value="maskPhone(selectedMember.phone)"
        />
      </van-cell-group>

      <van-cell-group inset title="预留图书">
        <div v-for="(item, index) in items" :key="index" class="book-item">
          <van-cell
            readonly
            is-link
            :title="item.book?.title || '选择图书'"
            :border="false"
            @click="selectBook(index)"
          >
            <template #label>
              <span v-if="item.book">库存: {{ item.book.available_quantity }}</span>
            </template>
            <template #right-icon>
              <van-icon name="close" size="18" color="#999" @click.stop="removeBook(index)" />
            </template>
          </van-cell>
          <van-stepper
            v-if="item.book"
            v-model="item.quantity"
            :min="1"
            :max="item.book.available_quantity"
            @change="calculateTotal"
          />
        </div>
        <van-cell is-link title="添加图书" icon="plus" @click="selectBook(items.length)" />
      </van-cell-group>

      <van-cell-group inset title="预留信息">
        <van-field
          v-model="form.contact_name"
          label="联系人"
          placeholder="请输入联系人姓名"
          required
        />
        <van-field
          v-model="form.contact_phone"
          label="联系电话"
          placeholder="请输入联系电话"
          type="tel"
          required
        />
        <van-field
          v-model="form.expire_hours"
          label="保留时长"
          type="number"
          :rules="[{ required: true, message: '请输入保留时长' }]"
        >
          <template #right-icon>小时</template>
        </van-field>
        <van-field
          v-model="form.remark"
          label="备注"
          type="textarea"
          placeholder="选填"
          rows="2"
          autosize
        />
      </van-cell-group>

      <div class="summary">
        <div class="summary-row">
          <span>图书数量</span>
          <span>{{ totalQuantity }} 册</span>
        </div>
        <div class="summary-row">
          <span>预计金额</span>
          <span class="price">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <div style="margin: 16px;">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          :disabled="!canSubmit"
        >
          提交预留
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showMemberPicker" round position="bottom" :style="{ height: '70%' }">
      <div class="picker-header">
        <van-search
          v-model="memberSearch"
          placeholder="搜索会员姓名/手机号"
          shape="round"
          background="#fff"
        />
      </div>
      <div class="picker-list">
        <van-cell
          v-for="member in filteredMembers"
          :key="member.id"
          :title="member.name"
          :label="maskPhone(member.phone)"
          is-link
          @click="selectMember(member)"
        />
        <van-empty v-if="filteredMembers.length === 0" description="暂无会员" />
      </div>
    </van-popup>

    <van-popup v-model:show="showBookPicker" round position="bottom" :style="{ height: '70%' }">
      <div class="picker-header">
        <van-search
          v-model="bookSearch"
          placeholder="搜索图书名称/ISBN"
          shape="round"
          background="#fff"
        />
      </div>
      <div class="picker-list">
        <van-cell
          v-for="book in filteredBooks"
          :key="book.id"
          :title="book.title"
          :label="`可借: ${book.available_quantity} · ¥${book.price}`"
          is-link
          @click="confirmBook(book)"
        />
        <van-empty v-if="filteredBooks.length === 0" description="暂无图书" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { api } from '@/utils/request'
import { maskPhone } from '@/utils/device'
import { addToOfflineQueue } from '@/utils/offline'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const selectedMember = ref(null)
const items = ref([])
const editingIndex = ref(-1)
const showMemberPicker = ref(false)
const showBookPicker = ref(false)
const memberSearch = ref('')
const bookSearch = ref('')
const members = ref([])
const books = ref([])

const form = ref({
  contact_name: '',
  contact_phone: '',
  expire_hours: 48,
  remark: ''
})

const filteredMembers = computed(() => {
  if (!memberSearch.value) return members.value
  const keyword = memberSearch.value.toLowerCase()
  return members.value.filter(m => 
    m.name.toLowerCase().includes(keyword) || m.phone.includes(keyword)
  )
})

const filteredBooks = computed(() => {
  if (!bookSearch.value) return books.value
  const keyword = bookSearch.value.toLowerCase()
  return books.value.filter(b => 
    b.title.toLowerCase().includes(keyword) || b.isbn.includes(keyword)
  )
})

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (item.book?.price || 0) * (item.quantity || 0)
  }, 0)
})

const canSubmit = computed(() => {
  return selectedMember.value && 
         items.value.length > 0 && 
         items.value.every(item => item.book && item.quantity > 0) &&
         form.value.contact_name &&
         form.value.contact_phone
})

const loadMembers = async () => {
  try {
    const { data } = await api.get('/members/members/', { params: { page_size: 100 } })
    members.value = data.results
  } catch (e) {}
}

const loadBooks = async () => {
  try {
    const { data } = await api.get('/books/books/', { params: { page_size: 100, allow_reservation: true } })
    books.value = data.results
  } catch (e) {}
}

const selectMember = (member) => {
  selectedMember.value = member
  form.value.contact_name = member.name
  form.value.contact_phone = member.phone
  showMemberPicker.value = false
}

const selectBook = (index) => {
  editingIndex.value = index
  showBookPicker.value = true
}

const confirmBook = (book) => {
  if (!book.allow_reservation) {
    showToast('该图书不允许预留')
    return
  }
  if (book.available_quantity <= 0) {
    showToast('该图书库存不足')
    return
  }
  
  if (editingIndex.value >= items.value.length) {
    items.value.push({ book, quantity: 1 })
  } else if (editingIndex.value >= 0) {
    items.value[editingIndex.value] = { book, quantity: 1 }
  }
  
  showBookPicker.value = false
  calculateTotal()
}

const removeBook = (index) => {
  items.value.splice(index, 1)
  calculateTotal()
}

const calculateTotal = () => {
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    showToast('请完善预留信息')
    return
  }

  loading.value = true
  const submitData = {
    member_id: selectedMember.value.id,
    contact_name: form.value.contact_name,
    contact_phone: form.value.contact_phone,
    expire_hours: form.value.expire_hours,
    remark: form.value.remark,
    items: items.value.map(item => ({
      book_id: item.book.id,
      quantity: item.quantity
    }))
  }

  try {
    if (navigator.onLine) {
      await api.post('/reservations/reservations/', submitData)
      showSuccessToast('预留创建成功')
    } else {
      await addToOfflineQueue({
        method: 'POST',
        url: '/reservations/reservations/',
        data: submitData,
        type: 'reservation'
      })
      showSuccessToast('已保存到离线队列，联网后自动提交')
    }
    setTimeout(() => router.push('/m/reservations'), 1500)
  } catch (e) {
    const msg = e.response?.data?.error || '创建失败'
    showToast(msg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMembers()
  loadBooks()
  
  const bookId = route.query.book_id
  if (bookId) {
    const book = books.value.find(b => b.id == bookId)
    if (book) {
      items.value.push({ book, quantity: 1 })
    }
  }
})
</script>

<style lang="scss" scoped>
.create-reservation-page {
  padding-bottom: 20px;
  
  .book-item {
    .van-stepper {
      padding: 0 16px 12px;
    }
  }
  
  .summary {
    margin: 16px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
        font-size: 16px;
        font-weight: 600;
        
        .price {
          color: #ff4d4f;
        }
      }
    }
  }
  
  .picker-header {
    padding: 12px;
    border-bottom: 1px solid #ebedf0;
  }
  
  .picker-list {
    max-height: calc(70vh - 100px);
    overflow-y: auto;
  }
}
</style>
