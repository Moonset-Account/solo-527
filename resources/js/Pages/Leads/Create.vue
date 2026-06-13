<template>
  <AppLayout title="快速录入咨询">
    <div class="lead-create">
      <el-page-header @back="router.visit(route('leads.index'))" class="page-header">
        <template #content>
          <span class="title">快速录入咨询记录与意向</span>
          <el-tag type="primary" effect="plain" size="small" style="margin-left: 10px">诊所运营日常使用</el-tag>
        </template>
      </el-page-header>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
        @submit.prevent="submit"
      >
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title"><el-icon><User /></el-icon>客户基本信息</div>
          </template>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="客户姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入客户姓名" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="form.phone" placeholder="手机号优先" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio-button value="male">男</el-radio-button>
                  <el-radio-button value="female">女</el-radio-button>
                  <el-radio-button value="unknown">未知</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-form-item label="年龄">
                <el-input-number v-model="form.age" :min="0" :max="150" placeholder="岁" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title"><el-icon><DataAnalysis /></el-icon>线索来源与分配</div>
          </template>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="来源渠道" prop="source">
                <el-select v-model="form.source" placeholder="请选择" style="width: 100%" clearable>
                  <el-option v-for="s in leadSources" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="初始状态" prop="status">
                <el-select v-model="form.status" style="width: 100%">
                  <el-option v-for="s in leadStatuses" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="线索质量" prop="quality">
                <el-radio-group v-model="form.quality">
                  <el-radio-button
                    v-for="q in leadQualities"
                    :key="q.value"
                    :value="q.value"
                  >{{ q.value }}</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="责任人">
                <el-select v-model="form.assignee_id" placeholder="默认当前用户" style="width: 100%" clearable>
                  <el-option v-for="o in operators" :key="o.id" :label="o.name" :value="o.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="适用报价">
                <el-select v-model="form.quote_version_id" placeholder="选择报价版本" style="width: 100%" clearable>
                  <el-option
                    v-for="q in quoteVersions"
                    :key="q.id"
                    :label="`${q.version} - ${q.name}`"
                    :value="q.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="下次跟进">
                <el-date-picker
                  v-model="form.next_follow_at"
                  type="datetime"
                  placeholder="选择时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-form-item label="预算下限">
                <el-input-number v-model="form.budget_min" :min="0" :step="1000" style="width: 100%" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-form-item label="预算上限">
                <el-input-number v-model="form.budget_max" :min="0" :step="1000" style="width: 100%" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title"><el-icon><ChatLineRound /></el-icon>首次咨询记录</div>
          </template>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="主要意向" label-width="100px">
                <el-input
                  v-model="form.intention"
                  type="textarea"
                  :rows="2"
                  placeholder="请记录客户主要需求：项目、痛点、时间预期等"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="咨询详情" label-width="100px" prop="consultation_content">
                <el-input
                  v-model="form.consultation_content"
                  type="textarea"
                  :rows="5"
                  placeholder="请详细记录本次咨询过程，包括客户问题、沟通要点、后续动作"
                  maxlength="5000"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="本次评估质量" label-width="140px">
                <el-radio-group v-model="form.consultation_quality">
                  <el-radio-button value="A">A 高意向</el-radio-button>
                  <el-radio-button value="B">B 中意向</el-radio-button>
                  <el-radio-button value="C">C 低意向</el-radio-button>
                  <el-radio-button value="D">D 无效</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <div class="actions-bar">
          <el-button size="large" @click="router.visit(route('leads.index'))">取消</el-button>
          <el-button type="primary" size="large" :loading="saving" native-type="submit" @click="submit">
            <el-icon><Check /></el-icon>保存线索并记录咨询
          </el-button>
        </div>
      </el-form>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import AppLayout from '@/Layouts/AppLayout.vue';
import { route as ziggyRoute } from 'ziggy-js';

const page = usePage<any>();
const formRef = ref<FormInstance>();
const saving = ref(false);

const leadStatuses = computed<SelectOption[]>(() => page.props.leadStatuses || []);
const leadSources = computed<SelectOption[]>(() => page.props.leadSources || []);
const leadQualities = computed<SelectOption[]>(() => page.props.leadQualities || []);
const operators = computed<any[]>(() => page.props.operators || []);
const quoteVersions = computed<any[]>(() => page.props.quoteVersions || []);

const form = reactive<any>({
  name: '',
  phone: '',
  gender: 'unknown',
  age: null,
  source: '',
  status: 'new',
  quality: 'C',
  assignee_id: null,
  owner_id: null,
  quote_version_id: null,
  budget_min: null,
  budget_max: null,
  intention: '',
  consultation_content: '',
  consultation_quality: null,
  next_follow_at: null,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  source: [{ required: true, message: '请选择来源渠道', trigger: 'change' }],
  status: [{ required: true, message: '请选择初始状态', trigger: 'change' }],
};

const submit = () => {
  formRef.value?.validate((ok) => {
    if (!ok) return;
    saving.value = true;
    router.post('/leads', form, {
      onSuccess: () => {
        saving.value = false;
        ElMessage.success('线索创建成功，已记录首次咨询');
      },
      onError: (err) => {
        saving.value = false;
        const first = Object.values(err)[0] as any;
        ElMessage.error(first?.join('；') || '保存失败');
      },
    });
  });
};

const route = ziggyRoute;
</script>

<style scoped>
.lead-create { display: flex; flex-direction: column; gap: 16px; }
.page-header {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 0;
}
.page-header .title { font-size: 16px; font-weight: 600; color: #111827; }
.form-card { }
.card-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #111827; }
.actions-bar {
  position: sticky;
  bottom: 20px;
  background: #ffffff;
  padding: 14px 20px;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 10;
}
:deep(.el-card__header) { padding: 14px 20px; }
</style>
