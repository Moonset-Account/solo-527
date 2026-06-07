<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, FileText, Clock, AlertTriangle, MessageSquare } from 'lucide-vue-next'
import type { AnomalySample, AnswerTrajectory, QualityCheckHit, ManualNote } from '@/types'
import { useQualityStore } from '@/stores/quality'
import { useNotesStore } from '@/stores/notes'
import { formatDuration, formatDateTime, formatNumber, formatPercent } from '@/utils/format'
import { ANOMALY_TYPES, QUALITY_MARK_COLORS } from '@/utils/constants'
import TagBadge from './TagBadge.vue'
import NoteModal from './NoteModal.vue'

const props = defineProps<{
  visible: boolean
  sampleId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const qualityStore = useQualityStore()
const notesStore = useNotesStore()

const activeTab = ref<'trajectory' | 'quality' | 'notes'>('trajectory')
const showNoteModal = ref(false)

const sample = computed<AnomalySample | null>(() => {
  if (!props.sampleId) return null
  return qualityStore.getSampleById(props.sampleId)
})

const trajectory = computed<AnswerTrajectory[]>(() => {
  if (!props.sampleId) return []
  return qualityStore.getAnswerTrajectory(props.sampleId)
})

const qualityHits = computed<QualityCheckHit[]>(() => {
  if (!props.sampleId) return []
  return qualityStore.getQualityCheckHits(props.sampleId)
})

const sampleNotes = computed<ManualNote[]>(() => {
  if (!props.sampleId) return []
  return notesStore.getNotesByTarget('sample', props.sampleId)
})

const anomalyTypeNames = computed(() => {
  if (!sample.value) return []
  return sample.value.anomalyTypes.map(code => {
    const type = ANOMALY_TYPES.find(t => t.code === code)
    return type?.name || code
  })
})

watch(() => props.visible, () => {
  if (props.visible) {
    activeTab.value = 'trajectory'
  }
})

function formatTime(time: string) {
  return formatDateTime(time)
}

function getAnomalyVariant(code: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    duration: 'danger',
    skip: 'warning',
    ip: 'info',
    device: 'warning',
    duplicate: 'danger',
    quality: 'info',
  }
  return map[code] || 'info'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')"></div>
        <div class="absolute right-0 top-0 h-full w-[560px] bg-survey-surface border-l border-survey-border shadow-2xl animate-slide-in-right flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-survey-border flex-shrink-0">
            <div>
              <h3 class="text-lg font-semibold text-survey-text-primary">样本详情</h3>
              <p v-if="sample" class="text-sm text-survey-text-muted font-mono mt-0.5">{{ sample.sampleId }}</p>
            </div>
            <button
              @click="emit('close')"
              class="p-1.5 rounded-md hover:bg-survey-surface-hover transition-colors text-survey-text-muted hover:text-survey-text-primary"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="sample" class="flex-1 overflow-y-auto">
            <div class="px-6 py-4 border-b border-survey-border">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">问卷名称</p>
                  <p class="text-survey-text-primary">{{ sample.surveyName }}</p>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">来源渠道</p>
                  <p class="text-survey-text-primary">{{ sample.channelName }}</p>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">地区</p>
                  <p class="text-survey-text-primary">{{ sample.region }}</p>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">设备类型</p>
                  <p class="text-survey-text-primary">{{ sample.deviceType }}</p>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">答题时长</p>
                  <p class="text-survey-text-primary font-mono">{{ formatDuration(sample.duration) }}</p>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">提交时间</p>
                  <p class="text-survey-text-primary text-sm">{{ formatTime(sample.submitTime) }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-survey-text-muted text-xs mb-1">异常类型</p>
                  <div class="flex flex-wrap gap-1.5">
                    <TagBadge
                      v-for="(type, idx) in anomalyTypeNames"
                      :key="idx"
                      :text="type"
                      :variant="getAnomalyVariant(sample.anomalyTypes[idx])"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">质检标记</p>
                  <TagBadge
                    :text="sample.qualityMark === 'pass' ? '通过' : sample.qualityMark === 'warning' ? '警告' : '未通过'"
                    :variant="sample.qualityMark === 'pass' ? 'success' : sample.qualityMark === 'warning' ? 'warning' : 'danger'"
                  />
                </div>
                <div>
                  <p class="text-survey-text-muted text-xs mb-1">跳题情况</p>
                  <p class="text-survey-text-primary font-mono">
                    {{ sample.skipCount }} / {{ sample.totalQuestions }} 题
                    ({{ formatPercent(sample.skipCount / sample.totalQuestions) }})
                  </p>
                </div>
              </div>
            </div>

            <div class="flex border-b border-survey-border">
              <button
                @click="activeTab = 'trajectory'"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2"
                :class="activeTab === 'trajectory'
                  ? 'text-survey-primary border-survey-primary'
                  : 'text-survey-text-muted border-transparent hover:text-survey-text-secondary'"
              >
                <Clock class="w-4 h-4" />
                答题轨迹
              </button>
              <button
                @click="activeTab = 'quality'"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2"
                :class="activeTab === 'quality'
                  ? 'text-survey-primary border-survey-primary'
                  : 'text-survey-text-muted border-transparent hover:text-survey-text-secondary'"
              >
                <AlertTriangle class="w-4 h-4" />
                质检详情
              </button>
              <button
                @click="activeTab = 'notes'"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2"
                :class="activeTab === 'notes'
                  ? 'text-survey-primary border-survey-primary'
                  : 'text-survey-text-muted border-transparent hover:text-survey-text-secondary'"
              >
                <MessageSquare class="w-4 h-4" />
                人工备注
              </button>
            </div>

            <div class="p-4">
              <div v-if="activeTab === 'trajectory'">
                <div class="space-y-2">
                  <div
                    v-for="(item, idx) in trajectory"
                    :key="item.questionId"
                    class="flex items-start gap-3 p-3 bg-survey-bg rounded-lg border border-survey-border"
                    :class="{ 'opacity-50': item.isSkipped }"
                  >
                    <div class="w-6 h-6 rounded-full bg-survey-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-xs font-mono text-survey-text-muted">{{ idx + 1 }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-survey-text-primary mb-1">{{ item.questionTitle }}</p>
                      <div class="flex items-center gap-3 text-xs">
                        <span class="text-survey-text-muted">
                          <Clock class="w-3 h-3 inline mr-1" />
                          {{ item.duration }} 秒
                        </span>
                        <span v-if="item.isSkipped" class="text-survey-warning">已跳过</span>
                        <span v-else class="text-survey-text-secondary truncate">答案: {{ item.answerValue }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'quality'">
                <div v-if="qualityHits.length > 0" class="space-y-3">
                  <div
                    v-for="hit in qualityHits"
                    :key="hit.ruleId"
                    class="p-4 bg-survey-bg rounded-lg border border-survey-border"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <h4 class="text-sm font-medium text-survey-text-primary">{{ hit.ruleName }}</h4>
                      <TagBadge
                        :text="hit.severity === 'high' ? '高风险' : hit.severity === 'medium' ? '中风险' : '低风险'"
                        :variant="hit.severity === 'high' ? 'danger' : hit.severity === 'medium' ? 'warning' : 'info'"
                      />
                    </div>
                    <p class="text-sm text-survey-text-secondary mb-2">{{ hit.ruleDescription }}</p>
                    <div class="flex items-center gap-4 text-xs">
                      <span class="text-survey-text-muted">阈值: <span class="text-survey-text-secondary font-mono">{{ hit.threshold }}</span></span>
                      <span class="text-survey-text-muted">实际值: <span class="text-survey-danger font-mono">{{ hit.hitValue }}</span></span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8 text-survey-text-muted">
                  <AlertTriangle class="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无质检规则命中记录</p>
                </div>
              </div>

              <div v-if="activeTab === 'notes'">
                <button
                  @click="showNoteModal = true"
                  class="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-survey-primary/10 text-survey-primary text-sm font-medium rounded-lg border border-survey-primary/30 hover:bg-survey-primary/20 transition-colors"
                >
                  <MessageSquare class="w-4 h-4" />
                  添加备注
                </button>
                <div v-if="sampleNotes.length > 0" class="space-y-3">
                  <div
                    v-for="note in sampleNotes"
                    :key="note.noteId"
                    class="p-3 bg-survey-bg rounded-lg border border-survey-border"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-survey-text-primary">{{ note.author }}</span>
                      <span class="text-xs text-survey-text-muted">{{ formatTime(note.createTime) }}</span>
                    </div>
                    <p class="text-sm text-survey-text-secondary">{{ note.content }}</p>
                    <div v-if="note.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                      <TagBadge v-for="tag in note.tags" :key="tag" :text="tag" variant="primary" />
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8 text-survey-text-muted">
                  <MessageSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无备注记录</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <NoteModal
      v-if="sample"
      :visible="showNoteModal"
      target-type="sample"
      :target-id="sample.sampleId"
      :target-name="`样本 ${sample.sampleId}`"
      @close="showNoteModal = false"
      @saved="showNoteModal = false"
    />
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
