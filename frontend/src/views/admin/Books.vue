<template>
  <div class="admin-books">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图书管理</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索书名/ISBN/作者"
              style="width: 250px; margin-right: 12px;"
              clearable
              @keyup.enter="loadBooks"
            >
              <template #append>
                <el-button icon="Search" @click="loadBooks" />
              </template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="状态" style="width: 120px; margin-right: 12px;" clearable @change="loadBooks">
              <el-option label="有库存" value="in_stock" />
              <el-option label="库存不足" value="low_stock" />
              <el-option label="缺货" value="out_of_stock" />
            </el-select>
            <el-button type="primary" icon="Plus" @click="openDialog()">新增图书</el-button>
          </div>
        </div>
      </template>

      <el-table :data="books" v-loading="loading" stripe border>
        <el-table-column prop="isbn" label="ISBN" width="150" />
        <el-table-column prop="title" label="书名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="publisher" label="出版社" width="150" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            {{ row.category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="定价" width="100" align="right">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="库存" width="180" align="center">
          <template #default="{ row }">
            <span :class="`stock-${row.status}`">
              {{ row.stock_quantity - row.reserved_quantity }} / {{ row.stock_quantity }}
            </span>
            <el-tag size="small" :type="statusTagType(row.status)" style="margin-left: 8px;">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="100" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="openStockDialog(row)">调整库存</el-button>
            <el-button type="danger" link size="small" @click="deleteBook(row)">删除</el-button>
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
          @size-change="loadBooks"
          @current-change="loadBooks"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑图书' : '新增图书'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ISBN" prop="isbn">
              <el-input v-model="form.isbn" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="书名" prop="title">
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出版社" prop="publisher">
              <el-input v-model="form.publisher" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.category_id" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-select v-model="form.supplier_id" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="sup in suppliers"
                  :key="sup.id"
                  :label="sup.name"
                  :value="sup.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="定价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存数量" prop="stock_quantity">
              <el-input-number v-model="form.stock_quantity" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="低库存阈值">
              <el-input-number v-model="form.low_stock_threshold" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="书架位置">
              <el-input v-model="form.location" placeholder="如：A-01-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="允许预留">
              <el-switch v-model="form.allow_reservation" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容简介">
              <el-input v-model="form.summary" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBook">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockDialogVisible" title="调整库存" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前库存">
          <span style="font-size: 18px; font-weight: bold;">{{ currentBook?.stock_quantity }}</span>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="stockForm.type">
            <el-radio label="add">增加</el-radio>
            <el-radio label="subtract">减少</el-radio>
            <el-radio label="set">设置为</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="stockForm.quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="adjustStock">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const books = ref([])
const categories = ref([])
const suppliers = ref([])
const keyword = ref('')
const filterStatus = ref('')
const dialogVisible = ref(false)
const stockDialogVisible = ref(false)
const currentBook = ref(null)
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const form = reactive({
  id: null,
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  category_id: null,
  supplier_id: null,
  price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  location: '',
  allow_reservation: true,
  summary: ''
})

const stockForm = reactive({
  type: 'add',
  quantity: 0,
  remark: ''
})

const rules = {
  isbn: [{ required: true, message: '请输入ISBN', trigger: 'blur' }],
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  price: [{ required: true, message: '请输入定价', trigger: 'blur' }],
  stock_quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
}

const statusTagType = (status) => {
  const types = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' }
  return types[status] || 'info'
}

const loadBooks = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/books/books/', {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        search: keyword.value,
        status: filterStatus.value
      }
    })
    books.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  const { data } = await api.get('/books/categories/')
  categories.value = data.results
}

const loadSuppliers = async () => {
  const { data } = await api.get('/books/suppliers/', { params: { page_size: 100 } })
  suppliers.value = data.results
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
      publisher: row.publisher,
      category_id: row.category?.id || null,
      supplier_id: row.supplier?.id || null,
      price: row.price,
      stock_quantity: row.stock_quantity,
      low_stock_threshold: row.low_stock_threshold,
      location: row.location || '',
      allow_reservation: row.allow_reservation,
      summary: row.summary || ''
    })
  } else {
    Object.assign(form, {
      id: null, isbn: '', title: '', author: '', publisher: '',
      category_id: null, supplier_id: null, price: 0, stock_quantity: 0,
      low_stock_threshold: 5, location: '', allow_reservation: true, summary: ''
    })
  }
  dialogVisible.value = true
}

const saveBook = async () => {
  await formRef.value.validate()
  try {
    if (form.id) {
      await api.put(`/books/books/${form.id}/`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/books/books/', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadBooks()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteBook = async (row) => {
  await ElMessageBox.confirm('确定要删除这本图书吗？', '提示', { type: 'warning' })
  try {
    await api.delete(`/books/books/${row.id}/`)
    ElMessage.success('删除成功')
    loadBooks()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const openStockDialog = (row) => {
  currentBook.value = row
  stockForm.type = 'add'
  stockForm.quantity = 0
  stockForm.remark = ''
  stockDialogVisible.value = true
}

const adjustStock = async () => {
  try {
    await api.post(`/books/books/${currentBook.value.id}/adjust_stock/`, stockForm)
    ElMessage.success('库存调整成功')
    stockDialogVisible.value = false
    loadBooks()
  } catch (e) {
    ElMessage.error('调整失败')
  }
}

onMounted(() => {
  loadBooks()
  loadCategories()
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.admin-books {
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
  
  .stock-in_stock { color: #52c41a; font-weight: 500; }
  .stock-low_stock { color: #faad14; font-weight: 500; }
  .stock-out_of_stock { color: #ff4d4f; font-weight: 500; }
}
</style>
