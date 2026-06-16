<script setup lang="ts">
import { ref } from 'vue'
import { Upload, FileText, Download, Trash2 } from 'lucide-vue-next'
import type { Attachment } from '@/types'

const props = defineProps<{ attachments: Attachment[] }>()
const emit = defineEmits<{ upload: [File[]], delete: [string] }>()

const isDragging = ref(false)

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length) emit('upload', files)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length) emit('upload', files)
  input.value = ''
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}
</script>

<template>
  <div class="space-y-4">
    <div
      :class="[
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
        isDragging ? 'border-rosegold bg-rosegold/5' : 'border-rosegold/20 hover:border-rosegold/40',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="($refs.fileInput as HTMLInputElement)?.click()"
    >
      <Upload class="w-8 h-8 text-rosegold/40 mx-auto mb-2" />
      <p class="text-sm text-grayrose">拖拽文件至此处，或点击上传</p>
      <input ref="fileInput" type="file" multiple class="hidden" @change="onFileSelect" />
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div
        v-for="file in attachments"
        :key="file.id"
        class="flex items-center gap-3 p-3 bg-warmwhite rounded-lg border border-rosegold/10"
      >
        <div class="w-10 h-10 rounded-lg bg-rosegold/10 flex items-center justify-center flex-shrink-0">
          <FileText class="w-5 h-5 text-rosegold" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ file.fileName }}</p>
          <p class="text-xs text-grayrose">{{ formatSize(file.fileSize) }} · {{ file.uploadedBy }}</p>
        </div>
        <div class="flex items-center gap-1">
          <button class="p-1 text-grayrose hover:text-rosegold transition-colors">
            <Download class="w-4 h-4" />
          </button>
          <button class="p-1 text-grayrose hover:text-coral transition-colors" @click="emit('delete', file.id)">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
