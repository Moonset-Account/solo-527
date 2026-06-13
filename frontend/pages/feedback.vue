<template>
  <div class="feedback-page">
    <n-card class="overview-card">
      <div class="overview-content">
        <div class="overview-info">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-label">总反馈数</div>
              <div class="stat-value">{{ feedbackList.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均评分</div>
              <div class="stat-value star-value">
                <n-rate readonly :value="averageRating" size="medium" style="display: inline-block; vertical-align: middle" />
                <span style="margin-left: 8px; font-size: 20px; font-weight: 600;">{{ averageRating.toFixed(1) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">已审核</div>
              <div class="stat-value">
                <n-tag type="success" size="medium">
                  {{ reviewedCount }} / {{ feedbackList.length }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>
        <div class="overview-chart">
          <v-chart :option="pieOption" autoresize style="height: 220px; width: 100%" />
        </div>
      </div>
    </n-card>

    <n-card class="filter-card">
      <n-space vertical :size="16">
        <n-space :size="12" wrap>
          <n-select
            v-model:value="filters.min_rating"
            placeholder="最低评分"
            :options="ratingOptions"
            clearable
            style="width: 160px"
          />
          <n-select
            v-model:value="filters.reviewed"
            placeholder="审核状态"
            :options="reviewedOptions"
            clearable
            style="width: 160px"
          />
          <n-input-number
            v-model:value="filters.ticket_id"
            placeholder="工单ID"
            :min="1"
            clearable
            style="width: 180px"
          />
        </n-space>
        <n-space :size="8">
          <n-button type="primary" @click="handleSearch">
            <template #icon>
              <n-icon>🔍</n-icon>
            </template>
            查询
          </n-button>
          <n-button @click="handleReset">
            重置
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="feedbackList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FeedbackItem) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <n-modal
      v-model:show="showReviewModal"
      :mask-closable="false"
      preset="card"
      title="审核反馈"
      style="width: 560px"
      :title-style="{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }"
    >
      <n-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewRules"
        label-placement="top"
        :show-label="true"
      >
        <n-form-item v-if="currentReviewItem" label="反馈信息">
          <div class="review-preview">
            <div class="preview-row">
              <span class="preview-label">工单ID：</span>
              <a
                style="color: #18a058; cursor: pointer"
                @click="router.push(`/tickets/${currentReviewItem.ticket_id}`)"
              >#{{ currentReviewItem.ticket_id }}</a>
            </div>
            <div class="preview-row">
              <span class="preview-label">评分：</span>
              <n-rate readonly :value="currentReviewItem.rating" size="small" />
            </div>
            <div class="preview-row">
              <span class="preview-label">评论：</span>
              <span>{{ currentReviewItem.comment || '（无评论）' }}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">提交时间：</span>
              <span>{{ dayjs(currentReviewItem.submitted_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
            </div>
          </div>
        </n-form-item>
        <n-form-item label="审核备注" path="review_note">
          <n-input
            v-model:value="reviewForm.review_note"
            type="textarea"
            placeholder="请输入审核备注，说明对该反馈的处理意见或跟进措施"
            :autosize="{ minRows: 4, maxRows: 8 }"
            maxlength="500"
            show-count
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showReviewModal = false">取消</n-button>
          <n-button type="primary" :loading="reviewing" @click="handleReviewSubmit">提交审核</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import type { DataTableColumns, FormInst, SelectMixedOption, TagProps } from 'naive-ui'

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { get, post } = useApi()
const message = useMessage()
const auth = useAuthStore()

interface FeedbackItem {
  id: number
  ticket_id: number
  rating: number
  comment: string | null
  submitted_at: string
  reviewed_by: number | null
  review_note: string | null
  reviewed_at: string | null
}

interface PieDataItem {
  name: string
  value: number
}

const loading = ref(false)
const reviewing = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const allFeedbackList = ref<FeedbackItem[]>([])

const filters = reactive({
  min_rating: null as number | null,
  reviewed: null as boolean | null,
  ticket_id: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`
})

const showReviewModal = ref(false)
const reviewFormRef = ref<FormInst | null>(null)
const currentReviewItem = ref<FeedbackItem | null>(null)
const reviewForm = reactive({
  review_note: ''
})

const reviewRules = {
  review_note: [
    { required: true, message: '请输入审核备注', trigger: 'blur' },
    { min: 2, max: 500, message: '审核备注长度在 2 到 500 个字符之间', trigger: 'blur' }
  ]
}

const ratingOptions: SelectMixedOption[] = [
  { label: '1星及以上', value: 1 },
  { label: '2星及以上', value: 2 },
  { label: '3星及以上', value: 3 },
  { label: '4星及以上', value: 4 },
  { label: '5星', value: 5 }
]

const reviewedOptions: SelectMixedOption[] = [
  { label: '已审核', value: true },
  { label: '未审核', value: false }
]

const reviewedTagTypeMap: Record<string, TagProps['type']> = {
  reviewed: 'success',
  unreviewed: 'default'
}

const canReview = computed(() => auth.isAdmin || auth.isSupervisor)

const averageRating = computed(() => {
  if (allFeedbackList.value.length === 0) return 0
  const sum = allFeedbackList.value.reduce((acc, item) => acc + item.rating, 0)
  return sum / allFeedbackList.value.length
})

const reviewedCount = computed(() => {
  return allFeedbackList.value.filter(item => item.reviewed_by !== null).length
})

const pieOption = computed(() => {
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  allFeedbackList.value.forEach(item => {
    ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1
  })

  const data: PieDataItem[] = []
  const colorMap: Record<string, string> = {
    '1星': '#d03050',
    '2星': '#f0a020',
    '3星': '#f0c020',
    '4星': '#18a058',
    '5星': '#2080f0'
  }

  for (let i = 5; i >= 1; i--) {
    if (ratingCounts[i] > 0) {
      data.push({ name: `${i}星`, value: ratingCounts[i] })
    }
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}条 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12 }
    },
    color: data.map(d => colorMap[d.name]),
    series: [
      {
        name: '评分分布',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
})

const columns = computed<DataTableColumns>(() => {
  const cols: DataTableColumns = [
    {
      title: '工单ID',
      key: 'ticket_id',
      width: 100,
      render: (row: FeedbackItem) => h(
        'a',
        {
          style: { color: '#18a058', cursor: 'pointer', fontWeight: 500 },
          onClick: () => router.push(`/tickets/${row.ticket_id}`)
        },
        `#${row.ticket_id}`
      )
    },
    {
      title: '评分',
      key: 'rating',
      width: 160,
      render: (row: FeedbackItem) => h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h('n-rate', {
          readonly: true,
          value: row.rating,
          size: 'small'
        }),
        h('span', { style: { color: '#999', fontSize: '12px' } }, `${row.rating}/5`)
      ])
    },
    {
      title: '评论',
      key: 'comment',
      ellipsis: { tooltip: true },
      minWidth: 240,
      render: (row: FeedbackItem) => row.comment || h('span', { style: { color: '#bbb' } }, '（无评论）')
    },
    {
      title: '提交人',
      key: 'submitted_by',
      width: 100,
      render: () => '客户'
    },
    {
      title: '提交时间',
      key: 'submitted_at',
      width: 180,
      render: (row: FeedbackItem) => dayjs(row.submitted_at).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '审核状态',
      key: 'review_status',
      width: 100,
      render: (row: FeedbackItem) => {
        const isReviewed = row.reviewed_by !== null
        return h('n-tag', {
          type: isReviewed ? reviewedTagTypeMap.reviewed : reviewedTagTypeMap.unreviewed,
          size: 'small'
        }, () => isReviewed ? '已审核' : '未审核')
      }
    },
    {
      title: '审核人',
      key: 'reviewed_by',
      width: 100,
      render: (row: FeedbackItem) => row.reviewed_by ? `用户#${row.reviewed_by}` : '-'
    }
  ]

  if (canReview.value) {
    cols.push({
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (row: FeedbackItem) => {
        const isReviewed = row.reviewed_by !== null
        return h('n-button', {
          size: 'small',
          type: isReviewed ? 'default' : 'primary',
          ghost: isReviewed,
          onClick: () => handleOpenReview(row)
        }, () => isReviewed ? '查看' : '审核')
      }
    })
  }

  return cols
})

const buildQueryString = () => {
  const params = new URLSearchParams()
  params.append('page', String(pagination.page))
  params.append('page_size', String(pagination.pageSize))
  if (filters.min_rating !== null) params.append('min_rating', String(filters.min_rating))
  if (filters.reviewed !== null) params.append('reviewed', String(filters.reviewed))
  if (filters.ticket_id !== null) params.append('ticket_id', String(filters.ticket_id))
  return params.toString()
}

const fetchFeedback = async () => {
  try {
    loading.value = true
    const query = buildQueryString()
    const res = await get<FeedbackItem[]>(`/feedback?${query}`)
    feedbackList.value = res

    if (pagination.page === 1 && !filters.min_rating && filters.reviewed === null && filters.ticket_id === null) {
      allFeedbackList.value = res
    }
    pagination.itemCount = res.length
  } catch (e: any) {
    message.error(e.message || '获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAllForStats = async () => {
  try {
    const query = new URLSearchParams({
      page: '1',
      page_size: '1000'
    }).toString()
    const res = await get<FeedbackItem[]>(`/feedback?${query}`)
    allFeedbackList.value = res
  } catch (e: any) {
    console.warn('获取统计数据失败', e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchFeedback()
}

const handleReset = () => {
  filters.min_rating = null
  filters.reviewed = null
  filters.ticket_id = null
  pagination.page = 1
  fetchFeedback()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchFeedback()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchFeedback()
}

const handleOpenReview = (item: FeedbackItem) => {
  currentReviewItem.value = item
  reviewForm.review_note = item.review_note || ''
  showReviewModal.value = true
}

const handleReviewSubmit = async () => {
  if (!currentReviewItem.value) return
  try {
    await reviewFormRef.value?.validate()
    reviewing.value = true

    const note = encodeURIComponent(reviewForm.review_note.trim())
    await post(`/feedback/${currentReviewItem.value.id}/review?review_note=${note}`)

    message.success(currentReviewItem.value.reviewed_by ? '审核备注更新成功' : '审核提交成功')
    showReviewModal.value = false
    fetchFeedback()
    fetchAllForStats()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '提交审核失败')
  } finally {
    reviewing.value = false
  }
}

onMounted(() => {
  fetchFeedback()
  fetchAllForStats()
})
</script>

<style scoped lang="scss">
.feedback-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-card {
  border-radius: 8px;

  :deep(.n-card__content) {
    padding: 20px 24px;
  }
}

.overview-content {
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.overview-info {
  flex: 1;
  min-width: 0;
}

.overview-chart {
  width: 360px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.stat-row {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.stat-item {
  .stat-label {
    font-size: 13px;
    color: #999;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #333;

    &.star-value {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.filter-card {
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
  padding: 0;

  :deep(.n-card__content) {
    padding: 0;
  }

  :deep(.n-data-table) {
    border-radius: 0;
    border: none;
  }
}

.review-preview {
  background-color: #f7f8fa;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 13px;
}

.preview-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
  gap: 8px;

  .preview-label {
    color: #999;
    flex-shrink: 0;
    width: 70px;
  }
}
</style>
