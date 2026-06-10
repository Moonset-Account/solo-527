<template>
  <div class="routes-page">
    <div class="page-header">
      <h2>路线规划</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadRoutes">
          🔄 刷新
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>订单号</label>
        <input v-model="searchForm.keyword" placeholder="请输入订单号" />
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>版本</th>
            <th>优化方式</th>
            <th>总距离</th>
            <th>预计耗时</th>
            <th>创建人</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="route in routeList" :key="route.id">
            <td class="order-no">{{ route.order?.orderNo || '-' }}</td>
            <td>
              <StatusTag type="primary">V{{ route.version }}</StatusTag>
            </td>
            <td>{{ getOptimizedByLabel(route.optimizedBy) }}</td>
            <td>{{ formatDistance(route.totalDistanceMeters) }}</td>
            <td>{{ formatDuration(route.totalMinutes) }}</td>
            <td>{{ route.creator?.realName || '-' }}</td>
            <td>
              <StatusTag :type="route.isActive ? 'success' : 'default'">
                {{ route.isActive ? '启用' : '已停用' }}
              </StatusTag>
            </td>
            <td class="text-secondary text-sm">{{ formatDate(route.createdAt) }}</td>
            <td class="remark-cell">{{ route.remark || '-' }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewRoute(route)">
                查看
              </button>
            </td>
          </tr>
          <tr v-if="routeList.length === 0">
            <td colspan="10">
              <div class="empty">暂无数据</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadRoutes"
      />
    </div>

    <AppModal v-model:visible="detailModalVisible" title="路线详情" width="700px">
      <div v-if="currentRoute" class="route-detail">
        <div class="route-info">
          <div class="info-row">
            <span class="label">订单号：</span>
            <span class="value">{{ currentRoute.order?.orderNo || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">版本：</span>
            <span class="value">V{{ currentRoute.version }}</span>
          </div>
          <div class="info-row">
            <span class="label">总距离：</span>
            <span class="value">{{ formatDistance(currentRoute.totalDistanceMeters) }}</span>
          </div>
          <div class="info-row">
            <span class="label">预计耗时：</span>
            <span class="value">{{ formatDuration(currentRoute.totalMinutes) }}</span>
          </div>
          <div class="info-row">
            <span class="label">优化方式：</span>
            <span class="value">{{ getOptimizedByLabel(currentRoute.optimizedBy) }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建人：</span>
            <span class="value">{{ currentRoute.creator?.realName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(currentRoute.createdAt) }}</span>
          </div>
        </div>

        <div class="waypoints-section">
          <h4>途经点</h4>
          <div class="waypoints-list">
            <div
              v-for="(point, index) in waypoints"
              :key="index"
              class="waypoint-item"
            >
              <div :class="['waypoint-icon', point.type]">
                {{ point.type === 'pickup' ? '取' : point.type === 'delivery' ? '送' : index + 1 }}
              </div>
              <div class="waypoint-info">
                <div class="waypoint-type">
                  {{ point.type === 'pickup' ? '取货点' : point.type === 'delivery' ? '送货点' : `途经点 ${index + 1}` }}
                </div>
                <div class="waypoint-address">{{ point.address || `(${point.lng}, ${point.lat})` }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentRoute.remark" class="remark-section">
          <h4>备注</h4>
          <p>{{ currentRoute.remark }}</p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const { formatDate, formatDistance, formatDuration } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const routeList = ref<any[]>([])
const detailModalVisible = ref(false)
const currentRoute = ref<any>(null)

const searchForm = reactive({
  keyword: '',
})

const waypoints = computed(() => {
  if (!currentRoute.value?.waypointsJson) return []
  return Array.isArray(currentRoute.value.waypointsJson)
    ? currentRoute.value.waypointsJson
    : []
})

const loadRoutes = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
    }
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }

    const res: any = await $fetch('/api/routes', {
      query: params,
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      routeList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载路线失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadRoutes()
}

const handleReset = () => {
  searchForm.keyword = ''
  reset()
  loadRoutes()
}

const viewRoute = (route: any) => {
  currentRoute.value = route
  detailModalVisible.value = true
}

const getOptimizedByLabel = (type: string) => {
  const labels: Record<string, string> = {
    MANUAL: '手动规划',
    SYSTEM_ALGORITHM: '系统算法',
  }
  return labels[type] || type
}

onMounted(() => {
  loadRoutes()
})
</script>

<style lang="scss" scoped>
.routes-page {
  .order-no {
    font-weight: 500;
    color: $primary;
  }

  .remark-cell {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $text-secondary;
  }
}

.route-detail {
  .route-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;

    .info-row {
      display: flex;
      font-size: 14px;

      .label {
        color: $text-secondary;
        width: 80px;
        flex-shrink: 0;
      }

      .value {
        color: $text-primary;
        font-weight: 500;
      }
    }
  }

  .waypoints-section,
  .remark-section {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
    }
  }

  .waypoints-list {
    position: relative;
    padding-left: 24px;

    .waypoint-item {
      position: relative;
      padding: 12px 0;
      border-bottom: 1px solid $border-light;

      &:last-child {
        border-bottom: none;
      }

      .waypoint-icon {
        position: absolute;
        left: -24px;
        top: 12px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: $primary;
        color: #fff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;

        &.pickup {
          background: $info;
        }

        &.delivery {
          background: $success;
        }
      }

      .waypoint-type {
        font-size: 13px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 4px;
      }

      .waypoint-address {
        font-size: 13px;
        color: $text-secondary;
      }
    }
  }

  .remark-section p {
    font-size: 14px;
    color: $text-primary;
    line-height: 1.6;
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
  }
}
</style>
