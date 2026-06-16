<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">接口重试日志</h3>
          <p class="text-sm text-gray-500 mt-1">
            查看所有接口调用失败后的重试记录，包含失败原因、重试时间、重试次数和最终结果。
          </p>
        </div>
        <div class="flex gap-2">
          <span class="badge bg-green-100 text-green-800">成功: {{ successCount }}</span>
          <span class="badge bg-red-100 text-red-800">最终失败: {{ failedCount }}</span>
          <span class="badge bg-gray-100 text-gray-800">总计: {{ total }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="space-y-4">
        <div
          v-for="log in logs"
          :key="log.id"
          class="p-4 rounded-lg border transition-all hover:shadow-md"
          :class="log.isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <span :class="['text-lg', log.isSuccess ? 'text-green-600' : 'text-red-600']">
                  {{ log.isSuccess ? '✅' : '❌' }}
                </span>
                <code class="font-mono text-sm font-semibold text-gray-800">{{ log.method }} {{ log.endpoint }}</code>
                <BadgeTag :text="log.isSuccess ? '重试成功' : `重试 ${log.retryCount}/${log.maxRetries}`" :color-class="log.isSuccess ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'" />
                <span v-if="log.retryCount > 0" class="badge bg-orange-100 text-orange-800">
                  重试 {{ log.retryCount }} 次
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">最后尝试时间: </span>
                  <span class="font-medium text-gray-700">{{ formatDate(log.lastAttemptAt) }}</span>
                </div>
                <div v-if="log.nextRetryAt && !log.isSuccess">
                  <span class="text-gray-500">下次重试: </span>
                  <span class="font-medium text-orange-700">{{ formatDate(log.nextRetryAt) }}</span>
                </div>
                <div v-if="log.successAt">
                  <span class="text-gray-500">成功时间: </span>
                  <span class="font-medium text-green-700">{{ formatDate(log.successAt) }}</span>
                </div>
                <div v-if="log.interview">
                  <span class="text-gray-500">关联面试: </span>
                  <NuxtLink :to="`/candidates/${log.interview.candidate?.id}`" class="text-primary-600 hover:underline font-medium">
                    {{ log.interview.candidate?.name }} - {{ log.interview.title }}
                  </NuxtLink>
                </div>
              </div>

              <div v-if="!log.isSuccess" class="mt-3">
                <p class="text-sm text-red-700 font-medium">失败原因:</p>
                <pre class="mt-1 text-xs bg-white p-3 rounded border border-red-200 text-red-800 overflow-auto max-h-24">{{ log.errorMessage || '未知错误' }}<span v-if="log.errorCode"> ({{ log.errorCode }})</span></pre>
              </div>

              <div class="mt-3 flex gap-2">
                <details v-if="log.requestBody" class="text-xs">
                  <summary class="cursor-pointer text-gray-500 hover:text-gray-700">查看请求体</summary>
                  <pre class="mt-1 bg-white p-2 rounded border text-gray-700 overflow-auto max-h-32">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                </details>
                <details v-if="log.responseBody" class="text-xs">
                  <summary class="cursor-pointer text-gray-500 hover:text-gray-700">查看响应体</summary>
                  <pre class="mt-1 bg-white p-2 rounded border text-gray-700 overflow-auto max-h-32">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div v-if="logs.length === 0" class="py-12 text-center text-gray-400">暂无重试日志记录</div>
      </div>

      <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex gap-2">
          <button class="btn-secondary" :disabled="page <= 1" @click="page > 1 && (page--, loadData())">上一页</button>
          <span class="px-4 py-2 text-sm text-gray-600">第 {{ page }} 页</span>
          <button class="btn-secondary" :disabled="page * pageSize >= total" @click="page * pageSize < total && (page++, loadData())">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/composables/useConstants'

const logs = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const successCount = computed(() => logs.value.filter(l => l.isSuccess).length)
const failedCount = computed(() => logs.value.filter(l => !l.isSuccess).length)

async function loadData() {
  const res = await $fetch<any>('/api/retry-logs', { params: { page: page.value, pageSize } })
  logs.value = res.data
  total.value = res.total
}

onMounted(loadData)
</script>
