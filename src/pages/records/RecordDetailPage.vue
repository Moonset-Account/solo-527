<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AttachmentManager from '@/components/records/AttachmentManager.vue'
import NoteEditor from '@/components/records/NoteEditor.vue'
import ChangeHistory from '@/components/records/ChangeHistory.vue'
import type { Attachment, ChangeLog } from '@/types'

const route = useRoute()
const recordId = computed(() => route.params.id as string || 'unknown')
const recordType = computed(() => (route.query.type as string) || '通用')

const note = ref('')
const attachments = ref<Attachment[]>([
  { id: '1', fileName: '采购合同.pdf', fileSize: 256000, fileType: 'pdf', url: '#', uploadedBy: '张经理', uploadedAt: '2026-06-10', relatedType: recordType.value, relatedId: recordId.value },
  { id: '2', fileName: '产品照片.jpg', fileSize: 1280000, fileType: 'image', url: '#', uploadedBy: '李顾问', uploadedAt: '2026-06-12', relatedType: recordType.value, relatedId: recordId.value },
])

const changeLogs = ref<ChangeLog[]>([
  { id: '1', entityType: recordType.value, entityId: recordId.value, field: '库存数量', oldValue: '25', newValue: '45', changedBy: '张经理', changedAt: '2026-06-15T09:30:00Z' },
  { id: '2', entityType: recordType.value, entityId: recordId.value, field: '状态', oldValue: '不足', newValue: '正常', changedBy: '系统', changedAt: '2026-06-15T09:30:00Z' },
  { id: '3', entityType: recordType.value, entityId: recordId.value, field: '位置', oldValue: 'A-01', newValue: 'A-02', changedBy: '张经理', changedAt: '2026-06-14T14:00:00Z' },
])

function handleUpload(files: File[]) {
  for (const file of files) {
    attachments.value.push({
      id: `ATT-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type.split('/')[1] || 'unknown',
      url: '#',
      uploadedBy: '当前用户',
      uploadedAt: new Date().toISOString(),
    })
  }
}

function handleDelete(id: string) {
  attachments.value = attachments.value.filter((a) => a.id !== id)
}

function handleNoteSave(content: string) {
  note.value = content
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">记录详情</h1>
      <p class="text-sm text-grayrose mt-1">{{ recordType }} · ID: {{ recordId }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-rosegold/10 p-5">
          <h3 class="text-sm font-medium text-gray-800 mb-4">附件管理</h3>
          <AttachmentManager :attachments="attachments" @upload="handleUpload" @delete="handleDelete" />
        </div>
        <div class="bg-white rounded-xl border border-rosegold/10 p-5">
          <NoteEditor v-model="note" @save="handleNoteSave" />
        </div>
      </div>
      <div class="bg-white rounded-xl border border-rosegold/10 p-5">
        <h3 class="text-sm font-medium text-gray-800 mb-4">变更历史</h3>
        <ChangeHistory :changes="changeLogs" />
      </div>
    </div>
  </div>
</template>
