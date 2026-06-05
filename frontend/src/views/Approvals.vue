<template>
  <div class="approvals">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>待审批列表</span>
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button value="pending">待审批</el-radio-button>
            <el-radio-button value="all">全部</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="pass.pass_number" label="通行证号" width="180" />
        <el-table-column label="申请人" width="120">
          <template #default="{ row }">
            {{ row.pass?.person?.name }}
          </template>
        </el-table-column>
        <el-table-column label="申请事由" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.pass?.purpose }}
          </template>
        </el-table-column>
        <el-table-column prop="approval_level" label="审批级别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.approval_level === 2 ? 'danger' : 'primary'">
              {{ row.approval_level === 2 ? '二级' : '一级' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="handleApprove(row)">
                通过
              </el-button>
              <el-button type="danger" size="small" @click="handleReject(row)">
                拒绝
              </el-button>
              <el-button size="small" @click="viewDetail(row)">查看</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="viewDetail(row)">查看</el-button>
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

    <el-dialog v-model="detailVisible" title="审批详情" width="700px">
      <div v-if="currentApproval">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="通行证号">{{ currentApproval.pass?.pass_number }}</el-descriptions-item>
          <el-descriptions-item label="通行证类型">{{ currentApproval.pass?.pass_type }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentApproval.pass?.person?.name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentApproval.pass?.person?.id_card }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ currentApproval.pass?.person?.company }}</el-descriptions-item>
          <el-descriptions-item label="申请事由">{{ currentApproval.pass?.purpose }}</el-descriptions-item>
          <el-descriptions-item label="有效期开始">{{ currentApproval.pass?.valid_from }}</el-descriptions-item>
          <el-descriptions-item label="有效期结束">{{ currentApproval.pass?.valid_until }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4>作业区域</h4>
        <el-tag v-for="zone in currentApproval.pass?.work_zones" :key="zone.id" style="margin-right: 8px">
          {{ zone.name }}
          <el-tag v-if="zone.requires_second_approval" type="danger" size="small" style="margin-left: 4px">
            需二级审批
          </el-tag>
        </el-tag>

        <el-divider />

        <h4>审批记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(approval, index) in currentApproval.pass?.approvals"
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

        <div v-if="currentApproval.status === 'pending'" style="margin-top: 20px">
          <el-input
            v-model="comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（可选）"
          />
          <div style="margin-top: 16px; text-align: right">
            <el-button type="success" @click="confirmApprove">通过</el-button>
            <el-button type="danger" @click="confirmReject">拒绝</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { approvalsApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const statusFilter = ref('pending')

const detailVisible = ref(false)
const currentApproval = ref(null)
const comment = ref('')

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value
    }
    if (statusFilter.value === 'pending') {
      params.pending = 'true'
    }
    const res = await approvalsApi.pendingForMe(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已拒绝' }
  return map[status] || status
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const viewDetail = (row) => {
  currentApproval.value = row
  comment.value = ''
  detailVisible.value = true
}

const handleApprove = (row) => {
  currentApproval.value = row
  comment.value = ''
  detailVisible.value = true
}

const handleReject = (row) => {
  currentApproval.value = row
  comment.value = ''
  detailVisible.value = true
}

const confirmApprove = async () => {
  try {
    await ElMessageBox.confirm('确定通过该审批吗？', '提示', { type: 'success' })
    await approvalsApi.approve(currentApproval.value.id, comment.value)
    ElMessage.success('审批通过')
    detailVisible.value = false
    fetchList()
  } catch (e) {}
}

const confirmReject = async () => {
  try {
    await ElMessageBox.confirm('确定拒绝该审批吗？', '提示', { type: 'warning' })
    await approvalsApi.reject(currentApproval.value.id, comment.value)
    ElMessage.success('已拒绝')
    detailVisible.value = false
    fetchList()
  } catch (e) {}
}

watch(statusFilter, () => {
  page.value = 1
  fetchList()
})

onMounted(() => {
  fetchList()
})
</script>
