<template>
  <div class="tracking-page">
    <div class="page-header">
      <h2>轨迹回放</h2>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>选择订单</label>
        <select v-model="selectedOrderId">
          <option value="">请选择订单</option>
          <option v-for="order in orderList" :key="order.id" :value="String(order.id)">
            {{ order.orderNo }}
          </option>
        </select>
      </div>
    </SearchBar>

    <div class="tracking-content">
      <div class="map-area">
        <div v-if="!selectedOrderId" class="empty-tip">
          请选择订单查看轨迹
        </div>
        <div v-else-if="locationList.length === 0" class="empty-tip">
          暂无轨迹数据
        </div>
        <div v-else class="trajectory-map">
          <div class="map-placeholder">
            <div class="map-info">
              <div class="info-item">
                <span class="label">轨迹点数</span>
                <span class="value">{{ locationList.length }}</span>
              </div>
              <div class="info-item">
                <span class="label">起始时间</span>
                <span class="value">{{ formatDate(startTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">结束时间</span>
                <span class="value">{{ formatDate(endTime) }}</span>
              </div>
            </div>
            <div class="path-preview">
              <div
                v-for="(point, index) in displayPoints"
                :key="index"
                :class="['path-point', { start: index === 0, end: index === displayPoints.length - 1 }]"
                :style="{ left: point.x + '%', top: point.y + '%' }"
                :title="`经度: ${point.lng}\n纬度: ${point.lat}\n时间: ${formatDate(point.collectedAt)}`"
              >
                <span v-if="index === 0" class="point-label">起</span>
                <span v-else-if="index === displayPoints.length - 1" class="point-label">终</span>
              </div>
              <svg class="path-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  :points="pathPoints"
                  fill="none"
                  stroke="#1890ff"
                  stroke-width="0.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="info-panel">
        <div class="panel-section">
          <h3>轨迹点列表</h3>
          <div class="location-list">
            <div
              v-for="(loc, index) in locationList"
              :key="loc.id || index"
              class="location-item"
            >
              <div class="loc-index">{{ index + 1 }}</div>
              <div class="loc-info">
                <div class="loc-coord">
                  经度: {{ loc.lng }}，纬度: {{ loc.lat }}
                </div>
                <div class="loc-detail">
                  <span v-if="loc.speed">速度: {{ loc.speed }}km/h</span>
                  <span v-if="loc.battery">电量: {{ loc.battery }}%</span>
                </div>
                <div class="loc-time">{{ formatDate(loc.collectedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const { formatDate } = useFormatter()

const selectedOrderId = ref('')
const orderList = ref<any[]>([])
const locationList = ref<any[]>([])

const searchForm = reactive({
  keyword: '',
  status: '',
})

const startTime = computed(() => {
  if (locationList.value.length === 0) return null
  return locationList.value[0].collectedAt
})

const endTime = computed(() => {
  if (locationList.value.length === 0) return null
  return locationList.value[locationList.value.length - 1].collectedAt
})

const displayPoints = computed(() => {
  if (locationList.value.length === 0) return []
  const lngs = locationList.value.map((p: any) => parseFloat(p.lng))
  const lats = locationList.value.map((p: any) => parseFloat(p.lat))
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const lngRange = maxLng - minLng || 0.001
  const latRange = maxLat - minLat || 0.001

  const step = Math.max(1, Math.ceil(locationList.value.length / 20))
  const sampled = locationList.value.filter((_: any, i: number) => i % step === 0)
  if (sampled[sampled.length - 1] !== locationList.value[locationList.value.length - 1]) {
    sampled.push(locationList.value[locationList.value.length - 1])
  }

  return sampled.map((p: any) => ({
    x: ((parseFloat(p.lng) - minLng) / lngRange) * 80 + 10,
    y: ((maxLat - parseFloat(p.lat)) / latRange) * 80 + 10,
    lng: p.lng,
    lat: p.lat,
    collectedAt: p.collectedAt,
  }))
})

const pathPoints = computed(() => {
  return displayPoints.value.map((p: any) => `${p.x},${p.y}`).join(' ')
})

const loadOrders = async () => {
  try {
    const res: any = await $fetch('/api/orders', {
      query: { pageSize: 50, status: 'IN_TRANSIT' },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      orderList.value = res.data.list
    }
  } catch (e) {
    console.error('加载订单失败', e)
  }
}

const loadLocations = async () => {
  if (!selectedOrderId.value) {
    locationList.value = []
    return
  }

  try {
    const res: any = await $fetch('/api/tracking/locations', {
      query: { orderId: selectedOrderId.value, pageSize: 200 },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      locationList.value = res.data.list
    }
  } catch (e) {
    console.error('加载轨迹失败', e)
  }
}

const handleSearch = () => {
  loadLocations()
}

const handleReset = () => {
  selectedOrderId.value = ''
  locationList.value = []
}

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.tracking-page {
  .tracking-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    min-height: 600px;
  }

  .map-area {
    background: #fff;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    min-height: 500px;
    position: relative;
    overflow: hidden;
  }

  .empty-tip {
    height: 100%;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-tertiary;
    font-size: 16px;
  }

  .map-placeholder {
    padding: 20px;
    height: 100%;
    min-height: 500px;

    .map-info {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 6px;

      .info-item {
        .label {
          font-size: 12px;
          color: $text-secondary;
          margin-right: 8px;
        }

        .value {
          font-size: 14px;
          color: $text-primary;
          font-weight: 500;
        }
      }
    }
  }

  .path-preview {
    position: relative;
    height: 400px;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border-radius: 8px;
    border: 1px solid $border-light;
  }

  .path-point {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $primary;
    transform: translate(-50%, -50%);
    z-index: 2;

    &.start {
      background: $success;
      width: 20px;
      height: 20px;

      .point-label {
        color: #fff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-weight: 600;
      }
    }

    &.end {
      background: $error;
      width: 20px;
      height: 20px;

      .point-label {
        color: #fff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-weight: 600;
      }
    }
  }

  .path-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .info-panel {
    background: #fff;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    display: flex;
    flex-direction: column;
    max-height: 600px;
    overflow: hidden;

    .panel-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;

      h3 {
        padding: 16px 20px;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 1px solid $border-light;
        margin: 0;
      }
    }
  }

  .location-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .location-item {
    display: flex;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 6px;
    background: #fafafa;

    &:hover {
      background: #f0f0f0;
    }

    .loc-index {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: $primary;
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .loc-info {
      flex: 1;
      min-width: 0;

      .loc-coord {
        font-size: 12px;
        color: $text-primary;
        margin-bottom: 4px;
      }

      .loc-detail {
        font-size: 11px;
        color: $text-secondary;
        display: flex;
        gap: 12px;
        margin-bottom: 4px;
      }

      .loc-time {
        font-size: 11px;
        color: $text-tertiary;
      }
    }
  }
}
</style>
