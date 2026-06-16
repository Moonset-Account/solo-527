<script setup lang="ts">
import { ref, watch } from 'vue'
import { Save } from 'lucide-vue-next'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string], save: [string] }>()

const content = ref(props.modelValue)
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (val) => { content.value = val })

watch(content, (val) => {
  emit('update:modelValue', val)
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    emit('save', val)
  }, 2000)
})

function handleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  emit('save', content.value)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">备注</label>
      <button
        class="flex items-center gap-1 text-xs text-rosegold hover:text-rosegold/80 transition-colors"
        @click="handleSave"
      >
        <Save class="w-3.5 h-3.5" />
        保存
      </button>
    </div>
    <textarea
      v-model="content"
      rows="4"
      placeholder="添加备注信息..."
      class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite resize-none"
    />
    <p class="text-xs text-grayrose/40">修改后2秒自动保存</p>
  </div>
</template>
