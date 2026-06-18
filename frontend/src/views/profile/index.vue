<template>
  <div class="profile-page page-container">
    <div class="card-wrapper" style="max-width: 960px; margin: 0 auto;">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基本信息" name="info">
          <div v-if="userStore.userInfo" class="profile-info">
            <div class="avatar-section">
              <el-avatar :size="100" :icon="UserFilled" style="background:#409eff; font-size:44px" />
              <div class="user-basic">
                <h2>{{ userStore.userInfo.name }}</h2>
                <el-tag :type="roleTagType" size="large">{{ roleLabel }}</el-tag>
                <p class="dept">{{ userStore.userInfo.department || '-' }}</p>
              </div>
            </div>

            <el-descriptions :column="2" border class="info-desc">
              <el-descriptions-item label="用户名">
                {{ userStore.userInfo.username }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ userStore.userInfo.email || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ userStore.userInfo.phone || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="账号状态">
                <el-tag v-if="userStore.userInfo.status === 'active'" type="success">正常</el-tag>
                <el-tag v-else-if="userStore.userInfo.status === 'expired'" type="danger">已过期</el-tag>
                <el-tag v-else type="info">已禁用</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="权限过期时间" :span="2">
                <template v-if="userStore.userInfo.permissionExpireAt">
                  {{ formatDate(userStore.userInfo.permissionExpireAt) }}
                  <el-tag
                    :type="daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'warning' : 'success'"
                    size="small"
                    style="margin-left: 8px"
                  >
                    剩余 {{ daysLeft }} 天
                  </el-tag>
                </template>
                <span v-else>永久有效</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
            style="max-width: 440px"
          >
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
              <el-button type="primary" :loading="submitting" @click="submitPassword">
                确认修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { roleMap, formatDate } from '@/utils'
import { changePassword } from '@/api/auth'
import { UserFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('info')
const pwdFormRef = ref<FormInstance>()
const submitting = ref(false)

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v !== pwdForm.newPassword) cb(new Error('两次密码不一致'))
        else cb()
      },
      trigger: 'blur'
    }
  ]
}

const roleLabel = computed(() => roleMap[userStore.userInfo?.role || '']?.label || '未知')
const roleTagType = computed(() => {
  const r = userStore.userInfo?.role
  return r === 'admin' ? 'danger' : r === 'manager' ? 'success' : r === 'operator' ? 'primary' : 'info'
})

const daysLeft = computed(() => {
  if (!userStore.userInfo?.permissionExpireAt) return 9999
  return Math.ceil(
    (new Date(userStore.userInfo.permissionExpireAt).getTime() - Date.now()) / 86400000
  )
})

async function submitPassword() {
  if (!pwdFormRef.value) return
  try {
    await pwdFormRef.value.validate()
    submitting.value = true
    await changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    await userStore.doLogout()
    router.replace('/login')
  } catch (e) {
    if (e?.message) ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const tab = route.query.tab as string
  if (tab) activeTab.value = tab
})
</script>

<style lang="scss" scoped>
.profile-info {
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid $border-light;

    .user-basic {
      h2 {
        margin: 0 0 8px;
        font-size: 22px;
      }

      .dept {
        margin: 8px 0 0;
        color: $text-secondary;
        font-size: 13px;
      }
    }
  }

  .info-desc {
    width: 100%;
  }
}
</style>
