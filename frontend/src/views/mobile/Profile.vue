<template>
  <div class="mobile-profile">
    <div class="profile-header">
      <div class="avatar">
        <van-icon name="user-o" size="48" />
      </div>
      <div class="user-info">
        <h3>{{ userInfo.first_name || userInfo.username }}</h3>
        <p>{{ userInfo.role_display }}</p>
      </div>
    </div>
    
    <van-cell-group inset>
      <van-cell title="账号设置" is-link to="/m/settings" />
      <van-cell title="离线数据" is-link to="/m/offline">
        <template #right-icon>
          <van-badge :content="offlineCount" v-if="offlineCount > 0" />
        </template>
      </van-cell>
      <van-cell title="关于系统" is-link @click="showAbout = true" />
    </van-cell-group>
    
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="修改密码" is-link @click="showPwdDialog = true" />
    </van-cell-group>
    
    <div style="padding: 20px 16px;">
      <van-button type="danger" block @click="logout">退出登录</van-button>
    </div>
    
    <van-dialog v-model:show="showAbout" title="关于系统" show-cancel-button>
      <div style="text-align: center; padding: 20px;">
        <h3>独立书店库存和读书会系统</h3>
        <p style="color: #999; margin-top: 10px;">版本 1.0.0</p>
        <p style="color: #666; margin-top: 10px; font-size: 14px;">
          支持图书管理、会员管理、活动票务、预留管理、销售分析等功能
        </p>
      </div>
    </van-dialog>
    
    <van-dialog v-model:show="showPwdDialog" title="修改密码" show-cancel-button @confirm="changePassword">
      <van-field v-model="pwdForm.old_password" label="原密码" type="password" placeholder="请输入原密码" />
      <van-field v-model="pwdForm.new_password" label="新密码" type="password" placeholder="请输入新密码" />
      <van-field v-model="pwdForm.confirm_password" label="确认密码" type="password" placeholder="请再次输入新密码" />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getOfflineQueue } from '@/utils/offline'
import { api } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const showAbout = ref(false)
const showPwdDialog = ref(false)

const userInfo = computed(() => userStore.user || {})
const offlineCount = ref(0)

const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const loadOfflineCount = async () => {
  const queue = await getOfflineQueue()
  offlineCount.value = queue.length
}

const changePassword = async () => {
  if (!pwdForm.old_password || !pwdForm.new_password || !pwdForm.confirm_password) {
    showToast('请填写完整信息')
    return false
  }
  if (pwdForm.new_password !== pwdForm.confirm_password) {
    showToast('两次密码输入不一致')
    return false
  }
  try {
    await api.post('/auth/auth/change_password/', pwdForm)
    showToast('修改成功')
    showPwdDialog.value = false
    return true
  } catch (e) {
    showToast('修改失败')
    return false
  }
}

const logout = () => {
  userStore.logout()
  router.replace('/login')
}

onMounted(() => {
  userStore.getUserInfo()
  loadOfflineCount()
})
</script>

<style lang="scss" scoped>
.mobile-profile {
  padding-bottom: 60px;
  
  .profile-header {
    display: flex;
    align-items: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    
    .user-info {
      h3 {
        margin: 0 0 4px;
        font-size: 18px;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        opacity: 0.8;
      }
    }
  }
}
</style>
