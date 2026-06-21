<template>
  <div class="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
    <div class="grid grid-cols-2 bg-slate-100/60 border-b border-slate-200">
      <div class="px-4 py-2.5 flex items-center text-sm font-medium text-slate-500">
        <NIcon :size="14" class="mr-2"><FileOutlined /></NIcon>
        {{ leftLabel }}
      </div>
      <div class="px-4 py-2.5 flex items-center text-sm font-medium text-deep-blue-700 border-l border-slate-200">
        <NIcon :size="14" class="mr-2"><EditOutlined /></NIcon>
        {{ rightLabel }}
      </div>
    </div>
    <div class="grid grid-cols-2 min-h-[200px]">
      <div class="p-4 border-r border-slate-200 bg-white/60 overflow-auto whitespace-pre-wrap text-sm text-slate-600 leading-relaxed" :class="{ 'font-mono': mono }">
        <span
          v-for="(segment, i) in leftSegments"
          :key="i"
          :class="segment.type === 'del' ? 'bg-red-100 line-through text-red-700 rounded px-0.5' : ''"
        >{{ segment.text }}</span>
        <span v-if="!leftText" class="text-slate-300 italic">无内容</span>
      </div>
      <div
        v-if="editable"
        class="relative"
      >
        <NInput
          v-model:value="editedText"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 20 }"
          class="h-full !border-0 !rounded-none"
          :placeholder="'在此编辑修改后的内容...'"
          @update:value="handleEdit"
        />
      </div>
      <div v-else class="p-4 bg-white overflow-auto whitespace-pre-wrap text-sm leading-relaxed" :class="{ 'font-mono': mono }">
        <span
          v-for="(segment, i) in rightSegments"
          :key="i"
          :class="segmentTypeClass(segment.type)"
        >{{ segment.text }}</span>
        <span v-if="!rightText" class="text-slate-300 italic">无内容</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { NIcon, NInput } from 'naive-ui'
import { FileOutlined, EditOutlined } from '@vicons/antd'

interface Segment {
  type: 'equal' | 'del' | 'add'
  text: string
}

interface Props {
  leftText: string
  rightText?: string
  leftLabel?: string
  rightLabel?: string
  editable?: boolean
  mono?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rightText: '',
  leftLabel: '原始内容',
  rightLabel: '修改后内容',
  editable: false,
  mono: false
})

const emit = defineEmits<{
  (e: 'update:rightText', value: string): void
}>()

const editedText = ref(props.rightText)

watch(
  () => props.rightText,
  (val) => { editedText.value = val }
)

function handleEdit(val: string) {
  emit('update:rightText', val)
}

function computeSegments(oldText: string, newText: string, mode: 'old' | 'new'): Segment[] {
  if (!oldText && !newText) return [{ type: 'equal', text: '' }]
  if (oldText === newText) return [{ type: 'equal', text: oldText }]

  const oldWords = oldText.split(/(\s+|[，。！？、；：""''（）【】《》,.!?;:()\[\]<>])/g).filter(Boolean)
  const newWords = newText.split(/(\s+|[，。！？、；：""''（）【】《》,.!?;:()\[\]<>])/g).filter(Boolean)

  if (mode === 'old') {
    const result: Segment[] = []
    let ni = 0
    for (let i = 0; i < oldWords.length; i++) {
      const oldWord = oldWords[i]
      const idx = newWords.indexOf(oldWord, ni)
      if (idx >= 0) {
        for (let j = ni; j < idx; j++) {}
        ni = idx + 1
        result.push({ type: 'equal', text: oldWord })
      } else {
        const last = result[result.length - 1]
        if (last && last.type === 'del') {
          last.text += oldWord
        } else {
          result.push({ type: 'del', text: oldWord })
        }
      }
    }
    return result
  } else {
    const result: Segment[] = []
    let oi = 0
    for (let i = 0; i < newWords.length; i++) {
      const newWord = newWords[i]
      const idx = oldWords.indexOf(newWord, oi)
      if (idx >= 0) {
        for (let j = oi; j < idx; j++) {}
        oi = idx + 1
        result.push({ type: 'equal', text: newWord })
      } else {
        const last = result[result.length - 1]
        if (last && last.type === 'add') {
          last.text += newWord
        } else {
          result.push({ type: 'add', text: newWord })
        }
      }
    }
    return result
  }
}

const leftSegments = computed(() => computeSegments(props.leftText, editedText.value || props.rightText, 'old'))
const rightSegments = computed(() => computeSegments(props.leftText, editedText.value || props.rightText, 'new'))

function segmentTypeClass(type: string) {
  if (type === 'add') return 'bg-emerald-100 text-emerald-800 rounded px-0.5 font-medium'
  if (type === 'del') return 'bg-red-100 line-through text-red-700 rounded px-0.5'
  return 'text-slate-700'
}
</script>
