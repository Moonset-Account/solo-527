<template>
  <n-modal v-model:show="innerVisible" preset="card" style="width: 520px;" title="一键生成月度排课">
    <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px;">
      将根据选定的星期和时间，批量为整个月生成重复排课（仅在未存在相同日期+时间+班级时创建）。
    </n-alert>
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <n-form-item label="班级" path="class_id">
        <n-select v-model:value="form.class_id" :options="classOpts" filterable placeholder="选择班级" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="年份" path="year">
            <n-input-number v-model:value="form.year" :min="2023" :max="2030" style="width:100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="月份" path="month">
            <n-select v-model:value="form.month" :options="monthOpts" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="上课星期">
        <n-checkbox-group v-model:value="form.weekdays">
          <n-space>
            <n-checkbox :value="1">周一</n-checkbox>
            <n-checkbox :value="2">周二</n-checkbox>
            <n-checkbox :value="3">周三</n-checkbox>
            <n-checkbox :value="4">周四</n-checkbox>
            <n-checkbox :value="5">周五</n-checkbox>
            <n-checkbox :value="6">周六</n-checkbox>
            <n-checkbox :value="7">周日</n-checkbox>
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="时段">
        <n-space align="center" style="width: 100%;">
          <n-time-picker v-model:value="form.start_time" format="HH:mm" style="flex: 1;" />
          <n-text depth="3">至</n-text>
          <n-time-picker v-model:value="form.end_time" format="HH:mm" style="flex: 1;" />
        </n-space>
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="教师">
            <n-select v-model:value="form.teacher_id" :options="teacherOpts" clearable filterable />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="教室">
            <n-select v-model:value="form.classroom" :options="classroomOpts" allow-create tag />
          </n-form-item>
        </n-grid-item>
      </n-grid>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="innerVisible = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="submit">
          <template #icon><n-icon><SparklesOutline /></n-icon></template>
          生成 (预计约{{ estimateDays }}天)
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { SparklesOutline } from '@vicons/ionicons5'
import { useUserStore } from '~/stores/user'
import { apiGet, apiPost } from '~/composables/useApi'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [v: boolean]; success: [] }>()

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const userStore = useUserStore()
const now = new Date()
const form = reactive({
  class_id: null as number | null,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  weekdays: [1, 2, 3, 4, 5] as number[],
  start_time: new Date().setHours(9, 0, 0, 0),
  end_time: new Date().setHours(12, 0, 0, 0),
  teacher_id: null as number | null,
  classroom: '画室A-1' as string | null,
})
const formRef = ref<FormInst>()
const submitting = ref(false)
const classOpts = ref<any[]>([])
const teacherOpts = ref<any[]>([])
const classroomOpts = [
  { label: '画室A-1', value: '画室A-1' },
  { label: '画室A-2', value: '画室A-2' },
  { label: '画室A-3', value: '画室A-3' },
  { label: '画室B-1', value: '画室B-1' },
  { label: '舞蹈排练厅', value: '舞蹈排练厅' },
  { label: '编导教室', value: '编导教室' },
]
const monthOpts = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))
const rules: FormRules = {
  class_id: { required: true, message: '请选择班级', type: 'number', trigger: 'change' },
  weekdays: { required: true, type: 'array', message: '请选择上课星期', trigger: 'change', validator: (_, v) => Array.isArray(v) && v.length > 0 },
}

const message = useMessage()

const estimateDays = computed(() => {
  if (!form.weekdays.length) return 0
  try {
    const daysInMonth = new Date(form.year, form.month, 0).getDate()
    let cnt = 0
    for (let i = 1; i <= daysInMonth; i++) {
      const wd = new Date(form.year, form.month - 1, i).getDay()
      const isoWd = wd === 0 ? 7 : wd
      if (form.weekdays.includes(isoWd)) cnt++
    }
    return cnt
  } catch { return 0 }
})

async function submit() {
  try {
    await formRef.value?.validate()
  } catch { return }
  submitting.value = true
  try {
    const params: any = {
      class_id: form.class_id,
      year: form.year,
      month: form.month,
      weekdays: form.weekdays,
      classroom: form.classroom || undefined,
      teacher_id: form.teacher_id || undefined,
    }
    const st = new Date(form.start_time)
    const et = new Date(form.end_time)
    params.start_time = `${st.getHours().toString().padStart(2, '0')}:${st.getMinutes().toString().padStart(2, '0')}`
    params.end_time = `${et.getHours().toString().padStart(2, '0')}:${et.getMinutes().toString().padStart(2, '0')}`
    const res: any = await apiPost('/schedules/generate-monthly', undefined)
    const url = `/schedules/generate-monthly?${new URLSearchParams(params as any).toString()}`
    const resp: any = await $fetch(url, {
      method: 'POST',
      baseURL: useRuntimeConfig().public.apiBase,
    })
    message.success(`已生成 ${resp?.schedule_ids?.length || 0} 条排课`)
    innerVisible.value = false
    emit('success')
  } catch (e: any) {
    message.error(e?.data?.detail || e?.message || '生成失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const classes: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(classes)) classOpts.value = classes.map(c => ({ label: c.name, value: c.id }))
    const teachers: any = await apiGet('/common/teachers', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(teachers)) teacherOpts.value = teachers.map(t => ({ label: t.real_name, value: t.id }))
  } catch (e) { console.warn(e) }
})

import { useMessage } from 'naive-ui'
</script>
