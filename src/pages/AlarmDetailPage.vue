<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Alarm } from '@/types'
import { alarmApi } from '@/api'

const route = useRoute()
const router = useRouter()

const typeLabelMap: Record<string, string> = {
  peak_anomaly: '尖峰异常',
  device_fault: '设备故障',
  data_anomaly: '数据异常',
  communication_loss: '通信中断',
}

const levelTagType: Record<string, string> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
}

const levelLabelMap: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
}

const statusTagType: Record<string, string> = {
  pending: 'danger',
  confirmed: 'warning',
  processing: '',
  resolved: 'success',
}

const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  resolved: '已解决',
}

const loading = ref(false)
const alarm = ref<Alarm | null>(null)
const resolveForm = ref({ rootCause: '', remark: '' })
const confirming = ref(false)
const resolving = ref(false)

function formatTime(val: string | null) {
  if (!val) return '-'
  return val.replace('T', ' ').replace('Z', '')
}

function formatResponseDuration(val: number | null) {
  if (val === null || val === undefined) return '未确认'
  return `${val}分钟`
}

async function fetchDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    alarm.value = await alarmApi.getById(id)
  } finally {
    loading.value = false
  }
}

async function handleConfirm() {
  if (!alarm.value) return
  confirming.value = true
  try {
    alarm.value = await alarmApi.confirm(alarm.value.id)
    ElMessage.success('告警已确认')
  } catch {
    ElMessage.error('确认失败')
  } finally {
    confirming.value = false
  }
}

async function handleResolve() {
  if (!alarm.value) return
  if (!resolveForm.value.rootCause) {
    ElMessage.warning('请填写根本原因')
    return
  }
  resolving.value = true
  try {
    alarm.value = await alarmApi.resolve(alarm.value.id, {
      rootCause: resolveForm.value.rootCause,
      remark: resolveForm.value.remark,
    })
    ElMessage.success('告警已解决')
  } catch {
    ElMessage.error('解决失败')
  } finally {
    resolving.value = false
  }
}

function handleBack() {
  router.push('/alarms')
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div v-loading="loading" class="alarm-detail-page">
    <div class="page-header">
      <el-button @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>告警详情</h2>
      <el-tag
        v-if="alarm"
        :type="statusTagType[alarm.status]"
        size="large"
      >
        {{ statusLabelMap[alarm.status] }}
      </el-tag>
    </div>

    <template v-if="alarm">
      <el-card class="section-card">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警类型">
            {{ typeLabelMap[alarm.type] || alarm.type }}
          </el-descriptions-item>
          <el-descriptions-item label="告警等级">
            <el-tag :type="levelTagType[alarm.level]" size="small">
              {{ levelLabelMap[alarm.level] || alarm.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源设备">
            {{ alarm.meterNo }}
          </el-descriptions-item>
          <el-descriptions-item label="所属区域">
            {{ alarm.zoneName }}
          </el-descriptions-item>
          <el-descriptions-item label="责任人">
            {{ alarm.assignee }}
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ formatTime(alarm.occurredAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="确认时间">
            {{ formatTime(alarm.confirmedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="解决时间">
            {{ formatTime(alarm.resolvedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="响应时长">
            {{ formatResponseDuration(alarm.responseDuration) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="section-card">
        <template #header>
          <span class="section-title">来源单据</span>
        </template>
        <el-link type="primary" :underline="false">
          {{ alarm.sourceDocumentNo }}
        </el-link>
      </el-card>

      <el-card class="section-card">
        <template #header>
          <span class="section-title">告警信息</span>
        </template>
        <el-alert
          :title="alarm.message"
          type="error"
          show-icon
          :closable="false"
        />
      </el-card>

      <el-card class="section-card">
        <template #header>
          <span class="section-title">处理记录</span>
        </template>

        <div v-if="alarm.status === 'pending'">
          <el-button
            type="primary"
            :loading="confirming"
            @click="handleConfirm"
          >
            确认告警
          </el-button>
        </div>

        <div v-else-if="alarm.status === 'confirmed'">
          <el-form :model="resolveForm" label-width="80px">
            <el-form-item label="根本原因">
              <el-input
                v-model="resolveForm.rootCause"
                type="textarea"
                :rows="3"
                placeholder="请输入根本原因"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="resolveForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="resolving"
                @click="handleResolve"
              >
                解决告警
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="alarm.status === 'resolved'">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="根本原因">
              {{ alarm.rootCause || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注">
              {{ alarm.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <el-card class="section-card">
        <template #header>
          <span class="section-title">补充说明</span>
        </template>
        <div class="remark-content">
          {{ alarm.remark || '暂无补充说明' }}
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.alarm-detail-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
  flex: 1;
}

.section-card {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.remark-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
