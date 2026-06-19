<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FileText, Paperclip, Upload, File, StickyNote, History, Send, Trash2, AlertCircle } from 'lucide-vue-next'
import dayjs from 'dayjs'
import { useRequirementsStore } from '@/stores/requirements'
import { useAuthStore } from '@/stores/auth'
import { requirementApi } from '@/api'
import type { CommentType, RequirementStatus } from '@/types'

const props = defineProps<{ id: string }>()

const router = useRouter()
const requirementsStore = useRequirementsStore()
const authStore = useAuthStore()

const activeCommentTab = ref<CommentType>('comment')
const newNoteContent = ref('')
const newCommentContent = ref('')
const newCommentType = ref<CommentType>('comment')
const isSubmittingNote = ref(false)
const isSubmittingComment = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const statusUpdating = ref(false)
const showStatusDropdown = ref(false)

const requirement = computed(() => requirementsStore.currentRequirement)
const isLoading = computed(() => requirementsStore.isLoading)
const canManage = computed(() => authStore.isPM || authStore.isAdmin)
const currentUserId = computed(() => authStore.user?.id)

const statusLabels: Record<RequirementStatus, string> = {
  draft: '草稿',
  pending: '待处理',
  in_progress: '进行中',
  overdue: '已逾期',
  completed: '已完成',
  closed: '已关闭',
}

const statusColors: Record<RequirementStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

const commentTypeLabels: Record<CommentType, string> = {
  comment: '评论',
  meeting_minute: '会议纪要',
  delay_reason: '延期原因',
}

const filteredComments = computed(() => {
  if (!requirement.value?.comments) return []
  return requirement.value.comments.filter((c) => c.type === activeCommentTab.value)
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function loadData() {
  const numId = Number(props.id)
  if (!isNaN(numId)) {
    await requirementsStore.fetchRequirement(numId)
  }
}

onMounted(loadData)

watch(() => props.id, () => {
  loadData()
})

async function updateStatus(status: RequirementStatus) {
  if (!requirement.value) return
  statusUpdating.value = true
  showStatusDropdown.value = false
  try {
    await requirementsStore.updateRequirement(requirement.value.id, { status })
  } finally {
    statusUpdating.value = false
  }
}

async function addNote() {
  if (!newNoteContent.value.trim() || !requirement.value) return
  isSubmittingNote.value = true
  try {
    await requirementApi.addNote(requirement.value.id, { content: newNoteContent.value.trim() })
    newNoteContent.value = ''
    await requirementsStore.fetchRequirement(requirement.value.id)
  } finally {
    isSubmittingNote.value = false
  }
}

async function addComment() {
  if (!newCommentContent.value.trim() || !requirement.value) return
  isSubmittingComment.value = true
  try {
    await requirementApi.addComment(requirement.value.id, {
      content: newCommentContent.value.trim(),
      type: newCommentType.value,
    })
    newCommentContent.value = ''
    await requirementsStore.fetchRequirement(requirement.value.id)
  } finally {
    isSubmittingComment.value = false
  }
}

async function handleFileUpload(files: FileList | File[]) {
  if (!requirement.value || !files.length) return
  isUploading.value = true
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      await requirementApi.uploadAttachment(requirement.value.id, formData)
    }
    await requirementsStore.fetchRequirement(requirement.value.id)
  } finally {
    isUploading.value = false
  }
}

function onFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFileUpload(target.files)
    target.value = ''
  }
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  if (event.dataTransfer?.files) {
    handleFileUpload(event.dataTransfer.files)
  }
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

async function deleteAttachment(attachmentId: number) {
  if (!requirement.value) return
  try {
    await requirementApi.deleteAttachment(requirement.value.id, attachmentId)
    await requirementsStore.fetchRequirement(requirement.value.id)
  } catch {}
}

async function toggleMissing(attachmentId: number, currentMissing: boolean) {
  if (!requirement.value) return
  try {
    await requirementApi.markAttachmentMissing(requirement.value.id, attachmentId, !currentMissing)
    await requirementsStore.fetchRequirement(requirement.value.id)
  } catch {}
}

async function sendReminder() {
  if (!requirement.value) return
  try {
    await requirementApi.update(requirement.value.id, {})
  } catch {}
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <a
      href="/requirements"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 transition-colors mb-4"
      @click.prevent="router.push('/requirements')"
    >
      <ArrowLeft class="w-4 h-4" />
      返回列表
    </a>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="requirement">
      <div class="card p-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <h1 class="text-2xl font-bold text-slate-800">{{ requirement.title }}</h1>
          <div class="flex items-center gap-2">
            <span :class="['badge', statusColors[requirement.status]]">
              {{ statusLabels[requirement.status] }}
            </span>
            <span :class="['badge', priorityColors[requirement.priority]]">
              {{ priorityLabels[requirement.priority] }}
            </span>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          <span>部门：{{ requirement.department }}</span>
          <span>创建人：{{ requirement.creator?.name ?? '-' }}</span>
          <span>负责人：{{ requirement.assignee?.name ?? '-' }}</span>
          <span>创建时间：{{ formatDate(requirement.createdAt) }}</span>
          <span>截止时间：{{ formatDate(requirement.deadline) }}</span>
        </div>

        <div v-if="canManage" class="mt-4 flex items-center gap-3">
          <div class="relative">
            <button
              class="btn-outline btn-sm flex items-center gap-1"
              @click="showStatusDropdown = !showStatusDropdown"
            >
              修改状态
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div
              v-if="showStatusDropdown"
              class="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10"
            >
              <button
                v-for="(label, key) in statusLabels"
                :key="key"
                class="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                :class="key === requirement.status ? 'text-amber-600 font-medium' : 'text-slate-600'"
                @click="updateStatus(key)"
              >
                {{ label }}
              </button>
            </div>
          </div>
          <button class="btn-accent btn-sm" @click="sendReminder">催办</button>
        </div>
      </div>

      <div class="card p-6 mt-4">
        <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <FileText class="w-5 h-5 text-amber-500" />
          需求描述
        </h2>
        <p class="text-slate-600 whitespace-pre-wrap leading-relaxed">
          {{ requirement.description }}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <Paperclip class="w-4 h-4 text-amber-500" />
              附件
            </h3>
            <label class="btn-outline btn-sm cursor-pointer">
              <Upload class="w-3.5 h-3.5" />
              <input type="file" multiple class="hidden" @change="onFileInput" />
            </label>
          </div>

          <div class="p-4 flex-1">
            <div
              class="border-2 border-dashed rounded-lg p-4 text-center text-sm text-slate-400 transition-colors"
              :class="isDragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200'"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
            >
              <Upload class="w-5 h-5 mx-auto mb-1" />
              拖拽文件到此处上传
            </div>

            <div v-if="isUploading" class="mt-3 text-xs text-amber-600">上传中...</div>

            <div v-if="requirement.attachments?.length" class="mt-3 space-y-2">
              <div
                v-for="att in requirement.attachments"
                :key="att.id"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group"
              >
                <File class="w-4 h-4 text-slate-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-700 truncate">{{ att.fileName }}</div>
                  <div class="text-xs text-slate-400">
                    {{ formatFileSize(att.fileSize) }} · {{ formatDate(att.createdAt) }}
                  </div>
                </div>
                <span
                  v-if="att.isMissing"
                  class="badge bg-red-100 text-red-600 text-xs shrink-0"
                >
                  <AlertCircle class="w-3 h-3 mr-0.5" />
                  缺失
                </span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    v-if="canManage"
                    class="p-1 text-xs rounded hover:bg-slate-200 text-slate-500"
                    @click="toggleMissing(att.id, att.isMissing)"
                  >
                    {{ att.isMissing ? '恢复' : '标记缺失' }}
                  </button>
                  <button
                    v-if="att.uploadedBy === currentUserId || canManage"
                    class="p-1 text-xs rounded hover:bg-red-100 text-red-500"
                    @click="deleteAttachment(att.id)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="mt-3 text-sm text-slate-400 text-center py-4">暂无附件</div>
          </div>
        </div>

        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <StickyNote class="w-4 h-4 text-amber-500" />
              备注
            </h3>
          </div>

          <div class="p-4 flex-1">
            <div class="mb-3">
              <textarea
                v-model="newNoteContent"
                class="input resize-none"
                rows="3"
                placeholder="添加备注..."
              />
              <button
                class="btn-accent btn-sm mt-2 w-full"
                :disabled="!newNoteContent.trim() || isSubmittingNote"
                @click="addNote"
              >
                添加备注
              </button>
            </div>

            <div v-if="requirement.notes?.length" class="space-y-3">
              <div
                v-for="note in requirement.notes"
                :key="note.id"
                class="p-3 bg-slate-50 rounded-lg"
              >
                <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ note.content }}</p>
                <div class="mt-1.5 text-xs text-slate-400">
                  {{ note.user?.name ?? '未知' }} · {{ formatDate(note.createdAt) }}
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-slate-400 text-center py-4">暂无备注</div>
          </div>
        </div>

        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-800">评论 & 纪要</h3>
              <div class="flex rounded-lg overflow-hidden border border-slate-200">
                <button
                  v-for="(label, key) in commentTypeLabels"
                  :key="key"
                  class="px-2.5 py-1 text-xs transition-colors"
                  :class="activeCommentTab === key
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'"
                  @click="activeCommentTab = key"
                >
                  {{ label }}
                </button>
              </div>
            </div>
          </div>

          <div class="p-4 flex-1">
            <div class="mb-3">
              <textarea
                v-model="newCommentContent"
                class="input resize-none"
                rows="3"
                :placeholder="`添加${commentTypeLabels[activeCommentTab]}...`"
              />
              <div class="flex gap-2 mt-2">
                <select v-model="newCommentType" class="select text-xs py-1.5 w-28">
                  <option v-for="(label, key) in commentTypeLabels" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
                <button
                  class="btn-accent btn-sm flex-1 flex items-center justify-center gap-1"
                  :disabled="!newCommentContent.trim() || isSubmittingComment"
                  @click="addComment"
                >
                  <Send class="w-3.5 h-3.5" />
                  提交
                </button>
              </div>
            </div>

            <div v-if="filteredComments.length" class="space-y-3">
              <div
                v-for="comment in filteredComments"
                :key="comment.id"
                class="p-3 bg-slate-50 rounded-lg"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge bg-amber-100 text-amber-700 text-xs">
                    {{ commentTypeLabels[comment.type] }}
                  </span>
                </div>
                <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ comment.content }}</p>
                <div class="mt-1.5 text-xs text-slate-400">
                  {{ comment.user?.name ?? '未知' }} · {{ formatDate(comment.createdAt) }}
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-slate-400 text-center py-4">暂无评论</div>
          </div>
        </div>
      </div>

      <div class="card p-6 mt-4">
        <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <History class="w-5 h-5 text-amber-500" />
          修改历史
        </h2>

        <div v-if="requirement.histories?.length" class="relative pl-6 border-l-2 border-slate-200 space-y-4">
          <div
            v-for="h in requirement.histories"
            :key="h.id"
            class="relative"
          >
            <div class="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
            <div class="text-xs text-slate-400 mb-0.5">{{ formatDate(h.createdAt) }}</div>
            <div class="text-sm text-slate-600">
              <span class="font-medium text-slate-700">{{ h.user?.name ?? '未知' }}</span>
              ：{{ h.field }}：<span class="text-slate-400">{{ h.oldValue ?? '无' }}</span>
              → <span class="text-amber-600">{{ h.newValue ?? '无' }}</span>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-slate-400 text-center py-4">暂无修改记录</div>
      </div>
    </template>
  </div>
</template>
