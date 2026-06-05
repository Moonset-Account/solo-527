<template>
  <div class="admin-reservations">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预留单管理</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索单号/客户姓名/手机号"
              style="width: 250px; margin-right: 12px;"
              clearable
              @keyup.enter="loadReservations"
            >
              <template #append>
                <el-button icon="Search" @click="loadReservations" />
              </template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="状态" style="width: 140px; margin-right: 12px;" clearable @change="loadReservations">
              <el-option label="待确认" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已过期" value="expired" />
            </el-select>
            <el-button type="primary" icon="Plus" @click="openCreateDialog()">新建预留</el-button>
          </div>
        </div>
      </template>

      <el-table :data="reservations" v-loading="loading" stripe border>
        <el-table-column prop="reservation_no" label="预留单号" width="150" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">
            <div v-if="row.member">
              <div>{{ row.member.name }}</div>
              <div style="color: #999; font-size: 12px;">{{ row.member.phone_display || row.member.phone }}</div>
            </div>
            <div v-else>
              <div>{{ row.customer_name || '散客' }}</div>
              <div style="color: #999; font-size: 12px;">{{ row.customer_phone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="图书" min-width="200">
          <template #default="{ row }">
            <div v-for="(item, idx) in row.items" :key="idx" style="font-size: 13px;">
              {{ item.book.title }} x {{ item.quantity }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expire_at" label="过期时间" width="180">
          <template #default="{ row }">
            <span :style="{ color: isExpiringSoon(row) ? '#ff4d4f' : '' }">
              {{ row.expire_at }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="confirmReservation(row)">确认</el-button>
            <el-button v-if="['pending', 'confirmed'].includes(row.status)" type="warning" link size="small" @click="completeReservation(row)">完成取书</el-button>
            <el-button v-if="['pending', 'confirmed'].includes(row.status)" type="danger" link size="small" @click="cancelReservation(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReservations"
          @current-change="loadReservations"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="预留单详情" width="700px">
      <div v-if="currentReservation" class="reservation-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预留单号">{{ currentReservation.reservation_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentReservation.status)">
              {{ currentReservation.status_display }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户">
            <span v-if="currentReservation.member">
              {{ currentReservation.member.name }} (会员)
            </span>
            <span v-else>{{ currentReservation.customer_name || '散客' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentReservation.customer_phone || currentReservation.member?.phone_display || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentReservation.created_at }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">
            <span :style="{ color: isExpiringSoon(currentReservation) ? '#ff4d4f' : '' }">
              {{ currentReservation.expire_at }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentReservation.created_by?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ currentReservation.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">图书明细</h4>
        <el-table :data="currentReservation.items" stripe border size="small">
          <el-table-column prop="book.title" label="书名" />
          <el-table-column prop="book.isbn" label="ISBN" width="150" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">¥{{ row.book.price }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentReservation?.status === 'pending'" type="success" @click="confirmReservation(currentReservation)">确认预留</el-button>
        <el-button v-if="['pending', 'confirmed'].includes(currentReservation?.status)" type="warning" @click="completeReservation(currentReservation)">完成取书</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="新建预留单" width="800px">
      <el-form :model="createForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户类型">
              <el-radio-group v-model="createForm.customer_type">
                <el-radio label="member">会员</el-radio>
                <el-radio label="guest">散客</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="createForm.customer_type === 'member'">
            <el-form-item label="选择会员">
              <el-select
                v-model="createForm.member_id"
                filterable
                placeholder="搜索姓名/手机号"
                style="width: 100%;"
              >
                <el-option
                  v-for="m in memberOptions"
                  :key="m.id"
                  :label="`${m.name} - ${m.phone_display || m.phone}`"
                  :value="m.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="createForm.customer_type === 'guest'">
            <el-form-item label="客户姓名">
              <el-input v-model="createForm.customer_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="createForm.customer_type === 'guest'">
            <el-form-item label="联系电话">
              <el-input v-model="createForm.customer_phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="选择图书">
          <div style="margin-bottom: 10px;">
            <el-autocomplete
              v-model="searchBookKeyword"
              :fetch-suggestions="searchBooks"
              placeholder="搜索书名/ISBN添加图书"
              style="width: 300px;"
              @select="addBookItem"
            />
          </div>
          <el-table :data="createForm.items" size="small" border>
            <el-table-column prop="book.title" label="书名" />
            <el-table-column prop="book.isbn" label="ISBN" width="150" />
            <el-table-column label="可预留数量" width="120" align="center">
              <template #default="{ row }">
                {{ row.book.stock_quantity - row.book.reserved_quantity }}
              </template>
            </el-table-column>
            <el-table-column label="预留数量" width="160">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.book.stock_quantity - row.book.reserved_quantity"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeBookItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createReservation">创建预留</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const reservations = ref([])
const keyword = ref('')
const filterStatus = ref('')
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const currentReservation = ref(null)
const memberOptions = ref([])
const searchBookKeyword = ref('')

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const createForm = reactive({
  customer_type: 'member',
  member_id: null,
  customer_name: '',
  customer_phone: '',
  items: [],
  remark: ''
})

const statusTagType = (status) => {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success',
    cancelled: 'info',
    expired: 'danger'
  }
  return types[status] || 'info'
}

const isExpiringSoon = (row) => {
  if (!row.expire_at) return false
  const expire = new Date(row.expire_at)
  const now = new Date()
  return (expire - now) < 24 * 60 * 60 * 1000 && expire > now
}

const loadReservations = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/reservations/reservations/', {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        search: keyword.value,
        status: filterStatus.value
      }
    })
    reservations.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  const { data } = await api.get('/members/members/', { params: { page_size: 100 } })
  memberOptions.value = data.results
}

const viewDetail = async (row) => {
  try {
    const { data } = await api.get(`/reservations/reservations/${row.id}/`)
    currentReservation.value = data
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const confirmReservation = async (row) => {
  try {
    await api.post(`/reservations/reservations/${row.id}/confirm/`)
    ElMessage.success('确认成功')
    loadReservations()
    if (currentReservation?.id === row.id) viewDetail(row)
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const completeReservation = async (row) => {
  try {
    await api.post(`/reservations/reservations/${row.id}/complete/`)
    ElMessage.success('已完成取书')
    loadReservations()
    if (currentReservation?.id === row.id) viewDetail(row)
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const cancelReservation = async (row) => {
  await ElMessageBox.confirm('确定要取消这个预留单吗？', '提示', { type: 'warning' })
  try {
    await api.post(`/reservations/reservations/${row.id}/cancel/`)
    ElMessage.success('已取消')
    loadReservations()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const openCreateDialog = () => {
  createForm.customer_type = 'member'
  createForm.member_id = null
  createForm.customer_name = ''
  createForm.customer_phone = ''
  createForm.items = []
  createForm.remark = ''
  createDialogVisible.value = true
}

const searchBooks = async (queryString, cb) => {
  try {
    const { data } = await api.get('/books/books/', {
      params: { search: queryString, page_size: 20, allow_reservation: true }
    })
    cb(data.results.map(b => ({ ...b, value: b.title })))
  } catch (e) {
    cb([])
  }
}

const addBookItem = (book) => {
  const exists = createForm.items.find(item => item.book_id === book.id)
  if (exists) {
    ElMessage.warning('这本书已添加')
    return
  }
  const available = book.stock_quantity - book.reserved_quantity
  if (available <= 0) {
    ElMessage.error('该书无可用库存')
    return
  }
  createForm.items.push({
    book_id: book.id,
    book: book,
    quantity: 1
  })
  searchBookKeyword.value = ''
}

const removeBookItem = (index) => {
  createForm.items.splice(index, 1)
}

const createReservation = async () => {
  if (createForm.items.length === 0) {
    ElMessage.warning('请至少添加一本图书')
    return
  }
  const payload = {
    items: createForm.items.map(i => ({ book_id: i.book_id, quantity: i.quantity })),
    remark: createForm.remark
  }
  if (createForm.customer_type === 'member') {
    if (!createForm.member_id) {
      ElMessage.warning('请选择会员')
      return
    }
    payload.member_id = createForm.member_id
  } else {
    if (!createForm.customer_name || !createForm.customer_phone) {
      ElMessage.warning('请填写客户姓名和电话')
      return
    }
    payload.customer_name = createForm.customer_name
    payload.customer_phone = createForm.customer_phone
  }
  try {
    await api.post('/reservations/reservations/', payload)
    ElMessage.success('预留单创建成功')
    createDialogVisible.value = false
    loadReservations()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

onMounted(() => {
  loadReservations()
  loadMembers()
})
</script>

<style lang="scss" scoped>
.admin-reservations {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .pagination {
    margin-top: 20px;
    text-align: right;
  }
  
  .reservation-detail {
    h4 {
      margin: 20px 0 10px;
    }
  }
}
</style>
