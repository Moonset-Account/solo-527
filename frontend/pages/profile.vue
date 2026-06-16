<template>
  <div>
    <n-page-header title="个人中心" subtitle="查看和修改个人信息" />

    <n-grid :cols="3" :x-gap="16" class="mt-4">
      <n-grid-item :span="1">
        <n-card title="个人信息">
          <div class="flex flex-col items-center py-4">
            <n-avatar round size="80">
              {{ authStore.user?.full_name?.[0] || authStore.user?.username?.[0] || 'U' }}
            </n-avatar>
            <h3 class="mt-4 text-lg font-medium">
              {{ authStore.user?.full_name || authStore.user?.username }}
            </h3>
            <n-tag :type="roleTagType" class="mt-2">
              {{ authStore.userRoleLabel }}
            </n-tag>
            <p class="mt-2 text-gray-500 text-sm">{{ authStore.user?.email }}</p>
            <p class="text-gray-500 text-sm">{{ authStore.user?.department || '-' }}</p>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="2">
        <n-card title="修改密码">
          <n-form :model="passwordForm" label-placement="top" style="max-width: 400px">
            <n-form-item label="原密码">
              <n-input
                v-model:value="passwordForm.old_password"
                type="password"
                show-password-on="click"
                placeholder="请输入原密码"
              />
            </n-form-item>
            <n-form-item label="新密码">
              <n-input
                v-model:value="passwordForm.new_password"
                type="password"
                show-password-on="click"
                placeholder="请输入新密码"
              />
            </n-form-item>
            <n-form-item label="确认新密码">
              <n-input
                v-model:value="passwordForm.confirm_password"
                type="password"
                show-password-on="click"
                placeholder="请再次输入新密码"
              />
            </n-form-item>
            <n-button type="primary" :loading="changing" @click="changePassword">
              修改密码
            </n-button>
          </n-form>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  NPageHeader,
  NGrid,
  NGridItem,
  NCard,
  NAvatar,
  NTag,
  NForm,
  NFormItem,
  NInput,
  NButton,
  useMessage,
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { useApiClient } from '~/composables/useApiClient'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
})

const message = useMessage()
const authStore = useAuthStore()
const api = useApiClient()

const changing = ref(false)

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const roleTagType = computed(() => {
  const types: Record<string, string> = {
    user: 'default',
    admin: 'info',
    security_officer: 'error',
  }
  return authStore.user?.role ? (types[authStore.user.role] as any) : 'default'
})

const changePassword = async () => {
  if (!passwordForm.old_password || !passwordForm.new_password) {
    message.error('请填写完整')
    return
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    message.error('两次输入的新密码不一致')
    return
  }

  if (passwordForm.new_password.length < 6) {
    message.error('新密码长度至少6位')
    return
  }

  changing.value = true
  try {
    await api.auth.changePassword(passwordForm.old_password, passwordForm.new_password)
    message.success('密码修改成功')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (error: any) {
    message.error(error.message || '修改失败')
  } finally {
    changing.value = false
  }
}
</script>
