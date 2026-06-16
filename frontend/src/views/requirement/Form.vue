<template>
  <div class="requirement-form">
    <el-card shadow="never">
      <template #header>{{ isEdit ? '编辑需求' : '提交需求' }}</template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 680px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入需求标题" maxlength="256" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="请输入需求描述" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option label="紧急" value="URGENT" />
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assigneeId">
          <el-select
            v-model="form.assigneeId"
            filterable
            remote
            reserve-keyword
            placeholder="请搜索用户"
            :remote-method="searchUsers"
            :loading="userLoading"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="u.realName"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入所属部门" />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="date"
            placeholder="请选择截止日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { submitRequirement, updateRequirement, getRequirement } from '@/api/requirement'
import { searchUsers as apiSearchUsers } from '@/api/users'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const formRef = ref(null)
const submitting = ref(false)
const userLoading = ref(false)
const userOptions = ref([])

const form = reactive({
  title: '',
  description: '',
  priority: '',
  assigneeId: null,
  department: '',
  deadline: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

async function searchUsers(query) {
  if (!query) return
  userLoading.value = true
  try {
    const res = await apiSearchUsers(query)
    userOptions.value = res.data || []
  } finally {
    userLoading.value = false
  }
}

async function loadRequirement() {
  if (!isEdit.value) return
  const res = await getRequirement(route.params.id)
  const data = res.data
  Object.assign(form, {
    title: data.title,
    description: data.description,
    priority: data.priority,
    assigneeId: data.assigneeId,
    department: data.department,
    deadline: data.deadline
  })
  if (data.assigneeId) {
    userOptions.value = [{ id: data.assigneeId, realName: data.assigneeName || '用户' + data.assigneeId }]
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value) {
      await updateRequirement(route.params.id, payload)
      ElMessage.success('更新成功')
    } else {
      await submitRequirement(payload)
      ElMessage.success('提交成功')
    }
    router.push('/requirements')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRequirement()
})
</script>

<style scoped>
.requirement-form {
  padding: 20px;
}
</style>
