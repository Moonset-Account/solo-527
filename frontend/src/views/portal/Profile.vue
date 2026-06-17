<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="8">
        <div class="card-shadow" style="text-align: center">
          <el-avatar :size="100" style="background-color: #409eff; font-size: 36px">
            {{ user?.realName?.charAt(0) }}
          </el-avatar>
          <h3 style="margin: 16px 0 8px">{{ user?.realName }}</h3>
          <p style="color: #909399; margin: 0 0 16px">{{ user?.username }}</p>
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap">
            <el-tag v-for="role in user?.roles" :key="role">{{ roleLabel(role) }}</el-tag>
          </div>
          <div style="margin-top: 20px; text-align: left">
            <p><strong>部门：</strong>{{ user?.department || '-' }}</p>
            <p><strong>实验室：</strong>{{ user?.laboratory || '-' }}</p>
            <p><strong>岗位：</strong>{{ user?.position || '-' }}</p>
            <p><strong>邮箱：</strong>{{ user?.email || '-' }}</p>
            <p><strong>手机：</strong>{{ user?.phone || '-' }}</p>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="修改密码" name="password">
            <div class="card-shadow">
              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px" style="max-width: 480px">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submitting" @click="changePassword">确认修改</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { UserRole, type User } from '@/types'

const userStore = useUserStore()
const user = ref<User | null>(null)
const activeTab = ref('password')
const submitting = ref(false)
const pwdFormRef = ref<FormInstance>()

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirm = (_: any, value: string, callback: any) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.ADMIN]: '管理员',
    [UserRole.REAGENT_MANAGER]: '试剂管理员',
    [UserRole.LAB_MANAGER]: '实验室主管',
    [UserRole.RESEARCHER]: '研究员',
    [UserRole.USER]: '普通用户',
  }
  return map[role] || role
}

async function changePassword() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await userApi.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
      })
      ElMessage.success('密码修改成功')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  user.value = await userStore.fetchUserInfo()
})
</script>
