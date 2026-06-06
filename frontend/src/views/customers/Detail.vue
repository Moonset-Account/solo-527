<template>
  <div class="customer-detail">
    <div class="page-header">
      <h2>客户详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" v-if="hasPermission('customer.edit')">
          编辑
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="customer">
      <el-col :span="16">
        <el-card class="mb-20">
          <template #header>
            <span>客户信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户编码">{{ customer.customer_code }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ customer.name }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ customer.contact_person || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ customer.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ customer.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ customer.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="是否VIP">
              <el-tag v-if="customer.is_vip" type="warning">VIP</el-tag>
              <span v-else>否</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="customer.is_active ? 'success' : 'info'">
                {{ customer.is_active ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="业务员">{{ customer.salesperson?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(customer.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ customer.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-20">
          <template #header>
            <span>近期订单</span>
          </template>
          <el-table :data="customer.orders || []" style="width: 100%">
            <el-table-column prop="order_no" label="订单编号" width="160" />
            <el-table-column prop="total_amount" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ row.total_amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="下单时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20">
          <template #header>
            <span>额度信息</span>
          </template>
          <div class="credit-info">
            <div class="credit-item">
              <span class="label">赊账额度:</span>
              <span class="value">¥{{ customer.credit_limit }}</span>
            </div>
            <div class="credit-item">
              <span class="label">当前欠款:</span>
              <span class="value text-danger">¥{{ customer.current_debt }}</span>
            </div>
            <el-divider />
            <div class="credit-item total">
              <span class="label">可用额度:</span>
              <span class="value" :class="availableCredit < 0 ? 'text-danger' : 'text-success'">
                ¥{{ availableCredit }}
              </span>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <span>客户价格表</span>
            <el-button
              type="primary"
              link
              size="small"
              v-if="hasPermission('customer.price_list')"
            >
              添加
            </el-button>
          </template>
          <el-table :data="customer.priceLists || []" style="width: 100%" size="small">
            <el-table-column prop="product_name" label="商品" min-width="120">
              <template #default="{ row }">
                {{ row.product?.name }}
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="80">
              <template #default="{ row }">
                ¥{{ row.price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="min_quantity" label="起订量" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const customer = ref(null)

const hasPermission = (p) => userStore.hasPermission(p)

const availableCredit = computed(() => {
  if (!customer.value) return 0
  return customer.value.credit_limit - customer.value.current_debt
})

onMounted(() => {
  fetchDetail()
})

async function fetchDetail() {
  try {
    const response = await request.get(`/customers/${route.params.id}`)
    customer.value = response.data
  } catch (e) {
    console.error(e)
  }
}

function goBack() {
  router.back()
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.customer-detail {
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
  .credit-info {
    .credit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      .label {
        color: #606266;
      }
      .value {
        font-weight: 500;
      }
      &.total {
        font-size: 16px;
      }
    }
  }
  .text-danger {
    color: #F56C6C;
  }
  .text-success {
    color: #67C23A;
  }
}
</style>
