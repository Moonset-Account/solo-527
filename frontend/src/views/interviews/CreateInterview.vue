<template>
  <div class="create-interview">
    <div class="page-header">
      <h2 class="page-title">预约面试</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="page-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="interview-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="候选人姓名" prop="candidateName">
              <el-input v-model="formData.candidateName" placeholder="请输入候选人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="candidatePhone">
              <el-input v-model="formData.candidatePhone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.candidateEmail" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应聘职位" prop="position">
              <el-input v-model="formData.position" placeholder="请输入应聘职位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="级别">
              <el-select v-model="formData.level" placeholder="请选择级别" clearable style="width: 100%">
                <el-option label="初级" value="junior" />
                <el-option label="中级" value="middle" />
                <el-option label="高级" value="senior" />
                <el-option label="专家" value="expert" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试官" prop="interviewerId">
              <el-select
                v-model="formData.interviewerId"
                placeholder="请选择面试官"
                filterable
                style="width: 100%"
                @change="fetchAvailableSchedules"
              >
                <el-option
                  v-for="item in interviewers"
                  :key="item._id"
                  :label="item.name"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试日期" prop="interviewDate">
              <el-date-picker
                v-model="formData.interviewDate"
                type="date"
                placeholder="请选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="fetchAvailableSchedules"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可用档期" prop="scheduleId">
              <el-select
                v-model="formData.scheduleId"
                placeholder="请选择档期"
                style="width: 100%"
                :disabled="!formData.interviewerId || !formData.interviewDate"
              >
                <el-option
                  v-for="item in availableSchedules"
                  :key="item._id"
                  :label="`${item.startTime} - ${item.endTime}`"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试形式">
              <el-select v-model="formData.channel" placeholder="请选择面试形式" clearable style="width: 100%">
                <el-option label="现场" value="onsite" />
                <el-option label="视频" value="video" />
                <el-option label="电话" value="phone" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地点">
              <el-input v-model="formData.location" placeholder="请输入地点或会议链接" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="技能标签">
              <el-select
                v-model="formData.skills"
                multiple
                filterable
                allow-create
                placeholder="请输入技能标签，回车添加"
                style="width: 100%"
              >
                <el-option label="JavaScript" value="JavaScript" />
                <el-option label="TypeScript" value="TypeScript" />
                <el-option label="Vue" value="Vue" />
                <el-option label="React" value="React" />
                <el-option label="Node.js" value="Node.js" />
                <el-option label="Java" value="Java" />
                <el-option label="Python" value="Python" />
                <el-option label="Go" value="Go" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuickCreate">
            快速预约
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import * as usersApi from '../../api/users';
import * as schedulesApi from '../../api/schedules';
import { useInterviewStore } from '../../stores/interview';
import type { User, Schedule } from '../../types';

const router = useRouter();
const interviewStore = useInterviewStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const interviewers = ref<User[]>([]);
const availableSchedules = ref<Schedule[]>([]);

const formData = reactive({
  candidateName: '',
  candidatePhone: '',
  candidateEmail: '',
  position: '',
  level: '',
  interviewerId: '',
  interviewDate: '',
  scheduleId: '',
  channel: '',
  location: '',
  skills: [] as string[],
  remark: '',
});

const rules: FormRules = {
  candidateName: [{ required: true, message: '请输入候选人姓名', trigger: 'blur' }],
  candidatePhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  position: [{ required: true, message: '请输入应聘职位', trigger: 'blur' }],
  interviewerId: [{ required: true, message: '请选择面试官', trigger: 'change' }],
  interviewDate: [{ required: true, message: '请选择面试日期', trigger: 'change' }],
  scheduleId: [{ required: true, message: '请选择档期', trigger: 'change' }],
};

async function fetchInterviewers() {
  try {
    const result = await usersApi.getInterviewers();
    interviewers.value = result;
  } catch (e) {
    console.error('Failed to fetch interviewers:', e);
  }
}

async function fetchAvailableSchedules() {
  if (!formData.interviewerId || !formData.interviewDate) {
    availableSchedules.value = [];
    return;
  }
  try {
    const result = await schedulesApi.getSchedules({
      interviewerId: formData.interviewerId,
      startDate: formData.interviewDate,
      endDate: formData.interviewDate,
      status: 'available',
    });
    availableSchedules.value = result.data;
  } catch (e) {
    console.error('Failed to fetch schedules:', e);
  }
}

async function handleQuickCreate() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const schedule = availableSchedules.value.find(s => s._id === formData.scheduleId);
        await interviewStore.quickCreate({
          ...formData,
          startTime: schedule?.startTime,
          endTime: schedule?.endTime,
        });
        ElMessage.success('预约成功');
        router.push('/interviews');
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '预约失败');
      } finally {
        loading.value = false;
      }
    }
  });
}

onMounted(() => {
  fetchInterviewers();
});
</script>

<style scoped>
.create-interview {
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

.interview-form {
  max-width: 900px;
  margin: 0 auto;
}
</style>
