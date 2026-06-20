<template>
  <div class="activity-create">
    <el-page-header @back="router.push('/')" title="返回" content="发布活动" />

    <el-card shadow="never" class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="large"
        class="create-form"
      >
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大参与人数" prop="maxParticipants">
          <el-input-number v-model="form.maxParticipants" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="活动费用" prop="fee">
          <el-input-number v-model="form.fee" :min="0" :precision="2" />
          <span class="fee-unit">元</span>
        </el-form-item>
        <el-form-item label="交易保障" prop="guaranteeEnabled">
          <el-switch v-model="form.guaranteeEnabled" active-text="开启" inactive-text="关闭" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            发布活动
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useActivityStore } from '../stores/activity'

const router = useRouter()
const activityStore = useActivityStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  maxParticipants: 50,
  fee: 0,
  guaranteeEnabled: false
})

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  maxParticipants: [{ required: true, message: '请输入最大参与人数', trigger: 'blur' }]
})

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await activityStore.create({
        ...form,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : '',
        endTime: form.endTime ? new Date(form.endTime).toISOString() : ''
      })
      ElMessage.success('活动发布成功')
      router.push('/')
    } finally {
      submitting.value = false
    }
  })
}

const handleReset = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.activity-create {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card {
  margin-top: 8px;
}

.create-form {
  max-width: 680px;
}

.fee-unit {
  margin-left: 8px;
  color: #909399;
}
</style>
