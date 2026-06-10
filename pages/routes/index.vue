<template>
  <div class="routes-page">
    <div class="page-header">
      <h2>路线规划</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreateModal">
          ➕ 调整路线
        </button>
        <button class="btn btn-default" @click="loadRoutes">
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

    <AppModal v-model:visible="createModalVisible" title="调整路线" width="700px">
      <div class="create-route-form">
        <div class="form-row">
          <div class="form-item full">
            <label>选择订单 <span class="required">*</span></label>
            <div class="order-select-wrapper">
              <select v-model="createForm.orderId" class="order-select">
                <option value="">请选择订单</option>
                <option v-for="order in selectableOrders" :key="order.id" :value="order.id">
                  {{ order.orderNo }} - {{ order.customer?.companyName || '未知客户' }}
                </option>
              </select>
              <button
                v-if="!loadingOrders"
                class="btn btn-text btn-sm refresh-orders-btn"
                @click="loadSelectableOrders"
              >
                刷新
              </button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h4>途经点明细</h4>
            <button class="btn btn-text btn-sm" @click="addWaypoint">
              ➕ 添加途经点
            </button>
          </div>
          <div class="waypoints-editor">
            <div
              v-for="(point, index) in createForm.waypoints"
              :key="index"
              class="waypoint-editor-item"
            >
              <div class="waypoint-index">{{ index + 1 }}</div>
              <div class="waypoint-fields">
                <div class="form-item">
                  <label>类型</label>
                  <select v-model="point.type">
                    <option value="waypoint">途经点</option>
                    <option value="pickup">取货点</option>
                    <option value="delivery">送货点</option>
                  </select>
                </div>
                <div class="form-item">
                  <label>地址</label>
                  <input v-model="point.address" placeholder="请输入地址" />
                </div>
                <div class="form-item">
                  <label>经度</label>
                  <input v-model.number="point.lng" type="number" step="0.000001" placeholder="经度" />
                </div>
                <div class="form-item">
                  <label>纬度</label>
                  <input v-model.number="point.lat" type="number" step="0.000001" placeholder="纬度" />
                </div>
              </div>
              <div class="waypoint-actions">
                <button
                  class="btn btn-text btn-sm"
                  @click="moveWaypointUp(index)"
                  :disabled="index === 0"
                >
                  ↑
                </button>
                <button
                  class="btn btn-text btn-sm"
                  @click="moveWaypointDown(index)"
                  :disabled="index === createForm.waypoints.length - 1"
                >
                  ↓
                </button>
                <button
                  class="btn btn-text btn-sm danger"
                  @click="removeWaypoint(index)"
                >
                  删除
                </button>
              </div>
            </div>
            <div v-if="createForm.waypoints.length === 0" class="empty-waypoints">
              暂无途经点，点击上方"添加途经点"按钮添加
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label>总距离（米）</label>
            <input
              v-model.number="createForm.totalDistanceMeters"
              type="number"
              placeholder="请输入总距离"
            />
          </div>
          <div class="form-item">
            <label>预计耗时（分钟）</label>
            <input
              v-model.number="createForm.totalMinutes"
              type="number"
              placeholder="请输入预计耗时"
            />
          </div>
        </div>

        <div class="form-item full">
          <label>备注说明</label>
          <textarea v-model="createForm.remark" placeholder="请输入调整原因或备注（可选）" rows="3"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="closeCreateModal">取消</button>
        <button class="btn btn-primary" @click="submitCreate" :disabled="submitting">
          {{ submitting ? '提交中...' : '确认提交' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const request = useRequest()

const { formatDate, formatDistance, formatDuration } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const routeList = ref<any[]>([])
const detailModalVisible = ref(false)
const currentRoute = ref<any>(null)
const createModalVisible = ref(false)
const submitting = ref(false)
const loadingOrders = ref(false)
const selectableOrders = ref<any[]>([])

const searchForm = reactive({
  keyword: '',
})

const createForm = reactive({
  orderId: '',
  totalDistanceMeters: 0,
  totalMinutes: 0,
  remark: '',
  waypoints: [] as any[],
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

    const res: any = await request('/routes', {
      query: params
    })
    if (res.code === 0) {
      routeList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载路线失败', e)
  }
}

const loadSelectableOrders = async () => {
  loadingOrders.value = true
  try {
    const res: any = await request('/orders', {
      query: { pageSize: 100, status: 'ACCEPTED,ASSIGNED,PICKED_UP,IN_TRANSIT,ARRIVED' }
    })
    if (res.code === 0) {
      selectableOrders.value = res.data.list
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loadingOrders.value = false
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

const openCreateModal = () => {
  createForm.orderId = ''
  createForm.totalDistanceMeters = 0
  createForm.totalMinutes = 0
  createForm.remark = ''
  createForm.waypoints = []
  createModalVisible.value = true
  if (selectableOrders.value.length === 0) {
    loadSelectableOrders()
  }
}

const closeCreateModal = () => {
  createModalVisible.value = false
}

const addWaypoint = () => {
  createForm.waypoints.push({
    type: 'waypoint',
    address: '',
    lng: 0,
    lat: 0,
  })
}

const removeWaypoint = (index: number) => {
  createForm.waypoints.splice(index, 1)
}

const moveWaypointUp = (index: number) => {
  if (index === 0) return
  const temp = createForm.waypoints[index]
  createForm.waypoints[index] = createForm.waypoints[index - 1]
  createForm.waypoints[index - 1] = temp
}

const moveWaypointDown = (index: number) => {
  if (index === createForm.waypoints.length - 1) return
  const temp = createForm.waypoints[index]
  createForm.waypoints[index] = createForm.waypoints[index + 1]
  createForm.waypoints[index + 1] = temp
}

const submitCreate = async () => {
  if (!createForm.orderId) {
    alert('请选择订单')
    return
  }
  if (createForm.waypoints.length === 0) {
    alert('请至少添加一个途经点')
    return
  }
  if (!createForm.totalDistanceMeters) {
    alert('请输入总距离')
    return
  }
  if (!createForm.totalMinutes) {
    alert('请输入预计耗时')
    return
  }

  submitting.value = true
  try {
    const res: any = await request('/routes/create', {
      method: 'POST',
      body: {
        orderId: createForm.orderId,
        waypointsJson: createForm.waypoints,
        totalDistanceMeters: createForm.totalDistanceMeters,
        totalMinutes: createForm.totalMinutes,
        remark: createForm.remark,
      },
    })
    if (res.code === 0) {
      alert('路线调整成功')
      closeCreateModal()
      loadRoutes()
    } else {
      alert(res.message || '创建失败')
    }
  } catch (e: any) {
    console.error('创建路线失败', e)
    alert(e?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
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

.create-route-form {
  .required {
    color: $error;
  }

  .order-select-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;

    .order-select {
      flex: 1;
    }

    .refresh-orders-btn {
      flex-shrink: 0;
    }
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .form-item {
      flex: 1;
      margin-bottom: 0;

      &.full {
        flex: none;
        width: 100%;
      }
    }
  }

  .form-section {
    margin-bottom: 16px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: $text-primary;
        margin: 0;
      }
    }
  }

  .waypoints-editor {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;
    background: #fafafa;
    border-radius: 6px;

    .waypoint-editor-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px;
      margin-bottom: 8px;
      background: #fff;
      border: 1px solid $border-light;
      border-radius: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      .waypoint-index {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: $primary;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 6px;
      }

      .waypoint-fields {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        .form-item {
          margin-bottom: 0;

          label {
            font-size: 12px;
          }
        }
      }

      .waypoint-actions {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex-shrink: 0;

        .btn {
          padding: 4px 8px;
          font-size: 12px;

          &.danger {
            color: $error;
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }
      }
    }

    .empty-waypoints {
      padding: 40px;
      text-align: center;
      color: $text-tertiary;
      font-size: 13px;
    }
  }
}
</style>
