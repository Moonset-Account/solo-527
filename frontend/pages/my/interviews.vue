<template>
  <n-card :bordered="false">
    <template #header>我的面试</template>
    <n-list bordered>
      <n-list-item v-for="interview in interviews" :key="interview.id" style="padding: 16px">
        <n-thing>
          <template #header>
            <div class="iv-header">
              <span class="iv-title">{{ interview.title || '面试' }}</span>
              <n-tag :type="interviewStatusColors[interview.status] as any">
                {{ interviewStatusLabels[interview.status] }}
              </n-tag>
            </div>
          </template>
          <template #description>
            <div class="iv-meta">
              <n-tag size="small">{{ interviewTypeLabels[interview.interview_type] }}</n-tag>
              <span>开始: {{ formatDateTime(interview.start_time) }}</span>
              <span>结束: {{ formatDateTime(interview.end_time) }}</span>
            </div>
          </template>
          <div v-if="interview.location">地点: {{ interview.location }}</div>
          <div v-if="interview.meeting_link">会议链接: {{ interview.meeting_link }}</div>
        </n-thing>
      </n-list-item>
      <n-list-item v-if="interviews.length === 0">
        <div style="text-align: center; color: #999; padding: 40px">
          暂无面试安排
        </div>
      </n-list-item>
    </n-list>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { interviewTypeLabels, interviewStatusLabels, formatDateTime } from '~/utils/dict'
import type { Interview } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const interviews = ref<Interview[]>([])

const interviewStatusColors: Record<string, string> = {
  scheduled: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'default',
  no_show: 'error',
}

async function loadInterviews() {
  try {
    const res = await api.get('/interviews/my')
    interviews.value = res.data
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadInterviews()
})
</script>

<style scoped>
.iv-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.iv-title {
  font-size: 16px;
  font-weight: 600;
}
.iv-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
</style>
