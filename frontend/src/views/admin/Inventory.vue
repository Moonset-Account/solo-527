<template>
  <div class="admin-inventory">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存管理</span>
          <div class="header-actions">
            <el-tabs v-model="activeTab" @tab-change="loadData">
              <el-tab-pane label="库存日志" name="logs" />
              <el-tab-pane label="入库单" name="stockin" />
              <el-tab-pane label="出库单" name="stockout" />
              <el-tab-pane label="低库存预警" name="low" />
            </el-tabs>
          </div>
        </div>
      </template>

      <div v-if="activeTab === 'logs'">
        <div style="margin-bottom: 16px;">
          <el-button type="primary" icon="Plus" @click="openStockInDialog">新增入库</el-button>
          <el-button type="warning" icon="Minus" @click="openStockOutDialog">新增出库</el-button>
        </div>
        <el-table :data="stockLogs" v-loading="loading" stripe border>
          <el-table-column prop="created_at" label="时间" width="180" />
          <el-table-column label="图书" min-width="200">
            <template #default="{ row }">
              <div>{{ row.book.title }}</div>
              <div style="color: #999; font-size: 12px;">{{ row.book.isbn }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="change_type_display" label="类型" width="100" align="center" />
          <el-table-column label="变动数量" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.quantity_change >= 0 ? '#52c41a' : '#ff4d4f' }">
                {{ row.quantity_change >= 0 ? '+' : '' }}{{ row.quantity_change }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="变动后库存" width="120" align="right">{{ row.balance_after }}</el-table-column>
          <el-table-column prop="operator.username" label="操作人" width="100" />
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        </el-table>
      </div>

      <div v-if="activeTab === 'low'">
        <el-table :data="lowStockBooks" v-loading="loading" stripe border>
          <el-table-column prop="isbn" label="ISBN" width="150" />
          <el-table-column prop="title" label="书名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="author" label="作者" width="120" />
          <el-table-column label="库存" width="150" align="center">
            <template #default="{ row }">
              <span style="color: #ff4d4f; font-weight: bold;">
                {{ row.stock_quantity - row.reserved_quantity }}
              </span>
              <span style="color: #999;"> / {{ row.stock_quantity }}</span>
              <el-tag type="danger" size="small" style="margin-left: 8px;">低库存</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="low_stock_threshold" label="阈值" width="80" align="center" />
          <el-table-column label="供应商" width="150">
            <template #default="{ row }">{{ row.supplier?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openStockInDialog(row)">补货</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination" v-if="activeTab === 'logs'">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="stockInDialogVisible" title="新增入库" width="500px">
      <el-form :model="stockInForm" label-width="100px">
        <el-form-item label="图书">
          <el-select
            v-model="stockInForm.book_id"
            filterable
            placeholder="搜索选择图书"
            style="width: 100%;"
          >
            <el-option
              v-for="b in bookOptions"
              :key="b.id"
              :label="`${b.title} (${b.isbn})`"
              :value="b.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入库数量">
          <el-input-number v-model="stockInForm.quantity" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="stockInForm.supplier_id" placeholder="选择供应商" style="width: 100%;">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockInForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockInDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockIn">确认入库</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockOutDialogVisible" title="新增出库" width="500px">
      <el-form :model="stockOutForm" label-width="100px">
        <el-form-item label="图书">
          <el-select
            v-model="stockOutForm.book_id"
            filterable
            placeholder="搜索选择图书"
            style="width: 100%;"
          >
            <el-option
              v-for="b in bookOptions"
              :key="b.id"
              :label="`${b.title} (${b.isbn}) 库存:${b.stock_quantity - b.reserved_quantity}`"
              :value="b.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出库数量">
          <el-input-number v-model="stockOutForm.quantity" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="出库原因">
          <el-select v-model="stockOutForm.reason" style="width: 100%;">
            <el-option label="销售" value="sale" />
            <el-option label="破损" value="damaged" />
            <el-option label="丢失" value="lost" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockOutForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockOutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockOut">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/request'

const activeTab = ref('logs')
const loading = ref(false)
const stockLogs = ref([])
const lowStockBooks = ref([])
const bookOptions = ref([])
const supplierOptions = ref([])
const stockInDialogVisible = ref(false)
const stockOutDialogVisible = ref(false)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const stockInForm = reactive({
  book_id: null, quantity: 1, supplier_id: null, remark: ''
})

const stockOutForm = reactive({
  book_id: null, quantity: 1, reason: 'sale', remark: ''
})

const loadData = () => {
  if (activeTab.value === 'logs') loadStockLogs()
  else if (activeTab.value === 'low') loadLowStock()
}

const loadStockLogs = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/inventory/stock_logs/', {
      params: { page: pagination.page, page_size: pagination.page_size }
    })
    stockLogs.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadLowStock = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/books/books/low_stock/')
    lowStockBooks.value = data.results || data
  } finally {
    loading.value = false
  }
}

const loadBooks = async () => {
  const { data } = await api.get('/books/books/', { params: { page_size: 200 } })
  bookOptions.value = data.results
}

const loadSuppliers = async () => {
  const { data } = await api.get('/books/suppliers/', { params: { page_size: 100 } })
  supplierOptions.value = data.results
}

const openStockInDialog = (book = null) => {
  stockInForm.book_id = book?.id || null
  stockInForm.quantity = 1
  stockInForm.supplier_id = book?.supplier?.id || null
  stockInForm.remark = ''
  stockInDialogVisible.value = true
}

const openStockOutDialog = () => {
  stockOutForm.book_id = null
  stockOutForm.quantity = 1
  stockOutForm.reason = 'sale'
  stockOutForm.remark = ''
  stockOutDialogVisible.value = true
}

const submitStockIn = async () => {
  if (!stockInForm.book_id || !stockInForm.quantity) {
    ElMessage.warning('请选择图书并填写数量')
    return
  }
  try {
    await api.post('/inventory/stock_in/', stockInForm)
    ElMessage.success('入库成功')
    stockInDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('入库失败')
  }
}

const submitStockOut = async () => {
  if (!stockOutForm.book_id || !stockOutForm.quantity) {
    ElMessage.warning('请选择图书并填写数量')
    return
  }
  try {
    await api.post('/inventory/stock_out/', stockOutForm)
    ElMessage.success('出库成功')
    stockOutDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('出库失败')
  }
}

onMounted(() => {
  loadData()
  loadBooks()
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.admin-inventory {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .header-actions {
      flex: 1;
      margin-left: 20px;
    }
  }
  
  .pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
