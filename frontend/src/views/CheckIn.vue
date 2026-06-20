<template>
  <div class="check-in-page">
    <div class="page-header">
      <h2 class="page-title">签到记录</h2>
    </div>

    <SearchFilter
      :status-options="statusOptions"
      @search="handleSearch"
    />

    <div class="page-container">
      <el-table :data="interviews" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="candidateName" label="候选人" width="120" />
        <el-table-column prop="position" label="应聘职位" width="140" />
        <el-table-column label="面试日期" width="120">
          <template #default="{ row }">
            {{ row.interviewDate }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="interviewerId.name" label="面试官" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ InterviewStatusLabel[row.status as keyof typeof InterviewStatusLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="180" sortable>
          <template #default="{ row }">
            {{ row.checkInTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.startInterviewTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.endInterviewTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'scheduled' || row.status === 'confirmed'"
              type="primary"
              size="small"
              @click="handleCheckIn(row._id)"
            >签到</el-button>
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
import { ElMessage } from 'element-plus';
import SearchFilter from '../components/SearchFilter.vue';
import { useInterviewStore } from '../stores/interview';
import { InterviewStatusLabel, InterviewStatus } from '../types';
import type { SearchParams } from '../types';

const interviewStore = useInterviewStore();

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const interviews = ref<any[]>([]);
const searchParams = ref<SearchParams>({});

const statusOptions = [
  { label: InterviewStatusLabel[InterviewStatus.SCHEDULED], value: InterviewStatus.SCHEDULED },
  { label: InterviewStatusLabel[InterviewStatus.CONFIRMED], value: InterviewStatus.CONFIRMED },
  { label: InterviewStatusLabel[InterviewStatus.CHECKED_IN], value: InterviewStatus.CHECKED_IN },
  { label: InterviewStatusLabel[InterviewStatus.IN_PROGRESS], value: InterviewStatus.IN_PROGRESS },
  { label: InterviewStatusLabel[InterviewStatus.COMPLETED], value: InterviewStatus.COMPLETED },
  { label: InterviewStatusLabel[InterviewStatus.NO_SHOW], value: InterviewStatus.NO_SHOW },
];

function getStatusType(status: string) {
  const map: Record<string, string> = {
    scheduled: 'primary',
    confirmed: '',
    checked_in: 'success',
    in_progress: 'warning',
    completed: 'success',
    no_show: 'danger',
  };
  return map[status] || 'info';
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await interviewStore.fetchInterviews({
      ...searchParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'checkInTime',
      sortOrder: 'desc',
    });
    interviews.value = result.data;
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

async function handleCheckIn(id: string) {
  try {
    await interviewStore.checkIn(id);
    ElMessage.success('签到成功');
    await fetchData();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '签到失败');
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.check-in-page {
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
