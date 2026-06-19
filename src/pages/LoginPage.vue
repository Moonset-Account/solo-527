<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DataLine } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.username || !form.value.password) return
  loading.value = true
  const ok = await auth.login(form.value.username, form.value.password)
  loading.value = false
  if (ok) {
    router.push('/')
  }
}
</script>

<template>
  <div class="h-full flex items-center justify-center" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #064E3B 100%)">
    <div class="w-[420px] rounded-lg p-8" style="background: var(--color-bg-card); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4)">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style="background: var(--color-accent)">
          <el-icon :size="28" color="#fff"><DataLine /></el-icon>
        </div>
        <h1 class="text-xl font-bold" style="color: var(--color-text); font-family: var(--font-heading)">
          用户增长自助报表中心
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-text-muted)">请登录以继续</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="loading"
            native-type="submit"
            style="background: var(--color-accent); border-color: var(--color-accent)"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
