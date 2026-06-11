<script setup lang="ts">
definePageMeta({ layout: 'default' })

const phone = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { phone: phone.value, password: password.value },
    })
    if (res) {
      navigateTo('/admin')
    }
  } catch (e: any) {
    error.value = e?.data?.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div class="w-16 h-16 rounded-2xl bg-amber flex items-center justify-center mx-auto mb-4">
          <span class="text-pine font-serif font-bold text-3xl">北</span>
        </div>
        <h1 class="font-serif text-3xl font-bold text-pine mb-2">北桥房态行程台</h1>
        <p class="text-slate text-sm">精品民宿 · 房态库存管理平台</p>
      </div>

      <div class="card p-8">
        <h2 class="font-serif text-xl font-semibold text-pine mb-6">登录</h2>

        <div v-if="error" class="bg-brick/10 text-brick px-4 py-3 rounded-lg mb-4 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">手机号</label>
            <input
              v-model="phone"
              type="tel"
              placeholder="请输入手机号"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-slate">
          演示账号：13800000001 / admin123
        </p>
      </div>
    </div>
  </div>
</template>
