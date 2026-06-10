<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">预约管理</h2>
      <div style="display:flex;gap:10px">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-button type="primary" @click="$router.push('/bookings/create')">
          <el-icon><Plus /></el-icon> 新建预约
        </el-button>
      </div>
    </div>

    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-input v-model="searchForm.keyword" placeholder="客户姓名/手机号/预约号" clearable style="width:240px" :prefix-icon="Search" @clear="fetchList" @keyup.enter="fetchList" />
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width:140px" @change="fetchList">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已到店" value="arrived" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-select v-model="searchForm.staffId" placeholder="全部医生/技师" clearable style="width:160px" @change="fetchList">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="String(s.id)" />
          </el-select>
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:260px"
            @change="fetchList"
          />
          <el-button type="primary" @click="fetchList"><el-icon><Search /></el-icon> 查询</el-button>
        </div>

        <el-table :data="list" v-loading="loading" stripe size="default" style="width:100%">
          <el-table-column prop="booking_no" label="预约编号" width="200">
            <template #default="{ row }">
              <span style="font-family:monospace;color:#606266">{{ row.booking_no }}</span>
            </template>
          </el-table-column>
          <el-table-column label="客户信息" width="180">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar :size="32" style="background:#e6f7f3;color:#2ab99f">{{ row.customer?.name?.[0] }}</el-avatar>
                <div>
                  <div style="font-weight:500">{{ row.customer?.name }}</div>
                  <div style="font-size:12px;color:#909399">{{ row.customer?.phone }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="服务 & 人员" min-width="180">
            <template #default="{ row }">
              <div style="font-size:13px">{{ row.service?.name }}</div>
              <div style="font-size:12px;color:#909399;margin-top:2px">{{ row.staff?.name }} · {{ row.service?.duration_minutes }}分钟 · ¥{{ row.amount }}</div>
            </template>
          </el-table-column>
          <el-table-column label="预约日期" width="120">
            <template #default="{ row }">
              <div style="font-size:13px">{{ row.booking_date }}</div>
              <div style="font-size:12px;color:#909399">{{ row.start_time }}-{{ row.end_time }}</div>
            </template>
          </el-table-column>
          <el-table-column label="爽约率" width="150">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:6px">
                <span :class="[
                  'rate-tag',
                  (row.customer?.no_show_rate || 0) >= 0.3 ? 'high' :
                  (row.customer?.no_show_rate || 0) >= 0.15 ? 'medium' : 'low'
                ]">
                  {{ ((row.customer?.no_show_rate || 0) * 100).toFixed(1) }}%
                </span>
                <span style="font-size:12px;color:#909399">
                  ({{ row.customer?.no_show_count || 0 }}次/{{ row.customer?.total_bookings || 0 }}次)
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span :class="['status-tag', 'status-' + row.status]">{{ statusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="支付" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.payment_status === 'paid'" type="success" size="small">已支付</el-tag>
              <el-tag v-else-if="row.payment_status === 'failed'" type="danger" size="small">支付失败</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">未支付</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近变更" width="150">
            <template #default="{ row }">
              <div v-if="row.last_changed_at" style="font-size:12px;color:#606266">
                {{ formatTime(row.last_changed_at) }}
              </div>
              <span v-else style="font-size:12px;color:#c0c4cc">-</span>
              <div v-if="row.change_count" style="font-size:11px;color:#909399;margin-top:2px">
                变更 {{ row.change_count }} 次
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="$router.push(`/bookings/${row.id}`)">详情</el-button>
              <el-button link type="primary" size="small" @click="handleStatus(row, 'arrived')" v-if="['pending','confirmed'].includes(row.status)">到店</el-button>
              <el-button link type="success" size="small" @click="handleStatus(row, 'completed')" v-if="row.status === 'arrived'">完成</el-button>
              <el-dropdown trigger="click" @command="(c: any) => handleMore(row, c)">
                <el-button link type="info" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="no-show" :disabled="row.is_no_show">标记爽约</el-dropdown-item>
                    <el-dropdown-item command="cancel" v-if="['pending','confirmed'].includes(row.status)">取消预约</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Download, ArrowDown } from '@element-plus/icons-vue'
import { getBookingList, updateBookingStatus, exportBookingList } from '@/api/booking'
import { getStaffList } from '@/api/staff'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<any[]>([])
const staffList = ref<any[]>([])

const searchForm = reactive({
  keyword: '',
  status: '',
  staffId: '',
  dateRange: [] as string[],
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const statusMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', arrived: '已到店',
  completed: '已完成', cancelled: '已取消'
}
const statusText = (s: string) => statusMap[s] || s

const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getBookingList({
      page: pagination.page,
      perPage: pagination.perPage,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      staffId: searchForm.staffId || undefined,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
    })
    list.value = res.data.data
    pagination.total = res.data.meta.total
  } finally {
    loading.value = false
  }
}

const fetchStaff = async () => {
  const res = await getStaffList({ active: '1' })
  staffList.value = res.data
}

const handleStatus = async (row: any, status: string) => {
  try {
    await ElMessageBox.confirm(`确认将该预约状态变更为「${statusMap[status]}」吗？`, '提示', {
      type: 'warning'
    })
    await updateBookingStatus(row.id, { status })
    ElMessage.success('状态更新成功')
    fetchList()
  } catch (_) { /* cancel */ }
}

const handleMore = async (row: any, cmd: string) => {
  if (cmd === 'no-show') {
    try {
      await ElMessageBox.confirm('确认将该预约标记为爽约吗？这将影响客户的爽约率。', '提示', { type: 'warning' })
      await updateBookingStatus(row.id, { isNoShow: true, reason: '标记爽约' })
      ElMessage.success('已标记爽约')
      fetchList()
    } catch (_) { /* cancel */ }
  } else if (cmd === 'cancel') {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消预约', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因'
    }).catch(() => ({ value: null }))
    if (value) {
      await updateBookingStatus(row.id, { status: 'cancelled', reason: value })
      ElMessage.success('预约已取消')
      fetchList()
    }
  }
}

const handleExport = () => {
  exportBookingList({
    keyword: searchForm.keyword || undefined,
    status: searchForm.status || undefined,
    staffId: searchForm.staffId || undefined,
    startDate: searchForm.dateRange?.[0],
    endDate: searchForm.dateRange?.[1],
  })
}

onMounted(async () => {
  await fetchStaff()
  await fetchList()
})
</script>

<style scoped>
.rate-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.rate-tag.low { background: #f0f9eb; color: #67c23a; }
.rate-tag.medium { background: #fdf6ec; color: #e6a23c; }
.rate-tag.high { background: #fef0f0; color: #f56c6c; }
</style>
