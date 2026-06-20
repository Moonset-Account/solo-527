<template>
  <div class="create-assessment">
    <div class="page-header">
      <h2 class="page-title">快速测评 - {{ interview?.candidateName }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="page-container" v-loading="loading">
      <el-card class="mb-20" shadow="never">
        <template #header>
          <div class="card-header">
            <span>候选人信息</span>
          </div>
        </template>
        <el-descriptions :column="3" size="small">
          <el-descriptions-item label="候选人">{{ interview?.candidateName }}</el-descriptions-item>
          <el-descriptions-item label="应聘职位">{{ interview?.position }}</el-descriptions-item>
          <el-descriptions-item label="面试时间">{{ interview?.interviewDate }} {{ interview?.startTime }}-{{ interview?.endTime }}</el-descriptions-item>
          <el-descriptions-item label="面试官">{{ interview?.interviewerId?.name }}</el-descriptions-item>
          <el-descriptions-item label="技能标签">
            <el-tag v-for="skill in interview?.skills" :key="skill" size="small" style="margin-right: 4px">{{ skill }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="mb-20" shadow="never">
        <template #header>
          <div class="card-header">
            <span>抽题</span>
            <el-button type="primary" size="small" :icon="Refresh" @click="fetchRandomQuestions">
              随机抽题
            </el-button>
          </div>
        </template>
        <div v-if="randomQuestions.length > 0" class="question-list">
          <div v-for="(q, index) in randomQuestions" :key="q._id" class="question-item">
            <div class="question-header">
              <span class="question-no">{{ index + 1 }}.</span>
              <el-tag :type="getDifficultyType(q.difficulty)" size="small">{{ DifficultyLevelLabel[q.difficulty as keyof typeof DifficultyLevelLabel] }}</el-tag>
              <el-tag size="small" type="info">{{ QuestionTypeLabel[q.type as keyof typeof QuestionTypeLabel] }}</el-tag>
              <span class="question-title">{{ q.title }}</span>
            </div>
            <div class="question-content">{{ q.content }}</div>
            <el-collapse v-if="q.referenceAnswer">
              <el-collapse-item title="查看参考答案">
                <pre class="reference-answer">{{ q.referenceAnswer }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
        <el-empty v-else description="点击上方按钮随机抽题" />
      </el-card>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="assessment-form"
      >
        <el-card class="mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <span>多维度评分</span>
              <span class="score-total">总分：{{ totalScore }}</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="技术能力" prop="technicalScore">
                <el-slider
                  v-model="formData.technicalScore"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  :marks="{ 0: '0', 60: '及格', 80: '良好', 100: '优秀' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="沟通能力" prop="communicationScore">
                <el-slider
                  v-model="formData.communicationScore"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  :marks="{ 0: '0', 60: '及格', 80: '良好', 100: '优秀' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="问题解决" prop="problemSolvingScore">
                <el-slider
                  v-model="formData.problemSolvingScore"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  :marks="{ 0: '0', 60: '及格', 80: '良好', 100: '优秀' }"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>自定义维度评分（可选）</el-divider>
          <div v-for="(dim, index) in formData.dimensions" :key="index" class="dimension-item">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-input v-model="dim.dimension" placeholder="维度名称" />
              </el-col>
              <el-col :span="10">
                <el-slider
                  v-model="dim.score"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                />
              </el-col>
              <el-col :span="4">
                <el-input v-model="dim.weight" placeholder="权重">
                  <template #append>%</template>
                </el-input>
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="Delete" circle @click="removeDimension(index)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="dashed" style="width: 100%; margin-top: 12px" @click="addDimension">
            <el-icon><Plus /></el-icon> 添加维度
          </el-button>
        </el-card>

        <el-card class="mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <span>综合评价</span>
            </div>
          </template>
          <el-form-item label="优势">
            <el-input v-model="formData.strengths" type="textarea" :rows="2" placeholder="请描述候选人的优势" />
          </el-form-item>
          <el-form-item label="不足">
            <el-input v-model="formData.weaknesses" type="textarea" :rows="2" placeholder="请描述候选人的不足" />
          </el-form-item>
          <el-form-item label="综合评价">
            <el-input v-model="formData.overallComment" type="textarea" :rows="3" placeholder="请输入综合评价" />
          </el-form-item>
        </el-card>

        <el-card class="mb-20" shadow="never">
          <template #header>
            <div class="card-header">
              <span>录用建议</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="录用建议" prop="recommendation">
                <el-radio-group v-model="formData.recommendation">
                  <el-radio-button label="pass">通过</el-radio-button>
                  <el-radio-button label="fail">不通过</el-radio-button>
                  <el-radio-button label="hold">待定</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="建议级别">
                <el-select v-model="formData.suggestedLevel" placeholder="请选择" clearable>
                  <el-option label="初级" value="junior" />
                  <el-option label="中级" value="middle" />
                  <el-option label="高级" value="senior" />
                  <el-option label="专家" value="expert" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="建议薪资">
                <el-input v-model="formData.suggestedSalary" placeholder="如：15-20K" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-checkbox v-model="formData.isFinal">作为最终测评结果</el-checkbox>
          </el-form-item>
        </el-card>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交测评
          </el-button>
          <el-button size="large" @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Refresh, Plus, Delete } from '@element-plus/icons-vue';
import * as interviewsApi from '../../api/interviews';
import * as questionBankApi from '../../api/questionBank';
import * as assessmentsApi from '../../api/assessments';
import { DifficultyLevelLabel, QuestionTypeLabel, HireResult, type Interview, type Question } from '../../types';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const interview = ref<Interview | null>(null);
const randomQuestions = ref<Question[]>([]);
const formRef = ref<FormInstance>();

const formData = reactive({
  technicalScore: 70,
  communicationScore: 70,
  problemSolvingScore: 70,
  dimensions: [] as { dimension: string; score: number; weight: number; comment?: string }[],
  strengths: '',
  weaknesses: '',
  overallComment: '',
  recommendation: HireResult.PENDING as HireResult,
  suggestedLevel: '',
  suggestedSalary: '',
  isFinal: true,
  usedQuestions: [] as string[],
});

const rules: FormRules = {
  technicalScore: [{ required: true, message: '请输入技术能力评分', trigger: 'change' }],
  communicationScore: [{ required: true, message: '请输入沟通能力评分', trigger: 'change' }],
  problemSolvingScore: [{ required: true, message: '请输入问题解决能力评分', trigger: 'change' }],
  recommendation: [{ required: true, message: '请选择录用建议', trigger: 'change' }],
};

const totalScore = computed(() => {
  const avg = (formData.technicalScore + formData.communicationScore + formData.problemSolvingScore) / 3;
  return Math.round(avg * 10) / 10;
});

function getDifficultyType(difficulty: string) {
  const map: Record<string, string> = {
    easy: 'success',
    medium: '',
    hard: 'warning',
    expert: 'danger',
  };
  return map[difficulty] || '';
}

async function fetchInterview() {
  loading.value = true;
  try {
    const id = route.params.interviewId as string;
    interview.value = await interviewsApi.getInterview(id);
  } finally {
    loading.value = false;
  }
}

async function fetchRandomQuestions() {
  try {
    const params: any = { count: 3 };
    if (interview.value && interview.value.skills && interview.value.skills.length > 0) {
      params.keyword = interview.value.skills[0];
    }
    randomQuestions.value = await questionBankApi.getRandomQuestions(params);
    formData.usedQuestions = randomQuestions.value.map(q => q._id);
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '抽题失败');
  }
}

function addDimension() {
  formData.dimensions.push({
    dimension: '',
    score: 70,
    weight: 20,
  });
}

function removeDimension(index: number) {
  formData.dimensions.splice(index, 1);
}

async function handleSubmit() {
  if (!formRef.value || !interview.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await assessmentsApi.create({
          interviewId: interview.value!._id,
          ...formData,
          totalScore: totalScore.value,
        });
        ElMessage.success('测评提交成功');
        router.push(`/interviews/${interview.value!._id}`);
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '提交失败');
      } finally {
        submitting.value = false;
      }
    }
  });
}

onMounted(() => {
  fetchInterview();
});
</script>

<style scoped>
.create-assessment {
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

.page-container {
  padding: 30px;
  background: white;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.score-total {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.question-list {
  max-height: 400px;
  overflow-y: auto;
}

.question-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-no {
  font-weight: 600;
  color: #303133;
}

.question-title {
  font-weight: 500;
  color: #303133;
}

.question-content {
  color: #606266;
  line-height: 1.6;
  padding-left: 24px;
}

.reference-answer {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dimension-item {
  padding: 12px 0;
  border-bottom: 1px dashed #ebeef5;
}

.mb-20 {
  margin-bottom: 20px;
}

.assessment-form {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
