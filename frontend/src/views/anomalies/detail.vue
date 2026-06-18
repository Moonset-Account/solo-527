<template>
  <div v-loading="loading" class="anomaly-detail page-container">
    <div v-if="detail" class="detail-wrapper">
      <div class="card-wrapper detail-header">
        <div class="header-top">
          <div class="left">
            <el-breadcrumb separator="/" class="crumb">
              <el-breadcrumb-item @click="router.push('/anomalies/list')">异常列表</el-breadcrumb-item>
              <el-breadcrumb-item>详情</el-breadcrumb-item>
            </el-breadcrumb>
            <h1 class="detail-title">
              <el-tag
                :class="`tag-${detail.severity}`"
                effect="dark"
                size="large"
                style="border: none; margin-right: 10px;"
              >
                {{ getSeverityInfo(detail.severity).label }}
              </el-tag>
              {{ detail.title }}
            </h1>
            <div class="meta-row">
              <el-tag :type="getStatusInfo(detail.status).type" effect="plain" size="small">
                {{ getStatusInfo(detail.status).label }}
              </el-tag>
              <el-tag type="info" effect="plain" size="small">
                <el-icon style="margin-right: 2px;"><Refresh /></el-icon>
                {{ getCategoryInfo(detail.category).label }}
              </el-tag>
              <el-tag type="info" effect="plain" size="small">
                指标: {{ detail.metricName }}
              </el-tag>
              <el-tag v-if="detail.datasetName" type="warning" effect="plain" size="small">
                数据集: {{ detail.datasetName }}
              </el-tag>
              <span class="time">
                检测于 {{ formatDate(detail.detectedAt) }}（{{ fromNow(detail.detectedAt) }}）
              </span>
              <span class="views">
                <el-icon><View /></el-icon> {{ detail.viewCount || 0 }} 次浏览
              </span>
            </div>
          </div>
          <div class="right">
            <el-select
              v-model="statusValue"
              @change="onStatusChange"
              style="width: 120px; margin-right: 8px;"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
            <el-select
              v-model="severityValue"
              @change="onSeverityChange"
              style="width: 100px; margin-right: 8px;"
            >
              <el-option label="严重" value="critical" />
              <el-option label="警告" value="warning" />
              <el-option label="提示" value="info" />
            </el-select>
            <el-button type="primary" @click="showAssignDialog = true">
              <el-icon><UserFilled /></el-icon>分配处理
            </el-button>
          </div>
        </div>
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="16">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title"><el-icon><TrendCharts /></el-icon> 异常波动过程数据</span>
            </div>
            <div ref="trendRef" style="height: 340px;"></div>
            <div class="trend-stats">
              <div class="stat">
                <span class="label">当前值</span>
                <span class="value current">{{ formatNumber(detail.currentValue) }}</span>
              </div>
              <div class="stat">
                <span class="label">预期值</span>
                <span class="value">{{ formatNumber(detail.expectedValue) }}</span>
              </div>
              <div class="stat">
                <span class="label">偏离程度</span>
                <span class="value" :class="detail.deviationPercent > 0 ? 'up' : 'down'">
                  {{ formatPercent(detail.deviationPercent) }}
                </span>
              </div>
              <div class="stat">
                <span class="label">处理人</span>
                <span class="value" style="font-size: 14px;">
                  {{ detail.assigneeName || '未分配' }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 16px;">
            <div class="card-header">
              <span class="title"><el-icon><Search /></el-icon> 异常原因分析</span>
              <el-tag type="info" effect="plain" size="small">
                AI 自动识别可能原因，置信度仅供参考
              </el-tag>
            </div>
            <el-empty v-if="!detail.possibleCauses?.length" description="暂未分析出可能原因" :image-size="80" />
            <div v-else class="cause-list">
              <div
                v-for="(cause, idx) in detail.possibleCauses"
                :key="idx"
                class="cause-item"
              >
                <div class="cause-header">
                  <div class="cause-type">
                    <el-icon style="color:#409eff"><InfoFilled /></el-icon>
                    <span>{{ cause.type }}</span>
                  </div>
                  <div class="confidence">
                    <span class="conf-label">置信度</span>
                    <el-progress
                      :percentage="Math.round((cause.confidence || 0) * 100)"
                      :stroke-width="8"
                      :show-text="false"
                      style="width: 140px;"
                    />
                    <span class="conf-val">{{ Math.round((cause.confidence || 0) * 100) }}%</span>
                  </div>
                </div>
                <div class="cause-desc">
                  <el-icon style="color:#67c23a; flex-shrink: 0;"><Promotion /></el-icon>
                  <span>{{ cause.description }}</span>
                </div>
                <div v-if="cause.evidence" class="cause-evidence">
                  <el-icon style="color:#e6a23c; flex-shrink: 0;"><Warning /></el-icon>
                  <span>证据: {{ cause.evidence }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 16px;">
            <el-tabs v-model="activeTab" type="border-card">
              <el-tab-pane label="业务明细" name="business">
                <el-form label-width="100px" style="max-width: 720px;">
                  <el-form-item label="业务背景">
                    <el-input
                      v-model="businessForm.businessContext"
                      type="textarea"
                      :rows="3"
                      placeholder="描述业务背景上下文..."
                    />
                  </el-form-item>
                  <el-form-item label="影响范围">
                    <el-input
                      v-model="businessForm.impactScope"
                      type="textarea"
                      :rows="2"
                      placeholder="描述业务影响范围..."
                    />
                  </el-form-item>
                  <el-form-item label="关联业务">
                    <el-input
                      v-model="businessForm.relatedBusiness"
                      placeholder="涉及的产品/渠道/活动等"
                    />
                  </el-form-item>
                  <el-form-item label="根因分析">
                    <el-input
                      v-model="businessForm.rootCauseAnalysis"
                      type="textarea"
                      :rows="3"
                      placeholder="详细的根因分析..."
                    />
                  </el-form-item>
                  <el-form-item label="解决方案">
                    <el-input
                      v-model="businessForm.solution"
                      type="textarea"
                      :rows="3"
                      placeholder="具体解决方案..."
                    />
                  </el-form-item>
                  <el-form-item label="预防措施">
                    <el-input
                      v-model="businessForm.preventionMeasure"
                      type="textarea"
                      :rows="3"
                      placeholder="后续如何预防类似问题..."
                    />
                  </el-form-item>
                  <el-form-item label="复盘状态">
                    <el-select v-model="businessForm.reviewStatus" style="width: 180px;">
                      <el-option label="未开始" value="not_started" />
                      <el-option label="进行中" value="in_progress" />
                      <el-option label="已完成" value="completed" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="savingBusiness" @click="saveBusiness">
                      保存业务明细
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane :label="`附件 (${businessDetail?.attachments?.length || 0})`" name="attachments">
                <div style="margin-bottom: 12px;">
                  <el-upload
                    :before-upload="handleUpload"
                    :show-file-list="false"
                    drag
                    multiple
                    action="#"
                    style="max-width: 420px;"
                  >
                    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                    <div class="el-upload__text">
                      将文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        支持任意格式文件，单个文件最大 10MB
                      </div>
                    </template>
                  </el-upload>
                </div>
                <el-empty
                  v-if="!businessDetail?.attachments?.length"
                  description="暂无附件"
                  :image-size="80"
                />
                <div v-else class="attachment-list">
                  <div
                    v-for="att in businessDetail.attachments"
                    :key="att._id"
                    class="attachment-item"
                  >
                    <el-icon class="att-icon"><Document /></el-icon>
                    <div class="att-info">
                      <div class="att-name" :title="att.originalName">{{ att.originalName }}</div>
                      <div class="att-meta">
                        {{ formatFileSize(att.size) }}
                        · {{ att.uploadedByName }} 上传于 {{ formatDate(att.uploadedAt) }}
                      </div>
                    </div>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      @click="deleteAtt(att._id)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane :label="`备注评论 (${businessDetail?.comments?.length || 0})`" name="comments">
                <div class="comment-input" style="margin-bottom: 20px;">
                  <el-avatar :size="36" style="background: #409eff">
                    {{ userStore.userInfo?.name?.[0] }}
                  </el-avatar>
                  <div style="flex: 1;">
                    <el-input
                      v-model="commentText"
                      type="textarea"
                      :rows="3"
                      placeholder="添加备注或评论..."
                    />
                    <div style="text-align: right; margin-top: 8px;">
                      <el-button type="primary" :loading="submittingComment" @click="submitComment">
                        发表评论
                      </el-button>
                    </div>
                  </div>
                </div>
                <el-empty
                  v-if="!businessDetail?.comments?.length"
                  description="暂无评论"
                  :image-size="80"
                />
                <div v-else class="comment-list">
                  <div
                    v-for="c in businessDetail.comments"
                    :key="c._id"
                    class="comment-item"
                  >
                    <el-avatar :size="36" style="background: #909399">
                      {{ c.userName?.[0] }}
                    </el-avatar>
                    <div class="comment-body">
                      <div class="comment-header">
                        <span class="comment-user">{{ c.userName }}</span>
                        <span class="comment-time">{{ formatDate(c.createdAt) }}</span>
                      </div>
                      <div class="comment-content">{{ c.content }}</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane :label="`修改历史 (${businessDetail?.history?.length || 0})`" name="history">
                <el-timeline v-if="businessDetail?.history?.length">
                  <el-timeline-item
                    v-for="(h, idx) in businessDetail.history"
                    :key="idx"
                    :timestamp="formatDate(h.changedAt)"
                    placement="top"
                    :type="idx < 3 ? 'primary' : ''"
                  >
                    <el-card shadow="never" class="history-card">
                      <div class="history-operator">
                        <el-icon><User /></el-icon>{{ h.userName }}
                      </div>
                      <div class="history-field">
                        修改字段: <el-tag size="small" type="info">{{ h.fieldName }}</el-tag>
                      </div>
                      <div class="history-values">
                        <div class="old-value">
                          <span>旧值：</span>
                          <span>{{ formatHistoryValue(h.oldValue) }}</span>
                        </div>
                        <el-icon style="margin: 0 10px; color:#909399"><ArrowRight /></el-icon>
                        <div class="new-value">
                          <span>新值：</span>
                          <span>{{ formatHistoryValue(h.newValue) }}</span>
                        </div>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无修改历史" :image-size="80" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title"><el-icon><Document /></el-icon> 摘要推送</span>
            </div>
            <div v-if="detail.summary || detail.resolvedCause" class="summary-content">
              <div v-if="detail.summary" class="summary-block">
                <div class="sum-label">摘要</div>
                <p>{{ detail.summary }}</p>
              </div>
              <div v-if="detail.resolvedCause" class="summary-block">
                <div class="sum-label">解决原因</div>
                <p>{{ detail.resolvedCause }}</p>
              </div>
              <div v-if="detail.resolvedByName" class="summary-block">
                <div class="sum-label">解决人</div>
                <p>
                  {{ detail.resolvedByName }}
                  <span v-if="detail.resolvedAt">于 {{ formatDate(detail.resolvedAt) }}</span>
                </p>
              </div>
            </div>
            <div v-else class="empty-summary">
              <el-input
                v-model="summaryText"
                type="textarea"
                :rows="4"
                placeholder="填写摘要，方便后续检索和复盘..."
              />
              <el-button
                type="primary"
                style="margin-top: 8px;"
                :loading="savingSummary"
                @click="saveSummary"
              >
                保存摘要
              </el-button>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 16px;">
            <div class="card-header">
              <span class="title"><el-icon><List /></el-icon> 操作事件流</span>
            </div>
            <el-empty
              v-if="!events?.length"
              description="暂无操作事件"
              :image-size="80"
            />
            <el-timeline v-else>
              <el-timeline-item
                v-for="(e, idx) in events.slice(0, 15)"
                :key="idx"
                :timestamp="fromNow(e.createdAt)"
                placement="top"
              >
                <div class="event-item">
                  <div class="event-desc">
                    <b>{{ e.operatorName }}</b> {{ e.description }}
                  </div>
                  <div class="event-type">
                    <el-tag size="small" type="info">{{ e.eventType }}</el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="card-wrapper" style="margin-top: 16px;">
            <div class="card-header">
              <span class="title"><el-icon><Flag /></el-icon> 复盘节奏</span>
              <el-tag type="success" size="small" effect="plain">纳入月底复盘</el-tag>
            </div>
            <div class="review-info">
              <div class="review-row">
                <el-icon><Clock /></el-icon>
                <span>周复盘: 每周一 10:00</span>
              </div>
              <div class="review-row">
                <el-icon><Calendar /></el-icon>
                <span>月复盘: 每月第1个周一 14:00</span>
              </div>
              <div class="review-row">
                <el-icon><UserFilled /></el-icon>
                <span>负责人: 运营经理</span>
              </div>
              <div class="review-row">
                <el-icon><User /></el-icon>
                <span>参与人: 运营组 / 产品组 / 技术组</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showAssignDialog" title="分配处理人" width="420px">
      <el-form label-width="80px">
        <el-form-item label="处理人" required>
          <el-select v-model="assignUserId" filterable placeholder="请选择处理人" style="width: 100%">
            <el-option
              v-for="u in operators"
              :key="u._id"
              :label="u.name + '（' + u.department + '）'"
              :value="u._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="assignUser">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  getAnomalyDetail, getAnomalyEvents, updateAnomaly, getAnomalyTrend
} from '@/api/anomalies'
import {
  getBusinessDetail, updateBusinessDetail, getBusinessHistory,
  addComment, uploadAttachment, deleteAttachment
} from '@/api/business-details'
import { getUsers } from '@/api/users'
import { useUserStore } from '@/stores/user'
import {
  formatNumber, formatPercent, formatDate, formatDateShort, formatFileSize,
  fromNow, getSeverityInfo, getStatusInfo, getCategoryInfo
} from '@/utils'
import {
  TrendCharts, Refresh, View, UserFilled, Search, InfoFilled, Promotion, Warning,
  Document, UploadFilled, User, ArrowRight, List, Flag, Clock, Calendar
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const detail = ref<any>(null)
const events = ref<any[]>([])
const businessDetail = ref<any>(null)
const activeTab = ref('business')
const trendRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

const statusValue = ref('')
const severityValue = ref('')

const summaryText = ref('')
const savingSummary = ref(false)

const businessForm = reactive({
  businessContext: '',
  impactScope: '',
  relatedBusiness: '',
  rootCauseAnalysis: '',
  solution: '',
  preventionMeasure: '',
  reviewStatus: 'not_started' as const
})
const savingBusiness = ref(false)

const commentText = ref('')
const submittingComment = ref(false)

const showAssignDialog = ref(false)
const assignUserId = ref('')
const assigning = ref(false)
const operators = ref<any[]>([])

async function loadAll() {
  loading.value = true
  try {
    const id = route.params.id as string
    const [d, ev, bd] = await Promise.all([
      getAnomalyDetail(id),
      getAnomalyEvents(id),
      getBusinessDetail(id)
    ])
    detail.value = d
    events.value = ev
    businessDetail.value = bd
    statusValue.value = d.status
    severityValue.value = d.severity
    summaryText.value = d.summary || ''
    Object.assign(businessForm, {
      businessContext: bd.businessContext || '',
      impactScope: bd.impactScope || '',
      relatedBusiness: bd.relatedBusiness || '',
      rootCauseAnalysis: bd.rootCauseAnalysis || '',
      solution: bd.solution || '',
      preventionMeasure: bd.preventionMeasure || '',
      reviewStatus: bd.reviewStatus || 'not_started'
    })
    await nextTick()
    initTrendChart()
  } finally {
    loading.value = false
  }
}

function initTrendChart() {
  if (!trendRef.value || !detail.value?.trendData?.length) return
  trendChart = echarts.init(trendRef.value)
  const data = detail.value.trendData
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        const p2 = params[1]
        const p3 = params[2]
        return `${p.axisValue}<br/>
          实际: ${p.data?.value ?? p.data}<br/>
          预期: ${p2.data?.value ?? p2.data}<br/>
          偏离: ${p3.data}%`
      }
    },
    legend: { data: ['实际值', '预期值', '偏离度'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map((d: any) => formatDateShort(d.timestamp)),
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: [
      {
        type: 'value', name: '数值',
        splitLine: { lineStyle: { color: '#f0f2f5' } },
        axisLabel: { color: '#909399' }
      },
      {
        type: 'value', name: '偏离%', position: 'right',
        axisLabel: { color: '#909399', formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '实际值',
        data: data.map((d: any) => d.value),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#409eff' },
        lineStyle: { width: 3, color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.25)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' }
          ])
        }
      },
      {
        name: '预期值',
        data: data.map((d: any) => d.expected),
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: { color: '#909399' },
        lineStyle: { width: 2, type: 'dashed', color: '#909399' }
      },
      {
        name: '偏离度',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d: any) => d.deviation),
        barWidth: 10,
        itemStyle: {
          color: (params: any) => params.value >= 0 ? 'rgba(103,194,58,0.6)' : 'rgba(245,108,108,0.6)'
        }
      }
    ]
  })
}

async function onStatusChange(val: string) {
  await updateAnomaly(route.params.id as string, { status: val })
  detail.value.status = val
  ElMessage.success('状态已更新')
}

async function onSeverityChange(val: string) {
  await updateAnomaly(route.params.id as string, { severity: val })
  detail.value.severity = val
  ElMessage.success('严重程度已更新')
}

async function saveSummary() {
  if (!summaryText.value.trim()) {
    ElMessage.warning('请填写摘要内容')
    return
  }
  savingSummary.value = true
  try {
    await updateAnomaly(route.params.id as string, { summary: summaryText.value })
    detail.value.summary = summaryText.value
    ElMessage.success('摘要已保存')
  } finally {
    savingSummary.value = false
  }
}

async function saveBusiness() {
  savingBusiness.value = true
  try {
    const id = route.params.id as string
    await updateBusinessDetail(id, { ...businessForm })
    Object.assign(businessDetail.value, businessForm)
    ElMessage.success('业务明细已保存')
    loadAll()
  } finally {
    savingBusiness.value = false
  }
}

async function submitComment() {
  if (!commentText.value.trim()) return
  submittingComment.value = true
  try {
    await addComment(route.params.id as string, { content: commentText.value })
    commentText.value = ''
    loadAll()
    ElMessage.success('评论已发布')
  } finally {
    submittingComment.value = false
  }
}

async function handleUpload(file: File) {
  try {
    await uploadAttachment(route.params.id as string, file)
    ElMessage.success('附件上传成功')
    loadAll()
  } catch (e) {}
  return false
}

async function deleteAtt(id: string) {
  try {
    await deleteAttachment(route.params.id as string, id)
    ElMessage.success('附件已删除')
    loadAll()
  } catch (e) {}
}

async function loadOperators() {
  try {
    const res = await getUsers({ pageSize: 200 })
    operators.value = res.list
  } catch (e) {}
}

async function assignUser() {
  if (!assignUserId.value) {
    ElMessage.warning('请选择处理人')
    return
  }
  assigning.value = true
  try {
    await updateAnomaly(route.params.id as string, { assigneeId: assignUserId.value })
    ElMessage.success('已分配处理人')
    showAssignDialog.value = false
    loadAll()
  } finally {
    assigning.value = false
  }
}

function formatHistoryValue(v: any) {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  const statusMap: Record<string, string> = {
    pending: '待处理', processing: '处理中', resolved: '已解决', ignored: '已忽略',
    critical: '严重', warning: '警告', info: '提示'
  }
  return statusMap[v] || String(v)
}

onMounted(() => {
  loadAll()
  loadOperators()
  window.addEventListener('resize', () => trendChart?.resize())
})
</script>

<style lang="scss" scoped>
.detail-wrapper {
  max-width: 1440px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 16px;

  .header-top {
    display: flex;
    justify-content: space-between;
    gap: 20px;

    .left {
      flex: 1;
      min-width: 0;
    }

    .right {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
  }

  .crumb {
    margin-bottom: 12px;
    :deep(.el-breadcrumb__inner) {
      cursor: pointer;
    }
  }

  .detail-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    color: $text-primary;
  }

  .meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: $text-secondary;

    .time, .views {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .views { margin-left: 10px; }
  }
}

.trend-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border-light;

  .stat {
    text-align: center;
    .label {
      font-size: 12px;
      color: $text-secondary;
      display: block;
      margin-bottom: 4px;
    }
    .value {
      font-size: 22px;
      font-weight: 700;
      color: $text-primary;

      &.current { color: $primary-color; }
      &.up { color: $success-color; font-size: 18px; }
      &.down { color: $danger-color; font-size: 18px; }
    }
  }
}

.cause-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cause-item {
  padding: 16px;
  border: 1px solid $border-light;
  border-radius: 8px;
  background: #fafbfc;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .cause-header {
    @include flex-between;
    margin-bottom: 10px;

    .cause-type {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: $text-primary;
      font-size: 15px;
    }

    .confidence {
      display: flex;
      align-items: center;
      gap: 8px;

      .conf-label {
        font-size: 12px;
        color: $text-secondary;
      }
      .conf-val {
        font-weight: 600;
        color: $primary-color;
        font-size: 13px;
      }
    }
  }

  .cause-desc, .cause-evidence {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: $text-regular;
    margin-top: 6px;
  }
}

.summary-content {
  .summary-block {
    margin-bottom: 14px;
    .sum-label {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 4px;
    }
    p {
      margin: 0;
      line-height: 1.7;
      color: $text-regular;
      white-space: pre-wrap;
    }
  }
}

.comment-input {
  display: flex;
  gap: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;

  .comment-body {
    flex: 1;
    background: #fafbfc;
    border-radius: 8px;
    padding: 12px 14px;

    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      .comment-user {
        font-weight: 600;
        color: $text-primary;
        font-size: 13px;
      }
      .comment-time {
        font-size: 12px;
        color: $text-secondary;
      }
    }

    .comment-content {
      color: $text-regular;
      line-height: 1.7;
      white-space: pre-wrap;
    }
  }
}

.history-card {
  padding: 12px 16px;

  .history-operator {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .history-field {
    margin-bottom: 8px;
    font-size: 13px;
  }

  .history-values {
    display: flex;
    align-items: flex-start;
    font-size: 13px;

    .old-value, .new-value {
      background: #f5f7fa;
      padding: 4px 8px;
      border-radius: 4px;
      max-width: 200px;
      span:first-child { color: $text-secondary; }
    }
    .new-value {
      background: #ecf5ff;
    }
  }
}

.event-item {
  .event-desc {
    font-size: 13px;
    color: $text-regular;
    b {
      color: $text-primary;
    }
  }
  .event-type {
    margin-top: 4px;
  }
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .review-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $text-regular;

    .el-icon {
      color: $primary-color;
    }
  }
}

.empty-summary {
  .el-button {
    width: 100%;
  }
}
</style>
