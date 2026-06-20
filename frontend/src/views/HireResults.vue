<template>
  <div class="hire-results-page">
    <div class="page-header">
      <h2 class="page-title">录用结果</h2>
    </div>

    <SearchFilter
      :status-options="resultOptions"
      @search="handleSearch"
    />

    <div class="page-container">
      <el-table :data="interviews" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="candidateName" label="候选人" width="120" />
        <el-table-column prop="position" label="应聘职位" width="140" />
        <el-table-column prop="level" label="级别" width="100" />
        <el-table-column label="面试日期" width="120">
          <template #default="{ row }">
            {{ row.interviewDate }}
          </template>
        </el-table-column>
        <el-table-column prop="interviewerId.name" label="面试官" width="100" />
        <el-table-column label="面试状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getInterviewStatusType(row.status)">{{ InterviewStatusLabel[row.status as keyof typeof InterviewStatusLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="录用结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultType(row.hireResult)" effect="dark">{{ HireResultLabel[row.hireResult as keyof typeof HireResultLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="100" sortable>
          <template #default="{ row }">
            {{ row.assessment?.totalScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="技术能力" width="100">
          <template #default="{ row }">
            {{ row.assessment?.technicalScore || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="建议级别" width="100">
          <template #default="{ row }">
            {{ row.assessment?.suggestedLevel || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="建议薪资" width="120">
          <template #default="{ row }">
            {{ row.assessment?.suggestedSalary || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed' && row.hireResult === 'pending'"
              type="primary"
              size="small"
              @click="$router.push('/assessments/create/' + row._id)"
            >测评</el-button>
            <el-button type="info" size="small" @click="$router.push('/interviews/' + row._id)">详情</el-button>
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
import { ref, onMounted } from 'vue';
import SearchFilter from '../components/SearchFilter.vue';
import { useInterviewStore } from '../stores/interview';
import * as interviewsApi from '../api/interviews';
import { InterviewStatusLabel, HireResultLabel, InterviewStatus, HireResult } from '../types';
import type { SearchParams } from '../types';

const interviewStore = useInterviewStore();

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const interviews = ref<any[]>([]);
const searchParams = ref<SearchParams>({});

const resultOptions = [
  { label: HireResultLabel[HireResult.PENDING], value: HireResult.PENDING },
  { label: HireResultLabel[HireResult.PASS], value: HireResult.PASS },
  { label: HireResultLabel[HireResult.FAIL], value: HireResult.FAIL },
  { label: HireResultLabel[HireResult.HOLD], value: HireResult.HOLD },
];

function getInterviewStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    scheduled: 'primary',
    confirmed: '',
    checked_in: 'success',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
  };
  return map[status] || 'info';
}

function getResultType(result: string) {
  const map: Record<string, string> = {
    pending: 'info',
    pass: 'success',
    fail: 'danger',
    hold: 'warning',
  };
  return map[result] || 'info';
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await interviewStore.fetchInterviews({
      ...searchParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    const list = [];
    for (const item of result.data) {
      const interview = { ...item };
      try {
        const assessments = await interviewsApi.getInterviewAssessments(item._id);
        if (assessments.data.length > 0) {
          interview.assessment = assessments.data[0];
        }
      } catch (e) {
        console.error('Failed to fetch assessment:', e);
      }
      list.push(interview);
    }
    
    interviews.value = list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch(params: SearchParams) {
  searchParams.value = params;
  currentPage.value = 1;
  fetchData();
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
  fetchData();
});
</script>

<style scoped>
.hire-results-page {
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

.page-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
</style>
