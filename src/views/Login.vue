<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Pill, User, Shield } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const selectedRole = ref<UserRole>('store_manager')

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'store_manager', label: '门店经理', desc: '仅可查看本店数据' },
  { value: 'region_operation', label: '大区运营', desc: '可查看区域内门店对比' },
  { value: 'headquarters_operation', label: '总部运营', desc: '全量数据和管理权限' }
]

function handleLogin() {
  authStore.login(selectedRole.value)
  ElMessage.success(`登录成功，欢迎使用${roles.find(r => r.value === selectedRole.value)?.label}账号`)
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-10 text-center">
          <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Pill class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">连锁药店会员复购分析系统</h1>
          <p class="mt-2 text-blue-100 text-sm">数据驱动决策 · 隐私合规保障</p>
        </div>

        <div class="px-8 py-8">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">选择登录角色</label>
            <div class="space-y-3">
              <label
                v-for="role in roles"
                :key="role.value"
                class="flex items-center p-4 border rounded-xl cursor-pointer transition-all"
                :class="selectedRole === role.value
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
              >
                <input
                  v-model="selectedRole"
                  type="radio"
                  :value="role.value"
                  class="sr-only"
                />
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3"
                  :class="selectedRole === role.value ? 'border-blue-500' : 'border-gray-300'"
                >
                  <div
                    v-if="selectedRole === role.value"
                    class="w-2.5 h-2.5 rounded-full bg-blue-500"
                  ></div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4 text-gray-500" />
                    <span class="font-medium text-gray-800">{{ role.label }}</span>
                  </div>
                  <p class="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Shield class="w-3 h-3" />
                    {{ role.desc }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            @click="handleLogin"
          >
            登录系统
          </button>

          <div class="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p class="text-xs text-amber-700">
              <strong>隐私提示：</strong>系统已启用数据隐私保护机制，个人敏感信息将自动脱敏，低样本数据会被模糊处理。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
