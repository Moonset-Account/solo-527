<template>
  <div class="search-page page-container">
    <div class="card-wrapper">
      <div class="search-header">
        <el-input
          v-model="keyword"
          placeholder="输入关键词搜索异常、数据集、报表..."
          size="large"
          clearable
          @keyup.enter="doSearch"
          @clear="doSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="doSearch" :loading="loading">搜索</el-button>
          </template>
        </el-input>
        <div v-if="suggestions?.length" class="suggest-box">
          <div
            v-for="s in suggestions"
            :key="s"
            class="suggest-item"
            @click="selectSuggest(s)"
          >
            <el-icon style="margin-right: 6px;"><Search /></el-icon>{{ s }}
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <span class="label">类型筛选:</span>
        <el-checkbox-group v-model="typeFilters" @change="doSearch">
          <el-checkbox label="anomaly">
            异常 <el-tag size="small" type="danger" effect="plain">{{ counts.anomaly }}</el-tag>
          </el-checkbox>
          <el-checkbox label="dataset">
            数据集 <el-tag size="small" type="primary" effect="plain">{{ counts.dataset }}</el-tag>
          </el-checkbox>
          <el-checkbox label="report">
            报表 <el-tag size="small" type="success" effect="plain">{{ counts.report }}</el-tag>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div v-loading="loading" class="result-area">
        <div v-if="!keyword && !searched" class="empty-tip">
          <el-empty description="输入关键词开始搜索，支持搜索异常标题、原因分析、数据集权限、复盘报表等内容" :image-size="120" />
        </div>

        <div v-else-if="!list.length && searched" class="empty-tip">
          <el-empty description="没有找到匹配的结果" :image-size="100" />
        </div>

        <div v-else>
          <div class="result-summary" style="margin-bottom: 16px;">
            找到 <b style="color: $primary-color;">{{ total }}</b> 条匹配结果
          </div>
          <div class="result-list">
            <div
              v-for="item in list"
              :key="item._id + item._type"
              class="result-item"
              @click="openItem(item)"
            >
              <div class="r-type">
                <el-tag
                  v-if="item._type === 'anomaly'"
                  size="small"
                  type="danger"
                  effect="dark"
                  style="border: none;"
                >
                  异常
                </el-tag>
                <el-tag v-else-if="item._type === 'dataset'" size="small" type="primary" effect="dark" style="border: none;">
                  数据集
                </el-tag>
                <el-tag v-else size="small" type="success" effect="dark" style="border: none;">
                  报表
                </el-tag>
              </div>
              <div class="r-main">
                <div class="r-title">
                  <span v-if="item._type === 'anomaly'">
                    <el-tag
                      :class="`tag-${item.severity}`"
                      size="small"
                      effect="plain"
                      style="margin-right: 6px;"
                    >
                      {{ getSeverityInfo(item.severity).label }}
                    </el-tag>
                  </span>
                  {{ item.title || item.name }}
                </div>
                <div class="r-desc">
                  <template v-if="item._type === 'anomaly'">
                    <span>指标: {{ item.metricName }}</span>
                    <span>· {{ getCategoryInfo(item.category).label }}</span>
                    <span v-if="item.summary">· {{ highlight(item.summary, keyword) }}</span>
                    <div v-if="item.possibleCauses?.length" class="cause-line">
                      可能原因: {{ item.possibleCauses[0]?.description }}
                    </div>
                  </template>
                  <template v-else-if="item._type === 'dataset'">
                    <span>编码: {{ item.code }}</span>
                    <span v-if="item.category"> · {{ item.category }}</span>
                    <span v-if="item.description"> · {{ highlight(item.description, keyword) }}</span>
                    <div class="perm-line">
                      权限: {{ item.permissions?.length || 0 }} 人授权
                      <span v-if="item.metrics?.length"> · {{ item.metrics.length }} 个指标</span>
                    </div>
                  </template>
                  <template v-else>
                    <span>{{ reportTypeMap[item.reportType] }}</span>
                    <span> · {{ formatDateShort(item.startDate) }} ~ {{ formatDateShort(item.endDate) }}</span>
                    <div v-if="item.summary" class="sum-line">
                      {{ highlight(item.summary, keyword) }}
                    </div>
                  </template>
                </div>
              </div>
              <div class="r-meta">
                <div>{{ item.status || item.reportType ? reportStatusMap[item.status]?.label || reportTypeMap[item.reportType] : '-' }}</div>
                <div class="time">
                  {{ formatDateShort(item.detectedAt || item.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              layout="prev, pager, next, jumper"
              background
              @current-change="doSearch"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { globalSearch, suggestKeywords } from '@/api/search'
import {
  formatDateShort, getSeverityInfo, getCategoryInfo,
  reportTypeMap, reportStatusMap
} from '@/utils'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const searched = ref(false)
const keyword = ref('')
const typeFilters = ref(['anomaly', 'dataset', 'report'])
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const suggestions = ref<string[]>([])
const counts = reactive({ anomaly: 0, dataset: 0, report: 0 })

function highlight(text: string, kw: string) {
  if (!kw || !text) return text
  const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${safe})`, 'ig'), '<b style="color: #f56c6c;">$1</b>')
}

async function doSearch() {
  searched.value = true
  if (!keyword.value.trim()) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const res = await globalSearch({
      q: keyword.value,
      types: typeFilters.value.join(','),
      page: page.value,
      pageSize: pageSize.value
    })
    list.value = res.items
    total.value = res.total
    counts.anomaly = res.counts?.anomaly || 0
    counts.dataset = res.counts?.dataset || 0
    counts.report = res.counts?.report || 0
  } finally {
    loading.value = false
  }
}

async function loadSuggest() {
  if (!keyword.value || keyword.value.length < 1) {
    suggestions.value = []
    return
  }
  try {
    suggestions.value = await suggestKeywords(keyword.value)
  } catch (e) {}
}

function selectSuggest(s: string) {
  keyword.value = s
  suggestions.value = []
  doSearch()
}

function openItem(item: any) {
  if (item._type === 'anomaly') router.push(`/anomalies/${item._id}`)
  else if (item._type === 'dataset') router.push(`/datasets/${item._id}`)
  else router.push(`/reports/${item._id}`)
}

let timer: any
watch(keyword, () => {
  clearTimeout(timer)
  timer = setTimeout(loadSuggest, 300)
})

onMounted(() => {
  const q = route.query.q as string
  if (q) {
    keyword.value = q
    doSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-header {
  max-width: 720px;
  margin: 0 auto 24px;
  position: relative;

  .suggest-box {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid $border-light;
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    z-index: 10;
    overflow: hidden;
  }
  .suggest-item {
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    color: $text-regular;
    &:hover { background: #f2f6fc; color: $primary-color; }
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 20px;
  .label { font-size: 13px; color: $text-secondary; }
  :deep(.el-checkbox) { margin-right: 20px; }
}

.result-summary {
  font-size: 14px;
  color: $text-regular;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid $border-light;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: $primary-color;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    background: #fafcff;
  }

  .r-type { flex-shrink: 0; }
  .r-main {
    flex: 1;
    min-width: 0;
    .r-title {
      font-weight: 500;
      color: $text-primary;
      font-size: 15px;
      margin-bottom: 6px;
      @include text-ellipsis;
    }
    .r-desc {
      font-size: 13px;
      color: $text-regular;
      line-height: 1.7;

      .cause-line, .perm-line, .sum-line {
        margin-top: 4px;
        color: $text-secondary;
        font-size: 12px;
      }
      b { color: #f56c6c; font-weight: 600; }
    }
  }
  .r-meta {
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.8;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-tip { padding: 60px 0; }
</style>
