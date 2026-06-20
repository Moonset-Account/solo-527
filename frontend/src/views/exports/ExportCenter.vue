<template>
  <div class="export-center">
    <div class="page-header">
      <h2 class="page-title">数据导出</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="export-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="24" color="#409eff"><Document /></el-icon>
              <span>面试明细报表</span>
            </div>
          </template>
          <p class="card-desc">
            导出完整的面试明细数据，包含候选人信息、面试时间、面试官、签到状态、测评评分、录用结果等24个字段。
            支持按日期范围、状态、负责人、关键词筛选。
          </p>
          <el-divider />
          <el-form :model="detailForm" label-width="80px">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="detailDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="detailForm.status" placeholder="全部状态" clearable style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="负责人">
              <el-select v-model="detailForm.ownerId" placeholder="全部" clearable filterable style="width: 100%">
                <el-option v-for="item in interviewers" :key="item._id" :label="item.name" :value="item._id" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="detailForm.keyword" placeholder="候选人/职位/备注" clearable />
            </el-form-item>
          </el-form>
          <el-button
            type="primary"
            style="width: 100%; margin-top: 10px"
            :loading="exporting.detail"
            :icon="Download"
            @click="exportDetail"
          >
            导出 Excel
          </el-button>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="export-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="24" color="#67c23a"><DataAnalysis /></el-icon>
              <span>面试质量分析</span>
            </div>
          </template>
          <p class="card-desc">
            按面试官统计面试质量数据，包含面试次数、通过率、平均综合评分、
            技术能力平均分、沟通能力平均分等指标，用于评估面试官工作质量。
          </p>
          <el-divider />
          <el-form :model="statsForm" label-width="80px">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="statsDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="面试官">
              <el-select v-model="statsForm.ownerId" placeholder="全部" clearable filterable style="width: 100%">
                <el-option v-for="item in interviewers" :key="item._id" :label="item.name" :value="item._id" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-button
            type="success"
            style="width: 100%; margin-top: 10px"
            :loading="exporting.stats"
            :icon="Download"
            @click="exportStats"
          >
            导出分析报告
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mb-20" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>导出说明</span>
        </div>
      </template>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="面试明细报表包含">
          候选人姓名、电话、邮箱、应聘职位、级别、技能标签、面试日期、开始时间、结束时间、
          面试官、地点、面试形式、状态、签到时间、开始时间、结束时间、录用结果、
          综合评分、技术能力、沟通能力、问题解决、测评备注、创建时间、备注，共24列数据。
          通过/不通过结果会自动高亮显示，并包含数据统计工作表。
        </el-descriptions-item>
        <el-descriptions-item label="面试质量分析包含">
          按面试官分组统计：面试次数、通过人数、通过率、平均综合评分、
          技术能力平均分、沟通能力平均分、问题解决平均分、测评完成及时率等指标。
        </el-descriptions-item>
        <el-descriptions-item label="筛选条件">
          支持日期范围、面试状态、负责人（面试官）、关键词（候选人姓名、职位、备注）多条件组合筛选。
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, DataAnalysis, Download } from '@element-plus/icons-vue';
import * as usersApi from '../../api/users';
import * as exportsApi from '../../api/exports';
import {
  InterviewStatusLabel,
  InterviewStatus,
  type User,
} from '../../types';

const exporting = reactive({
  detail: false,
  stats: false,
});

const detailDateRange = ref<string[]>([]);
const statsDateRange = ref<string[]>([]);

const detailForm = reactive({
  status: '',
  ownerId: '',
  keyword: '',
});

const statsForm = reactive({
  ownerId: '',
});

const interviewers = ref<User[]>([]);

const statusOptions = [
  { label: InterviewStatusLabel[InterviewStatus.PENDING], value: InterviewStatus.PENDING },
  { label: InterviewStatusLabel[InterviewStatus.SCHEDULED], value: InterviewStatus.SCHEDULED },
  { label: InterviewStatusLabel[InterviewStatus.CONFIRMED], value: InterviewStatus.CONFIRMED },
  { label: InterviewStatusLabel[InterviewStatus.CHECKED_IN], value: InterviewStatus.CHECKED_IN },
  { label: InterviewStatusLabel[InterviewStatus.IN_PROGRESS], value: InterviewStatus.IN_PROGRESS },
  { label: InterviewStatusLabel[InterviewStatus.COMPLETED], value: InterviewStatus.COMPLETED },
  { label: InterviewStatusLabel[InterviewStatus.CANCELLED], value: InterviewStatus.CANCELLED },
  { label: InterviewStatusLabel[InterviewStatus.NO_SHOW], value: InterviewStatus.NO_SHOW },
];

async function fetchInterviewers() {
  try {
    const result = await usersApi.getInterviewers();
    interviewers.value = result;
  } catch (e) {
    console.error('Failed to fetch interviewers:', e);
  }
}

async function exportDetail() {
  exporting.detail = true;
  try {
    const params: any = {};
    if (detailDateRange.value && detailDateRange.value.length === 2) {
      params.startDate = detailDateRange.value[0];
      params.endDate = detailDateRange.value[1];
    }
    if (detailForm.status) params.status = detailForm.status;
    if (detailForm.ownerId) params.ownerId = detailForm.ownerId;
    if (detailForm.keyword) params.keyword = detailForm.keyword;

    await exportsApi.exportInterviewDetails(params);
    ElMessage.success('导出成功');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '导出失败');
  } finally {
    exporting.detail = false;
  }
}

async function exportStats() {
  exporting.stats = true;
  try {
    const params: any = {};
    if (statsDateRange.value && statsDateRange.value.length === 2) {
      params.startDate = statsDateRange.value[0];
      params.endDate = statsDateRange.value[1];
    }
    if (statsForm.ownerId) params.ownerId = statsForm.ownerId;

    await exportsApi.exportAssessmentStats(params);
    ElMessage.success('导出成功');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '导出失败');
  } finally {
    exporting.stats = false;
  }
}

onMounted(() => {
  fetchInterviewers();
});
</script>

<style scoped>
.export-center {
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

.export-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.card-desc {
  color: #606266;
  line-height: 1.6;
  margin: 0;
  min-height: 60px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
