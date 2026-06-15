<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Collection /></el-icon>选题管理
      </h2>
      <el-button type="primary" @click="$router.push('/topic/create')">
        <el-icon><Plus /></el-icon>提交选题
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="标题/描述" clearable style="width:200px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:140px;">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="content-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="title" label="选题标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="选题描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="tags" label="标签" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-for="(t, i) in parseTags(row.tags)" :key="i" size="small" style="margin-right:4px;">
              {{ t }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建人" width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="success" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleChangeStatus(row, cmd)">
              <el-button type="warning" link size="small">改状态<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="s in statusOptions" :key="s.value" :command="s.value">
                    <el-tag :type="s.type" size="small">{{ s.label }}</el-tag>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" link size="small" @click="goReview(row)">审核追溯</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right;"
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog v-model="detailVisible" title="选题详情" width="720px" destroy-on-close>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="选题标题" :span="2">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(detail.status).type">{{ getStatusTag(detail.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-tag v-for="(t, i) in parseTags(detail.tags)" :key="i" size="small" style="margin-right:4px;">{{ t }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标受众" :span="2">{{ detail.targetAudience || '-' }}</el-descriptions-item>
        <el-descriptions-item label="选题描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内容方向" :span="2">{{ detail.contentDirection || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTopicPage, getTopicDetail, updateTopicStatus } from '../../api/topic'
import { statusOptions, getStatusTag } from '../../utils/constants'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref(null)
const dateRange = ref([])

const query = reactive({
  keyword: '',
  status: null,
  current: 1,
  size: 10
})

function parseTags(str) {
  if (!str) return []
  return str.split(',').filter(Boolean)
}

async function fetchList() {
  loading.value = true
  try {
    const params = { ...query }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getTopicPage(params)
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.status = null
  dateRange.value = []
  handleSearch()
}

async function handleView(row) {
  const res = await getTopicDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

function handleEdit(row) {
  router.push('/topic/edit/' + row.id)
}

function goReview(row) {
  router.push({ path: '/review', query: { businessId: row.id, reviewType: 1 } })
}

async function handleChangeStatus(row, status) {
  try {
    await ElMessageBox.confirm(`确定将选题状态改为"${getStatusTag(status).label}"吗？`, '提示', { type: 'warning' })
    await updateTopicStatus(row.id, status)
    ElMessage.success('状态更新成功')
    fetchList()
  } catch (e) {}
}

onMounted(fetchList)
</script>
