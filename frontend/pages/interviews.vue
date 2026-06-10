<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>面试管理</span>
        <div class="actions">
          <n-select
            v-model:value="filterStatus"
            placeholder="状态筛选"
            :options="statusOptions"
            style="width: 140px"
            clearable
            @update:value="loadInterviews"
          />
          <n-button type="primary" @click="showCreate = true">安排面试</n-button>
        </div>
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="interviews"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadInterviews"
      @update:page-size="loadInterviews"
    />
  </n-card>

  <n-modal v-model:show="showCreate" preset="dialog" title="安排面试" :style="{ width: '500px' }">
    <n-form :model="form" label-placement="top">
      <n-form-item label="关联投递ID">
        <n-input-number v-model:value="form.application_id" :min="1" style="width: 100%" />
      </n-form-item>
      <n-form-item label="面试类型">
        <n-select v-model:value="form.interview_type" :options="typeOptions" />
      </n-form-item>
      <n-form-item label="面试标题">
        <n-input v-model:value="form.title" placeholder="如：技术一面" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="开始时间">
            <n-date-picker
              v-model:value="form.start_time"
              type="datetime"
              style="width: 100%"
              format="yyyy-MM-dd HH:mm:ss"
              @update:value="checkConflict"
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="结束时间">
            <n-date-picker
              v-model:value="form.end_time"
              type="datetime"
              style="width: 100%"
              format="yyyy-MM-dd HH:mm:ss"
              @update:value="checkConflict"
            />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-alert v-if="conflictInfo?.has_conflict" type="warning" style="margin-bottom: 12px">
        检测到时间冲突！冲突面试数: {{ conflictInfo.conflicts.length }}
      </n-alert>
      <n-form-item label="面试地点/链接">
        <n-input v-model:value="form.location" placeholder="如：会议室A301" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showCreate = false">取消</n-button>
      <n-button type="primary" :loading="creating" @click="createInterview">确认安排</n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="showResult" preset="dialog" title="面试结果评价" :style="{ width: '450px' }">
    <n-form :model="resultForm" label-placement="top">
      <n-form-item label="面试结果">
        <n-select v-model:value="resultForm.result" :options="resultOptions" />
      </n-form-item>
      <n-form-item label="评分">
        <n-input-number v-model:value="resultForm.score" :min="0" :max="100" style="width: 100%" />
      </n-form-item>
      <n-form-item label="评价反馈">
        <n-input v-model:value="resultForm.feedback" type="textarea" :rows="4" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showResult = false">取消</n-button>
      <n-button type="primary" @click="submitResult">提交</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import {
  interviewTypeLabels, interviewStatusLabels, interviewResultLabels,
  formatDateTime,
} from '~/utils/dict'
import type { Interview } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const interviews = ref<Interview[]>([])
const loading = ref(false)
const filterStatus = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showCreate = ref(false)
const creating = ref(false)
const conflictInfo = ref<any>(null)

const showResult = ref(false)
const currentInterviewId = ref<number | null>(null)

const form = ref({
  application_id: 1,
  interview_type: 'video',
  title: '',
  start_time: null as any,
  end_time: null as any,
  location: '',
  interviewer_ids: '',
})

const resultForm = ref({
  result: 'pending',
  score: null as number | null,
  feedback: '',
})

const statusOptions = Object.entries(interviewStatusLabels).map(([value, label]) => ({ label, value }))
const typeOptions = Object.entries(interviewTypeLabels).map(([value, label]) => ({ label, value }))
const resultOptions = Object.entries(interviewResultLabels).map(([value, label]) => ({ label, value }))

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '标题', key: 'title' },
  {
    title: '类型',
    key: 'interview_type',
    render(row: any) {
      return interviewTypeLabels[row.interview_type] || '-'
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row: any) {
      return interviewStatusLabels[row.status] || '-'
    },
  },
  {
    title: '开始时间',
    key: 'start_time',
    render(row: any) {
      return formatDateTime(row.start_time)
    },
  },
  {
    title: '结果',
    key: 'result',
    render(row: any) {
      return interviewResultLabels[row.result] || '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      return h(
        'n-space',
        { size: 'small' },
        () => [
          h('n-button', { size: 'small', onClick: () => openResult(row.id) }, () => '评价'),
          h('n-button', { size: 'small', type: 'error', onClick: () => cancelInterview(row.id) }, () => '取消'),
        ]
      )
    },
  },
]

async function loadInterviews() {
  loading.value = true
  try {
    const res = await api.get('/interviews', {
      params: {
        status: filterStatus.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
      },
    })
    interviews.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function checkConflict() {
  if (!form.value.start_time || !form.value.end_time) return
  try {
    const res = await api.get('/interviews/check/conflict', {
      params: {
        start_time: form.value.start_time,
        end_time: form.value.end_time,
      },
    })
    conflictInfo.value = res.data
  } catch (e) {
    // ignore
  }
}

async function createInterview() {
  if (!form.value.application_id || !form.value.start_time || !form.value.end_time) {
    message.warning('请填写完整信息')
    return
  }
  creating.value = true
  try {
    await api.post('/interviews', form.value)
    message.success('面试安排成功')
    showCreate.value = false
    loadInterviews()
  } catch (err: any) {
    message.error(err.response?.data?.detail || '创建失败')
  } finally {
    creating.value = false
  }
}

function openResult(id: number) {
  currentInterviewId.value = id
  resultForm.value = { result: 'pending', score: null, feedback: '' }
  showResult.value = true
}

async function submitResult() {
  if (!currentInterviewId.value) return
  try {
    await api.post(`/interviews/${currentInterviewId.value}/result`, resultForm.value)
    message.success('评价提交成功')
    showResult.value = false
    loadInterviews()
  } catch (err: any) {
    message.error(err.response?.data?.detail || '提交失败')
  }
}

async function cancelInterview(id: number) {
  try {
    await api.post(`/interviews/${id}/cancel`)
    message.success('已取消')
    loadInterviews()
  } catch (e) {
    message.error('取消失败')
  }
}

onMounted(() => {
  loadInterviews()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
