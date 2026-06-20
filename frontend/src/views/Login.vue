<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="60" color="#409eff"><UserFilled /></el-icon>
        <h1>技术面试排课签到台</h1>
        <p class="subtitle">技术面试管理系统</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="userStore.loading"
          class="login-button"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
      <div class="login-footer">
        <el-collapse class="demo-accounts">
          <el-collapse-item title="演示账号">
            <div class="account-item">
              <p><strong>管理员：</strong>admin@example.com / admin123</p>
              <p><strong>面试官：</strong>interviewer1@example.com / 123456</p>
              <p><strong>HR：</strong>hr1@example.com / 123456</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, UserFilled } from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loginFormRef = ref<FormInstance>();
const loginForm = reactive({
  email: '',
  password: '',
});

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await userStore.login(loginForm.email, loginForm.password);
        ElMessage.success('登录成功');
        const redirect = route.query.redirect as string || '/dashboard';
        router.push(redirect);
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '登录失败');
      }
    }
  });
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.login-footer {
  margin-top: 20px;
}

.account-item p {
  margin: 8px 0;
  font-size: 13px;
  color: #606266;
}
</style>
