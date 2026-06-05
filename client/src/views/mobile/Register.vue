<template>
  <div class="mobile-container">
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />
    <div class="register-form">
      <van-form @submit="handleRegister">
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
          <van-field
            v-model="form.realName"
            name="realName"
            label="真实姓名"
            placeholder="请输入真实姓名"
          />
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
          />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            注册
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';

const router = useRouter();
const userStore = useUserStore();

const submitting = ref(false);
const form = reactive({
  username: '',
  password: '',
  realName: '',
  phone: ''
});

const handleRegister = async () => {
  submitting.value = true;
  try {
    await userStore.register(form);
    showToast('注册成功');
    router.push('/');
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.register-form {
  padding: 20px 0;
}
</style>
