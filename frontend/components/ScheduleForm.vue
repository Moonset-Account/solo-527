<template>
  <n-modal v-model:show="innerVisible" preset="card" style="width: 640px;" :title="isEdit ? '编辑排课' : '新建排课'">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <n-form-item label="班级" path="class_id">
        <n-select v-model:value="form.class_id" :options="classOpts" filterable placeholder="选择班级" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="授课教师" path="teacher_id">
            <n-select v-model:value="form.teacher_id" :options="teacherOpts" clearable filterable placeholder="选择教师" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="教室">
            <n-select v-model:value="form.classroom" :options="classroomOpts" allow-create tag placeholder="选择或输入" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="上课日期" path="course_date">
            <n-date-picker v-model:value="form.course_date" type="date" style="width: 100%;" placeholder="选择日期" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="时段">
            <n-space vertical style="width: 100%;">
              <n-space>
                <n-time-picker v-model:value="form.start_time" format="HH:mm" style="flex: 1;" placeholder="开始时间" />
                <n-text depth="3">至</n-text>
                <n-time-picker v-model:value="form.end_time" format="HH:mm" style="flex: 1;" placeholder="结束时间" />
              </n-space>
            </n-space>
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="课时/人">
            <n-input-number v-model:value="form.max_hours_per_student" :min="1" :max="8" style="width: 100%;" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="状态">
            <n-select v-model:value="form.status" :options="statusOpts" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="课程主题">
        <n-input v-model:value="form.topic" placeholder="如：素描静物写生、色彩风景..." />
      </n-form-item>
      <n-form-item label="课程内容">
        <n-input v-model:value="form.content" type="textarea" :rows="3" placeholder="教学内容、目标、重点等..." />
      </n-form-item>
      <n-form-item label="备注">
        <n-input v-model:value="form.remark" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="innerVisible = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="submit">确认提交</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useUserStore } from '~/stores/user'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'

const props = defineProps<{ visible: boolean; editData?: any }>()
const emit = defineEmits<{ 'update:visible': [v: boolean]; success: [] }>()

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})
const isEdit = computed(() => !!props.editData?.id)

const userStore = useUserStore()
const formRef = ref<FormInst>()
const submitting = ref(false)
const classOpts = ref<any[]>([])
const teacherOpts = ref<any[]>([])
const classroomOpts = [
  { label: '画室A-1', value: '画室A-1' },
  { label: '画室A-2', value: '画室A-2' },
  { label: '画室A-3', value: '画室A-3' },
  { label: '画室B-1（多媒体）', value: '画室B-1（多媒体）' },
  { label: '画室B-2（设计）', value: '画室B-2（设计）' },
  { label: '音乐教室1', value: '音乐教室1' },
  { label: '音乐教室2（琴房）', value: '音乐教室2（琴房）' },
  { label: '舞蹈排练厅', value: '舞蹈排练厅' },
  { label: '编导教室', value: '编导教室' },
  { label: '表演排练厅', value: '表演排练厅' },
  { label: '线上（腾讯会议）', value: '线上（腾讯会议）' },
]
const statusOpts = [
  { label: '待确认', value: 'planned' },
  { label: '已确认', value: 'confirmed' },
  { label: '上课中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const form = reactive<any>({
  class_id: null,
  teacher_id: null,
  classroom: null,
  course_date: Date.now(),
  start_time: new Date().setHours(9, 0, 0, 0),
  end_time: new Date().setHours(12, 0, 0, 0),
  duration_minutes: 180,
  max_hours_per_student: 2,
  status: 'confirmed',
  topic: '',
  content: '',
  remark: '',
  is_online: false,
  online_url: '',
})

const rules: FormRules = {
  class_id: { required: true, message: '请选择班级', type: 'number', trigger: 'change' },
  course_date: { required: true, message: '请选择日期', type: 'number', trigger: 'change' },
  start_time: { required: true, message: '请选择开始时间', type: 'number', trigger: 'change' },
  end_time: { required: true, message: '请选择结束时间', type: 'number', trigger: 'change' },
}

const message = useMessage()

function computeDuration() {
  if (form.start_time && form.end_time) {
    const diff = Math.round((form.end_time - form.start_time) / 60000)
    if (diff > 0) form.duration_minutes = diff
  }
}

watch(() => form.start_time, computeDuration)
watch(() => form.end_time, computeDuration)

watch(() => props.editData, (d) => {
  if (d) {
    Object.keys(d).forEach((k) => {
      if (k in form) {
        if (k === 'course_date' && typeof d[k] === 'string') {
          form.course_date = new Date(d[k]).getTime()
        } else if ((k === 'start_time' || k === 'end_time') && typeof d[k] === 'string') {
          const base = new Date()
          const [h, m] = d[k].split(':')
          form[k] = base.setHours(parseInt(h), parseInt(m), 0, 0)
        } else {
          (form as any)[k] = d[k]
        }
      }
    })
  } else {
    resetForm()
  }
}, { immediate: true, deep: true })

function resetForm() {
  Object.assign(form, {
    class_id: null,
    teacher_id: null,
    classroom: null,
    course_date: Date.now(),
    start_time: new Date().setHours(9, 0, 0, 0),
    end_time: new Date().setHours(12, 0, 0, 0),
    duration_minutes: 180,
    max_hours_per_student: 2,
    status: 'confirmed',
    topic: '',
    content: '',
    remark: '',
  })
}

async function submit() {
  try {
    await formRef.value?.validate()
  } catch { return }
  computeDuration()
  submitting.value = true
  try {
    const payload: any = { ...form }
    if (typeof payload.course_date === 'number') {
      payload.course_date = new Date(payload.course_date).toISOString().split('T')[0]
    }
    if (typeof payload.start_time === 'number') {
      const d = new Date(payload.start_time)
      payload.start_time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`
    }
    if (typeof payload.end_time === 'number') {
      const d = new Date(payload.end_time)
      payload.end_time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`
    }
    if (isEdit.value) {
      await apiPut(`/schedules/${props.editData.id}`, payload)
      message.success('排课已更新')
    } else {
      await apiPost('/schedules', payload)
      message.success('排课已创建')
    }
    innerVisible.value = false
    emit('success')
  } catch (e: any) {
    message.error(e?.data?.detail || e?.message || '保存失败')
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
