<template>
  <div>
    <h2 class="font-display text-xl font-bold text-inkBlack mb-6">账户设置</h2>

    <div class="card p-6">
      <el-form :model="form" label-width="100px" style="max-width: 500px;">
        <el-form-item label="头像">
          <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl text-primary-700 font-bold">
            {{ form.name?.[0] || '学' }}
          </div>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="简单介绍一下自己" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card p-6 mt-6">
      <h3 class="font-semibold text-inkBlack mb-4">修改密码</h3>
      <el-form :model="passwordForm" label-width="100px" style="max-width: 500px;">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.current" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.new" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirm" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = reactive({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  phone: '',
  bio: ''
})

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

const saveProfile = () => {
  ElMessage.success('个人信息已保存')
}

const changePassword = () => {
  if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
    ElMessage.warning('请填写完整')
    return
  }
  if (passwordForm.new !== passwordForm.confirm) {
    ElMessage.warning('两次密码不一致')
    return
  }
  ElMessage.success('密码修改成功')
  passwordForm.current = ''
  passwordForm.new = ''
  passwordForm.confirm = ''
}
</script>
