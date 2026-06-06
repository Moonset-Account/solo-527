<template>
  <div class="order-create">
    <div class="page-header">
      <h2>新建订单</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交订单
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="mb-20">
          <template #header>
            <span>订单商品</span>
            <el-button type="primary" link size="small" @click="showProductDialog = true">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </template>

          <el-table :data="orderItems" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" min-width="200" />
            <el-table-column prop="sku" label="SKU" width="120" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  size="small"
                  @change="calculateTotal"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.price * row.quantity)?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="库存" width="100">
              <template #default="{ row }">
                <el-tag :type="row.available_stock < row.quantity ? 'danger' : 'success'" size="small">
                  {{ row.available_stock }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeItem($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="orderItems.length === 0" description="请添加商品" />
        </el-card>

        <el-card v-if="stockWarningItems.length > 0" class="mb-20">
          <template #header>
            <span class="text-warning">
              <el-icon><Warning /></el-icon>
              库存不足提示
            </span>
          </template>
          <el-alert
            v-for="item in stockWarningItems"
            :key="item.id"
            :title="`${item.product_name} 库存不足，当前可用 ${item.available_stock}，建议拆单处理`"
            type="warning"
            show-icon
            class="mb-10"
          />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20">
          <template #header>
            <span>客户信息</span>
          </template>
          <el-form label-width="80px">
            <el-form-item label="选择客户">
              <el-select
                v-model="form.customer_id"
                placeholder="搜索客户"
                filterable
                remote
                :remote-method="searchCustomers"
                :loading="customerLoading"
                @change="onCustomerChange"
              >
                <el-option
                  v-for="customer in customerOptions"
                  :key="customer.id"
                  :label="`${customer.customer_code} - ${customer.name}`"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="客户额度" v-if="selectedCustomer">
              <div>
                <p>赊账额度: ¥{{ selectedCustomer.credit_limit }}</p>
                <p>当前欠款: ¥{{ selectedCustomer.current_debt }}</p>
                <p :class="availableCredit < 0 ? 'text-danger' : 'text-success'">
                  可用额度: ¥{{ availableCredit }}
                </p>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="mb-20">
          <template #header>
            <span>订单信息</span>
          </template>
          <el-form label-width="80px">
            <el-form-item label="付款方式">
              <el-radio-group v-model="form.payment_method">
                <el-radio value="cash">现金</el-radio>
                <el-radio value="credit">赊账</el-radio>
                <el-radio value="transfer">转账</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="付款状态">
              <el-radio-group v-model="form.payment_status">
                <el-radio value="unpaid">未付款</el-radio>
                <el-radio value="paid">已付款</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="配送方式">
              <el-select v-model="form.delivery_method">
                <el-option label="自提" value="pickup" />
                <el-option label="配送" value="delivery" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="form.remarks"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <template #header>
            <span>订单金额</span>
          </template>
          <div class="amount-summary">
            <div class="amount-item">
              <span>商品金额:</span>
              <span>¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="amount-item">
              <span>运费:</span>
              <el-input-number v-model="form.shipping_fee" :min="0" size="small" />
            </div>
            <div class="amount-item">
              <span>优惠:</span>
              <el-input-number v-model="form.discount" :min="0" size="small" />
            </div>
            <el-divider />
            <div class="amount-item total">
              <span>订单总额:</span>
              <span class="text-primary">¥{{ finalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showProductDialog" title="选择商品" width="800px">
      <el-input
        v-model="productSearch"
        placeholder="搜索商品名称/SKU/条码"
        class="mb-20"
        clearable
        @input="searchProducts"
      />
      <el-table :data="productOptions" style="width: 100%" height="400px">
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="sku" label="SKU" width="120" />
        <el-table-column prop="specification" label="规格" width="100" />
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            ¥{{ getProductPrice(row)?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="100">
          <template #default="{ row }">
            <el-tag :type="row.total_available_stock > 0 ? 'success' : 'danger'" size="small">
              {{ row.total_available_stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="row.total_available_stock <= 0"
              @click="addProduct(row)"
            >
              添加
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const submitting = ref(false)
const showProductDialog = ref(false)
const customerLoading = ref(false)
const productSearch = ref('')

const form = reactive({
  customer_id: null,
  payment_method: 'credit',
  payment_status: 'unpaid',
  delivery_method: 'delivery',
  shipping_fee: 0,
  discount: 0,
  remarks: '',
})

const orderItems = ref([])
const customerOptions = ref([])
const productOptions = ref([])
const selectedCustomer = ref(null)

const totalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0)
})

const finalAmount = computed(() => {
  return totalAmount.value + form.shipping_fee - form.discount
})

const availableCredit = computed(() => {
  if (!selectedCustomer.value) return 0
  return selectedCustomer.value.credit_limit - selectedCustomer.value.current_debt - (form.payment_method === 'credit' ? finalAmount.value : 0)
})

const stockWarningItems = computed(() => {
  return orderItems.value.filter(item => item.available_stock < item.quantity)
})

onMounted(() => {
  searchProducts()
})

async function searchCustomers(keyword) {
  if (!keyword) return
  customerLoading.value = true
  try {
    const response = await request.get('/customers', { params: { keyword, per_page: 20 } })
    customerOptions.value = response.data.data
  } catch (e) {
    console.error(e)
  } finally {
    customerLoading.value = false
  }
}

async function onCustomerChange(customerId) {
  try {
    const response = await request.get(`/customers/${customerId}`)
    selectedCustomer.value = response.data
    orderItems.value.forEach(item => {
      item.price = selectedCustomer.value.getProductPrice
        ? selectedCustomer.value.getProductPrice(item.product_id, item.quantity)
        : item.price
    })
  } catch (e) {
    console.error(e)
  }
}

async function searchProducts() {
  try {
    const response = await request.get('/products', {
      params: { keyword: productSearch.value, is_active: true, per_page: 50 },
    })
    productOptions.value = response.data.data
  } catch (e) {
    console.error(e)
  }
}

function getProductPrice(product) {
  if (selectedCustomer.value?.is_vip) {
    return product.wholesale_price || product.standard_price
  }
  return product.standard_price
}

function addProduct(product) {
  const existing = orderItems.value.find(item => item.product_id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    orderItems.value.push({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      price: getProductPrice(product),
      quantity: 1,
      available_stock: product.total_available_stock || 0,
    })
  }
  showProductDialog.value = false
  calculateTotal()
}

function removeItem(index) {
  orderItems.value.splice(index, 1)
  calculateTotal()
}

function calculateTotal() {
}

function goBack() {
  router.back()
}

async function handleSubmit() {
  if (!form.customer_id) {
    ElMessage.warning('请选择客户')
    return
  }
  if (orderItems.value.length === 0) {
    ElMessage.warning('请添加商品')
    return
  }
  if (form.payment_method === 'credit' && availableCredit.value < 0) {
    ElMessage.error('客户可用额度不足')
    return
  }

  submitting.value = true
  try {
    const response = await request.post('/orders', {
      ...form,
      items: orderItems.value.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    })
    ElMessage.success('订单创建成功')
    router.push(`/orders/${response.data.id}`)
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.order-create {
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

  .amount-summary {
    .amount-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      &.total {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .text-danger {
    color: #F56C6C;
  }

  .text-success {
    color: #67C23A;
  }

  .text-primary {
    color: #409EFF;
  }

  .text-warning {
    color: #E6A23C;
  }
}
</style>
