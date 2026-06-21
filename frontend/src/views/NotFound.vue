<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div class="text-center max-w-md">
      <div class="relative mb-8">
        <h1 class="font-charter text-[120px] md:text-[160px] font-bold leading-none bg-gradient-to-r from-deep-blue-500 via-deep-blue-700 to-amber-gold-500 bg-clip-text text-transparent select-none">
          404
        </h1>
        <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-amber-gold-400/20 blur-2xl"></div>
        <div class="absolute -bottom-4 -left-8 w-32 h-32 rounded-full bg-deep-blue-500/10 blur-2xl"></div>
      </div>
      <h2 class="font-charter text-2xl font-bold text-slate-800 mb-3">
        页面走丢了
      </h2>
      <p class="text-slate-500 mb-8 leading-relaxed">
        您访问的页面不存在、已被删除或链接已失效。<br/>
        请检查网址是否正确，或返回首页继续使用。
      </p>
      <div class="flex items-center justify-center gap-3 flex-wrap">
        <NButton type="primary" size="large" @click="goHome">
          <NIcon :size="16" class="mr-1.5"><HomeOutlined /></NIcon>
          返回工作台
        </NButton>
        <NButton size="large" @click="goBack">
          <NIcon :size="16" class="mr-1.5"><ArrowLeftOutlined /></NIcon>
          返回上一页
        </NButton>
      </div>
      <div class="mt-10 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 text-left">
        <p class="text-xs text-slate-400 font-bold mb-3 flex items-center">
          <NIcon :size="12" class="mr-1"><InfoCircleOutlined /></NIcon>
          您可以尝试：
        </p>
        <ul class="text-sm text-slate-600 space-y-2">
          <li class="flex items-start">
            <span class="text-amber-gold-500 mr-2 mt-0.5">•</span>
            <span>检查浏览器地址栏中 URL 的拼写是否正确</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-gold-500 mr-2 mt-0.5">•</span>
            <span>使用顶部导航菜单访问其他页面</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-gold-500 mr-2 mt-0.5">•</span>
            <span>如果此问题持续出现，请联系系统管理员</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NIcon } from 'naive-ui'
import { HomeOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@vicons/antd'
import { usePageTitle } from '@/composables/usePageTitle'

usePageTitle('页面不存在')

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>
