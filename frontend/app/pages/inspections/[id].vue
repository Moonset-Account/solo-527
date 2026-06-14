<template>
  <div>
    <n-spin :show="loading">
      <n-page-header @back="router.back()" title="巡检任务详情" style="margin-bottom: 16px" />

      <n-card title="任务基本信息" size="small" style="margin-bottom: 16px">
        <n-descriptions :column="2" label-placement="left" label-style="width: 100px">
          <n-descriptions-item label="任务编号">XJ-{{ String(task?.id || 0).padStart(4, '0') }}</n-descriptions-item>
          <n-descriptions-item label="节点名称">{{ task?.node_name }}</n-descriptions-item>
          <n-descriptions-item label="合同">{{ task?.contract_name }}</n-descriptions-item>
          <n-descriptions-item label="巡检员">{{ task?.inspector_name || '未分配' }}</n-descriptions-item>
          <n-descriptions-item label="计划日期">{{ task?.deadline?.slice(0, 10) }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="statusTagType(task?.status)" size="small">{{ statusLabel(task?.status) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ task?.created_at?.slice(0, 10) }}</n-descriptions-item>
          <n-descriptions-item label="是否延期">
            <n-tag v-if="task?.is_delayed" size="small" type="error">是</n-tag>
            <n-tag v-else size="small" type="success">否</n-tag>
          </n-descriptions-item>
        </n-descriptions>
        <n-space style="margin-top: 16px">
          <n-button v-if="task?.status === 'pending'" type="primary" size="small" @click="changeStatus('in_progress')">开始巡检</n-button>
          <n-button v-if="task?.status === 'in_progress'" type="success" size="small" @click="changeStatus('completed')">标记完成</n-button>
          <n-button v-if="task?.status === 'completed'" type="info" size="small" @click="changeStatus('accepted')">确认验收</n-button>
        </n-space>
      </n-card>

      <n-card v-if="task && (task.status === 'in_progress' || task.status === 'completed' || task.status === 'accepted')" title="巡检记录" size="small">
        <n-form ref="formRef" :model="recordForm" label-placement="left" label-width="100">
          <n-form-item label="质量评分">
            <n-rate v-model:value="recordForm.quality_score" :count="5" :allow-half="false" />
          </n-form-item>
          <n-form-item label="问题描述">
            <n-input v-model:value="recordForm.description" type="textarea" :rows="4" placeholder="请输入问题描述" />
          </n-form-item>
          <n-form-item label="现场照片">
            <n-space>
              <div v-for="(photo, index) in recordForm.photos" :key="index" style="position: relative; width: 100px; height: 100px; border: 1px dashed #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fafafa;">
                <n-icon size="24" color="#999"><ImageOutline /></n-icon>
                <n-button size="tiny" type="error" text style="position: absolute; top: 2px; right: 2px" @click="removePhoto(index)">×</n-button>
              </div>
              <div v-if="(recordForm.photos?.length || 0) < 5" style="width: 100px; height: 100px; border: 1px dashed #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #fafafa;" @click="addPhoto">
                <n-icon size="24" color="#999"><AddOutline /></n-icon>
              </div>
            </n-space>
            <n-text depth="3" style="font-size: 12px; display: block; margin-top: 4px">最多上传5张照片（演示模式，点击添加模拟照片）</n-text>
          </n-form-item>
          <n-form-item label="验收结果">
            <n-radio-group v-model:value="recordForm.conclusion">
              <n-space>
                <n-radio value="pass">合格</n-radio>
                <n-radio value="conditional_pass">有条件通过</n-radio>
                <n-radio value="fail">不合格</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="task.status === 'in_progress'">
            <n-space>
              <n-button type="primary" :loading="submitting" @click="handleSubmit">提交记录</n-button>
              <n-button @click="handleReset">重置</n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </n-card>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useMessage, type FormInst } from 'naive-ui'
import { ImageOutline, AddOutline } from '@vicons/ionicons5'
import { useInspectionsStore } from '~/stores/inspections'
import { useAuthStore } from '~/stores/auth'
import { inspectionApi } from '~/utils/api'
import type { InspectionTask, InspectionRecord } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const store = useInspectionsStore()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)

const task = ref<InspectionTask | null>(null)
const loading = ref(true)
const submitting = ref(false)

const recordForm = reactive<Partial<InspectionRecord>>({
  quality_score: 0,
  description: '',
  conclusion: undefined as 'pass' | 'fail' | 'conditional_pass' | undefined,
  photos: [],
})

function statusLabel(status?: string) {
  const map: Record<string, string> = { pending: '待分派', in_progress: '进行中', completed: '已完成', accepted: '已验收' }
  return map[status ?? ''] ?? status ?? ''
}

function statusTagType(status?: string) {
  const map: Record<string, any> = { pending: 'default', in_progress: 'warning', completed: 'success', accepted: 'info' }
  return map[status ?? ''] ?? 'default'
}

function addPhoto() {
  if (!recordForm.photos) recordForm.photos = []
  if (recordForm.photos.length >= 5) {
    message.warning('最多上传5张照片')
    return
  }
  recordForm.photos.push(`photo_${Date.now()}.jpg`)
}

function removePhoto(index: number) {
  if (recordForm.photos) {
    recordForm.photos.splice(index, 1)
  }
}

async function loadData() {
  const id = Number(route.params.id)
  loading.value = true
  try {
    const res = await inspectionApi.get(id)
    task.value = res
  } catch (e: any) {
    message.error(e?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

async function changeStatus(status: string) {
  if (!task.value) return
  try {
    const res = await store.updateStatus(task.value.id, status)
    message.success('状态更新成功')
    task.value = res
  } catch (e: any) {
    message.error(e?.data?.detail || '状态更新失败')
  }
}

async function handleSubmit() {
  if (!task.value) return
  if (!recordForm.quality_score || recordForm.quality_score < 1) {
    message.warning('请选择质量评分')
    return
  }
  if (!recordForm.conclusion) {
    message.warning('请选择验收结果')
    return
  }
  submitting.value = true
  try {
    await store.submitRecord(task.value.id, recordForm)
    message.success('巡检记录提交成功')
    if (task.value.status === 'in_progress') {
      const res = await store.updateStatus(task.value.id, 'completed')
      task.value = res
    }
  } catch (e: any) {
    message.error(e?.data?.detail || '提交失败')
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  recordForm.quality_score = 0
  recordForm.description = ''
  recordForm.conclusion = undefined
  recordForm.photos = []
}

onMounted(() => {
  authStore.init()
  loadData()
})
</script>
