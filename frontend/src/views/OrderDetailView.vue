<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div class="flex-center" style="gap: 12px;">
        <el-button link type="primary" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2 class="page-title">订单详情 - {{ detail?.orderNo }}</h2>
      </div>
      <div>
        <el-button @click="openEditDialog">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
      </div>
    </div>

    <div class="detail-card mb-24">
      <div class="detail-card-header">基础信息</div>
      <div class="detail-card-body">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单号">{{ detail?.orderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联品牌合作">{{ detail?.partnership?.brandName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">
            <el-tag :type="detail?.type === 'subscription' ? 'success' : 'primary'" size="small">
              {{ detail?.type === 'subscription' ? '会员订阅' : '品牌赞助' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="amount-text">{{ detail?.currency || '¥' }}{{ formatMoney(detail?.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="币种">{{ detail?.currency || 'CNY' }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">
            <span v-if="detail?.paymentMethod === 'alipay'">支付宝</span>
            <span v-else-if="detail?.paymentMethod === 'wechat'">微信支付</span>
            <span v-else-if="detail?.paymentMethod === 'bank_transfer'">银行转账</span>
            <span v-else-if="detail?.paymentMethod === 'card'">银行卡</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag
              :type="detail?.status === 'completed' ? 'success' : detail?.status === 'cancelled' ? 'danger' : detail?.status === 'processing' ? 'warning' : 'info'"
              size="small"
            >
              {{ dictStore.getDictLabel('order_status', detail?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag
              :type="detail?.paymentStatus === 'paid' ? 'success' : detail?.paymentStatus === 'refunded' ? 'danger' : detail?.paymentStatus === 'pending' ? 'warning' : 'info'"
              size="small"
            >
              {{ dictStore.getDictLabel('payment_status', detail?.paymentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(detail?.paidAt) }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ detail?.transactionNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detail?.creator?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ detail?.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <div class="detail-card">
      <div class="detail-card-body" style="padding: 0;">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="赞助权益与修改轮次" name="benefits">
            <div class="tab-content">
              <div class="flex-between mb-16">
                <div class="flex-center" style="gap: 12px;">
                  <span class="filter-label">修改轮次：</span>
                  <el-select v-model="revisionFilter" placeholder="全部轮次" clearable style="width: 140px;" @change="applyRevisionFilter">
                    <el-option v-for="r in revisionRounds" :key="r" :label="`第 ${r} 轮`" :value="r" />
                  </el-select>
                </div>
                <span class="text-muted">共 {{ filteredBenefits.length }} 项权益</span>
              </div>
              <el-table :data="filteredBenefits" stripe>
                <el-table-column label="权益类型" width="130">
                  <template #default="{ row }">
                    <el-tag :color="dictStore.getDictColor('benefit_type', row.benefitType)" effect="dark" size="small">
                      {{ dictStore.getDictLabel('benefit_type', row.benefitType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="权益名称" min-width="160" />
                <el-table-column label="数量 × 单价 = 总价" width="220">
                  <template #default="{ row }">
                    <span>{{ row.quantity }} × {{ detail?.currency || '¥' }}{{ formatMoney(row.unitPrice) }}</span>
                    <span class="ml-8"><b>{{ detail?.currency || '¥' }}{{ formatMoney(row.quantity * row.unitPrice) }}</b></span>
                  </template>
                </el-table-column>
                <el-table-column label="修改轮次" width="90">
                  <template #default="{ row }">第 {{ row.revisionRound || 1 }} 轮</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">{{ row.status || '待处理' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="交付状态" width="110">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.deliveryStatus === 'delivered' ? 'success' : row.deliveryStatus === 'delivering' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.deliveryStatus === 'delivered' ? '已交付' : row.deliveryStatus === 'delivering' ? '交付中' : '待交付' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="预计交付" width="120">
                  <template #default="{ row }">{{ formatDate(row.expectedDeliveryDate) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="130" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="openRevisionDialog(row)">新增修改轮次</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="订单节点" name="nodes">
            <div class="tab-content">
              <div class="flex-between mb-16">
                <span class="text-muted">节点追踪</span>
                <el-button type="primary" size="small" @click="openNodeDialog">
                  <el-icon><Plus /></el-icon> 添加节点
                </el-button>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="(node, idx) in nodes"
                  :key="node.id"
                  :timestamp="formatDateTime(node.createdAt)"
                  :type="node.status === 'completed' ? 'success' : node.status === 'processing' ? 'primary' : 'primary'"
                  :icon="node.status === 'completed' ? 'CircleCheck' : 'CircleDot'"
                  size="large"
                >
                  <div class="timeline-item">
                    <div class="flex-between mb-8">
                      <h4 class="node-title">
                        {{ node.title || node.name }}
                        <el-tag
                          v-if="node.status === 'completed'"
                          type="success"
                          size="small"
                          class="ml-8"
                        >已完成</el-tag>
                        <el-tag
                          v-else-if="node.status === 'processing'"
                          type="primary"
                          size="small"
                          class="ml-8"
                        >进行中</el-tag>
                        <el-tag
                          v-else
                          type="info"
                          size="small"
                          class="ml-8"
                        >待开始</el-tag>
                      </h4>
                      <div>
                        <el-button
                          v-if="node.status !== 'completed'"
                          link
                          type="success"
                          size="small"
                          @click="markNodeComplete(node)"
                        >标记完成</el-button>
                        <el-button link type="primary" size="small" @click="openNodeDialog(node)">编辑</el-button>
                      </div>
                    </div>
                    <p class="text-muted" v-if="node.description">{{ node.description }}</p>
                    <div class="text-muted text-sm mt-8">
                      <span v-if="node.operator?.username">{{ node.operator.username }} · </span>
                      <span>{{ fromNow(node.createdAt) }}</span>
                      <span v-if="node.completedAt" class="ml-16">完成时间：{{ formatDateTime(node.completedAt) }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>

          <el-tab-pane label="附件、备注与修改历史" name="extras">
            <div class="extras-container">
              <div class="extras-left">
                <div class="section-title">附件管理</div>
                <el-upload
                  drag
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
                  multiple
                  class="upload-dragger"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">支持任意格式，单个文件不超过 50MB</div>
                  </template>
                </el-upload>
                <el-divider />
                <div class="attachment-list">
                  <div
                    v-for="item in attachments"
                    :key="item.id"
                    class="attachment-item"
                  >
                    <div class="flex-between mb-4">
                      <div class="flex-center" style="gap: 8px;">
                        <el-icon :size="18" color="#409eff"><Document /></el-icon>
                        <span class="attachment-name">{{ item.name }}</span>
                      </div>
                      <el-button link type="primary" size="small" @click="downloadAttachment(item)">下载</el-button>
                    </div>
                    <div class="attachment-meta text-muted">
                      <span>{{ item.size }} · {{ item.uploader?.username || '未知' }} · {{ formatDateTime(item.createdAt) }}</span>
                    </div>
                  </div>
                  <el-empty v-if="!attachments.length" description="暂无附件" />
                </div>
              </div>

              <div class="extras-middle">
                <div class="section-title">备注讨论</div>
                <div class="comment-input mb-16">
                  <el-form :model="commentForm" label-width="auto">
                    <el-form-item label="关联权益" size="small" class="mb-8">
                      <el-select v-model="commentForm.benefitId" placeholder="不关联" clearable style="width: 100%;">
                        <el-option
                          v-for="b in (detail?.benefits || [])"
                          :key="b.id"
                          :label="b.name"
                          :value="b.id"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="修改轮次" size="small" class="mb-8">
                      <el-select v-model="commentForm.revisionRound" placeholder="全部" clearable style="width: 100%;">
                        <el-option v-for="r in revisionRounds" :key="r" :label="`第 ${r} 轮`" :value="r" />
                      </el-select>
                    </el-form-item>
                    <el-input
                      v-model="commentForm.content"
                      type="textarea"
                      :rows="3"
                      placeholder="写下您的备注或讨论内容..."
                      class="mb-8"
                    />
                    <div class="flex-between">
                      <span class="text-muted text-sm">支持 Markdown 语法</span>
                      <el-button type="primary" size="small" :loading="submittingComment" @click="submitComment">发送</el-button>
                    </div>
                  </el-form>
                </div>
                <el-divider />
                <div class="comment-list">
                  <div v-for="c in comments" :key="c.id" class="comment-item">
                    <el-avatar :size="36" class="comment-avatar">
                      {{ c.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
                    </el-avatar>
                    <div class="comment-content">
                      <div class="flex-between mb-4">
                        <div class="flex-center" style="gap: 8px;">
                          <span class="comment-user">{{ c.user?.username || '用户' }}</span>
                          <el-tag
                            v-if="c.benefit"
                            size="small"
                            type="info"
                          >关联：{{ c.benefit?.name || '' }}</el-tag>
                          <el-tag
                            v-if="c.revisionRound"
                            size="small"
                            type="warning"
                          >第 {{ c.revisionRound }} 轮</el-tag>
                        </div>
                        <span class="text-muted text-sm">{{ fromNow(c.createdAt) }}</span>
                      </div>
                      <p class="comment-text">{{ c.content }}</p>
                    </div>
                  </div>
                  <el-empty v-if="!comments.length" description="暂无备注" />
                </div>
              </div>

              <div class="extras-right">
                <div class="section-title">修改历史</div>
                <el-timeline>
                  <el-timeline-item
                    v-for="h in history"
                    :key="h.id"
                    :timestamp="formatDateTime(h.createdAt)"
                    placement="top"
                  >
                    <div class="history-item">
                      <h4 class="history-user mb-4">
                        {{ h.user?.username || '系统' }}
                        <span class="text-muted text-sm ml-8">{{ h.action || '修改' }}</span>
                      </h4>
                      <div
                        v-if="h.changes && h.changes.length"
                        class="history-changes"
                      >
                        <div
                          v-for="(ch, idx) in h.changes"
                          :key="idx"
                          class="change-row mb-8"
                        >
                          <div class="change-field">{{ ch.field }}：</div>
                          <div class="change-values">
                            <span class="change-old">{{ ch.oldValue || '-' }}</span>
                            <el-icon color="#909399"><ArrowRight /></el-icon>
                            <span class="change-new">{{ ch.newValue || '-' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-if="!history.length" description="暂无修改记录" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑订单" width="560px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="订单状态">
          <el-select v-model="editForm.status" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('order_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="editForm.paymentStatus" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('payment_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="editForm.paymentMethod" style="width: 100%;" clearable>
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingEdit" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="nodeDialogVisible" :title="editingNode ? '编辑节点' : '添加节点'" width="500px">
      <el-form :model="nodeForm" label-width="80px">
        <el-form-item label="节点名称">
          <el-input v-model="nodeForm.name" placeholder="例如：需求确认、素材提交、视频制作..." />
        </el-form-item>
        <el-form-item label="节点描述">
          <el-input v-model="nodeForm.description" type="textarea" :rows="3" placeholder="节点说明（可选）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="nodeForm.status" style="width: 100%;">
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingNode" @click="submitNode">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="revisionDialogVisible" title="新增修改轮次" width="480px">
      <div class="mb-16">
        <div class="text-muted mb-8">当前权益：</div>
        <div class="font-medium">{{ currentBenefit?.name }}</div>
      </div>
      <el-form :model="revisionForm" label-width="100px">
        <el-form-item label="新轮次">
          <el-input-number v-model="revisionForm.round" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="修改说明">
          <el-input v-model="revisionForm.description" type="textarea" :rows="3" placeholder="修改说明（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revisionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRevision">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { orderApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDateTime, formatDate, fromNow } from '@/utils'

const route = useRoute()
const dictStore = useDictStore()

const orderId = computed(() => Number(route.params.id))
const loading = ref(false)
const detail = ref<any>(null)
const activeTab = ref('benefits')
const revisionFilter = ref<number | null>(null)

const nodes = ref<any[]>([])
const attachments = ref<any[]>([])
const comments = ref<any[]>([])
const history = ref<any[]>([])

const revisionRounds = computed(() => {
  const rounds = new Set<number>()
  ;(detail.value?.benefits || []).forEach((b: any) => {
    if (b.revisionRound) rounds.add(b.revisionRound)
  })
  return Array.from(rounds).sort((a, b) => a - b)
})

const filteredBenefits = computed(() => {
  const benefits = detail.value?.benefits || []
  if (revisionFilter.value === null || revisionFilter.value === undefined) return benefits
  return benefits.filter((b: any) => (b.revisionRound || 1) === revisionFilter.value)
})

const applyRevisionFilter = () => {}

const editDialogVisible = ref(false)
const submittingEdit = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<any>({
  status: '',
  paymentStatus: '',
  paymentMethod: '',
  remark: ''
})

const editRules: FormRules = {}

const openEditDialog = () => {
  Object.assign(editForm, {
    status: detail.value?.status || '',
    paymentStatus: detail.value?.paymentStatus || '',
    paymentMethod: detail.value?.paymentMethod || '',
    remark: detail.value?.remark || ''
  })
  editDialogVisible.value = true
}

const submitEdit = async () => {
  submittingEdit.value = true
  try {
    await orderApi.update(orderId.value, editForm)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    await loadDetail()
  } finally {
    submittingEdit.value = false
  }
}

const nodeDialogVisible = ref(false)
const submittingNode = ref(false)
const editingNode = ref<any>(null)
const nodeForm = reactive({
  name: '',
  description: '',
  status: 'pending'
})

const openNodeDialog = (node?: any) => {
  editingNode.value = node || null
  if (node) {
    Object.assign(nodeForm, {
      name: node.name || node.title || '',
      description: node.description || '',
      status: node.status || 'pending'
    })
  } else {
    Object.assign(nodeForm, { name: '', description: '', status: 'pending' })
  }
  nodeDialogVisible.value = true
}

const submitNode = async () => {
  if (!nodeForm.name) {
    ElMessage.warning('请输入节点名称')
    return
  }
  submittingNode.value = true
  try {
    if (editingNode.value) {
      await orderApi.updateNode(orderId.value, editingNode.value.id, nodeForm)
    } else {
      await orderApi.addNode(orderId.value, nodeForm)
    }
    ElMessage.success('操作成功')
    nodeDialogVisible.value = false
    await loadDetail()
  } finally {
    submittingNode.value = false
  }
}

const markNodeComplete = async (node: any) => {
  try {
    await orderApi.updateNode(orderId.value, node.id, { status: 'completed' })
    ElMessage.success('已标记完成')
    await loadDetail()
  } catch {}
}

const revisionDialogVisible = ref(false)
const currentBenefit = ref<any>(null)
const revisionForm = reactive({ round: 1, description: '' })

const openRevisionDialog = (row: any) => {
  currentBenefit.value = row
  revisionForm.round = (row.revisionRound || 1) + 1
  revisionForm.description = ''
  revisionDialogVisible.value = true
}

const submitRevision = async () => {
  ElMessage.success(`已为权益「${currentBenefit.value?.name}」新增第 ${revisionForm.round} 轮修改`)
  revisionDialogVisible.value = false
}

const submittingComment = ref(false)
const commentForm = reactive({
  content: '',
  benefitId: null as number | null,
  revisionRound: null as number | null
})

const submitComment = async () => {
  if (!commentForm.content.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  submittingComment.value = true
  try {
    await orderApi.addComment(orderId.value, commentForm)
    ElMessage.success('发送成功')
    commentForm.content = ''
    commentForm.benefitId = null
    commentForm.revisionRound = null
    await loadComments()
  } finally {
    submittingComment.value = false
  }
}

const handleFileChange = async (file: UploadFile) => {
  try {
    const formData = new FormData()
    formData.append('file', file.raw as File)
    await orderApi.uploadAttachment(orderId.value, formData)
    ElMessage.success('上传成功')
    await loadAttachments()
  } catch {
    ElMessage.error('上传失败')
  }
}

const downloadAttachment = (item: any) => {
  if (item.url) {
    window.open(item.url, '_blank')
  } else {
    ElMessage.info('下载链接暂未配置')
  }
}

const loadDetail = async () => {
  loading.value = true
  try {
    return orderApi.detail(orderId.value).then((res: any) => {
      const data = res.data || res
      detail.value = data
      nodes.value = data.nodes || []
    })
  } finally {
    loading.value = false
  }
}

const loadAttachments = async () => {
  try {
    const res: any = await orderApi.getAttachments(orderId.value)
    attachments.value = res.data || res || []
  } catch {}
}

const loadComments = async () => {
  comments.value = []
}

const loadHistory = async () => {
  try {
    const res: any = await orderApi.getHistory(orderId.value)
    history.value = res.data || res || []
  } catch {}
}

onMounted(async () => {
  await loadDetail()
  await Promise.all([loadAttachments(), loadComments(), loadHistory()])
})
</script>

<style lang="scss" scoped>
.amount-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.tab-content {
  padding: 16px 0;
}

.filter-label {
  font-weight: 500;
  color: #303133;
}

.ml-8 {
  margin-left: 8px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 4px;
}

.ml-16 {
  margin-left: 16px;
}

.timeline-item {
  padding: 4px 0;
}

.node-title {
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}

.text-sm {
  font-size: 12px;
}

.mt-8 {
  margin-top: 8px;
}

.extras-container {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  padding: 16px 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.attachment-list {
  max-height: 600px;
  overflow-y: auto;
}

.attachment-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 8px;
  &:hover {
    background: #f5f7fa;
  }
}

.attachment-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.attachment-meta {
  font-size: 12px;
}

.comment-input {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.comment-list {
  max-height: 600px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-weight: 500;
  font-size: 14px;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
  margin: 4px 0 0;
  word-break: break-word;
}

.history-item {
  padding: 4px 0;
}

.history-user {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.history-changes {
  background: #fafafa;
  padding: 12px;
  border-radius: 4px;
}

.change-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.change-field {
  color: #909399;
  flex-shrink: 0;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.change-old {
  color: #f56c6c;
  text-decoration: line-through;
}

.change-new {
  color: #67c23a;
  font-weight: 500;
}
</style>
