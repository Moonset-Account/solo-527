<template>
  <div class="profile-container" v-loading="loading">
    <el-row :gutter="20">
      <el-col :xs="24" :md="8">
        <el-card class="user-card">
          <div class="user-info">
            <el-avatar :size="80" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'">
              {{ userInfo.nickname?.charAt(0) }}
            </el-avatar>
            <h3>{{ userInfo.nickname }}</h3>
            <el-tag :type="roleTagType" size="large" effect="dark">{{ roleLabel }}</el-tag>
            <p class="phone" v-if="userInfo.phone">{{ userInfo.phone }}</p>
          </div>
          <el-divider />
          <div class="member-section" v-if="memberInfo">
            <div class="member-header">
              <i class="vip-icon">👑</i>
              <span class="vip-text">会员权益</span>
            </div>
            <div class="member-expire">
              到期时间：{{ memberInfo.expireTime || '非会员' }}
            </div>
            <el-progress :percentage="memberProgress" :status="memberProgress > 90 ? 'warning' : ''" />
            <el-button type="warning" class="renew-btn" size="large" @click="showRenew = true">续费会员</el-button>
          </div>
          <el-divider />
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-num">{{ stats.studyDays }}</div>
              <div class="stat-label">学习天数</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.completedChapters }}</div>
              <div class="stat-label">完成章节</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.totalHours }}h</div>
              <div class="stat-label">学习时长</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的学习记录</span>
            </div>
          </template>
          <el-table :data="studyList">
            <el-table-column prop="courseTitle" label="课程名称" />
            <el-table-column label="学习进度">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" />
              </template>
            </el-table-column>
            <el-table-column prop="lastStudyTime" label="最近学习" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link @click="continueStudy(row)">继续学习</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card class="mt20">
          <template #header>
            <div class="card-header">
              <span>我的订单</span>
            </div>
          </template>
          <el-table :data="orderList">
            <el-table-column prop="orderNo" label="订单号" width="200" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'MEMBER' ? 'warning' : 'primary'" size="small">
                  {{ row.type === 'MEMBER' ? '会员' : '课程' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column label="支付状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.payStatus === 1 ? 'success' : 'info'" size="small">
                  {{ ['待支付', '已支付', '已退款'][row.payStatus] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="payTime" label="支付时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog v-model="showRenew" title="续费会员" width="420px">
      <el-radio-group v-model="renewPlan">
        <el-radio label="month">月度会员 - ¥36</el-radio><br />
        <el-radio label="quarter">季度会员 - ¥99 <el-tag size="small" type="success">省¥9</el-tag></el-radio><br />
        <el-radio label="year">年度会员 - ¥365 <el-tag size="small" type="danger">最划算</el-tag></el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="showRenew = false">取消</el-button>
        <el-button type="primary" @click="handleRenew">立即续费</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})
const loading = ref(false)
const showRenew = ref(false)
const renewPlan = ref('year')

const roleMap = { ADMIN: ['管理员', 'danger'], TEACHER: ['讲师', 'warning'], MEMBER: ['会员', 'success'] }
const roleLabel = computed(() => roleMap[userInfo.value.role]?.[0] || '未知')
const roleTagType = computed(() => roleMap[userInfo.value.role]?.[1] || 'info')

const memberInfo = ref({ expireTime: '2025-06-10', daysLeft: 30 })
const memberProgress = computed(() => Math.min(100, Math.round((365 - (memberInfo.value?.daysLeft || 0)) / 365 * 100)))
const stats = ref({ studyDays: 45, completedChapters: 18, totalHours: 32 })
const studyList = ref([
  { courseTitle: '职场沟通必修课', progress: 65, lastStudyTime: '2024-01-14 20:30' },
  { courseTitle: '高效时间管理实战', progress: 80, lastStudyTime: '2024-01-13 19:15' },
  { courseTitle: 'Excel数据处理精通', progress: 30, lastStudyTime: '2024-01-10 21:00' }
])
const orderList = ref([
  { orderNo: 'ORD202401150001', type: 'MEMBER', amount: 365.00, payStatus: 1, payTime: '2024-01-10 10:30:00' },
  { orderNo: 'ORD202401150003', type: 'COURSE', amount: 719.20, payStatus: 1, payTime: '2024-01-12 15:20:00' }
])

const continueStudy = (row) => {
  const idx = studyList.value.indexOf(row)
  router.push(`/course/${idx + 1}`)
}
const handleRenew = () => {
  ElMessage.success('续费成功！')
  showRenew.value = false
}
onMounted(() => {
  if (!userStore.isLoggedIn) router.push('/login')
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.user-card {
  text-align: center;
}
.user-info h3 {
  margin: 16px 0 8px;
}
.phone {
  color: #909399;
  margin: 8px 0 0;
}
.member-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
}
.vip-icon {
  font-size: 22px;
}
.vip-text {
  color: #e6a23c;
  font-size: 16px;
}
.member-expire {
  color: #909399;
  font-size: 13px;
  margin: 8px 0 16px;
}
.renew-btn {
  margin-top: 16px;
  width: 100%;
}
.stats-row {
  display: flex;
  justify-content: space-around;
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.card-header {
  font-weight: 600;
}
.mt20 {
  margin-top: 20px;
}
</style>
