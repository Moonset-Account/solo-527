<template>
  <div class="mobile-container">
    <van-nav-bar title="个人中心" />
    
    <div class="profile-header">
      <div class="avatar">
        <van-icon name="user-o" size="40" color="#fff" />
      </div>
      <div class="user-info">
        <h3>{{ userStore.user?.realName || userStore.user?.username }}</h3>
        <p>
          <van-tag :type="userStore.isVerified ? 'success' : 'warning'" size="mini">
            {{ userStore.isVerified ? '已认证' : '未认证' }}
          </van-tag>
          <van-tag type="primary" size="mini" style="margin-left: 8px;">
            {{ getRoleText(userStore.user?.role) }}
          </van-tag>
        </p>
      </div>
    </div>

    <van-cell-group inset class="profile-group">
      <van-cell title="余额" :value="'¥' + (userStore.user?.balance || 0)" is-link @click="showRecharge = true" />
      <van-cell title="我的借用" is-link @click="$router.push('/my-borrows')" />
      <van-cell title="维修申报" is-link @click="$router.push('/maintenance')" />
      <van-cell title="消息通知" is-link @click="$router.push('/notifications')">
        <template #right-icon>
          <van-badge :content="unreadCount" v-if="unreadCount > 0" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="profile-group">
      <van-cell title="编辑资料" is-link @click="showEdit = true" />
      <van-cell title="实名认证" is-link @click="showVerify = true" v-if="!userStore.isVerified" />
      <van-cell title="管理后台" is-link @click="$router.push('/admin')" v-if="userStore.isVolunteer" />
    </van-cell-group>

    <van-cell-group inset class="profile-group">
      <van-cell title="退出登录" @click="handleLogout">
        <template #title>
          <span style="color: #ee0a24;">退出登录</span>
        </template>
      </van-cell>
    </van-cell-group>

    <van-tabbar v-model="tabBar" active-color="#1989fa">
      <van-tabbar-item icon="home-o" @click="tabBar = 0; $router.push('/')">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="tabBar = 1; $router.push('/tools')">工具</van-tabbar-item>
      <van-tabbar-item icon="scan" @click="tabBar = 2; $router.push('/scan')">扫码</van-tabbar-item>
      <van-tabbar-item icon="user-o" @click="tabBar = 3">我的</van-tabbar-item>
    </van-tabbar>

    <van-dialog v-model:show="showEdit" title="编辑资料" show-cancel-button @confirm="saveProfile">
      <van-field v-model="editForm.realName" label="真实姓名" placeholder="请输入真实姓名" />
      <van-field v-model="editForm.phone" label="手机号" placeholder="请输入手机号" />
    </van-dialog>

    <van-dialog v-model:show="showVerify" title="实名认证" show-cancel-button @confirm="verifyIdentity">
      <van-field v-model="verifyForm.realName" label="真实姓名" placeholder="请输入真实姓名" />
      <van-field v-model="verifyForm.idCard" label="身份证号" placeholder="请输入身份证号" />
    </van-dialog>

    <van-dialog v-model:show="showRecharge" title="余额充值" show-cancel-button @confirm="handleRecharge">
      <van-field v-model="rechargeAmount" label="充值金额" placeholder="请输入充值金额" type="number" />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { notificationAPI } from '@/api';
import { showToast, showConfirmDialog } from 'vant';

const router = useRouter();
const userStore = useUserStore();
const tabBar = ref(3);
const unreadCount = ref(0);
const showEdit = ref(false);
const showVerify = ref(false);
const showRecharge = ref(false);
const rechargeAmount = ref('');

const editForm = reactive({
  realName: '',
  phone: ''
});

const verifyForm = reactive({
  realName: '',
  idCard: ''
});

const getRoleText = (role) => {
  const map = { resident: '居民', volunteer: '志愿者', admin: '管理员' };
  return map[role] || role;
};

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要退出登录吗？'
    });
    userStore.logout();
    showToast('已退出登录');
    router.push('/login');
  } catch (e) {}
};

const saveProfile = async () => {
  try {
    await userStore.updateProfile(editForm);
    showToast('保存成功');
  } catch (e) {
    console.error(e);
  }
};

const verifyIdentity = async () => {
  try {
    await userStore.updateProfile(verifyForm);
    showToast('认证信息已提交');
  } catch (e) {
    console.error(e);
  }
};

const handleRecharge = () => {
  if (rechargeAmount.value && parseFloat(rechargeAmount.value) > 0) {
    showToast('充值功能演示中，实际使用请联系管理员');
    showRecharge.value = false;
  }
};

const fetchUnreadCount = async () => {
  try {
    const res = await notificationAPI.getUnreadCount();
    unreadCount.value = res.count;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  if (userStore.user) {
    editForm.realName = userStore.user.realName || '';
    editForm.phone = userStore.user.phone || '';
  }
  fetchUnreadCount();
});
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, #1989fa, #07c160);
  color: #fff;
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
}
.profile-group {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
