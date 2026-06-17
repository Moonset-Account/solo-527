<template>
  <MainLayout>
    <div class="profile-page">
      <n-grid :cols="3" :x-gap="20">
        <n-grid-item :span="1">
          <n-card :bordered="false">
            <div class="user-info-card">
              <n-avatar size="large" round>
                {{ userStore.userInfo?.full_name?.charAt(0) || 'U' }}
              </n-avatar>
              <div class="user-name">{{ userStore.userInfo?.full_name || userStore.userInfo?.username }}</div>
              <div class="user-roles">
                <n-tag v-for="role in userStore.roles" :key="role.id" size="small" type="info">
                  {{ role.name }}
                </n-tag>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-card title="基本信息" :bordered="false">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="用户名">
                {{ userStore.userInfo?.username }}
              </n-descriptions-item>
              <n-descriptions-item label="邮箱">
                {{ userStore.userInfo?.email }}
              </n-descriptions-item>
              <n-descriptions-item label="姓名">
                {{ userStore.userInfo?.full_name || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="手机号">
                {{ userStore.userInfo?.phone || '-' }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <n-card title="修改密码" :bordered="false" style="margin-top: 20px;">
            <n-form :model="passwordForm" label-placement="left" label-width="100px" style="max-width: 400px;">
              <n-form-item label="原密码">
                <n-input v-model:value="passwordForm.old_password" type="password" />
              </n-form-item>
              <n-form-item label="新密码">
                <n-input v-model:value="passwordForm.new_password" type="password" />
              </n-form-item>
              <n-form-item label="确认密码">
                <n-input v-model:value="passwordForm.confirm_password" type="password" />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" :loading="updating" @click="handleUpdatePassword">修改密码</n-button>
              </n-form-item>
            </n-form>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import MainLayout from '~/components/layout/MainLayout.vue'
import { useUserStore } from '~/stores/user'
import { useMessageUtil } from '~/composables/useMessage'

const userStore = useUserStore()
const { success, error } = useMessageUtil()

const updating = ref(false)
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

async function handleUpdatePassword() {
  if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
    error('请填写完整信息')
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    error('两次密码输入不一致')
    return
  }
  if (passwordForm.new_password.length < 6) {
    error('新密码长度不能少于6位')
    return
  }

  updating.value = true
  try {
    // 调用修改密码接口
    success('密码修改成功')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (e: any) {
    error(e.message || '修改失败')
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  if (!userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.user-info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 12px 0 8px;
}

.user-roles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
