<template>
  <div class="assessment-list">
    <div class="page-header">
      <h2 class="page-title">测评管理</h2>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="面试官">
          <el-select
            v-model="searchForm.interviewerId"
            placeholder="全部"
            clearable
            style="width: 140px"
            filterable
          >
            <el-option v-for="item in interviewers" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="录用建议">
          <el-select v-model="searchForm.recommendation" placeholder="全部" clearable style="width: 120px">
            <el-option label="通过" value="pass" />
            <el-option label="不通过" value="fail" />
            <el-option label="待定" value="hold" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="候选人/职位"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-container">
      <el-table :data="assessments" v-loading="loading" style="width: 100%" stripe>
        <el-table-column label="候选人" width="120">
          <template #default="{ row }">
            {{ row.interviewId?.candidateName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="应聘职位" width="140">
          <template #default="{ row }">
            {{ row.interviewId?.position || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="interviewerId.name" label="面试官" width="100" />
        <el-table-column label="综合评分" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.totalScore)" effect="dark">
              {{ row.totalScore || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="技术能力" width="100">
          <template #default="{ row }">
            {{ row.technicalScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="沟通能力" width="100">
          <template #default="{ row }">
            {{ row.communicationScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="问题解决" width="100">
          <template #default="{ row }">
            {{ row.problemSolvingScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="录用建议" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultType(row.recommendation)" effect="dark">
              {{ HireResultLabel[row.recommendation as keyof typeof HireResultLabel] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建议级别" width="100">
          <template #default="{ row }">
            {{ row.suggestedLevel || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="建议薪资" width="120">
          <template #default="{ row }">
            {{ row.suggestedSalary || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="测评时间" width="180" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isFinal" type="success" size="small">最终</el-tag>
            <el-tag v-else type="info" size="small">草稿</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="$router.push('/interviews/' + row.interviewId?._id)">查看面试</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import * as assessmentsApi from '../../api/assessments';
import * as usersApi from '../../api/users';
import { HireResultLabel, type Assessment, type User } from '../../types';

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const assessments = ref<Assessment[]>([]);
const interviewers = ref<User[]>([]);

const dateRange = ref<string[]>([]);
const searchForm = reactive({
  interviewerId: '',
  recommendation: '',
  keyword: '',
});

function getScoreType(score?: number) {
  if (!score) return 'info';
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

function getResultType(result: string) {
  const map: Record<string, string> = {
    pass: 'success',
    fail: 'danger',
    hold: 'warning',
    pending: 'info',
  };
  return map[result] || 'info';
}

async function fetchInterviewers() {
  try {
    const result = await usersApi.getInterviewers();
    interviewers.value = result;
  } catch (e) {
    console.error('Failed to fetch interviewers:', e);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    if (searchForm.interviewerId) params.interviewerId = searchForm.interviewerId;
    if (searchForm.recommendation) params.recommendation = searchForm.recommendation;
    if (searchForm.keyword) params.keyword = searchForm.keyword;

    const result = await assessmentsApi.getAssessments(params);
    assessments.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  dateRange.value = [];
  searchForm.interviewerId = '';
  searchForm.recommendation = '';
  searchForm.keyword = '';
  handleSearch();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
  fetchData();
}

onMounted(() => {
  fetchInterviewers();
  fetchData();
});
</script>

<style scoped>
.assessment-list {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.page-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
</style>
