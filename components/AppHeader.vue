<template>
  <header class="bg-white border-b shadow-sm sticky top-0 z-40">
    <div class="container mx-auto px-4 py-3 flex items-center gap-6">
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-primary-700">
        <span class="inline-block w-8 h-8 rounded-lg bg-primary-600 text-white grid place-items-center">议</span>
        <span>居民议题闭环看板</span>
      </NuxtLink>
      <nav class="flex items-center gap-1 text-sm">
        <NuxtLink to="/" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path === '/' ? 'bg-gray-100 font-semibold' : ''">议题公示</NuxtLink>
        <NuxtLink to="/vote" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/vote') ? 'bg-gray-100 font-semibold' : ''">参与投票</NuxtLink>
        <NuxtLink to="/resident" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/resident') ? 'bg-gray-100 font-semibold' : ''">居民查询</NuxtLink>
        <NuxtLink to="/admin" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/admin') ? 'bg-gray-100 font-semibold' : ''">后台管理</NuxtLink>
        <NuxtLink to="/todos" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/todos') ? 'bg-gray-100 font-semibold' : ''">待办中心</NuxtLink>
        <NuxtLink to="/stats" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/stats') ? 'bg-gray-100 font-semibold' : ''">统计巡检</NuxtLink>
        <NuxtLink to="/logs" class="px-3 py-1.5 rounded hover:bg-gray-100" :class="router.path.startsWith('/logs') ? 'bg-gray-100 font-semibold' : ''">异常日志</NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-3">
        <input
          v-model="operatorName"
          @change="onChange"
          placeholder="操作员姓名(用于日志)"
          class="px-3 py-1.5 text-sm border rounded w-48"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const router = useRouter()
const { name, setName } = useOperator()
const operatorName = ref(name)
const onChange = () => setName(operatorName.value || 'system')
</script>
