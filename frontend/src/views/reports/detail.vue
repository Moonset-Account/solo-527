<template>
  <div class="report-detail page-container" v-loading="loading">
    <div v-if="detail" class="card-wrapper" style="max-width: 1100px; margin: 0 auto;">
      <el-breadcrumb separator="/" class="crumb">
        <el-breadcrumb-item @click="router.push('/reports/list')">报表列表</el-breadcrumb-item>
        <el-breadcrumb-item>详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="report-header">
        <div>
          <h1>
            {{ detail.title }}
            <el-tag
              size="large"
              :type="detail.reportType === 'weekly' ? 'primary' : detail.reportType === 'monthly' ? 'success' : 'info'"
              style="margin-left: 10px;"
            >
              {{ reportTypeMap[detail.reportType] }}
            </el-tag>
            <el-tag
              v-if="detail.status === 'published'"
              size="large"
              type="success"
              effect="dark"
              style="margin-left: 6px; border: none;"
            >
              已发布
            </el-tag>
          </h1>
          <div class="meta">
            <span>周期: {{ formatDateShort(detail.startDate) }} ~ {{ formatDateShort(detail.endDate) }}</span>
            <span>· 创建人: {{ detail.createdByName }}</span>
            <span v-if="detail.publishedAt">· 发布于 {{ formatDate(detail.publishedAt) }}</span>
          </div>
        </div>
        <div class="actions" v-if="userStore.isManager">
          <el-button v-if="detail.status === 'draft'" type="primary" @click="publish">
            发布报表
          </el-button>
        </div>
      </div>

      <el-row :gutter="16" style="margin: 20px 0;">
        <el-col :xs="6">
          <div class="stat-box">
            <div class="label">异常总数</div>
            <div class="value">{{ detail.statistics?.totalAnomalies || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="6">
          <div class="stat-box success">
            <div class="label">已解决</div>
            <div class="value">{{ detail.statistics?.resolvedCount || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="6">
          <div class="stat-box primary">
            <div class="label">解决率</div>
            <div class="value">{{ detail.statistics?.resolutionRate || 0 }}%</div>
          </div>
        </el-col>
        <el-col :xs="6">
          <div class="stat-box warning">
            <div class="label">复盘项目</div>
            <div class="value">{{ detail.reviewItems?.length || 0 }}</div>
          </div>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <h3 style="margin: 0;">📊 复盘节奏</h3>
      </el-divider>
      <div class="schedule-section">
        <div class="schedule-grid">
          <div class="s-item">
            <el-icon :size="22" color="#409eff"><Clock /></el-icon>
            <div>
              <div class="s-label">周复盘</div>
              <div class="s-value">{{ detail.schedule?.weeklyTime || '每周一 10:00' }}</div>
              <div class="s-sub">负责人: {{ detail.schedule?.weeklyOwner || '运营经理' }}</div>
            </div>
          </div>
          <div class="s-item">
            <el-icon :size="22" color="#67c23a"><Calendar /></el-icon>
            <div>
              <div class="s-label">月复盘</div>
              <div class="s-value">{{ detail.schedule?.monthlyTime || '每月第1个周一 14:00' }}</div>
              <div class="s-sub">负责人: {{ detail.schedule?.monthlyOwner || '运营总监' }}</div>
            </div>
          </div>
          <div class="s-item">
            <el-icon :size="22" color="#e6a23c"><UserFilled /></el-icon>
            <div>
              <div class="s-label">参与部门</div>
              <div class="s-value">{{ (detail.schedule?.participants || []).join(' / ') }}</div>
            </div>
          </div>
        </div>
      </div>

      <el-divider content-position="left"><h3 style="margin: 0;">📝 复盘摘要</h3></el-divider>

      <div class="content-section" v-if="detail.summary">
        <h4>整体总结</h4>
        <p>{{ detail.summary }}</p>
      </div>
      <div class="content-section success" v-if="detail.highlights">
        <h4><el-icon><Star /></el-icon> 亮点</h4>
        <p style="white-space: pre-wrap;">{{ detail.highlights }}</p>
      </div>
      <div class="content-section warning" v-if="detail.problems">
        <h4><el-icon><Warning /></el-icon> 问题</h4>
        <p style="white-space: pre-wrap;">{{ detail.problems }}</p>
      </div>
      <div class="content-section info" v-if="detail.improvements">
        <h4><el-icon><Tools /></el-icon> 改进措施</h4>
        <p style="white-space: pre-wrap;">{{ detail.improvements }}</p>
      </div>

      <el-divider content-position="left"><h3 style="margin: 0;">📋 异常复盘明细</h3></el-divider>

      <el-empty
        v-if="!detail.reviewItems?.length"
        description="暂无复盘项目"
        :image-size="80"
      />
      <div v-else class="review-list">
        <div
          v-for="(item, idx) in detail.reviewItems"
          :key="idx"
          class="review-item"
          @click="router.push(`/anomalies/${item.anomalyId}`)"
        >
          <div class="r-index">{{ idx + 1 }}</div>
          <div class="r-main">
            <div class="r-title-row">
              <span class="r-title">{{ item.anomalyTitle }}</span>
              <el-tag size="small" effect="plain" style="margin-left: 6px;">
                {{ getCategoryInfo(item.category).label }}
              </el-tag>
              <el-tag
                v-if="item.status === 'resolved'"
                size="small"
                type="success"
                effect="dark"
                style="border: none; margin-left: 6px;"
              >
                已解决
              </el-tag>
            </div>
            <div class="r-grid">
              <div class="r-cell">
                <div class="r-label">根因</div>
                <div class="r-value">{{ item.rootCause || '-' }}</div>
              </div>
              <div class="r-cell">
                <div class="r-label">解决方案</div>
                <div class="r-value">{{ item.solution || '-' }}</div>
              </div>
              <div class="r-cell" style="grid-column: 1 / -1;">
                <div class="r-label">预防措施</div>
                <div class="r-value">{{ item.preventive || '-' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReport, publishReport as _publish } from '@/api/reports'
import { useUserStore } from '@/stores/user'
import { formatDate, formatDateShort, reportTypeMap, getCategoryInfo } from '@/utils'
import { Clock, Calendar, UserFilled, Star, Warning, Tools } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const detail = ref<any>(null)

async function load() {
  loading.value = true
  try {
    detail.value = await getReport(route.params.id as string)
  } finally {
    loading.value = false
  }
}

async function publish() {
  try {
    await ElMessageBox.confirm('确认发布此报表？', '提示', { type: 'success' })
    await _publish(detail.value._id)
    ElMessage.success('发布成功')
    load()
  } catch (e) {}
}

onMounted(load)
</script>

<style lang="scss" scoped>
.crumb { margin-bottom: 16px; :deep(.el-breadcrumb__inner) { cursor: pointer; } }

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h1 {
    font-size: 22px;
    margin: 0;
    display: flex;
    align-items: center;
  }
  .meta {
    margin-top: 8px;
    font-size: 13px;
    color: $text-secondary;
    display: flex;
    gap: 6px;
  }
}

.stat-box {
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  text-align: center;
  border-top: 3px solid $text-secondary;

  .label { font-size: 12px; color: $text-secondary; margin-bottom: 6px; }
  .value { font-size: 28px; font-weight: 700; color: $text-primary; }

  &.success { border-color: $success-color; .value { color: $success-color; } }
  &.primary { border-color: $primary-color; .value { color: $primary-color; } }
  &.warning { border-color: $warning-color; .value { color: $warning-color; } }
}

.schedule-section {
  .schedule-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .s-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }
  .s-label { font-size: 12px; color: $text-secondary; }
  .s-value { font-weight: 600; color: $text-primary; margin: 2px 0; }
  .s-sub { font-size: 12px; color: $text-regular; }
}

.content-section {
  padding: 16px 18px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 14px;
  border-left: 3px solid $primary-color;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  p { margin: 0; line-height: 1.8; color: $text-regular; }

  &.success { border-color: $success-color; }
  &.warning { border-color: $warning-color; }
  &.info { border-color: $info-color; }
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  display: flex;
  gap: 14px;
  padding: 18px;
  border: 1px solid $border-light;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: $primary-color;
  }

  .r-index {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: $primary-color;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  }
  .r-main { flex: 1; min-width: 0; }
  .r-title-row {
    display: flex; align-items: center;
    margin-bottom: 10px;
  }
  .r-title { font-weight: 600; color: $text-primary; }
  .r-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 18px;
  }
  .r-cell {
    padding: 10px 12px;
    background: #fafbfc;
    border-radius: 6px;
  }
  .r-label {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 4px;
  }
  .r-value {
    font-size: 13px;
    color: $text-regular;
    line-height: 1.6;
  }
}
</style>
