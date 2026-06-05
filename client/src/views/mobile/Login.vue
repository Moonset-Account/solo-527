<template>
  <div class="mobile-container">
    <div v-if="loading" class="login-loading">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    <van-nav-bar title="登录" v-if="!loading" />
    <div class="login-form" v-if="!loading">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            登录
          </van-button>
        </div>
      </van-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
      <div class="demo-accounts">
        <p>演示账号:</p>
        <p>管理员: admin / admin123</p>
        <p>志愿者: volunteer / volunteer123</p>
        <p>居民: resident1 / resident123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const submitting = ref(false);
const form = reactive({
  username: '',
  password: ''
});

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 300);
});

const handleLogin = async () => {
  submitting.value = true;
  try {
    await userStore.login(form);
    showToast('登录成功');
    if (userStore.isVolunteer) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.login-form {
  padding: 20px 0;
}
.login-footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
.register-link {
  color: #1989fa;
  margin-left: 4px;
}
.demo-accounts {
  margin-top: 40px;
  padding: 16px;
  background: #f7f8fa;
  font-size: 12px;
  color: #969799;
  text-align: center;
}
.demo-accounts p {
  margin: 4px 0;
}
.login-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
