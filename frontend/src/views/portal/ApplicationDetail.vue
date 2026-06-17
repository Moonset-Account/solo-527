<template>
  <div v-if="application" class="application-detail">
    <div class="page-header">
      <h2 class="page-title">申请详情 - {{ application.applicationNo }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="card-shadow">
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请单号">{{ application.applicationNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="ApplicationStatusType[application.status] as any">
              {{ ApplicationStatusLabel[application.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请人">{{ application.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="部门/实验室">
            {{ application.applicantDepartment }} / {{ application.applicantLaboratory || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用途" :span="2">{{ application.purpose }}</el-descriptions-item>
          <el-descriptions-item label="关联课题">{{ application.projectName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计领用日期">{{ application.expectedPickDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(application.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="detail-section">
        <div class="section-title">试剂清单</div>
        <el-table :data="application.items" border>
          <el-table-column prop="reagentName" label="试剂名称" />
          <el-table-column prop="specification" label="规格/批号" />
          <el-table-column label="数量">
            <template #default="{ row }">
              {{ row.quantity }} {{ row.unit }}
              <span v-if="row.actualQuantity !== undefined" style="color: #67c23a; margin-left: 8px">
                (实际发放: {{ row.actualQuantity }})
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="备注" />
        </el-table>
      </div>

      <div v-if="application.approval" class="detail-section">
        <div class="section-title">审核信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审核人">{{ application.approval.approverName }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ formatDate(application.approval.approvedAt) }}</el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">{{ application.approval.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="application.rejectReason" class="detail-section">
        <div class="section-title">驳回原因</div>
        <el-alert :title="application.rejectReason" type="error" show-icon />
      </div>

      <div class="detail-section">
        <div class="section-title">关联信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="仪器预约">{{ application.relatedInstrumentBookingId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="危化标签">{{ (application.relatedHazardousLabelIds || []).join(', ') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联样本">{{ (application.relatedSampleIds || []).length }} 个</el-descriptions-item>
          <el-descriptions-item label="原始单据">{{ application.originalDocumentId || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="detail-section">
        <div class="section-title">操作日志（复盘查询）</div>
        <el-table :data="auditLogs" v-loading="auditLoading" stripe size="small">
          <el-table-column prop="actionTime" label="时间" width="180">
            <template #default="{ row }">{{ formatDate(row.actionTime) }}</template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="100" />
          <el-table-column prop="operatorName" label="操作人" width="120" />
          <el-table-column prop="details" label="详情">
            <template #default="{ row }">
              <span v-if="typeof row.details === 'string'">{{ row.details }}</span>
              <span v-else-if="row.details">{{ JSON.stringify(row.details) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="form-actions" v-if="canEdit">
        <el-button
          v-if="application.status === 'draft'"
          type="primary"
          @click="handleSubmit"
        >提交申请</el-button>
        <el-button
          v-if="['draft', 'pending'].includes(application.status)"
          type="danger"
          @click="handleCancel"
        >取消申请</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applicationApi, auditApi } from '@/api'
import {
  ApplicationStatusLabel,
  ApplicationStatusType,
  type Application,
  type AuditLog,
  ApplicationStatus,
} from '@/types'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const application = ref<Application | null>(null)
const auditLogs = ref<AuditLog[]>([])
const auditLoading = ref(false)

const canEdit = computed(() => {
  if (!application.value) return false
  return application.value.applicantId === userStore.userId
})

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm:ss') : '-'
}

async function loadDetail() {
  const id = route.params.id as string
  application.value = await applicationApi.detail(id)
  await loadAuditLogs(id)
}

async function loadAuditLogs(targetId: string) {
  auditLoading.value = true
  try {
    auditLogs.value = await auditApi.findByTarget(targetId, 'application')
  } finally {
    auditLoading.value = false
  }
}

async function handleSubmit() {
  if (!application.value) return
  try {
    await ElMessageBox.confirm('确定提交此申请？', '提示', { type: 'warning' })
    await applicationApi.submit(application.value._id)
    ElMessage.success('提交成功')
    loadDetail()
  } catch {}
}

async function handleCancel() {
  if (!application.value) return
  try {
    await ElMessageBox.confirm('确定取消此申请？', '提示', { type: 'warning' })
    await applicationApi.cancel(application.value._id)
    ElMessage.success('已取消')
    loadDetail()
  } catch {}
}

onMounted(loadDetail)
</script>
