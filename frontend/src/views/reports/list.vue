<template>
  <div class="reports-page page-container">
    <div class="card-wrapper">
      <div class="card-header">
        <span class="title"><el-icon><Document /></el-icon> 复盘报表</span>
        <el-button type="primary" :icon="Plus" @click="showCreate = true" v-if="userStore.isManager">
          新建报表
        </el-button>
      </div>

      <el-form :inline="true" :model="filters" class="filter-form" style="margin-bottom: 16px;">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索标题/摘要..." clearable style="width: 220px" @change="loadData(1)" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.reportType" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="报表标题" min-width="260">
          <template #default="{ row }">
            <div class="report-title-cell">
              <a @click="router.push(`/reports/${row._id}`)" class="title-link">{{ row.title }}</a>
              <el-tag
                size="small"
                :type="reportTypeMap[row.reportType] === '周报' ? 'primary' : reportTypeMap[row.reportType] === '月报' ? 'success' : 'info'"
                effect="plain"
                style="margin-left: 8px;"
              >
                {{ reportTypeMap[row.reportType] }}
              </el-tag>
              <el-tag
                v-if="row.status === 'published'"
                size="small"
                type="success"
                effect="dark"
                style="margin-left: 6px; border: none;"
              >
                已发布
              </el-tag>
              <el-tag v-else-if="row.status === 'draft'" size="small" effect="plain" style="margin-left: 6px;">
                草稿
              </el-tag>
            </div>
            <div class="report-meta" v-if="row.summary">
              {{ row.summary.length > 80 ? row.summary.slice(0, 80) + '...' : row.summary }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报表周期" min-width="240">
          <template #default="{ row }">
            {{ formatDateShort(row.startDate) }} ~ {{ formatDateShort(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column label="复盘项目数" width="110" align="center">
          <template #default="{ row }">{{ row.reviewItems?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="解决率" width="110" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.statistics?.resolutionRate || 0"
              :stroke-width="10"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="110">
          <template #default="{ row }">{{ row.createdByName || '-' }}</template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">
            <span v-if="row.publishedAt">{{ formatDate(row.publishedAt) }}</span>
            <span v-else style="color: $text-secondary;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/reports/${row._id}`)">查看</el-button>
            <el-button
              v-if="row.status === 'draft' && userStore.isManager"
              link
              type="success"
              @click="publishReport(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="userStore.isAdmin"
              link
              type="danger"
              @click="deleteReport(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>

    <el-dialog v-model="showCreate" title="新建复盘报表" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="报表标题" required>
          <el-input v-model="form.title" placeholder="如：2025年第X周 用户增长异常周报" />
        </el-form-item>
        <el-form-item label="报表类型" required>
          <el-select v-model="form.reportType" style="width: 100%;">
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" required>
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="复盘节奏">
          <div class="schedule-info">
            <div><el-icon><Clock /></el-icon> 周复盘: 每周一 10:00</div>
            <div><el-icon><Calendar /></el-icon> 月复盘: 每月第1个周一 14:00</div>
            <div><el-icon><UserFilled /></el-icon> 参与人: 运营组 / 产品组 / 技术组</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          创建并生成分析
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getReports, createReport, deleteReport as deleteReportApi, publishReport as _publishReport
} from '@/api/reports'
import { useUserStore } from '@/stores/user'
import { formatDate, formatDateShort, reportTypeMap } from '@/utils'
import { Document, Plus, Clock, Calendar, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', reportType: '', status: '' })

const showCreate = ref(false)
const saving = ref(false)
const form = reactive({
  title: '', reportType: 'weekly' as 'weekly' | 'monthly' | 'custom',
  dateRange: [] as any[]
})

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const res = await getReports({
      ...filters, page: page.value, pageSize: pageSize.value
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.reportType = ''
  filters.status = ''
  loadData(1)
}

async function submitForm() {
  if (!form.title || !form.reportType || form.dateRange?.length !== 2) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    await createReport({
      title: form.title,
      reportType: form.reportType,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1]
    })
    ElMessage.success('报表创建成功，已自动填充异常分析数据')
    showCreate.value = false
    loadData(1)
  } finally {
    saving.value = false
  }
}

async function publishReport(row: any) {
  try {
    await ElMessageBox.confirm(`确认发布【${row.title}】？发布后将同步到首页复盘区域`, '提示', {
      type: 'success', confirmButtonText: '发布', cancelButtonText: '取消'
    })
    await _publishReport(row._id)
    ElMessage.success('发布成功')
    loadData()
  } catch (e) {}
}

async function deleteReport(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除【${row.title}】？`, '提示', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await deleteReportApi(row._id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.filter-form {
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  :deep(.el-form-item) { margin-bottom: 10px; margin-right: 12px; }
}
.report-title-cell {
  .title-link {
    color: $primary-color;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
}
.report-meta {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
  line-height: 1.5;
}
.schedule-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: $text-regular;
  line-height: 2;
  .el-icon {
    color: $primary-color;
    margin-right: 4px;
  }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
