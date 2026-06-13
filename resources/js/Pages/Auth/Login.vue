<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-wrap">
          <el-icon :size="48" color="#2563eb"><Tooth /></el-icon>
        </div>
        <h2 class="title">牙科诊所客户转化管理台</h2>
        <p class="subtitle">让每一条线索都能高效转化</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
        class="login-form"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            size="large"
            clearable
            :prefix-icon="Message"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住登录</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="processing"
            native-type="submit"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <el-alert type="info" :closable="false" show-icon>
          <p>初始管理员账号：请联系系统管理员创建。</p>
          <p>或先执行迁移并通过 tinker 创建：<code>App\Models\User::create(['name'=>'Admin','email'=>'admin@example.com','password'=>bcrypt('123456'),'role'=>'admin'])</code></p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Lock, Message } from '@element-plus/icons-vue';

const page = usePage<any>();
const formRef = ref<FormInstance>();
const processing = ref(false);

const form = reactive({
  email: 'admin@example.com',
  password: '123456',
  remember: true,
});

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

const submit = () => {
  formRef.value?.validate((ok) => {
    if (!ok) return;
    processing.value = true;
    router.post('/login', form, {
      onSuccess: () => {
        ElMessage.success('登录成功');
        processing.value = false;
      },
      onError: (err) => {
        processing.value = false;
        if (err?.email) ElMessage.error(err.email.join('；'));
        else if (err?.password) ElMessage.error(err.password.join('；'));
        else ElMessage.error('登录失败，请检查账号密码');
      },
    });
  });
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #f5f3ff 100%);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 40px 32px;
  box-shadow: 0 20px 40px -12px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
}
.login-header { text-align: center; margin-bottom: 28px; }
.logo-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: #eff6ff;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title { margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #111827; }
.subtitle { margin: 0; font-size: 14px; color: #6b7280; }
.login-form { margin-top: 8px; }
.submit-btn { width: 100%; font-weight: 500; letter-spacing: 2px; }
.login-tips { margin-top: 20px; }
.login-tips code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
}
</style>
