<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <el-card style="width: 420px; border-radius: 12px;">
      <template #header>
        <div style="text-align: center; font-size: 22px; font-weight: 600; color: #303133;">
          公寓住户费用账单管理系统
        </div>
      </template>
      <el-form :model="form" label-width="80px" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%;" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
        <div style="color: #909399; font-size: 12px; text-align: center;">
          测试账号: admin / manager / cs01 &nbsp;&nbsp;密码均为 admin123
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    await auth.login(form.username, form.password);
    router.push('/dashboard');
  } catch (_) {
  } finally {
    loading.value = false;
  }
}
</script>
