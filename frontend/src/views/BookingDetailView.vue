<template>
  <div class="page-container">
    <div v-loading="loading" v-if="booking.id">
      <div class="page-header">
        <div>
          <h2 class="page-title">
            预约详情
            <el-tag size="small" style="margin-left:10px" :type="tagType">{{ booking.booking_no }}</el-tag>
          </h2>
          <div style="margin-top:6px;display:flex;gap:16px;font-size:13px;color:#909399">
            <span>创建于 {{ formatTime(booking.created_at) }}</span>
            <span v-if="booking.change_count">已变更 {{ booking.change_count }} 次</span>
            <span v-if="booking.last_changed_at">最近变更 {{ formatTime(booking.last_changed_at) }}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <el-button @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button type="primary">
              <el-icon><Operation /></el-icon> 操作 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="arrive" v-if="['pending','confirmed'].includes(booking.status)">到店确认</el-dropdown-item>
                <el-dropdown-item command="complete" v-if="booking.status === 'arrived'">服务完成</el-dropdown-item>
                <el-dropdown-item command="pay" v-if="booking.payment_status !== 'paid'">标记已支付</el-dropdown-item>
                <el-dropdown-item command="noshow" v-if="!booking.is_no_show" divided>标记爽约</el-dropdown-item>
                <el-dropdown-item command="cancel" v-if="['pending','confirmed'].includes(booking.status)">取消预约</el-dropdown-item>
                <el-dropdown-item command="edit" divided>编辑预约</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-main">
          <div class="section-card">
            <div class="card-header"><h3 class="card-title">基本信息</h3></div>
            <div class="card-body info-grid">
              <div class="info-block customer">
                <div class="info-title">客户信息</div>
                <div class="customer-card">
                  <el-avatar :size="48" style="background:#e6f7f3;color:#2ab99f;font-size:18px">
                    {{ booking.customer?.name?.[0] }}
                  </el-avatar>
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="customer-name">{{ booking.customer?.name }}</span>
                      <span v-if="booking.customer?.gender" class="info-tag">{{ booking.customer?.gender }}</span>
                      <span v-if="booking.customer?.age" class="info-tag">{{ booking.customer?.age }}岁</span>
                      <el-tag
                        :class="['no-show-rate-tag', (booking.customer?.no_show_rate || 0) >= 0.3 ? 'danger' : (booking.customer?.no_show_rate || 0) >= 0.15 ? 'warn' : 'ok']"
                        size="small" effect="light"
                      >
                        爽约率 {{ ((booking.customer?.no_show_rate || 0) * 100).toFixed(1) }}%
                        ({{ booking.customer?.no_show_count || 0 }}/{{ booking.customer?.total_bookings || 0 }})
                      </el-tag>
                    </div>
                    <div style="margin-top:6px;display:flex;gap:18px;color:#606266;font-size:13px">
                      <span><el-icon><Phone /></el-icon> {{ booking.customer?.phone }}</span>
                      <span v-if="booking.customer?.total_bookings">历史预约 {{ booking.customer?.total_bookings }} 次</span>
                    </div>
                    <div v-if="booking.customer?.medical_history" style="margin-top:8px;padding:8px 12px;background:#fdf6ec;border-radius:6px;font-size:12px;color:#e6a23c">
                      <el-icon><WarningFilled /></el-icon> 病史：{{ booking.customer?.medical_history }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="info-block">
                <div class="info-title">预约信息</div>
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="服务项目">{{ booking.service?.name }}</el-descriptions-item>
                  <el-descriptions-item label="服务时长">{{ booking.service?.duration_minutes || 30 }} 分钟</el-descriptions-item>
                  <el-descriptions-item label="服务人员">
                    <span>{{ booking.staff?.name }}</span>
                    <el-tag size="small" style="margin-left:6px" effect="plain">
                      {{ booking.staff?.title || (booking.staff?.type === 'doctor' ? '医生' : '技师') }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="预约来源">{{ sourceText(booking.source) }}</el-descriptions-item>
                  <el-descriptions-item label="预约日期" :span="2">
                    <span style="font-weight:600;font-size:15px">{{ booking.booking_date }}</span>
                    <span style="margin-left:12px;color:#2ab99f;font-weight:600;font-size:15px">{{ booking.start_time }} - {{ booking.end_time }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <span :class="['status-tag', 'status-' + booking.status]">{{ statusText(booking.status) }}</span>
                    <el-tag v-if="booking.is_no_show" type="danger" size="small" style="margin-left:6px">爽约</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="支付状态">
                    <el-tag v-if="booking.payment_status === 'paid'" type="success">已支付</el-tag>
                    <el-tag v-else-if="booking.payment_status === 'failed'" type="danger">支付失败</el-tag>
                    <el-tag v-else type="info" effect="plain">未支付</el-tag>
                    <span v-if="booking.paid_at" style="margin-left:8px;font-size:12px;color:#909399">{{ formatTime(booking.paid_at) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="预约金额" :span="2">
                    <span style="font-size:20px;font-weight:700;color:#2ab99f">¥{{ Number(booking.amount).toFixed(2) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="预约备注" :span="2" v-if="booking.remark">
                    {{ booking.remark }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="tabs-wrap">
              <el-tabs v-model="activeTab" type="card">
                <el-tab-pane label="备注记录" name="notes">
                  <div class="tab-body">
                    <div class="note-input">
                      <el-input v-model="newNote" type="textarea" :rows="2" placeholder="添加新备注..." maxlength="500" show-word-limit />
                      <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
                        <el-select v-model="newNoteType" size="default" style="width:140px">
                          <el-option label="普通备注" value="normal" />
                          <el-option label="重要" value="important" />
                          <el-option label="内部" value="internal" />
                        </el-select>
                        <el-button type="primary" :disabled="!newNote.trim()" :loading="noteSubmitting" @click="submitNote">
                          <el-icon><Plus /></el-icon> 提交备注
                        </el-button>
                      </div>
                    </div>
                    <div class="note-list">
                      <div v-if="notes.length === 0" class="empty-hint">暂无备注记录</div>
                      <div v-for="n in notes" :key="n.id" :class="['note-item', 'note-' + n.type]">
                        <el-avatar :size="32" style="background:#ecf5ff;color:#409eff">
                          {{ n.creator?.real_name?.[0] || 'U' }}
                        </el-avatar>
                        <div class="note-body">
                          <div class="note-head">
                            <span class="note-author">{{ n.creator?.real_name || '系统' }}</span>
                            <el-tag v-if="n.type !== 'normal'" size="small" effect="light" :type="n.type === 'important' ? 'danger' : 'warning'">
                              {{ n.type === 'important' ? '重要' : '内部' }}
                            </el-tag>
                            <span class="note-time">{{ formatTime(n.created_at) }}</span>
                          </div>
                          <div class="note-content">{{ n.content }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="附件管理" name="attachments">
                  <div class="tab-body">
                    <el-upload
                      drag
                      :auto-upload="false"
                      :on-change="handleFile"
                      :show-file-list="false"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                    >
                      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                      <template #tip>
                        <div class="el-upload__tip" style="margin-top:8px">
                          支持图片、PDF、Office文档，单文件不超过10MB
                        </div>
                      </template>
                    </el-upload>

                    <div class="attachments-list">
                      <div v-if="attachments.length === 0" class="empty-hint">暂无附件</div>
                      <div v-for="a in attachments" :key="a.id" class="attach-item">
                        <div class="attach-icon">
                          <el-icon :size="28"><Document /></el-icon>
                        </div>
                        <div class="attach-info">
                          <div class="attach-name">{{ a.file_name }}</div>
                          <div class="attach-meta">
                            {{ formatSize(a.file_size) }} ·
                            {{ a.uploader?.real_name || '系统' }} ·
                            {{ formatTime(a.created_at) }}
                          </div>
                        </div>
                        <div class="attach-actions">
                          <el-button link type="primary" size="small">下载</el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="修改历史" name="history">
                  <div class="tab-body">
                    <div v-if="history.length === 0" class="empty-hint">暂无修改记录</div>
                    <el-timeline v-else>
                      <el-timeline-item
                        v-for="h in history"
                        :key="h.id"
                        :timestamp="formatTime(h.created_at)"
                        :type="timelineType(h.field_name)"
                      >
                        <div class="hist-card">
                          <div class="hist-head">
                            <el-avatar :size="28" style="background:#f0f2f5;color:#606266;font-size:12px">
                              {{ h.changer?.real_name?.[0] || 'S' }}
                            </el-avatar>
                            <div>
                              <span style="font-weight:500;margin-right:8px">{{ h.changer?.real_name || '系统' }}</span>
                              修改了 <strong>{{ fieldNameText(h.field_name) }}</strong>
                            </div>
                          </div>
                          <div class="hist-detail">
                            <div class="hist-old">
                              <span class="label">旧值</span>
                              <span class="value">{{ h.old_value || '(空)' }}</span>
                            </div>
                            <el-icon style="margin:0 8px;color:#c0c4cc"><Right /></el-icon>
                            <div class="hist-new">
                              <span class="label">新值</span>
                              <span class="value">{{ h.new_value || '(空)' }}</span>
                            </div>
                          </div>
                          <div v-if="h.change_reason" class="hist-reason">
                            <el-icon><ChatDotRound /></el-icon> {{ h.change_reason }}
                          </div>
                        </div>
                      </el-timeline-item>
                    </el-timeline>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>

        <div class="detail-aside">
          <div class="section-card">
            <div class="card-header"><h3 class="card-title">时间线</h3></div>
            <div class="card-body">
              <el-steps direction="vertical" :active="stepIndex" finish-status="success">
                <el-step title="预约创建" :description="formatTime(booking.created_at)" />
                <el-step title="预约确认" :description="booking.status !== 'pending' ? '已确认' : '待确认'" />
                <el-step title="客户到店" :description="booking.arrived_at ? formatTime(booking.arrived_at) : (booking.status === 'cancelled' ? '已取消' : '待进行')" />
                <el-step title="服务完成" :description="booking.completed_at ? formatTime(booking.completed_at) : (booking.status === 'cancelled' ? '-' : '待进行')" />
              </el-steps>
            </div>
          </div>

          <div class="section-card" style="margin-top:16px">
            <div class="card-header"><h3 class="card-title">快速操作</h3></div>
            <div class="card-body quick-actions">
              <el-button type="success" @click="handleStatus('arrived')" v-if="['pending','confirmed'].includes(booking.status)">
                <el-icon><CircleCheck /></el-icon> 确认到店
              </el-button>
              <el-button type="primary" @click="handleStatus('completed')" v-if="booking.status === 'arrived'">
                <el-icon><Finished /></el-icon> 服务完成
              </el-button>
              <el-button type="warning" @click="handleStatus('cancelled')" v-if="['pending','confirmed'].includes(booking.status)">
                <el-icon><Close /></el-icon> 取消预约
              </el-button>
              <el-button @click="activeTab = 'notes'">
                <el-icon><EditPen /></el-icon> 添加备注
              </el-button>
              <el-button @click="activeTab = 'attachments'">
                <el-icon><Paperclip /></el-icon> 上传附件
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Operation, ArrowDown, Phone, WarningFilled, Plus,
  UploadFilled, Document, Right, ChatDotRound, CircleCheck, Finished,
  Close, EditPen, Paperclip
} from '@element-plus/icons-vue'
import {
  getBookingDetail, updateBookingStatus, addBookingNote,
  getBookingNotes, uploadAttachment, getBookingAttachments, getBookingHistory
} from '@/api/booking'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const noteSubmitting = ref(false)
const activeTab = ref('notes')
const booking = ref<any>({})
const notes = ref<any[]>([])
const attachments = ref<any[]>([])
const history = ref<any[]>([])
const newNote = ref('')
const newNoteType = ref('normal')

const id = computed(() => route.params.id as string)

const statusMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', arrived: '已到店',
  completed: '已完成', cancelled: '已取消'
}
const sourceMap: Record<string, string> = {
  front_desk: '前台登记', online: '线上预约', phone: '电话预约', walk_in: '到店预约'
}
const statusText = (s: string) => statusMap[s] || s
const sourceText = (s: string) => sourceMap[s] || s

const tagType = computed(() => {
  if (booking.value.status === 'cancelled') return 'info'
  if (booking.value.status === 'completed') return 'success'
  if (booking.value.is_no_show) return 'danger'
  return ''
})

const stepIndex = computed(() => {
  const s = booking.value.status
  if (s === 'completed') return 4
  if (s === 'arrived') return 3
  if (s === 'confirmed') return 2
  if (s === 'pending') return 1
  return 0
})

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : ''

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

const fieldNameText = (f: string) => {
  const m: Record<string, string> = {
    staffId: '服务人员', serviceId: '服务项目', bookingDate: '预约日期',
    startTime: '开始时间', endTime: '结束时间', status: '预约状态',
    amount: '服务金额', paymentStatus: '支付状态', remark: '备注',
  }
  return m[f] || f
}
const timelineType = (f: string) => {
  if (f === 'status' || f === 'paymentStatus') return 'warning'
  if (f === 'amount') return 'success'
  return ''
}

const loadData = async () => {
  loading.value = true
  try {
    const [bRes, nRes, aRes, hRes] = await Promise.all([
      getBookingDetail(id.value),
      getBookingNotes(id.value),
      getBookingAttachments(id.value),
      getBookingHistory(id.value),
    ])
    booking.value = bRes.data
    notes.value = nRes.data || []
    attachments.value = aRes.data || []
    history.value = hRes.data || []
  } finally {
    loading.value = false
  }
}

const submitNote = async () => {
  if (!newNote.value.trim()) return
  noteSubmitting.value = true
  try {
    await addBookingNote(id.value, { content: newNote.value, type: newNoteType.value })
    newNote.value = ''
    newNoteType.value = 'normal'
    ElMessage.success('备注添加成功')
    const res = await getBookingNotes(id.value)
    notes.value = res.data || []
  } finally {
    noteSubmitting.value = false
  }
}

const handleFile = async (uploadFile: any) => {
  try {
    await uploadAttachment(id.value, uploadFile.raw)
    ElMessage.success('附件上传成功')
    const res = await getBookingAttachments(id.value)
    attachments.value = res.data || []
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

const handleStatus = async (status: string) => {
  try {
    let reason = ''
    if (status === 'cancelled') {
      const { value } = await ElMessageBox.prompt('请输入取消原因', '取消预约', {
        confirmButtonText: '确认', cancelButtonText: '返回',
        inputPattern: /.+/, inputErrorMessage: '请输入原因'
      }).catch(() => ({ value: null }))
      if (!value) return
      reason = value
    } else {
      await ElMessageBox.confirm(`确认变更状态为「${statusMap[status]}」吗？`, '提示', { type: 'warning' })
    }
    await updateBookingStatus(id.value, { status, reason })
    ElMessage.success('状态更新成功')
    loadData()
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(err.message || '操作失败')
  }
}

const handleCommand = async (cmd: string) => {
  if (cmd === 'arrive') handleStatus('arrived')
  else if (cmd === 'complete') handleStatus('completed')
  else if (cmd === 'cancel') handleStatus('cancelled')
  else if (cmd === 'pay') {
    try {
      await ElMessageBox.confirm('确认标记为已支付吗？', '提示', { type: 'warning' })
      await updateBookingStatus(id.value, { status: booking.value.status, paymentStatus: 'paid', reason: '标记支付' })
      ElMessage.success('已更新支付状态')
      loadData()
    } catch (_) { /* cancel */ }
  }
  else if (cmd === 'noshow') {
    try {
      await ElMessageBox.confirm('确认标记该预约为爽约吗？会影响客户爽约率。', '提示', { type: 'warning' })
      await updateBookingStatus(id.value, { status: booking.value.status, isNoShow: true, reason: '标记爽约' })
      ElMessage.success('已标记爽约')
      loadData()
    } catch (_) { /* cancel */ }
  }
  else if (cmd === 'edit') {
    ElMessage.info('编辑功能：点击返回后在列表中编辑')
  }
}

onMounted(loadData)
watch(id, loadData)
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: flex-start;
}
@media (max-width: 1200px) {
  .detail-grid { grid-template-columns: 1fr; }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  font-weight: 600;
}
.customer-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0faf7 0%, #f8fefc 100%);
  border-radius: 10px;
  align-items: center;
}
.customer-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.info-tag {
  padding: 2px 8px;
  background: #f0f2f5;
  color: #606266;
  font-size: 12px;
  border-radius: 4px;
}
.no-show-rate-tag {
  border: none !important;
}
.no-show-rate-tag.ok {
  background: #f0f9eb !important;
  color: #67c23a !important;
}
.no-show-rate-tag.warn {
  background: #fdf6ec !important;
  color: #e6a23c !important;
}
.no-show-rate-tag.danger {
  background: #fef0f0 !important;
  color: #f56c6c !important;
}

.tabs-wrap {
  padding: 0;
}
:deep(.el-tabs--card > .el-tabs__header .el-tabs__nav) {
  border-radius: 0;
  border-left: none;
  border-right: none;
}
:deep(.el-tabs--card > .el-tabs__header) {
  margin: 0 0 16px;
  padding: 0 20px;
}
:deep(.el-tabs__item) {
  padding: 0 20px;
  height: 44px;
  line-height: 44px;
}

.tab-body { padding: 0 20px 20px; }

.note-input {
  padding: 12px;
  background: #f7f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}
.note-list { display: flex; flex-direction: column; gap: 12px; }
.note-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  border-left: 3px solid #e4e7ed;
}
.note-item.note-important {
  border-left-color: #f56c6c;
  background: #fff5f5;
}
.note-item.note-internal {
  border-left-color: #e6a23c;
  background: #fffaf2;
}
.note-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.note-author { font-weight: 500; color: #303133; font-size: 13px; }
.note-time {
  margin-left: auto;
  font-size: 11px;
  color: #909399;
}
.note-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}
.attach-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}
.attach-icon {
  width: 44px;
  height: 44px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}
.attach-info { flex: 1; min-width: 0; }
.attach-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attach-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty-hint {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 13px;
}

.hist-card {
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}
.hist-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}
.hist-detail {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
}
.hist-old, .hist-new {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hist-old .label {
  font-size: 11px;
  color: #909399;
}
.hist-new .label {
  font-size: 11px;
  color: #2ab99f;
}
.hist-old .value {
  padding: 4px 8px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  word-break: break-all;
}
.hist-new .value {
  padding: 4px 8px;
  background: #e6f7f3;
  color: #2ab99f;
  border-radius: 4px;
  word-break: break-all;
}
.hist-reason {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-aside {
  position: sticky;
  top: 20px;
}
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.quick-actions .el-button {
  width: 100%;
  justify-content: center;
}
</style>
