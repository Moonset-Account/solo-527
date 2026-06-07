<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Map, User, Lock, LogIn } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useDataStore } from '@/stores/data'

const userStore = useUserStore()
const dataStore = useDataStore()
const router = useRouter()
const route = useRoute()

const selectedUserId = ref('')
const error = ref('')

function handleLogin() {
  if (!selectedUserId.value) {
    error.value = '请选择用户'
    return
  }

  userStore.login(selectedUserId.value, dataStore.users)
  error.value = ''

  const redirect = route.query.redirect as string
  router.push(redirect || '/manager')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
          <Map class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">城市垃圾分类投放分析系统</h1>
        <p class="text-gray-500 mt-2">智慧环卫 · 数据驱动 · 精细管理</p>
      </div>

      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LogIn class="w-5 h-5 text-teal-600" />
          用户登录
        </h2>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <User class="w-4 h-4 inline mr-1" />
              选择用户
            </label>
            <select v-model="selectedUserId" class="select">
              <option value="">-- 请选择用户角色 --</option>
              <option v-for="user in dataStore.users" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.role === 'manager' ? '项目经理' : '审核员' }})
              </option>
            </select>
          </div>

          <button
            class="w-full btn-primary py-2.5 text-base"
            @click="handleLogin"
          >
            <Lock class="w-4 h-4 mr-2" />
            登录系统
          </button>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-500 text-center">
            演示账号：选择任意用户即可登录体验完整功能
          </p>
        </div>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        无需登录可访问
        <router-link to="/" class="text-teal-600 hover:underline">桶点地图</router-link>
        和
        <router-link to="/public" class="text-teal-600 hover:underline">公开看板</router-link>
      </p>
    </div>
  </div>
</template>
