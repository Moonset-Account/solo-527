<template>
  <div class="question-list">
    <div class="page-header">
      <h2 class="page-title">测评题库</h2>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="题目内容/标签"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in questionTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in difficultyLevels" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="全部" clearable style="width: 120px">
            <el-option label="JavaScript" value="JavaScript" />
            <el-option label="TypeScript" value="TypeScript" />
            <el-option label="Vue" value="Vue" />
            <el-option label="React" value="React" />
            <el-option label="Node.js" value="Node.js" />
            <el-option label="计算机基础" value="计算机基础" />
            <el-option label="算法" value="算法" />
            <el-option label="系统设计" value="系统设计" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Refresh" @click="handleRandomQuestions">
            随机抽题
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-container">
      <el-table :data="questions" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="title" label="题目标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="题型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ QuestionTypeLabel[row.type as keyof typeof QuestionTypeLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)" size="small">{{ DifficultyLevelLabel[row.difficulty as keyof typeof DifficultyLevelLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags.slice(0, 3)" :key="tag" size="small" style="margin-right: 4px">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultScore" label="分值" width="80" />
        <el-table-column prop="usedCount" label="使用次数" width="100" />
        <el-table-column label="正确率" width="100">
          <template #default="{ row }">
            {{ row.correctRate ? row.correctRate + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showDetail(row)">查看</el-button>
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

    <el-dialog v-model="detailVisible" title="题目详情" width="700px">
      <el-descriptions v-if="currentQuestion" :column="2" border>
        <el-descriptions-item label="标题">{{ currentQuestion.title }}</el-descriptions-item>
        <el-descriptions-item label="题型">{{ QuestionTypeLabel[currentQuestion.type as keyof typeof QuestionTypeLabel] }}</el-descriptions-item>
        <el-descriptions-item label="难度">
          <el-tag :type="getDifficultyType(currentQuestion.difficulty)" size="small">{{ DifficultyLevelLabel[currentQuestion.difficulty as keyof typeof DifficultyLevelLabel] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentQuestion.category }}</el-descriptions-item>
        <el-descriptions-item label="分值">{{ currentQuestion.defaultScore }}</el-descriptions-item>
        <el-descriptions-item label="预计用时">{{ currentQuestion.estimatedTime || '-' }} 分钟</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in currentQuestion.tags" :key="tag" size="small" style="margin-right: 4px">{{ tag }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="题目内容" :span="2">
          <pre class="question-content">{{ currentQuestion.content }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentQuestion.options" label="选项" :span="2">
          <div v-for="(opt, idx) in currentQuestion.options" :key="idx" class="option-item">
            {{ String.fromCharCode(65 + idx) }}. {{ opt }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentQuestion.referenceAnswer" label="参考答案" :span="2">
          <pre class="reference-answer">{{ currentQuestion.referenceAnswer }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentQuestion.analysis" label="解析" :span="2">
          <pre class="reference-answer">{{ currentQuestion.analysis }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import * as questionBankApi from '../../api/questionBank';
import {
  QuestionTypeLabel,
  DifficultyLevelLabel,
  QuestionType,
  DifficultyLevel,
  type Question,
} from '../../types';

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const questions = ref<Question[]>([]);
const detailVisible = ref(false);
const currentQuestion = ref<Question | null>(null);

const searchForm = reactive({
  keyword: '',
  type: '',
  difficulty: '',
  category: '',
});

const questionTypes = [
  { label: QuestionTypeLabel[QuestionType.SINGLE_CHOICE], value: QuestionType.SINGLE_CHOICE },
  { label: QuestionTypeLabel[QuestionType.MULTIPLE_CHOICE], value: QuestionType.MULTIPLE_CHOICE },
  { label: QuestionTypeLabel[QuestionType.TRUE_FALSE], value: QuestionType.TRUE_FALSE },
  { label: QuestionTypeLabel[QuestionType.SHORT_ANSWER], value: QuestionType.SHORT_ANSWER },
  { label: QuestionTypeLabel[QuestionType.ESSAY], value: QuestionType.ESSAY },
  { label: QuestionTypeLabel[QuestionType.CODING], value: QuestionType.CODING },
];

const difficultyLevels = [
  { label: DifficultyLevelLabel[DifficultyLevel.EASY], value: DifficultyLevel.EASY },
  { label: DifficultyLevelLabel[DifficultyLevel.MEDIUM], value: DifficultyLevel.MEDIUM },
  { label: DifficultyLevelLabel[DifficultyLevel.HARD], value: DifficultyLevel.HARD },
  { label: DifficultyLevelLabel[DifficultyLevel.EXPERT], value: DifficultyLevel.EXPERT },
];

function getDifficultyType(difficulty: string) {
  const map: Record<string, string> = {
    easy: 'success',
    medium: '',
    hard: 'warning',
    expert: 'danger',
  };
  return map[difficulty] || '';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'usedCount',
      sortOrder: 'desc',
    };
    if (searchForm.keyword) params.keyword = searchForm.keyword;
    if (searchForm.type) params.type = searchForm.type;
    if (searchForm.difficulty) params.difficulty = searchForm.difficulty;
    if (searchForm.category) params.category = searchForm.category;

    const result = await questionBankApi.getQuestions(params);
    questions.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function handleRandomQuestions() {
  try {
    const params: any = { count: 5 };
    if (searchForm.category) params.category = searchForm.category;
    if (searchForm.difficulty) params.difficulty = searchForm.difficulty;
    const result = await questionBankApi.getRandomQuestions(params);
    questions.value = result;
    total.value = result.length;
  } catch (e: any) {
    console.error('Failed to get random questions:', e);
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.type = '';
  searchForm.difficulty = '';
  searchForm.category = '';
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

function showDetail(row: Question) {
  currentQuestion.value = row;
  detailVisible.value = true;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.question-list {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.question-content,
.reference-answer {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  line-height: 1.6;
}

.option-item {
  padding: 4px 0;
  color: #606266;
}
</style>
