<template>
  <div class="ticket-detail-wrapper">
    <n-spin :show="loading">
    <n-space vertical :size="16" style="padding: 20px;">
      <n-card v-if="ticket">
        <template #header>
          <div class="ticket-header">
            <div class="header-left">
              <n-button text size="small" @click="goBack">
                ← 返回
              </n-button>
              <h2 class="ticket-title">{{ ticket.title }}</h2>
              <n-tag :type="statusTagType(ticket.status)" size="small" round>
                {{ statusLabel(ticket.status) }}
              </n-tag>
              <n-tag v-if="ticket.is_duplicate" type="warning" size="small" round>
                重复工单
              </n-tag>
            </div>
            <div class="header-right" v-if="!auth.isCustomer">
              <n-space>
                <n-button
                  v-if="ticket.status === 'pending'"
                  type="primary"
                  size="small"
                  :loading="statusLoading"
                  @click="changeStatus('processing')"
                >
                  开始处理
                </n-button>
                <n-button
                  v-if="ticket.status === 'processing'"
                  type="success"
                  size="small"
                  :loading="statusLoading"
                  @click="changeStatus('resolved')"
                >
                  标记已解决
                </n-button>
                <n-button
                  v-if="ticket.status !== 'closed'"
                  type="default"
                  size="small"
                  :loading="statusLoading"
                  @click="changeStatus('closed')"
                >
                  关闭工单
                </n-button>
              </n-space>
            </div>
          </div>
        </template>

        <n-descriptions :column="3" bordered size="small">
          <n-descriptions-item label="工单编号">
            #{{ ticket.id }}
          </n-descriptions-item>
          <n-descriptions-item label="优先级">
            <n-tag :type="priorityTagType(ticket.priority)" size="small">
              {{ priorityLabel(ticket.priority) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="分类">
            {{ ticket.category || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="创建人">
            {{ ticket.requester?.full_name || ticket.requester?.username || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="处理人">
            {{ ticket.assigned_agent?.full_name || ticket.assigned_agent?.username || '未分配' }}
          </n-descriptions-item>
          <n-descriptions-item label="风险等级">
            <n-tag v-if="ticket.risk_level" :type="riskTagType(ticket.risk_level)" size="small">
              {{ riskLabel(ticket.risk_level) }}
            </n-tag>
            <span v-else>-</span>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatDateTime(ticket.created_at) }}
          </n-descriptions-item>
          <n-descriptions-item label="响应时长">
            {{ formatDuration(ticket.response_time_seconds) }}
          </n-descriptions-item>
          <n-descriptions-item label="解决时长">
            {{ formatDuration(ticket.resolution_time_seconds) }}
          </n-descriptions-item>
          <n-descriptions-item label="SLA截止" :span="3">
            <n-space>
              <span :class="{ 'sla-overdue': isOverdue(ticket.sla_deadline) }">
                {{ formatDateTime(ticket.sla_deadline) }}
              </span>
              <n-tag
                v-if="isOverdue(ticket.sla_deadline)"
                type="error"
                size="small"
              >
                已超时
              </n-tag>
              <n-tag
                v-else-if="isNearDeadline(ticket.sla_deadline)"
                type="warning"
                size="small"
              >
                即将到期
              </n-tag>
            </n-space>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <n-card v-if="ticket" title="SLA 响应与超时统计" :bordered="true">
        <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen">
          <n-gi span="1 s:1 m:1 l:1 xl:1">
            <div class="stat-card stat-primary">
              <div class="stat-label">响应时长</div>
              <div class="stat-value">
                {{ ticket.first_response_at
                  ? formatDuration(ticket.response_time_seconds)
                  : ticket.status === 'pending' ? '待响应' : '-' }}
              </div>
              <div class="stat-sub">
                首响时间：{{ formatDateTime(ticket.first_response_at) }}
              </div>
            </div>
          </n-gi>
          <n-gi span="1 s:1 m:1 l:1 xl:1">
            <div class="stat-card" :class="isOverdue(ticket.sla_deadline) ? 'stat-error' : 'stat-success'">
              <div class="stat-label">SLA 状态</div>
              <div class="stat-value">
                {{ isOverdue(ticket.sla_deadline) ? '已超时' : ticket.status === 'resolved' || ticket.status === 'closed' ? '已达标' : isNearDeadline(ticket.sla_deadline) ? '即将到期' : '正常' }}
              </div>
              <div class="stat-sub">
                截止：{{ formatDateTime(ticket.sla_deadline) }}
                <span v-if="isOverdue(ticket.sla_deadline)" class="risk-tag">⚠️ 超时</span>
                <span v-else-if="isNearDeadline(ticket.sla_deadline)" class="warn-tag">临近</span>
                <n-tag v-if="ticket.has_overdue_risk" type="error" size="small" style="margin-left: 8px;">有风险</n-tag>
              </div>
            </div>
          </n-gi>
          <n-gi span="1 s:1 m:1 l:1 xl:1">
            <div class="stat-card stat-info">
              <div class="stat-label">解决时长</div>
              <div class="stat-value">
                {{ ticket.resolved_at
                  ? formatDuration(ticket.resolution_time_seconds)
                  : ticket.status === 'closed' || ticket.status === 'resolved' ? '无记录' : '处理中' }}
              </div>
              <div class="stat-sub">
                完成时间：{{ formatDateTime(ticket.resolved_at) }}
              </div>
            </div>
          </n-gi>
          <n-gi span="1 s:1 m:1 l:1 xl:1">
            <div class="stat-card stat-warn">
              <div class="stat-label">处理流转</div>
              <div class="stat-value small">
                创建：{{ formatDateTime(ticket.created_at) }}
              </div>
              <div class="stat-sub">
                处理人：{{ ticket.assigned_agent?.full_name || ticket.assigned_agent?.username || '未分配' }}
                <br />
                创建人：{{ ticket.requester?.full_name || ticket.requester?.username || '用户#' + ticket.created_by }}
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <n-tabs v-model:value="activeTab" type="line" animated v-if="ticket">
        <n-tab-pane name="detail" tab="详情">
          <n-space vertical :size="16">
            <n-card title="问题描述" :bordered="true">
              <div class="description-content">
                {{ ticket.description }}
              </div>
            </n-card>

            <n-card title="关联知识库文章" :bordered="true">
              <div v-if="ticket.kb_article || kbArticle">
                <n-space vertical :size="12">
                  <n-space>
                    <n-tag type="success" size="small">已关联</n-tag>
                    <a @click="navigateToKb((ticket.kb_article || kbArticle).id)" class="kb-link">
                      📄 {{ (ticket.kb_article || kbArticle).title }}
                    </a>
                    <n-tag type="info" size="small">
                      v{{ (ticket.kb_article || kbArticle).version || 1 }}
                    </n-tag>
                  </n-space>

                  <div v-if="ticket.kb_versions && ticket.kb_versions.length > 0">
                    <div class="subsection-title">版本历史引用（最近 {{ Math.min(5, ticket.kb_versions.length) }} 个版本）：</div>
                    <n-space vertical :size="8">
                      <div
                        v-for="ver in ticket.kb_versions"
                        :key="ver.id"
                        class="version-item"
                      >
                        <n-space align="center">
                          <n-tag size="small" type="info">v{{ ver.version }}</n-tag>
                          <span class="version-summary">
                            {{ ver.change_summary || '无变更说明' }}
                          </span>
                          <span class="version-meta">
                            用户 #{{ ver.changed_by || '-' }} ·
                            {{ formatDateTime(ver.created_at) }}
                          </span>
                        </n-space>
                      </div>
                    </n-space>
                  </div>
                </n-space>
              </div>
              <n-empty v-else description="暂无关联知识库文章" />
            </n-card>

            <n-card title="处理结果" :bordered="true">
              <div v-if="ticket.resolution_type || ticket.resolution_summary">
                <n-descriptions :column="1" size="small">
                  <n-descriptions-item label="解决方式">
                    {{ resolutionLabel(ticket.resolution_type) }}
                  </n-descriptions-item>
                  <n-descriptions-item label="处理总结">
                    <div class="resolution-summary">
                      {{ ticket.resolution_summary || '-' }}
                    </div>
                  </n-descriptions-item>
                </n-descriptions>
              </div>
              <n-empty v-else description="工单尚未处理完成" />
            </n-card>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="notes" tab="备注">
          <n-space vertical :size="16">
            <n-card title="新增备注" :bordered="true">
              <n-form :model="noteForm" label-placement="top">
                <n-form-item label="备注内容">
                  <n-input
                    v-model:value="noteForm.content"
                    type="textarea"
                    placeholder="请输入备注内容"
                    :rows="4"
                  />
                </n-form-item>
                <n-form-item v-if="!auth.isCustomer" label="备注类型">
                  <n-radio-group v-model:value="noteForm.is_internal">
                    <n-radio :value="true">
                      <n-tag type="warning" size="small">内部备注</n-tag>
                    </n-radio>
                    <n-radio :value="false">
                      <n-tag type="info" size="small">公开备注</n-tag>
                    </n-radio>
                  </n-radio-group>
                </n-form-item>
                <n-form-item>
                  <n-space>
                    <n-button
                      type="primary"
                      :loading="noteLoading"
                      :disabled="!noteForm.content.trim()"
                      @click="addNote"
                    >
                      提交备注
                    </n-button>
                  </n-space>
                </n-form-item>
              </n-form>
            </n-card>

            <n-card title="备注列表" :bordered="true">
              <n-space vertical :size="12" v-if="ticket.notes && ticket.notes.length > 0">
                <n-card
                  v-for="note in sortedNotes"
                  :key="note.id"
                  size="small"
                  :class="note.is_internal ? 'note-card internal' : 'note-card public'"
                >
                  <template #header>
                    <div class="note-header">
                      <n-space>
                        <n-avatar round size="small">
                          {{ getAvatarText(note.created_by) }}
                        </n-avatar>
                        <span class="note-author">用户 #{{ note.created_by }}</span>
                        <n-tag
                          :type="note.is_internal ? 'warning' : 'info'"
                          size="small"
                        >
                          {{ note.is_internal ? '内部' : '公开' }}
                        </n-tag>
                      </n-space>
                      <span class="note-time">{{ formatDateTime(note.created_at) }}</span>
                    </div>
                  </template>
                  <div class="note-content">{{ note.content }}</div>
                </n-card>
              </n-space>
              <n-empty v-else description="暂无备注记录" />
            </n-card>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="attachments" tab="附件">
          <n-space vertical :size="16">
            <n-card title="上传附件" :bordered="true">
              <n-upload
                :show-file-list="false"
                :custom-request="handleUpload"
                accept=""
                multiple
              >
                <n-button>
                  ☁️ 点击上传
                </n-button>
              </n-upload>
              <n-alert type="info" style="margin-top: 12px;">
                支持上传任意文件，单个文件最大 20MB
              </n-alert>
            </n-card>

            <n-card title="附件列表" :bordered="true">
              <n-space vertical :size="8" v-if="ticket.attachments && ticket.attachments.length > 0">
                <n-card v-for="att in ticket.attachments" :key="att.id" size="small" hoverable>
                  <div class="attachment-item">
                    <div class="attachment-info">
                      <span class="attachment-icon">📄</span>
                      <div>
                        <div class="attachment-name">{{ att.original_filename }}</div>
                        <div class="attachment-meta">
                          <span>{{ formatFileSize(att.file_size) }}</span>
                          <span> · </span>
                          <span>{{ formatDateTime(att.created_at) }}</span>
                        </div>
                      </div>
                    </div>
                    <n-button
                      size="small"
                      type="primary"
                      ghost
                      @click="downloadAttachment(att)"
                    >
                      ⬇️ 下载
                    </n-button>
                  </div>
                </n-card>
              </n-space>
              <n-empty v-else description="暂无附件" />
            </n-card>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="timeline" tab="时间线">
          <n-card title="工单时间线" :bordered="true">
            <n-timeline
              v-if="ticket.timeline_events && ticket.timeline_events.length > 0"
              :items="timelineItems"
              size="medium"
            />
            <n-empty v-else description="暂无时间线记录" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="feedback" tab="客户反馈">
          <n-card title="客户反馈记录" :bordered="true">
            <div v-if="ticket.feedback">
              <n-space vertical :size="16">
                <n-descriptions :column="2" bordered size="small">
                  <n-descriptions-item label="提交时间">
                    {{ formatDateTime(ticket.feedback.submitted_at) }}
                  </n-descriptions-item>
                  <n-descriptions-item label="审核状态">
                    <n-tag
                      :type="ticket.feedback.reviewed_at ? 'success' : 'warning'"
                      size="small"
                    >
                      {{ ticket.feedback.reviewed_at ? '已审核' : '待审核' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="满意度评分" :span="2">
                    <n-space>
                      <n-rate v-model:value="starRating" readonly count="5" />
                      <span class="star-count">{{ ticket.feedback.rating }} / 5</span>
                    </n-space>
                  </n-descriptions-item>
                  <n-descriptions-item label="客户留言" :span="2">
                    <div class="feedback-comment">
                      {{ ticket.feedback.comment || '客户未留言' }}
                    </div>
                  </n-descriptions-item>
                  <n-descriptions-item v-if="ticket.feedback.reviewed_at" label="审核人">
                    用户 #{{ ticket.feedback.reviewed_by }}
                  </n-descriptions-item>
                  <n-descriptions-item v-if="ticket.feedback.reviewed_at" label="审核时间">
                    {{ formatDateTime(ticket.feedback.reviewed_at) }}
                  </n-descriptions-item>
                  <n-descriptions-item v-if="ticket.feedback.review_note" label="审核备注" :span="2">
                    <div class="review-note">
                      {{ ticket.feedback.review_note }}
                    </div>
                  </n-descriptions-item>
                </n-descriptions>
              </n-space>
            </div>
            <n-empty v-else description="该工单暂无客户反馈记录" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="risk" tab="风险样本">
          <n-card title="风险检测记录" :bordered="true">
            <n-space vertical :size="12" v-if="ticket.risk_samples && ticket.risk_samples.length > 0">
              <n-card
                v-for="risk in ticket.risk_samples"
                :key="risk.id"
                size="small"
                hoverable
                :class="`risk-card risk-${risk.risk_level}`"
              >
                <template #header>
                  <div class="risk-header">
                    <n-space>
                      <n-tag
                        :type="riskTagType(risk.risk_level)"
                        size="small"
                      >
                        {{ riskLabel(risk.risk_level) }}
                      </n-tag>
                      <n-tag v-if="risk.risk_type" size="small" type="info">
                        {{ risk.risk_type }}
                      </n-tag>
                      <n-tag
                        :type="risk.is_verified ? 'success' : 'warning'"
                        size="small"
                      >
                        {{ risk.is_verified ? '已确认' : '待确认' }}
                      </n-tag>
                    </n-space>
                    <span class="risk-time">{{ formatDateTime(risk.detected_at) }}</span>
                  </div>
                </template>
                <n-space vertical :size="8">
                  <div class="risk-description" v-if="risk.description">
                    {{ risk.description }}
                  </div>
                  <n-space wrap :size="16" class="risk-meta">
                    <span>检测人：用户 #{{ risk.detected_by || '系统自动检测' }}</span>
                    <span v-if="risk.is_verified">
                      审核人：用户 #{{ risk.verified_by }} · {{ formatDateTime(risk.verified_at) }}
                    </span>
                  </n-space>
                  <div v-if="risk.mitigation_note" class="mitigation-note">
                    📌 缓解措施：{{ risk.mitigation_note }}
                  </div>
                </n-space>
              </n-card>
            </n-space>
            <n-empty v-else description="该工单暂无风险检测记录" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="similar" tab="相似工单">
          <n-space vertical :size="16">
            <n-spin :show="similarLoading">
            <n-card title="相似工单推荐" :bordered="true">
              <n-space vertical :size="12" v-if="similarTickets.length > 0">
                <n-card
                  v-for="sim in similarTickets"
                  :key="sim.similar_ticket_id"
                  size="small"
                  hoverable
                >
                  <div class="similar-item">
                    <div class="similar-info">
                      <div class="similar-header">
                        <a
                          class="similar-title"
                          @click="navigateToTicket(sim.similar_ticket_id)"
                        >
                          #{{ sim.similar_ticket_id }} {{ sim.ticket_title }}
                        </a>
                        <n-tag type="info" size="small">
                          相似度 {{ (sim.similarity_score * 100).toFixed(0) }}%
                        </n-tag>
                      </div>
                      <div class="similar-meta">
                        计算时间: {{ formatDateTime(sim.calculated_at) }}
                      </div>
                    </div>
                    <div v-if="!auth.isCustomer">
                      <n-popconfirm
                        @positive-click="markDuplicate(sim.similar_ticket_id)"
                        positive-text="确认"
                        negative-text="取消"
                      >
                        <template #trigger>
                          <n-button size="small" type="warning" ghost>
                            📋 标记重复
                          </n-button>
                        </template>
                        确认将当前工单标记为 #{{ sim.similar_ticket_id }} 的重复工单？此操作会关闭当前工单。
                      </n-popconfirm>
                    </div>
                  </div>
                </n-card>
              </n-space>
              <n-empty v-else description="暂无相似工单" />
            </n-card>
            </n-spin>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-space>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UploadCustomRequestOptions, TimelineItem } from 'naive-ui'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { get, post, put, upload, baseURL } = useApi()
const auth = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const loading = ref(true)
const statusLoading = ref(false)
const noteLoading = ref(false)
const similarLoading = ref(false)
const activeTab = ref('detail')
const ticket = ref<any>(null)
const kbArticle = ref<any>(null)
const similarTickets = ref<any[]>([])

const noteForm = reactive({
  content: '',
  is_internal: true
})

const ticketId = computed(() => Number(route.params.id))

const starRating = computed(() => {
  return ticket.value?.feedback?.rating || 0
})

const sortedNotes = computed(() => {
  if (!ticket.value?.notes) return []
  return [...ticket.value.notes].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const timelineItems = computed<TimelineItem[]>(() => {
  if (!ticket.value?.timeline_events) return []
  return [...ticket.value.timeline_events]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((event: any) => ({
      title: getTimelineTitle(event),
      content: event.description,
      time: formatDateTime(event.created_at),
      type: getTimelineType(event.event_type)
    }))
})

function getTimelineTitle(event: any): string {
  const typeMap: Record<string, string> = {
    created: '工单创建',
    updated: '工单更新',
    note_added: '添加备注',
    attachment_added: '上传附件',
    marked_duplicate: '标记重复',
    status_changed: '状态变更',
    assigned: '分配工单'
  }
  return typeMap[event.event_type] || event.event_type
}

function getTimelineType(eventType: string): any {
  const typeMap: Record<string, string> = {
    created: 'success',
    updated: 'default',
    note_added: 'info',
    attachment_added: 'info',
    marked_duplicate: 'warning',
    status_changed: 'primary',
    assigned: 'primary'
  }
  return typeMap[eventType] || 'default'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function statusTagType(status: string): any {
  const map: Record<string, string> = {
    pending: 'default',
    processing: 'info',
    resolved: 'success',
    closed: 'error'
  }
  return map[status] || 'default'
}

function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[priority] || priority
}

function priorityTagType(priority: string): any {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'error'
  }
  return map[priority] || 'default'
}

function riskLabel(risk: string): string {
  const map: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '严重风险'
  }
  return map[risk] || risk
}

function riskTagType(risk: string): any {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    critical: 'error'
  }
  return map[risk] || 'default'
}

function resolutionLabel(type: string | null): string {
  if (!type) return '-'
  const map: Record<string, string> = {
    kb_solution: '知识库方案',
    manual: '手动处理',
    escalated: '已升级',
    other: '其他'
  }
  return map[type] || type
}

function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '-'
  const d = new Date(dt)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}小时${m}分${s}秒`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

function isOverdue(dt: string | null | undefined): boolean {
  if (!dt) return false
  return new Date(dt) < new Date()
}

function isNearDeadline(dt: string | null | undefined): boolean {
  if (!dt) return false
  const diff = new Date(dt).getTime() - new Date().getTime()
  return diff > 0 && diff < 2 * 60 * 60 * 1000
}

function getAvatarText(userId: number): string {
  return 'U' + (userId % 10)
}

async function fetchTicket() {
  loading.value = true
  try {
    ticket.value = await get<any>(`/tickets/${ticketId.value}`)
    if (ticket.value.kb_article) {
      kbArticle.value = ticket.value.kb_article
    } else if (ticket.value.kb_article_id) {
      try {
        kbArticle.value = await get<any>(`/knowledge-base/articles/${ticket.value.kb_article_id}`)
      } catch {
        kbArticle.value = { id: ticket.value.kb_article_id, title: `文章 #${ticket.value.kb_article_id}` }
      }
    }
  } catch (e: any) {
    message.error(e.message || '获取工单详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchSimilar() {
  similarLoading.value = true
  try {
    similarTickets.value = await get<any[]>(`/tickets/${ticketId.value}/similar`)
  } catch (e: any) {
    message.error(e.message || '获取相似工单失败')
  } finally {
    similarLoading.value = false
  }
}

async function changeStatus(newStatus: string) {
  if (auth.isCustomer) {
    message.warning('您没有权限修改工单状态')
    return
  }
  statusLoading.value = true
  try {
    await put<any>(`/tickets/${ticketId.value}`, { status: newStatus })
    message.success(`状态已更新为「${statusLabel(newStatus)}」`)
    await fetchTicket()
  } catch (e: any) {
    message.error(e.message || '状态更新失败')
  } finally {
    statusLoading.value = false
  }
}

async function addNote() {
  if (!noteForm.content.trim()) return
  noteLoading.value = true
  try {
    const note = await post<any>(`/tickets/${ticketId.value}/notes`, {
      content: noteForm.content.trim(),
      is_internal: auth.isCustomer ? false : noteForm.is_internal
    })
    message.success('备注添加成功')
    noteForm.content = ''
    if (!ticket.value.notes) ticket.value.notes = []
    ticket.value.notes.push(note)
  } catch (e: any) {
    message.error(e.message || '添加备注失败')
  } finally {
    noteLoading.value = false
  }
}

async function handleUpload(options: UploadCustomRequestOptions) {
  const file = options.file.file as File
  if (!file) return
  try {
    const att = await upload<any>(`/tickets/${ticketId.value}/attachments`, file)
    message.success(`附件「${att.original_filename}」上传成功`)
    if (!ticket.value.attachments) ticket.value.attachments = []
    ticket.value.attachments.push(att)
    options.onFinish()
  } catch (e: any) {
    message.error(e.message || '上传失败')
    options.onError()
  }
}

async function downloadAttachment(att: any) {
  try {
    const token = auth.token
    const url = `${baseURL}/tickets/${ticketId.value}/attachments/${att.id}/download`
    const resp = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!resp.ok) {
      message.error('下载失败：权限不足或文件不存在')
      return
    }
    const blob = await resp.blob()
    const objUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = att.original_filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(objUrl)
  } catch (e: any) {
    message.error(e.message || '下载失败')
  }
}

async function markDuplicate(duplicateOfId: number) {
  if (auth.isCustomer) {
    message.warning('您没有权限标记重复工单')
    return
  }
  try {
    const url = `/tickets/${ticketId.value}/mark-duplicate?duplicate_of_id=${duplicateOfId}`
    await post<any>(url)
    message.success('已标记为重复工单')
    await fetchTicket()
  } catch (e: any) {
    message.error(e.message || '标记失败')
  }
}

function goBack() {
  router.push('/tickets')
}

function navigateToTicket(id: number) {
  router.push(`/tickets/${id}`)
}

function navigateToKb(id: number) {
  router.push(`/knowledge-base/${id}`)
}

onMounted(() => {
  fetchTicket()
  fetchSimilar()
})
</script>

<style scoped lang="scss">
.ticket-detail-wrapper {
  min-height: 100vh;
  background-color: #f2f3f5;
}

.ticket-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ticket-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1d2129;
  }

  .header-right {
    flex-shrink: 0;
  }
}

.description-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: #4e5969;
  padding: 8px 0;
}

.resolution-summary {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.sla-overdue {
  color: #d03050;
  font-weight: 500;
}

.kb-link {
  color: #2080f0;
  cursor: pointer;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.note-card {
  &.internal {
    border-left: 4px solid #f0a020;
  }
  &.public {
    border-left: 4px solid #2080f0;
  }
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;

  .note-author {
    font-weight: 500;
    color: #1d2129;
  }

  .note-time {
    font-size: 12px;
    color: #86909c;
  }
}

.note-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #4e5969;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .attachment-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .attachment-icon {
    color: #2080f0;
    flex-shrink: 0;
    font-size: 24px;
  }

  .attachment-name {
    font-weight: 500;
    color: #1d2129;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attachment-meta {
    font-size: 12px;
    color: #86909c;
    margin-top: 2px;
  }
}

.similar-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  .similar-info {
    flex: 1;
    min-width: 0;
  }

  .similar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  .similar-title {
    font-weight: 500;
    color: #2080f0;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 500px;
    &:hover {
      text-decoration: underline;
    }
  }

  .similar-meta {
    font-size: 12px;
    color: #86909c;
  }
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #c9cdd4;
  background: #fafbfc;

  .stat-label {
    font-size: 12px;
    color: #86909c;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
    margin-bottom: 6px;
    &.small {
      font-size: 13px;
      font-weight: 500;
      color: #4e5969;
    }
  }

  .stat-sub {
    font-size: 12px;
    color: #86909c;
    line-height: 1.6;
  }

  &.stat-primary {
    border-left-color: #2080f0;
    background: #f2f7ff;
    .stat-value { color: #2080f0; }
  }
  &.stat-success {
    border-left-color: #00b42a;
    background: #f0ffed;
    .stat-value { color: #00b42a; }
  }
  &.stat-error {
    border-left-color: #f53f3f;
    background: #fff1f0;
    .stat-value { color: #f53f3f; }
  }
  &.stat-info {
    border-left-color: #722ed1;
    background: #f9f0ff;
    .stat-value { color: #722ed1; }
  }
  &.stat-warn {
    border-left-color: #ff7d00;
    background: #fff7e8;
    .stat-value { color: #ff7d00; }
  }
}

.risk-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 0 8px;
  color: #f53f3f;
  font-weight: 500;
  font-size: 12px;
}
.warn-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 0 8px;
  color: #ff7d00;
  font-weight: 500;
  font-size: 12px;
}

.kb-link {
  color: #2080f0;
  cursor: pointer;
  font-weight: 500;
  &:hover { text-decoration: underline; }
}

.subsection-title {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
  margin: 8px 0;
  padding-left: 8px;
  border-left: 3px solid #2080f0;
}

.version-item {
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 6px;
  transition: background 0.15s;
  &:hover { background: #f2f7ff; }

  .version-summary {
    flex: 1;
    font-size: 13px;
    color: #1d2129;
  }
  .version-meta {
    font-size: 12px;
    color: #86909c;
    white-space: nowrap;
  }
}

.risk-card {
  border-left: 3px solid #c9cdd4;
  &.risk-high { border-left-color: #ff7d00; }
  &.risk-critical { border-left-color: #f53f3f; }
  &.risk-medium { border-left-color: #2080f0; }
  &.risk-low { border-left-color: #00b42a; }
}

.risk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  .risk-time {
    font-size: 12px;
    color: #86909c;
  }
}
.risk-description {
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
}
.risk-meta {
  font-size: 12px;
  color: #86909c;
}
.mitigation-note {
  padding: 8px 12px;
  background: #f0ffed;
  border-radius: 6px;
  font-size: 13px;
  color: #00b42a;
  border: 1px dashed #00b42a;
}

.feedback-comment {
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 6px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
  min-height: 32px;
}
.review-note {
  padding: 8px 12px;
  background: #f2f7ff;
  border-radius: 6px;
  font-size: 13px;
  color: #2080f0;
  border: 1px dashed #2080f0;
}
.star-count {
  font-size: 13px;
  color: #86909c;
}
</style>
