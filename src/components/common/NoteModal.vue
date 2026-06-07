<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Tag, Send } from 'lucide-vue-next'
import type { ManualNote } from '@/types'
import { useNotesStore } from '@/stores/notes'

const props = defineProps<{
  visible: boolean
  targetType: ManualNote['targetType']
  targetId: string
  targetName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const notesStore = useNotesStore()

const content = ref('')
const selectedTags = ref<string[]>([])
const availableTags = ['无效样本', '机器人', '渠道异常', '刷量', '需复核', '已处理', '数据问题']

const existingNotes = ref<ManualNote[]>([])

watch(() => [props.visible, props.targetId], () => {
  if (props.visible) {
    existingNotes.value = notesStore.getNotesByTarget(props.targetType, props.targetId)
    content.value = ''
    selectedTags.value = []
  }
}, { immediate: true })

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function saveNote() {
  if (!content.value.trim()) return
  notesStore.addNote({
    targetType: props.targetType,
    targetId: props.targetId,
    content: content.value.trim(),
    tags: [...selectedTags.value],
  })
  content.value = ''
  selectedTags.value = []
  existingNotes.value = notesStore.getNotesByTarget(props.targetType, props.targetId)
  emit('saved')
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="emit('close')"></div>
        <div class="relative bg-survey-surface border border-survey-border rounded-xl w-full max-w-lg mx-4 shadow-2xl animate-scale-in">
          <div class="flex items-center justify-between px-6 py-4 border-b border-survey-border">
            <div>
              <h3 class="text-lg font-semibold text-survey-text-primary">人工备注</h3>
              <p v-if="targetName" class="text-sm text-survey-text-muted mt-0.5">{{ targetName }}</p>
            </div>
            <button
              @click="emit('close')"
              class="p-1.5 rounded-md hover:bg-survey-surface-hover transition-colors text-survey-text-muted hover:text-survey-text-primary"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="px-6 py-4 max-h-96 overflow-y-auto">
            <div v-if="existingNotes.length > 0" class="mb-6">
              <h4 class="text-sm font-medium text-survey-text-secondary mb-3">历史备注</h4>
              <div class="space-y-3">
                <div
                  v-for="note in existingNotes"
                  :key="note.noteId"
                  class="bg-survey-bg rounded-lg p-3 border border-survey-border"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-survey-text-primary">{{ note.author }}</span>
                    <span class="text-xs text-survey-text-muted">{{ formatTime(note.createTime) }}</span>
                  </div>
                  <p class="text-sm text-survey-text-secondary">{{ note.content }}</p>
                  <div v-if="note.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                    <span
                      v-for="tag in note.tags"
                      :key="tag"
                      class="px-2 py-0.5 text-xs bg-survey-secondary/10 text-survey-secondary rounded border border-survey-secondary/30"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-survey-text-secondary mb-2 flex items-center gap-2">
                <Tag class="w-4 h-4" />
                添加标签
              </h4>
              <div class="flex flex-wrap gap-2 mb-4">
                <button
                  v-for="tag in availableTags"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="px-2.5 py-1 text-xs rounded-md border transition-all"
                  :class="selectedTags.includes(tag)
                    ? 'bg-survey-primary/20 text-survey-primary border-survey-primary/50'
                    : 'bg-survey-bg text-survey-text-secondary border-survey-border hover:border-survey-primary/30'"
                >
                  {{ tag }}
                </button>
              </div>

              <div>
                <textarea
                  v-model="content"
                  placeholder="输入备注内容..."
                  class="w-full h-24 bg-survey-bg border border-survey-border rounded-lg px-3 py-2 text-sm text-survey-text-primary placeholder-survey-text-muted resize-none focus:outline-none focus:border-survey-primary/50 transition-colors"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-survey-border">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-sm text-survey-text-secondary hover:text-survey-text-primary transition-colors"
            >
              取消
            </button>
            <button
              @click="saveNote"
              :disabled="!content.trim()"
              class="flex items-center gap-2 px-4 py-2 bg-survey-primary text-white text-sm font-medium rounded-md hover:bg-survey-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send class="w-4 h-4" />
              保存备注
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
