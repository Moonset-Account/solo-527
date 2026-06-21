<template>
  <div
    class="inline-flex items-center group relative"
  >
    <NTag
      :bordered="false"
      :type="tagType"
      class="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      round
      size="medium"
    >
      <div class="flex items-center">
        <NIcon :size="14" class="mr-1.5 opacity-80">
          <FileTextOutlined />
        </NIcon>
        <span class="font-medium text-sm">{{ source.title }}</span>
        <span class="ml-2 text-xs opacity-75">
          {{ similarityPercent }}%
        </span>
      </div>
    </NTag>
    <div
      class="absolute z-50 left-0 top-full mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-0 group-hover:translate-y-0"
    >
      <div class="bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
        <div class="px-4 py-3 bg-gradient-to-r from-deep-blue-50 to-white border-b border-slate-100">
          <div class="flex items-center justify-between">
            <p class="font-charter font-bold text-deep-blue-900 text-sm">{{ source.title }}</p>
            <NTag
              size="small"
              round
              type="warning"
              :bordered="false"
            >
              相似度 {{ similarityPercent }}%
            </NTag>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <NTag v-for="tag in source.tags" :key="tag" size="tiny" :bordered="false" round class="!text-xs">
              {{ tag }}
            </NTag>
          </div>
        </div>
        <div class="p-4 max-h-56 overflow-y-auto">
          <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {{ source.content }}
          </p>
        </div>
        <div class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400">版本 {{ source.version }}</span>
          <button
            class="text-xs text-deep-blue-600 hover:text-deep-blue-800 font-medium"
            @click="$emit('view-detail', source)"
          >
            查看原文 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NTag } from 'naive-ui'
import { FileTextOutlined } from '@vicons/antd'
import type { KnowledgeBase } from '@/types'

interface Props {
  source: KnowledgeBase
  similarity?: number
}

const props = withDefaults(defineProps<Props>(), {
  similarity: 0.85
})

defineEmits<{
  (e: 'view-detail', source: KnowledgeBase): void
}>()

const similarityPercent = computed(() => Math.round(props.similarity * 100))

const tagType = computed(() => {
  const s = props.similarity
  if (s >= 0.9) return 'success' as const
  if (s >= 0.75) return 'warning' as const
  return 'info' as const
})
</script>
