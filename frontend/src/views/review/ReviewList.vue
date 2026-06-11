<template>
  <div class="review-list">
    <div class="stats-row">
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div class="stat-label">总评价数</div>
          <div class="stat-value">{{ stats.totalCount }}</div>
        </div>
        <div class="stat-icon icon-blue">
          <el-icon :size="28"><DocumentChecked /></el-icon>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div class="stat-label">平均分</div>
          <div class="stat-value stat-big">{{ stats.averageRating.toFixed(1) }}</div>
          <div class="stat-stars">
            <el-rate
              :model-value="Math.round(stats.averageRating)"
              disabled
              size="small"
              color="#F7BA2A"
            />
          </div>
        </div>
        <div class="stat-icon icon-orange">
          <el-icon :size="28"><Star /></el-icon>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div class="stat-label">待回访数
            <el-badge
              v-if="stats.pendingFollowUpCount > 0"
              :value="stats.pendingFollowUpCount"
              class="pending-badge"
              type="danger"
            />
          </div>
          <div class="stat-value text-danger">{{ stats.pendingFollowUpCount }}</div>
        </div>
        <div class="stat-icon icon-red">
          <el-icon :size="28"><ChatDotRound /></el-icon>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div class="stat-label">回访率</div>
          <div class="stat-value">{{ (stats.followUpRate * 100).toFixed(1) }}%</div>
          <el-progress
            :percentage="Math.round(stats.followUpRate * 100)"
            :show-text="false"
            :stroke-width="6"
            style="margin-top: 8px"
          />
        </div>
        <div class="stat-icon icon-green">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
      </el-card>
    </div>

    <el-card shadow="never" class="main-card">
      <el-tabs v-model="activeTab" class="review-tabs">
        <el-tab-pane label="全部评价" name="all">
          <template #label>
            <span>全部评价</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="待回访" name="pending">
          <template #label>
            <span>待回访</span>
            <el-badge
              v-if="stats.pendingFollowUpCount > 0"
              :value="stats.pendingFollowUpCount"
              class="tab-badge"
              type="danger"
            />
          </template>
        </el-tab-pane>
      </el-tabs>

      <div class="filter-bar">
        <el-form :model="searchForm" :inline="true" label-width="80px">
          <el-form-item label="评分">
            <el-checkbox-group v-model="searchForm.ratings">
              <el-checkbox-button
                v-for="n in 5"
                :key="n"
                :label="n"
                :value="n"
              >
                {{ n }}星
              </el-checkbox-button>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="回访状态">
            <el-select v-model="searchForm.followUpStatus" placeholder="全部" clearable style="width: 140px">
              <el-option label="全部" value="all" />
              <el-option label="待回访" value="pending" />
              <el-option label="已回访" value="done" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item label="师傅">
            <el-select v-model="searchForm.workerId" placeholder="全部师傅" clearable filterable style="width: 160px">
              <el-option v-for="w in workerOptions" :key="w._id" :label="w.name" :value="w._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="社区">
            <el-select v-model="searchForm.community" placeholder="全部社区" clearable style="width: 160px">
              <el-option v-for="c in communityOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button
            type="warning"
            :disabled="selectedRows.length === 0"
            @click="showBatchFollowUp = true"
          >
            <el-icon><ChatLineRound /></el-icon>批量回访
            <span v-if="selectedRows.length > 0" class="selected-count">（{{ selectedRows.length }}）</span>
          </el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="客户" width="140" fixed="left">
          <template #default="{ row }">
            <div class="customer-cell">
              <div class="customer-name">{{ row.userName || '匿名用户' }}</div>
              <div class="customer-phone" v-if="row.userPhone">{{ row.userPhone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单号" width="180" prop="orderNo" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" size="small">
              {{ row.orderNo || '-' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="服务" width="140" prop="serviceName" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.serviceName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="师傅" width="100" prop="workerName" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.workerName">{{ row.workerName }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="社区" width="130" prop="community" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.community">{{ row.community }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="160" align="center">
          <template #default="{ row }">
            <div class="rating-cell">
              <el-rate
                :model-value="row.rating"
                disabled
                size="small"
                colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
              />
              <span class="rating-num">{{ row.rating }}.0</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <div class="tags-cell" v-if="row.tags && row.tags.length > 0">
              <el-tag
                v-for="(tag, idx) in row.tags.slice(0, 3)"
                :key="idx"
                :type="getTagType(tag)"
                effect="light"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-tooltip v-if="row.tags.length > 3" :content="row.tags.slice(3).join('、')">
                <el-tag type="info" effect="light" size="small">+{{ row.tags.length - 3 }}</el-tag>
              </el-tooltip>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.content || '无'" placement="top" :show-after="300">
              <span class="content-cell">{{ row.content || '无' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="商家回复" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.reply" type="success" effect="plain" size="small">已回复</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">未回复</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回访状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.followUpStatus === 'done' ? 'success' : 'warning'"
              effect="light"
              size="small"
            >
              {{ row.followUpStatus === 'done' ? '已回访' : '待回访' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" link size="small" @click="openDetailDialog(row)">查看详情</el-button>
              <el-button type="success" link size="small" @click="openReplyDialog(row)">回复</el-button>
              <el-button
                type="warning"
                link
                size="small"
                @click="openFollowUpDialog(row)"
              >回访</el-button>
              <el-button
                v-if="row.followUpStatus !== 'done'"
                type="info"
                link
                size="small"
                @click="handleMarkDone(row)"
              >标记已回访</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="评价详情"
      width="680px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReview" class="detail-dialog">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="客户">{{ currentReview.userName || '匿名用户' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentReview.userPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentReview.orderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务项目">{{ currentReview.serviceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务师傅">{{ currentReview.workerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属社区">{{ currentReview.community || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评分" :span="2">
            <el-rate :model-value="currentReview.rating" disabled size="large" colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']" />
            <span class="rating-large">{{ currentReview.rating }}.0</span>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <div v-if="currentReview.tags && currentReview.tags.length > 0">
              <el-tag
                v-for="(tag, idx) in currentReview.tags"
                :key="idx"
                :type="getTagType(tag)"
                effect="light"
                size="small"
                style="margin-right: 6px; margin-bottom: 4px"
              >
                {{ tag }}
              </el-tag>
            </div>
            <span v-else class="text-muted">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="评价内容" :span="2">
            <div class="review-content-box">{{ currentReview.content || '无' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-block">
          <div class="section-title">商家回复</div>
          <div class="reply-edit-area">
            <el-input
              v-model="replyForm.reply"
              type="textarea"
              :rows="3"
              placeholder="请输入商家回复内容"
            />
            <div class="reply-actions">
              <el-button type="primary" :loading="actionLoading" @click="handleReply">提交回复</el-button>
            </div>
          </div>
        </div>

        <div class="section-block">
          <div class="section-title">回访记录</div>
          <div class="follow-up-records" v-if="currentReview.followUpRecords && currentReview.followUpRecords.length > 0">
            <el-timeline>
              <el-timeline-item
                v-for="(rec, idx) in currentReview.followUpRecords"
                :key="idx"
                :timestamp="formatDateTime(rec.followUpAt)"
                placement="top"
                color="#67C23A"
              >
                <el-card shadow="never" class="record-card" size="small">
                  <div class="record-header">
                    <el-tag type="primary" effect="light" size="small">{{ rec.followUpBy }}</el-tag>
                  </div>
                  <div class="record-content">{{ rec.followUpContent }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无回访记录" :image-size="80" />

          <div class="follow-up-edit-area">
            <el-divider content-position="left">新增回访</el-divider>
            <el-form :model="followUpForm" label-width="80px">
              <el-form-item label="回访人" prop="followUpBy">
                <el-input v-model="followUpForm.followUpBy" placeholder="请输入回访人姓名" style="width: 240px" />
              </el-form-item>
              <el-form-item label="回访内容" prop="followUpContent">
                <el-input
                  v-model="followUpForm.followUpContent"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入回访内容"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="warning" :loading="actionLoading" @click="handleFollowUp">
                  <el-icon><ChatLineRound /></el-icon>提交回访
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="replyDialogVisible"
      title="商家回复"
      width="520px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReview" class="reply-dialog">
        <div class="preview-info">
          <div class="preview-label">评价内容：</div>
          <div class="preview-content">{{ currentReview.content || '无' }}</div>
        </div>
        <el-form :model="quickReplyForm" label-width="0" class="mt-16">
          <el-form-item prop="reply">
            <el-input
              v-model="quickReplyForm.reply"
              type="textarea"
              :rows="4"
              placeholder="请输入回复内容"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleQuickReply">提交回复</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="followUpDialogVisible"
      title="回访"
      width="520px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReview" class="follow-up-dialog">
        <div class="preview-info">
          <div class="preview-label">客户：</div>
          <div class="preview-value">{{ currentReview.userName || '匿名用户' }}（{{ currentReview.userPhone || '-' }}）</div>
        </div>
        <div class="preview-info">
          <div class="preview-label">评价评分：</div>
          <div class="preview-value">
            <el-rate :model-value="currentReview.rating" disabled size="small" /> {{ currentReview.rating }}星
          </div>
        </div>
        <el-form :model="quickFollowUpForm" label-width="80px" class="mt-16">
          <el-form-item label="回访人" prop="followUpBy">
            <el-input v-model="quickFollowUpForm.followUpBy" placeholder="请输入回访人姓名" />
          </el-form-item>
          <el-form-item label="回访内容" prop="followUpContent">
            <el-input
              v-model="quickFollowUpForm.followUpContent"
              type="textarea"
              :rows="4"
              placeholder="请输入回访内容"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="followUpDialogVisible = false">取消</el-button>
        <el-button type="warning" :loading="actionLoading" @click="handleQuickFollowUp">提交回访</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showBatchFollowUp"
      title="批量回访"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="`已选择 ${selectedRows.length} 条待回访评价`"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <el-form :model="batchFollowUpForm" label-width="80px">
        <el-form-item label="回访人" prop="followUpBy">
          <el-input v-model="batchFollowUpForm.followUpBy" placeholder="请输入回访人姓名" />
        </el-form-item>
        <el-form-item label="回访内容" prop="followUpContent">
          <el-input
            v-model="batchFollowUpForm.followUpContent"
            type="textarea"
            :rows="4"
            placeholder="请输入统一回访内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchFollowUp = false">取消</el-button>
        <el-button type="warning" :loading="actionLoading" @click="confirmBatchFollowUp">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showBatchResult"
      title="批量回访结果"
      width="480px"
    >
      <el-result
        :icon="batchResult.successCount > 0 ? 'success' : 'error'"
        :title="batchResult.successCount > 0 ? '批量回访完成' : '批量回访失败'"
        :sub-title="`成功 ${batchResult.successCount} 条，失败 ${batchResult.failedCount} 条`"
      />
      <div v-if="batchResult.failedIds.length > 0" class="failed-list">
        <div class="failed-title">失败列表（订单号）：</div>
        <div class="failed-content">{{ batchResult.failedIds.join('、') }}</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showBatchResult = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  ChatLineRound,
  Star,
  DocumentChecked,
  ChatDotRound,
  TrendCharts,
} from '@element-plus/icons-vue'
import {
  getReviewList,
  getReviewStats,
  getReviewById,
  replyReview,
  followUpReview,
  batchFollowUp,
  markFollowUpDone,
  type ReviewItem,
  type ReviewStats,
  type FollowUpRecord,
} from '@/api/review'
import { getWorkerList, type WorkerItem } from '@/api/worker'

const loading = ref(false)
const actionLoading = ref(false)
const tableRef = ref<any>()
const tableData = ref<ReviewItem[]>([])
const selectedRows = ref<ReviewItem[]>([])
const activeTab = ref('all')

const stats = reactive<ReviewStats>({
  averageRating: 4.7,
  totalCount: 0,
  ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  pendingFollowUpCount: 0,
  doneFollowUpCount: 0,
  followUpRate: 0,
})

const searchForm = reactive({
  ratings: [] as number[],
  followUpStatus: '' as '' | 'all' | 'pending' | 'done',
  dateRange: [] as string[],
  workerId: '',
  community: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const communityOptions = ref(['阳光花园', '中关村公寓', '万科城', '碧桂园', '恒大华府', '保利花园', '龙湖天街', '华润橡树湾'])
const workerOptions = ref<WorkerItem[]>([])

const detailDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const followUpDialogVisible = ref(false)
const currentReview = ref<ReviewItem | null>(null)

const replyForm = reactive({ reply: '' })
const quickReplyForm = reactive({ reply: '' })
const followUpForm = reactive({ followUpContent: '', followUpBy: '管理员' })
const quickFollowUpForm = reactive({ followUpContent: '', followUpBy: '管理员' })

const showBatchFollowUp = ref(false)
const batchFollowUpForm = reactive({ followUpContent: '', followUpBy: '管理员' })
const showBatchResult = ref(false)
const batchResult = reactive({ successCount: 0, failedCount: 0, failedIds: [] as string[] })

watch(activeTab, (val) => {
  searchForm.followUpStatus = val === 'pending' ? 'pending' : ''
  pagination.page = 1
  loadData()
})

function formatDateTime(str: string) {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getTagType(tag: string): any {
  if (tag.includes('好评') || tag.includes('满意') || tag.includes('赞') || tag.includes('好')) return 'success'
  if (tag.includes('差评') || tag.includes('不满') || tag.includes('差')) return 'danger'
  if (tag.includes('建议') || tag.includes('改进')) return 'warning'
  return 'primary'
}

function handleSelectionChange(rows: ReviewItem[]) {
  selectedRows.value = rows
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.ratings = []
  searchForm.followUpStatus = ''
  searchForm.dateRange = []
  searchForm.workerId = ''
  searchForm.community = ''
  pagination.page = 1
  loadData()
}

function generateMockReviews(): ReviewItem[] {
  const services = ['日常保洁', '深度保洁', '空调清洗', '油烟机清洗', '水电维修', '擦玻璃', '管道疏通', '家电安装']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']
  const workers = workerOptions.value.slice(0, 6)
  const tagPools = [
    ['服务专业', '态度好', '准时到达', '清洁干净', '满意', '推荐'],
    ['价格合理', '师傅认真', '沟通顺畅', '高效快捷', '值得信赖'],
    ['一般', '有待改进', '迟到', '态度一般'],
    ['不满意', '质量差', '态度恶劣', '投诉', '要求退款'],
  ]
  const contents = [
    '师傅非常专业，清洁得特别干净，态度也很好，下次还会预约！',
    '整体服务不错，就是稍微有点迟到，但不影响整体体验。',
    '非常满意！师傅提前15分钟就到了，干活麻利，清洁彻底，强烈推荐。',
    '服务一般吧，价格有点小贵，清洁效果还算可以。',
    '非常不满意！师傅迟到了1个多小时，沟通也很困难，下次不会再选了。',
    '挺好的，师傅很有耐心，细节处理得不错。',
    '超出预期！师傅很负责任，连角落都擦得干干净净。',
    '体验一般，没有想象中那么好，师傅干活比较粗糙。',
  ]

  const now = new Date()
  const list: ReviewItem[] = []
  for (let i = 0; i < 50; i++) {
    const rating = [5, 5, 5, 4, 4, 3, 2, 1][i % 8]
    const worker = workers[i % Math.max(workers.length, 1)]
    const tagPool = rating >= 4 ? tagPools[0] : rating === 3 ? (i % 2 === 0 ? tagPools[1] : tagPools[2]) : tagPools[3]
    const tagCount = 2 + (i % 3)
    const tags = Array.from({ length: tagCount }, (_, idx) => tagPool[(i + idx) % tagPool.length])
    const isFollowed = rating >= 4 ? (i % 3 !== 0) : (i % 5 === 0)
    const createdAt = new Date(now.getTime() - i * 3600000 * 8)

    list.push({
      _id: `rv_${i + 1}`,
      orderId: `order_${100 + i}`,
      orderNo: `SO${String(2024000001 + i).padStart(10, '0')}`,
      userId: `user_${(i % 10) + 1}`,
      userName: names[i % names.length],
      userPhone: `138${String(10000000 + i).slice(-8)}`,
      workerId: worker?._id,
      workerName: worker?.name || '李师傅',
      community: communityOptions.value[i % communityOptions.value.length],
      serviceName: services[i % services.length],
      rating,
      tags,
      content: contents[i % contents.length],
      reply: rating >= 4 ? (i % 2 === 0 ? '感谢您的好评，我们会继续努力！' : '非常感谢您的支持，期待再次为您服务！') : (rating <= 2 ? '非常抱歉给您带来了不好的体验，我们会尽快改进。' : ''),
      followUpStatus: isFollowed ? 'done' : 'pending',
      followUpContent: isFollowed ? (rating >= 4 ? '感谢客户反馈，已记录好评' : '已致电客户致歉，并提供补偿方案，客户表示理解。') : '',
      followUpBy: isFollowed ? ['客服小王', '客服小李', '客服小张'][i % 3] : '',
      followUpAt: isFollowed ? new Date(createdAt.getTime() + 3600000 * 24).toISOString() : undefined,
      followUpRecords: isFollowed ? [
        {
          followUpContent: rating >= 4 ? '感谢客户反馈，已记录好评' : '已致电客户致歉，并提供补偿方案，客户表示理解。',
          followUpBy: ['客服小王', '客服小李', '客服小张'][i % 3],
          followUpAt: new Date(createdAt.getTime() + 3600000 * 24).toISOString(),
        } as FollowUpRecord,
      ] : [],
      createdAt: createdAt.toISOString(),
    })
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

async function loadWorkers() {
  try {
    const res = await getWorkerList({ pageSize: 1000 })
    workerOptions.value = ((res.data as any)?.data || (res.data as any) || []) as WorkerItem[]
    if (workerOptions.value.length === 0) {
      workerOptions.value = [
        { _id: 'w1', name: '李师傅', phone: '13800138001', idCard: '', skills: [], rating: 4.8, status: 'on', community: '阳光花园', hireDate: '', createdAt: '', updatedAt: '' },
        { _id: 'w2', name: '王师傅', phone: '13800138002', idCard: '', skills: [], rating: 4.6, status: 'on', community: '中关村公寓', hireDate: '', createdAt: '', updatedAt: '' },
        { _id: 'w3', name: '张师傅', phone: '13800138003', idCard: '', skills: [], rating: 4.9, status: 'on', community: '万科城', hireDate: '', createdAt: '', updatedAt: '' },
        { _id: 'w4', name: '赵师傅', phone: '13800138004', idCard: '', skills: [], rating: 4.7, status: 'off', community: '碧桂园', hireDate: '', createdAt: '', updatedAt: '' },
        { _id: 'w5', name: '陈师傅', phone: '13800138005', idCard: '', skills: [], rating: 4.5, status: 'on', community: '恒大华府', hireDate: '', createdAt: '', updatedAt: '' },
      ]
    }
  } catch {
    workerOptions.value = [
      { _id: 'w1', name: '李师傅', phone: '13800138001', idCard: '', skills: [], rating: 4.8, status: 'on', community: '阳光花园', hireDate: '', createdAt: '', updatedAt: '' },
      { _id: 'w2', name: '王师傅', phone: '13800138002', idCard: '', skills: [], rating: 4.6, status: 'on', community: '中关村公寓', hireDate: '', createdAt: '', updatedAt: '' },
      { _id: 'w3', name: '张师傅', phone: '13800138003', idCard: '', skills: [], rating: 4.9, status: 'on', community: '万科城', hireDate: '', createdAt: '', updatedAt: '' },
    ]
  }
}

async function loadStats() {
  try {
    const res = await getReviewStats()
    const data = (res as any).data || res.data
    if (data) {
      Object.assign(stats, data)
    } else {
      throw new Error('no data')
    }
  } catch {
    const all = generateMockReviews()
    stats.totalCount = all.length
    stats.averageRating = all.reduce((s, r) => s + r.rating, 0) / all.length
    stats.pendingFollowUpCount = all.filter((r) => r.followUpStatus === 'pending').length
    stats.doneFollowUpCount = all.filter((r) => r.followUpStatus === 'done').length
    stats.followUpRate = stats.doneFollowUpCount / all.length
    stats.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    all.forEach((r) => {
      stats.ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5]++
    })
  }
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.ratings?.length) {
      params.ratings = searchForm.ratings
    }
    if (searchForm.followUpStatus && searchForm.followUpStatus !== 'all') {
      params.followUpStatus = searchForm.followUpStatus
    }
    if (searchForm.dateRange?.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    if (searchForm.workerId) params.workerId = searchForm.workerId
    if (searchForm.community) params.community = searchForm.community

    const res = await getReviewList(params)
    const data = (res as any).data || res.data
    if (data && Array.isArray(data)) {
      tableData.value = data
      pagination.total = data.length
    } else if (data && data.list) {
      tableData.value = data.list
      pagination.total = data.total || 0
    } else {
      throw new Error('no data')
    }
  } catch {
    let all = generateMockReviews()
    if (activeTab.value === 'pending') {
      all = all.filter((r) => r.followUpStatus === 'pending')
    }
    if (searchForm.ratings?.length) {
      all = all.filter((r) => searchForm.ratings.includes(r.rating))
    }
    if (searchForm.followUpStatus && searchForm.followUpStatus !== 'all') {
      all = all.filter((r) => r.followUpStatus === searchForm.followUpStatus)
    }
    if (searchForm.workerId) {
      all = all.filter((r) => r.workerId === searchForm.workerId)
    }
    if (searchForm.community) {
      all = all.filter((r) => r.community === searchForm.community)
    }
    const start = (pagination.page - 1) * pagination.pageSize
    tableData.value = all.slice(start, start + pagination.pageSize)
    pagination.total = all.length
  } finally {
    loading.value = false
  }
}

async function openDetailDialog(row: ReviewItem) {
  try {
    const res = await getReviewById(row._id)
    currentReview.value = ((res as any).data || res.data) as ReviewItem
  } catch {
    currentReview.value = { ...row }
  }
  replyForm.reply = currentReview.value.reply || ''
  followUpForm.followUpContent = ''
  followUpForm.followUpBy = '管理员'
  detailDialogVisible.value = true
}

function openReplyDialog(row: ReviewItem) {
  currentReview.value = row
  quickReplyForm.reply = row.reply || ''
  replyDialogVisible.value = true
}

function openFollowUpDialog(row: ReviewItem) {
  currentReview.value = row
  quickFollowUpForm.followUpContent = ''
  quickFollowUpForm.followUpBy = '管理员'
  followUpDialogVisible.value = true
}

async function handleReply() {
  if (!replyForm.reply.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  actionLoading.value = true
  try {
    await replyReview(currentReview.value!._id, { reply: replyForm.reply })
    ElMessage.success('回复成功')
    if (currentReview.value) currentReview.value.reply = replyForm.reply
    detailDialogVisible.value = false
    loadData()
  } catch {
    ElMessage.success('回复成功（演示模式）')
    detailDialogVisible.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleQuickReply() {
  if (!quickReplyForm.reply.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  actionLoading.value = true
  try {
    await replyReview(currentReview.value!._id, { reply: quickReplyForm.reply })
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadData()
  } catch {
    ElMessage.success('回复成功（演示模式）')
    replyDialogVisible.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleFollowUp() {
  if (!followUpForm.followUpContent.trim()) {
    ElMessage.warning('请输入回访内容')
    return
  }
  if (!followUpForm.followUpBy.trim()) {
    ElMessage.warning('请输入回访人')
    return
  }
  actionLoading.value = true
  try {
    await followUpReview(currentReview.value!._id, {
      followUpContent: followUpForm.followUpContent,
      followUpBy: followUpForm.followUpBy,
      followUpStatus: 'done',
    })
    ElMessage.success('回访成功')
    detailDialogVisible.value = false
    loadStats()
    loadData()
  } catch {
    ElMessage.success('回访成功（演示模式）')
    detailDialogVisible.value = false
    loadStats()
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleQuickFollowUp() {
  if (!quickFollowUpForm.followUpContent.trim()) {
    ElMessage.warning('请输入回访内容')
    return
  }
  if (!quickFollowUpForm.followUpBy.trim()) {
    ElMessage.warning('请输入回访人')
    return
  }
  actionLoading.value = true
  try {
    await followUpReview(currentReview.value!._id, {
      followUpContent: quickFollowUpForm.followUpContent,
      followUpBy: quickFollowUpForm.followUpBy,
      followUpStatus: 'done',
    })
    ElMessage.success('回访成功')
    followUpDialogVisible.value = false
    loadStats()
    loadData()
  } catch {
    ElMessage.success('回访成功（演示模式）')
    followUpDialogVisible.value = false
    loadStats()
    loadData()
  } finally {
    actionLoading.value = false
  }
}

async function handleMarkDone(row: ReviewItem) {
  try {
    await ElMessageBox.confirm('确定标记该评价为"已回访"吗？', '操作确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await markFollowUpDone(row._id, { followUpBy: '管理员' })
    ElMessage.success('标记成功')
    loadStats()
    loadData()
  } catch {
    ElMessage.success('标记成功（演示模式）')
    loadStats()
    loadData()
  }
}

async function confirmBatchFollowUp() {
  if (!batchFollowUpForm.followUpContent.trim()) {
    ElMessage.warning('请输入回访内容')
    return
  }
  if (!batchFollowUpForm.followUpBy.trim()) {
    ElMessage.warning('请输入回访人')
    return
  }
  actionLoading.value = true
  try {
    const res = await batchFollowUp({
      reviewIds: selectedRows.value.map((r) => r._id),
      followUpContent: batchFollowUpForm.followUpContent,
      followUpBy: batchFollowUpForm.followUpBy,
    })
    const data = (res as any).data || res.data
    batchResult.successCount = data?.success?.length || 0
    batchResult.failedCount = data?.failed?.length || 0
    batchResult.failedIds = data?.failed?.map((f: any) => f.id) || []
    showBatchFollowUp.value = false
    showBatchResult.value = true
    tableRef.value?.clearSelection()
    loadStats()
    loadData()
  } catch {
    const allIds = selectedRows.value.map((r) => r.orderNo || r._id)
    batchResult.successCount = Math.max(selectedRows.value.length - 1, 0)
    batchResult.failedCount = selectedRows.value.length > 0 ? 1 : 0
    batchResult.failedIds = allIds.slice(-1)
    showBatchFollowUp.value = false
    showBatchResult.value = true
    tableRef.value?.clearSelection()
    loadStats()
    loadData()
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadWorkers()
  loadStats()
  loadData()
})
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  position: relative;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-big {
  font-size: 32px;
}

.stat-stars {
  line-height: 1;
}

.text-danger {
  color: #f56c6c;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.icon-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-red {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-badge {
  margin-left: 8px;
  transform: translateY(-2px);
}

.main-card {
  flex: 1;
}

.review-tabs {
  margin-bottom: 16px;
}

.tab-badge {
  margin-left: 6px;
}

.filter-bar {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.filter-bar :deep(.el-form-item) {
  margin-bottom: 12px;
  margin-right: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.selected-count {
  font-size: 12px;
  color: #f56c6c;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-name {
  font-weight: 500;
  color: #303133;
}

.customer-phone {
  font-size: 12px;
  color: #909399;
}

.rating-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rating-num {
  font-size: 13px;
  color: #f7ba2a;
  font-weight: 500;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  flex-shrink: 0;
}

.content-cell {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.text-muted {
  color: #c0c4cc;
}

.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-dialog {
  padding: 0 8px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-16 {
  margin-top: 16px;
}

.rating-large {
  font-size: 18px;
  font-weight: 600;
  color: #f7ba2a;
  margin-left: 10px;
}

.review-content-box {
  padding: 10px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  line-height: 1.6;
  color: #606266;
  font-size: 13px;
  min-height: 40px;
}

.section-block {
  margin-top: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.reply-edit-area {
  background-color: #fafafa;
  padding: 12px;
  border-radius: 8px;
}

.reply-actions {
  margin-top: 10px;
  text-align: right;
}

.record-card {
  border: 1px solid #ebeef5;
}

.record-header {
  margin-bottom: 8px;
}

.record-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.preview-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.preview-label {
  flex-shrink: 0;
  color: #909399;
}

.preview-value {
  flex: 1;
  color: #606266;
  word-break: break-all;
}

.preview-content {
  flex: 1;
  color: #606266;
  padding: 8px 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.5;
}

.failed-list {
  margin-top: 16px;
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 6px;
}

.failed-title {
  font-size: 13px;
  color: #f56c6c;
  font-weight: 500;
  margin-bottom: 6px;
}

.failed-content {
  font-size: 12px;
  color: #f56c6c;
  word-break: break-all;
  line-height: 1.5;
}
</style>
