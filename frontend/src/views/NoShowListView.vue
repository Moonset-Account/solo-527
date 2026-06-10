<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">爽约名单</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">重点关注高爽约风险客户</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <el-slider v-model="minRate" :min="0" :max="100" :step="5" show-stops style="width:200px" />
        <span style="color:#606266;font-size:13px">爽约率 ≥ {{ minRate }}%</span>
      </div>
    </div>

    <div class="grid-dashboard" style="grid-template-columns: repeat(4, 1fr)">
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="label">高风险客户</div>
        <div class="value">{{ highRiskCount }}</div>
        <div class="trend" style="color:#f56c6c">爽约率 ≥ 30%</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon"><el-icon><Warning /></el-icon></div>
        <div class="label">中风险客户</div>
        <div class="value">{{ midRiskCount }}</div>
        <div class="trend" style="color:#e6a23c">爽约率 15%~30%</div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="label">低风险客户</div>
        <div class="value">{{ lowRiskCount }}</div>
        <div class="trend" style="color:#67c23a">爽约率 < 15%</div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon"><el-icon><User /></el-icon></div>
        <div class="label">总客户数</div>
        <div class="value">{{ totalCount }}</div>
        <div class="trend">含历史预约记录</div>
      </div>
    </div>

    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-input v-model="keyword" placeholder="姓名/手机号" clearable style="width:220px" :prefix-icon="Search" @keyup.enter="fetchList" @clear="fetchList" />
          <el-button type="primary" @click="fetchList"><el-icon><Search /></el-icon> 查询</el-button>
        </div>

        <el-table :data="list" v-loading="loading" stripe size="default" style="width:100%">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column label="客户信息" width="200">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar :size="36" :style="avatarStyle(row.no_show_rate)">
                  {{ row.name?.[0] }}
                </el-avatar>
                <div>
                  <div style="font-weight:500">{{ row.name }}</div>
                  <div style="font-size:12px;color:#909399">{{ row.phone }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="性别" width="70">
            <template #default="{ row }">{{ row.gender || '-' }}</template>
          </el-table-column>
          <el-table-column label="年龄" width="70">
            <template #default="{ row }">{{ row.age || '-' }}</template>
          </el-table-column>
          <el-table-column label="爽约率" width="220">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-tag :type="tagType(row.no_show_rate)" effect="dark" size="small">
                  {{ (row.no_show_rate * 100).toFixed(1) }}%
                </el-tag>
                <el-progress
                  :percentage="Math.round(row.no_show_rate * 100)"
                  :color="barColor(row.no_show_rate)"
                  :stroke-width="10"
                  style="width:120px"
                  :show-text="false"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="爽约 / 总预约" width="140">
            <template #default="{ row }">
              <span style="color:#f56c6c;font-weight:600">{{ row.no_show_count }}</span>
              <span style="color:#909399;margin:0 4px">/</span>
              <span style="color:#606266">{{ row.total_bookings }}</span>
            </template>
          </el-table-column>
          <el-table-column label="最近就诊" width="170">
            <template #default="{ row }">
              <span v-if="row.last_visit">{{ formatTime(row.last_visit) }}</span>
              <span v-else style="color:#c0c4cc">从未到店</span>
            </template>
          </el-table-column>
          <el-table-column label="病史备注" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.medical_history" style="color:#e6a23c">{{ row.medical_history }}</span>
              <span v-else style="color:#c0c4cc">无</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewBookings(row)">历史预约</el-button>
              <el-button link type="warning" size="small" @click="quickBook(row)">快捷预约</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display:flex;justify-content:flex-end;margin-top:20px">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.perPage"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled, Warning, CircleCheckFilled, User, Search } from '@element-plus/icons-vue'
import { getNoShowList } from '@/api/booking'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const list = ref<any[]>([])
const keyword = ref('')
const minRate = ref(0)
const pagination = reactive({ page: 1, perPage: 20, total: 0 })

const allCustomers = ref<any[]>([])

const totalCount = computed(() => allCustomers.value.length)
const highRiskCount = computed(() => allCustomers.value.filter(c => c.no_show_rate >= 0.3).length)
const midRiskCount = computed(() => allCustomers.value.filter(c => c.no_show_rate >= 0.15 && c.no_show_rate < 0.3).length)
const lowRiskCount = computed(() => allCustomers.value.filter(c => c.no_show_rate < 0.15 && (c.no_show_count > 0 || c.total_bookings > 0)).length)

const tagType = (rate: number) => {
  if (rate >= 0.3) return 'danger'
  if (rate >= 0.15) return 'warning'
  return 'success'
}
const barColor = (rate: number) => {
  if (rate >= 0.3) return '#f56c6c'
  if (rate >= 0.15) return '#e6a23c'
  return '#67c23a'
}
const avatarStyle = (rate: number) => {
  if (rate >= 0.3) return { background: '#fef0f0', color: '#f56c6c' }
  if (rate >= 0.15) return { background: '#fdf6ec', color: '#e6a23c' }
  return { background: '#f0f9eb', color: '#67c23a' }
}

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getNoShowList({
      keyword: keyword.value || undefined,
      minRate: minRate.value / 100,
      page: pagination.page,
      perPage: pagination.perPage,
    })
    list.value = res.data.data
    pagination.total = res.data.meta.total
    if (pagination.page === 1) {
      allCustomers.value = res.data.data
    }
  } finally {
    loading.value = false
  }
}

const viewBookings = (row: any) => {
  router.push({ path: '/customers', query: { id: row.id } })
}

const quickBook = (row: any) => {
  sessionStorage.setItem('quick_book_customer', JSON.stringify({
    name: row.name, phone: row.phone, gender: row.gender, age: row.age, medicalHistory: row.medical_history
  }))
  router.push('/bookings/create')
}

watch(minRate, () => {
  pagination.page = 1
  fetchList()
})

onMounted(async () => {
  try {
    const allRes = await getNoShowList({ page: 1, perPage: 1000 })
    allCustomers.value = allRes.data.data || []
  } catch (_) {}
  await fetchList()
})
</script>
