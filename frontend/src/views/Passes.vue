<template>
  <div class="passes">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>通行证管理</span>
          <el-button type="primary" size="small" @click="goToApply">
            新建申请
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="通行证号">
          <el-input v-model="searchForm.pass_number" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已冻结" value="frozen" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="pass_number" label="通行证号" width="160" />
        <el-table-column prop="pass_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getPassTypeName(row.pass_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="120">
          <template #default="{ row }">
            {{ row.person?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="事由" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="valid_from" label="有效期起" width="120">
          <template #default="{ row }">
            {{ formatDate(row.valid_from) }}
          </template>
        </el-table-column>
        <el-table-column prop="valid_until" label="有效期止" width="120">
          <template #default="{ row }">
            {{ formatDate(row.valid_until) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <template v-if="row.status === 'approved' && !row.frozen">
              <el-button type="danger" size="small" @click="handleFreeze(row)">
                冻结
              </el-button>
            </template>
            <template v-if="row.frozen">
              <el-button type="success" size="small" @click="handleUnfreeze(row)">
                解冻
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="通行证详情" width="700px">
      <div v-if="currentPass">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="通行证号">{{ currentPass.pass_number }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getPassTypeName(currentPass.pass_type) }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentPass.person?.name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentPass.person?.id_card }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentPass.person?.phone }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ currentPass.person?.company }}</el-descriptions-item>
          <el-descriptions-item label="申请事由">{{ currentPass.purpose }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentPass.status)">{{ getStatusName(currentPass.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="有效期起">{{ formatDate(currentPass.valid_from) }}</el-descriptions-item>
          <el-descriptions-item label="有效期止">{{ formatDate(currentPass.valid_until) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4>关联车辆</h4>
        <el-tag v-if="currentPass.vehicle">
          {{ currentPass.vehicle.plate_number }} - {{ currentPass.vehicle.vehicle_type }}
        </el-tag>
        <span v-else style="color: #909399">无</span>

        <el-divider />

        <h4>作业区域</h4>
        <el-tag v-for="zone in currentPass.work_zones" :key="zone.id" style="margin-right: 8px">
          {{ zone.name }}
          <el-tag v-if="zone.requires_second_approval" type="danger" size="small" style="margin-left: 4px">
            危险区域
          </el-tag>
        </el-tag>

        <el-divider />

        <h4>审批记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(approval, index) in currentPass.approvals"
            :key="index"
            :timestamp="approval.approved_at || approval.rejected_at || approval.created_at"
            :type="approval.status === 'approved' ? 'success' : (approval.status === 'rejected' ? 'danger' : 'warning')"
          >
            <div>
              <strong>第{{ approval.approval_level }}级审批</strong>
              <el-tag :type="getStatusType(approval.status)" style="margin-left: 8px">
                {{ getStatusName(approval.status) }}
              </el-tag>
            </div>
            <div v-if="approval.approver" style="color: #909399; font-size: 12px">
              审批人：{{ approval.approver.real_name }}
            </div>
            <div v-if="approval.comment" style="margin-top: 4px">
              意见：{{ approval.comment }}
            </div>
          </el-timeline-item>
        </el-timeline>

        <el-divider />

        <h4>违规记录</h4>
        <el-table :data="currentPass.violations || []" size="small" v-if="currentPass.violations?.length">
          <el-table-column prop="violation_type" label="违规类型" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="penalty" label="处罚" width="120" />
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <span v-else style="color: #909399">暂无违规记录</span>
      </div>
    </el-dialog>

    <el-dialog v-model="freezeVisible" title="冻结通行证" width="500px">
      <el-form label-width="80px">
        <el-form-item label="冻结原因">
          <el-input v-model="freezeReason" type="textarea" :rows="3" placeholder="请输入冻结原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFreeze">确认冻结</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { passesApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

const searchForm = reactive({
  pass_number: '',
  status: ''
})

const detailVisible = ref(false)
const currentPass = ref(null)
const freezeVisible = ref(false)
const freezeReason = ref('')
const currentFreezeId = ref(null)

const goToApply = () => {
  router.push('/pass-apply')
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await passesApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.pass_number = ''
  searchForm.status = ''
  page.value = 1
  fetchList()
}

const getPassTypeName = (type) => {
  const map = { visitor: '访客证', worker: '工作证', vehicle: '车辆证', temporary: '临时证' }
  return map[type] || type
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    frozen: 'info',
    expired: 'info'
  }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    frozen: '已冻结',
    expired: '已过期'
  }
  return map[status] || status
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')
const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const viewDetail = async (row) => {
  try {
    const res = await passesApi.detail(row.id)
    currentPass.value = res
    detailVisible.value = true
  } catch (e) {}
}

const handleFreeze = (row) => {
  currentFreezeId.value = row.id
  freezeReason.value = ''
  freezeVisible.value = true
}

const confirmFreeze = async () => {
  if (!freezeReason.value.trim()) {
    ElMessage.warning('请输入冻结原因')
    return
  }
  try {
    await passesApi.freeze(currentFreezeId.value, freezeReason.value)
    ElMessage.success('冻结成功')
    freezeVisible.value = false
    fetchList()
  } catch (e) {}
}

const handleUnfreeze = async (row) => {
  try {
    await ElMessageBox.confirm('确定解冻该通行证吗？', '提示', { type: 'warning' })
    await passesApi.unfreeze(row.id)
    ElMessage.success('解冻成功')
    fetchList()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
})
</script>
