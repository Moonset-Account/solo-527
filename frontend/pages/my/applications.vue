<template>
  <n-card :bordered="false">
    <template #header>我的投递</template>
    <n-list bordered>
      <n-list-item v-for="app in applications" :key="app.id" style="padding: 16px">
        <n-thing>
          <template #header>
            <div class="app-header">
              <span class="app-title">{{ app.position?.title || '职位#' + app.position_id }}</span>
              <n-tag :type="statusColors[app.status] as any">
                {{ statusLabels[app.status] }}
              </n-tag>
            </div>
          </template>
          <template #description>
            <div class="app-meta">
              <span>{{ app.position?.department || '-' }}</span>
              <span>· {{ app.position?.city || '-' }}</span>
            </div>
          </template>
          当前阶段: {{ stageLabels[app.current_stage] }}
          <template #action>
            <n-button size="small" @click="viewProgress(app.id)">查看进度</n-button>
          </template>
        </n-thing>
      </n-list-item>
      <n-list-item v-if="applications.length === 0">
        <div style="text-align: center; color: #999; padding: 40px">
          暂无投递记录，去
          <n-text type="success" style="cursor: pointer" @click="navigateTo('/positions')">
            浏览职位
          </n-text>
        </div>
      </n-list-item>
    </n-list>
  </n-card>

  <n-modal v-model:show="showProgress" preset="card" title="投递进度" :style="{ width: '500px' }">
    <n-steps v-if="currentApp" :current="currentStepIndex" vertical size="small">
      <n-step v-for="(stage, index) in stages" :key="stage.key" :title="stage.label">
        <template #description>
          <span v-if="index <= currentStepIndex" style="color: #999; font-size: 12px">
            {{ getStageTime(stage.key) }}
          </span>
          <span v-else style="color: #ccc; font-size: 12px">未开始</span>
        </template>
      </n-step>
    </n-steps>
    <template #footer>
      <n-button @click="showProgress = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '~/utils/api'
import { statusLabels, statusColors, stageLabels, formatDateTime } from '~/utils/dict'
import type { Application, StatusHistory } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const applications = ref<Application[]>([])
const showProgress = ref(false)
const currentApp = ref<Application | null>(null)
const history = ref<StatusHistory[]>([])

const stages = [
  { key: 'resume_screen', label: '简历筛选' },
  { key: 'assessment', label: '在线测评' },
  { key: 'tech_interview', label: '技术面试' },
  { key: 'hr_interview', label: 'HR面试' },
  { key: 'offer', label: 'Offer发放' },
  { key: 'onboarding', label: '入职' },
]

const currentStepIndex = computed(() => {
  if (!currentApp.value) return 0
  const stageIndex = stages.findIndex(s => s.key === currentApp.value?.current_stage)
  return stageIndex >= 0 ? stageIndex : 0
})

function getStageTime(stageKey: string): string {
  const h = history.value.find(item => item.to_stage === stageKey)
  return h ? formatDateTime(h.changed_at) : '-'
}

async function loadApplications() {
  try {
    const res = await api.get('/applications/my')
    applications.value = res.data
  } catch (e) {
    // ignore
  }
}

async function viewProgress(id: number) {
  try {
    const [appRes, historyRes] = await Promise.all([
      api.get(`/applications/${id}`),
      api.get(`/applications/${id}/history`),
    ])
    currentApp.value = appRes.data
    history.value = historyRes.data
    showProgress.value = true
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.app-title {
  font-size: 16px;
  font-weight: 600;
}
.app-meta {
  color: #666;
  font-size: 13px;
  display: flex;
  gap: 4px;
}
</style>
