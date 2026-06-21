<template>
  <div class="space-y-3">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">
        驳回原因 <span class="text-red-500">*</span>
      </label>
      <NSelect
        v-model:value="selectedReasons"
        :options="reasonOptions"
        multiple
        :max-tag-count="3"
        placeholder="请选择驳回原因（可多选）"
        class="w-full"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">
        详细备注
      </label>
      <NInput
        v-model:value="remark"
        type="textarea"
        :rows="4"
        placeholder="请输入具体的修改建议或说明..."
        maxlength="500"
        show-count
      />
    </div>
    <div v-if="showQuickTemplates" class="pt-2 border-t border-slate-100">
      <p class="text-xs text-slate-400 mb-2">常用备注模板：</p>
      <div class="flex flex-wrap gap-2">
        <NButton
          v-for="tpl in quickTemplates"
          :key="tpl.label"
          size="tiny"
          type="default"
          ghost
          @click="applyTemplate(tpl)"
        >
          {{ tpl.label }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NSelect, NInput, NButton } from 'naive-ui'

interface QuickTemplate {
  label: string
  reasons: string[]
  remark: string
}

interface Props {
  modelValue?: { reasons: string[]; remark: string }
  showQuickTemplates?: boolean
  customReasons?: { label: string; value: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  showQuickTemplates: true,
  customReasons: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: { reasons: string[]; remark: string }): void
}>()

const defaultReasons = [
  { label: '绝对化用语', value: 'abs_language' },
  { label: '违规承诺收益', value: 'promise_profit' },
  { label: '缺少风险提示', value: 'missing_risk' },
  { label: '客户信息风险', value: 'privacy_risk' },
  { label: '发送时间不当', value: 'bad_time' },
  { label: '语气/措辞不当', value: 'bad_tone' },
  { label: '内容错误', value: 'wrong_content' },
  { label: '格式/排版问题', value: 'format_issue' },
  { label: '其他', value: 'other' }
]

const reasonOptions = computed(() =>
  props.customReasons.length > 0 ? props.customReasons : defaultReasons
)

const selectedReasons = ref<string[]>(props.modelValue?.reasons || [])
const remark = ref(props.modelValue?.remark || '')

watch(
  [selectedReasons, remark],
  () => {
    emit('update:modelValue', { reasons: [...selectedReasons.value], remark: remark.value })
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      selectedReasons.value = [...val.reasons]
      remark.value = val.remark
    }
  },
  { deep: true }
)

const quickTemplates: QuickTemplate[] = [
  {
    label: '合规问题通用',
    reasons: ['abs_language', 'missing_risk'],
    remark: '邮件中存在绝对化用语及风险提示缺失问题，请根据《营销邮件合规审核标准》修改后重新提交。'
  },
  {
    label: '收益承诺违规',
    reasons: ['promise_profit'],
    remark: '禁止承诺保本保收益，请将表述改为预期收益或业绩比较基准，并增加相应的风险提示。'
  },
  {
    label: '措辞优化建议',
    reasons: ['bad_tone'],
    remark: '建议优化整体措辞，使其更符合正式商务邮件规范，语气可更加专业得体。'
  }
]

function applyTemplate(tpl: QuickTemplate) {
  selectedReasons.value = [...new Set([...selectedReasons.value, ...tpl.reasons])]
  remark.value = tpl.remark
}
</script>
