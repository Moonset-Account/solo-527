<template>
  <div class="riders-page">
    <div class="page-header">
      <h2>骑手管理</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadRiders">
          🔄 刷新
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>搜索</label>
        <input v-model="searchForm.keyword" placeholder="骑手编号/姓名/手机号" />
      </div>
      <div class="form-item">
        <label>状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="ONLINE">在线</option>
          <option value="OFFLINE">离线</option>
          <option value="BUSY">忙碌</option>
          <option value="REST">休息</option>
        </select>
      </div>
      <div class="form-item">
        <label>车辆类型</label>
        <select v-model="searchForm.vehicleType">
          <option value="">全部</option>
          <option value="MOTORCYCLE">摩托车</option>
          <option value="ELECTRIC_BIKE">电动车</option>
          <option value="VAN">面包车</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>骑手编号</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>车辆类型</th>
            <th>车牌号</th>
            <th>状态</th>
            <th>当前区域</th>
            <th>完成订单</th>
            <th>评分</th>
            <th>入职时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rider in riderList" :key="rider.id">
            <td class="rider-no">{{ rider.riderNo }}</td>
            <td>
              <div class="rider-info-cell">
                <div class="avatar-sm">{{ rider.realName?.charAt(0) }}</div>
                <span>{{ rider.realName }}</span>
              </div>
            </td>
            <td>{{ rider.phone }}</td>
            <td>{{ getVehicleTypeLabel(rider.vehicleType) }}</td>
            <td>{{ rider.plateNo || '-' }}</td>
            <td>
              <StatusTag :type="getStatusTag(rider.status)">
                {{ getStatusLabel(rider.status) }}
              </StatusTag>
            </td>
            <td>{{ rider.currentDistrict || '-' }}</td>
            <td>{{ rider.totalOrders }}</td>
            <td>
              <span class="rating">
                ⭐ {{ rider.rating }}
              </span>
            </td>
            <td class="text-secondary text-sm">{{ formatDate(rider.joinedAt, 'YYYY-MM-DD') }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewRider(rider)">
                详情
              </button>
            </td>
          </tr>
          <tr v-if="riderList.length === 0">
            <td colspan="11">
              <div class="empty">暂无数据</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadRiders"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const riderList = ref<any[]>([])

const searchForm = reactive({
  keyword: '',
  status: '',
  vehicleType: '',
})

const loadRiders = async () => {
  try {
    const res: any = await $fetch('/api/riders', {
      query: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        ...searchForm,
      },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      riderList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载骑手失败', e)
  }
}

const handleSearch = () => {
  reset()
  loadRiders()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.vehicleType = ''
  reset()
  loadRiders()
}

const viewRider = (rider: any) => {
  // TODO: 骑手详情页
  alert(`骑手详情：${rider.realName}`)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ONLINE: '在线',
    OFFLINE: '离线',
    BUSY: '忙碌',
    REST: '休息',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    ONLINE: 'success',
    OFFLINE: 'default',
    BUSY: 'warning',
    REST: 'info',
  }
  return tags[status] || 'default'
}

const getVehicleTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MOTORCYCLE: '摩托车',
    ELECTRIC_BIKE: '电动车',
    VAN: '面包车',
  }
  return labels[type] || type
}

onMounted(() => {
  loadRiders()
})
</script>

<style lang="scss" scoped>
.riders-page {
  .rider-no {
    font-weight: 500;
    color: $primary;
  }

  .rider-info-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: $primary;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .rating {
    color: $warning;
    font-size: 13px;
  }
}
</style>
