<template>
  <div class="lead-detail-container">
    <div class="page-header">
      <span class="page-title">线索详情</span>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :icon="Edit" @click="handleEdit">编辑</el-button>
        <el-button type="warning" :icon="User" @click="handleAssign">分配</el-button>
        <el-button type="info" :icon="ChatDotRound" @click="handleAddFollow">新增跟进</el-button>
        <el-button type="success" :icon="Document" @click="handleCreateContract">创建合同</el-button>
        <el-dropdown @command="handleUpdateStatus">
          <el-button type="primary" plain>
            更新状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="(label, value) in LEAD_STATUS" :key="value" :command="value">{{ label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-card class="base-info-card" shadow="never">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="线索编号">{{ leadDetail.leadNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <StatusTag :status="leadDetail.status" :status-map="leadStatusMap" />
        </el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ leadDetail.projectName }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ getLeadSourceName(leadDetail.source) }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ leadDetail.ownerName }}</el-descriptions-item>
        <el-descriptions-item label="跟进阶段">{{ getFollowStageName(leadDetail.followStage) }}</el-descriptions-item>
        <el-descriptions-item label="预算金额">¥{{ formatMoney(leadDetail.budgetAmount) }}</el-descriptions-item>
        <el-descriptions-item label="房屋面积">{{ leadDetail.houseArea }} ㎡</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ leadDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ leadDetail.customerPhone }}</el-descriptions-item>
        <el-descriptions-item label="小区名称">{{ leadDetail.communityName }}</el-descriptions-item>
        <el-descriptions-item label="装修类型">{{ getDecorationTypeName(leadDetail.decorationType) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ leadDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ leadDetail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" class="detail-content-row">
      <el-col :span="16">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="装修需求" name="decoration">
            <el-descriptions :column="2" border v-if="leadDetail.decorationRequirement">
              <el-descriptions-item label="户型">{{ leadDetail.decorationRequirement.houseType }}</el-descriptions-item>
              <el-descriptions-item label="面积">{{ leadDetail.decorationRequirement.area }} ㎡</el-descriptions-item>
              <el-descriptions-item label="装修风格">{{ leadDetail.decorationRequirement.style }}</el-descriptions-item>
              <el-descriptions-item label="装修档次">{{ leadDetail.decorationRequirement.grade }}</el-descriptions-item>
              <el-descriptions-item label="功能需求" :span="2">{{ leadDetail.decorationRequirement.functionalRequirements }}</el-descriptions-item>
              <el-descriptions-item label="特殊需求" :span="2">{{ leadDetail.decorationRequirement.specialRequirements }}</el-descriptions-item>
              <el-descriptions-item label="预算范围">{{ leadDetail.decorationRequirement.budgetRange }}</el-descriptions-item>
              <el-descriptions-item label="预计开工时间">{{ leadDetail.decorationRequirement.expectedStartDate }}</el-descriptions-item>
            </el-descriptions>
            <el-empty v-else description="暂无装修需求信息" />
          </el-tab-pane>
          <el-tab-pane label="量房信息" name="measure">
            <template v-if="leadDetail.houseMeasure">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="量房时间">{{ leadDetail.houseMeasure.measureTime }}</el-descriptions-item>
                <el-descriptions-item label="量房人员">{{ leadDetail.houseMeasure.measureUserName }}</el-descriptions-item>
                <el-descriptions-item label="房屋类型">{{ leadDetail.houseMeasure.houseType }}</el-descriptions-item>
                <el-descriptions-item label="建筑面积">{{ leadDetail.houseMeasure.buildArea }} ㎡</el-descriptions-item>
                <el-descriptions-item label="套内面积">{{ leadDetail.houseMeasure.insideArea }} ㎡</el-descriptions-item>
                <el-descriptions-item label="层高">{{ leadDetail.houseMeasure.floorHeight }} m</el-descriptions-item>
              </el-descriptions>
              <el-divider content-position="left">各房间尺寸</el-divider>
              <el-table :data="leadDetail.houseMeasure.roomList || []" border>
                <el-table-column prop="roomName" label="房间名称" />
                <el-table-column prop="length" label="长度(m)" />
                <el-table-column prop="width" label="宽度(m)" />
                <el-table-column prop="height" label="高度(m)" />
                <el-table-column prop="area" label="面积(㎡)" />
              </el-table>
              <el-divider content-position="left">施工难点</el-divider>
              <p>{{ leadDetail.houseMeasure.constructionDifficulty }}</p>
              <el-divider content-position="left">量房建议</el-divider>
              <p>{{ leadDetail.houseMeasure.measureSuggestion }}</p>
            </template>
            <el-empty v-else description="暂无量房信息" />
          </el-tab-pane>
          <el-tab-pane label="合同信息" name="contract">
            <el-table :data="leadDetail.contractList || []" border stripe>
              <el-table-column prop="contractNo" label="合同编号" />
              <el-table-column prop="contractName" label="合同名称" />
              <el-table-column prop="contractAmount" label="合同金额">
                <template #default="{ row }">¥{{ formatMoney(row.contractAmount) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <StatusTag :status="row.status" :status-map="contractStatusMap" />
                </template>
              </el-table-column>
              <el-table-column prop="signTime" label="签约时间" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleViewContract(row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!leadDetail.contractList || !leadDetail.contractList.length" description="暂无合同信息" />
          </el-tab-pane>
          <el-tab-pane label="回款信息" name="payment">
            <el-table :data="leadDetail.paymentPlanList || []" border stripe>
              <el-table-column prop="phaseName" label="回款阶段" />
              <el-table-column prop="planAmount" label="计划金额">
                <template #default="{ row }">¥{{ formatMoney(row.planAmount) }}</template>
              </el-table-column>
              <el-table-column prop="paidAmount" label="已付金额">
                <template #default="{ row }">¥{{ formatMoney(row.paidAmount) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <StatusTag :status="row.status" :status-map="paymentStatusMap" />
                </template>
              </el-table-column>
              <el-table-column prop="planDate" label="计划回款日期" />
              <el-table-column prop="actualDate" label="实际回款日期" />
            </el-table>
            <el-empty v-if="!leadDetail.paymentPlanList || !leadDetail.paymentPlanList.length" description="暂无回款信息" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
      <el-col :span="8">
        <el-card class="timeline-wrapper" shadow="never">
          <template #header>
            <span class="card-title">跟进记录 / 操作日志</span>
          </template>
          <TimelineCard :items="timelineList" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="assignDialogVisible" title="分配线索" width="400px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="负责人">
          <el-select v-model="assignForm.ownerId" placeholder="请选择负责人" style="width: 100%">
            <el-option v-for="user in userList" :key="user.id" :label="user.nickname || user.username" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="followDialogVisible" title="新增跟进" width="500px">
      <el-form :model="followForm" label-width="80px">
        <el-form-item label="跟进方式">
          <el-select v-model="followForm.followType" placeholder="请选择跟进方式" style="width: 100%">
            <el-option label="电话" value="PHONE" />
            <el-option label="微信" value="WECHAT" />
            <el-option label="面谈" value="MEETING" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容">
          <el-input v-model="followForm.content" type="textarea" :rows="4" placeholder="请输入跟进内容" />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="followForm.nextFollowTime" type="datetime" placeholder="选择下次跟进时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmFollow">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, User, ChatDotRound, Document, ArrowDown } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import TimelineCard from '@/components/TimelineCard.vue'
import { getLeadDetail, updateLeadStatus, assignLead } from '@/api/lead'
import { createFollow, getTimeline } from '@/api/follow'
import { getUserList } from '@/api/user'
import {
  LEAD_STATUS,
  CONTRACT_STATUS,
  PAYMENT_PLAN_STATUS,
  getLeadSourceName,
  getFollowStageName,
  getDecorationTypeName
} from '@/utils/dict'

const route = useRoute()
const router = useRouter()

const leadId = route.params.id

const activeTab = ref('decoration')
const leadDetail = ref({})
const timelineList = ref([])
const userList = ref([])

const leadStatusMap = {
  NEW: { label: '新建', type: 'primary' },
  FOLLOWING: { label: '跟进中', type: 'success' },
  MEASURED: { label: '已量房', type: 'warning' },
  DESIGNED: { label: '已出方案', type: 'warning' },
  QUOTED: { label: '已报价', type: 'warning' },
  NEGOTIATING: { label: '洽谈中', type: 'primary' },
  DEALED: { label: '已成交', type: 'success' },
  LOST: { label: '已流失', type: 'danger' },
  INVALID: { label: '无效', type: 'info' }
}

const contractStatusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  PENDING_APPROVAL: { label: '待审批', type: 'warning' },
  APPROVED: { label: '已通过', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
  SIGNED: { label: '已签约', type: 'success' },
  EXECUTING: { label: '执行中', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'info' }
}

const paymentStatusMap = {
  UNPAID: { label: '未支付', type: 'warning' },
  PARTIAL: { label: '部分支付', type: 'primary' },
  PAID: { label: '已支付', type: 'success' },
  OVERDUE: { label: '已逾期', type: 'danger' }
}

const assignDialogVisible = ref(false)
const assignForm = reactive({
  ownerId: null
})

const followDialogVisible = ref(false)
const followForm = reactive({
  leadId: leadId,
  followType: '',
  content: '',
  nextFollowTime: null
})

const formatMoney = (value) => {
  if (!value) return '0'
  return Number(value).toLocaleString()
}

const loadDetail = async () => {
  try {
    const res = await getLeadDetail(leadId)
    leadDetail.value = res || {}
  } catch (e) {
    console.error(e)
  }
}

const loadTimeline = async () => {
  try {
    const res = await getTimeline({ leadId })
    timelineList.value = res || []
  } catch (e) {
    console.error(e)
  }
}

const loadUserList = async () => {
  try {
    const res = await getUserList()
    userList.value = res || []
  } catch (e) {
    console.error(e)
  }
}

const goBack = () => {
  router.back()
}

const handleEdit = () => {
  ElMessage.info('编辑线索')
}

const handleAssign = () => {
  assignForm.ownerId = leadDetail.value.ownerId
  assignDialogVisible.value = true
}

const confirmAssign = async () => {
  if (!assignForm.ownerId) {
    ElMessage.warning('请选择负责人')
    return
  }
  try {
    await assignLead(leadId, assignForm.ownerId)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    loadDetail()
    loadTimeline()
  } catch (e) {
    console.error(e)
  }
}

const handleAddFollow = () => {
  followForm.followType = ''
  followForm.content = ''
  followForm.nextFollowTime = null
  followDialogVisible.value = true
}

const confirmFollow = async () => {
  if (!followForm.followType) {
    ElMessage.warning('请选择跟进方式')
    return
  }
  if (!followForm.content) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  try {
    await createFollow(followForm)
    ElMessage.success('跟进记录已添加')
    followDialogVisible.value = false
    loadDetail()
    loadTimeline()
  } catch (e) {
    console.error(e)
  }
}

const handleCreateContract = () => {
  ElMessage.info('创建合同')
}

const handleViewContract = (row) => {
  router.push(`/contracts/${row.id}`)
}

const handleUpdateStatus = async (status) => {
  try {
    await updateLeadStatus(leadId, status)
    ElMessage.success('状态更新成功')
    loadDetail()
    loadTimeline()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadDetail()
  loadTimeline()
  loadUserList()
})
</script>

<style lang="scss" scoped>
.lead-detail-container {
  .base-info-card {
    margin-bottom: 20px;
  }

  .detail-content-row {
    .timeline-wrapper {
      height: 100%;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }
}
</style>
