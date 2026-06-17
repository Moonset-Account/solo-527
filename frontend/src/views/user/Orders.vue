<template>
  <div class="orders-page">
    <PageHeader title="我的订单" show-demo />

    <el-card class="orders-card">
      <div class="filter-bar">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="" />
          <el-tab-pane label="待确认" name="pending" />
          <el-tab-pane label="进行中" name="in_progress" />
          <el-tab-pane label="已完成" name="completed" />
          <el-tab-pane label="已取消" name="cancelled" />
        </el-tabs>
      </div>

      <div v-loading="loading" class="orders-list">
        <template v-if="orders.length > 0">
          <div
            v-for="order in orders"
            :key="order.id"
            class="order-item"
            @click="goToDetail(order.id)"
          >
            <div class="order-header">
              <div class="order-no">订单号：{{ order.orderNo }}</div>
              <OrderStatusBadge :status="order.status" />
            </div>
            <div class="order-body">
              <div class="order-images">
                <img v-if="order.faultImages && order.faultImages.length > 0" :src="order.faultImages[0]" alt="故障图片" />
                <div v-else class="no-image">
                  <el-icon :size="32" color="#c0c4cc"><Picture /></el-icon>
                </div>
              </div>
              <div class="order-info">
                <h3 class="order-title">{{ order.deviceType }} · {{ order.deviceBrand }}</h3>
                <p class="order-desc">{{ order.faultDescription }}</p>
                <div class="order-meta">
                  <span class="meta-item">
                    <el-icon><Location /></el-icon>
                    {{ order.address }}
                  </span>
                </div>
                <div class="order-meta">
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    预约：{{ formatDateTime(order.appointmentTime) }}
                  </span>
                  <span v-if="order.price" class="price">¥{{ order.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <EmptyState v-else type="order" description="暂无订单">
          <template #action>
            <el-button type="primary" @click="goCreateOrder">立即下单</el-button>
          </template>
        </EmptyState>
      </div>

      <Pagination
        v-if="total > 0"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, Location, Clock } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import Pagination from '@/components/Pagination.vue'
import { getOrderList } from '@/api/order'
import type { Order } from '@/api/order'
import { formatDateTime } from '@/utils/date'
import { useAppStore } from '@/stores/app'
import { DEVICE_TYPES } from '@/utils/constants'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const orders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const activeTab = ref('')

const deviceTypeMap = computed(() => {
  const map: Record<string, string> = {}
  DEVICE_TYPES.forEach(item => {
    map[item.value] = item.label
  })
  return map
})

function handleTabChange() {
  page.value = 1
  fetchOrders()
}

function handlePageChange() {
  fetchOrders()
}

async function fetchOrders() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      orders.value = generateDemoOrders()
      total.value = 25
      loading.value = false
    }, 500)
    return
  }

  try {
    const res = await getOrderList({
      page: page.value,
      pageSize: pageSize.value,
      status: activeTab.value as any
    })
    orders.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

function generateDemoOrders(): Order[] {
  const statuses = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']
  const demoOrders: Order[] = []
  
  for (let i = 0; i < 10; i++) {
    const status = statuses[i % statuses.length]
    const deviceType = DEVICE_TYPES[i % DEVICE_TYPES.length]
    demoOrders.push({
      id: i + 1,
      orderNo: `20240115${String(i + 1).padStart(4, '0')}`,
      deviceType: deviceType.label,
      deviceBrand: ['美的', '格力', '海尔', '小米'][i % 4],
      faultDescription: '设备无法正常工作，需要上门检测维修。故障现象包括：启动困难、运行时有异常噪音、制冷/制热效果不佳等问题。',
      faultImages: [
        `https://images.unsplash.com/photo-${1581091226825 + i * 1000}?w=200&h=200&fit=crop`
      ],
      contactName: '张先生',
      contactPhone: '138****8000',
      address: '朝阳区XX小区' + (i + 1) + '号楼3单元501',
      appointmentTime: `2024-01-${15 + i} 10:00:00`,
      status: status as any,
      statusText: '',
      price: status === 'completed' ? 150 + i * 20 : undefined,
      createdAt: `2024-01-${10 + i} 09:00:00`,
      updatedAt: `2024-01-${10 + i} 09:00:00`
    })
  }
  
  return demoOrders
}

function goToDetail(id: number) {
  router.push(`/order/${id}`)
}

function goCreateOrder() {
  router.push('/order/create')
}

onMounted(() => {
  fetchOrders()
})
</script>

<style lang="scss" scoped>
.orders-page {
  .orders-card {
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .filter-bar {
    padding: 0 20px;
    border-bottom: 1px solid #ebeef5;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
  }

  .orders-list {
    padding: 20px;
    min-height: 300px;
  }

  .order-item {
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      border-color: #dcdfe6;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #ebeef5;

    .order-no {
      font-size: 13px;
      color: #909399;
    }
  }

  .order-body {
    display: flex;
    gap: 16px;

    .order-images {
      width: 100px;
      height: 100px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f5f7fa;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .order-info {
      flex: 1;
      min-width: 0;

      .order-title {
        font-size: 16px;
        color: #303133;
        margin: 0 0 8px 0;
      }

      .order-desc {
        color: #606266;
        font-size: 14px;
        margin: 0 0 10px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .order-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #909399;

          .el-icon {
            font-size: 14px;
          }
        }

        .price {
          color: #f56c6c;
          font-weight: 600;
          font-size: 16px;
        }
      }
    }
  }
}
</style>
