<template>
  <div class="home-container">
    <el-container>
      <el-main>
        <el-row :gutter="20" class="user-card-row">
          <el-col :span="24">
            <el-card class="user-card" shadow="hover">
              <div class="user-info">
                <el-avatar :size="64" :icon="UserFilled" class="user-avatar" />
                <div class="user-detail">
                  <div class="user-name-row">
                    <span class="user-name">{{ userInfo?.nickname || '欢迎回来' }}</span>
                    <el-tag v-if="isMember" type="warning" effect="dark" size="large" class="member-tag">
                      <el-icon><StarFilled /></el-icon>
                      <span>VIP会员</span>
                    </el-tag>
                    <el-tag v-else type="info" size="large">普通用户</el-tag>
                  </div>
                  <div class="user-expire" v-if="isMember">
                    <el-icon><Clock /></el-icon>
                    <span>会员有效期至：{{ memberExpireDate }}</span>
                  </div>
                  <div class="user-expire" v-else>
                    <el-icon><Star /></el-icon>
                    <span>升级会员解锁全部课程权益</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="section-row">
          <el-col :span="24">
            <div class="section-header">
              <h2 class="section-title">
                <el-icon><ChatLineRound /></el-icon>
                继续学习
              </h2>
            </div>
            <el-card v-if="continueLearning" class="continue-card" shadow="hover" @click="goToCourseDetail(continueLearning.courseId)">
              <div class="continue-content">
                <el-image :src="continueLearning.courseCover" class="continue-cover" fit="cover" />
                <div class="continue-info">
                  <h3 class="continue-title">{{ continueLearning.courseTitle }}</h3>
                  <p class="continue-chapter">
                    <el-icon><Files /></el-icon>
                    上次学习：{{ continueLearning.lastChapterTitle }}
                  </p>
                  <div class="continue-progress">
                    <el-progress
                      :percentage="continueLearning.progress"
                      :stroke-width="12"
                      :color="progressColor"
                    />
                    <span class="progress-text">已完成 {{ continueLearning.progress }}%</span>
                  </div>
                  <el-button type="primary" class="continue-btn">
                    <el-icon><VideoPlay /></el-icon>
                    继续学习
                  </el-button>
                </div>
              </div>
            </el-card>
            <el-card v-else class="empty-continue-card" shadow="never">
              <el-empty description="还没有开始学习的课程，去挑选一门吧！">
                <el-button type="primary">浏览课程</el-button>
              </el-empty>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="section-row">
          <el-col :span="24">
            <div class="section-header">
              <h2 class="section-title">
                <el-icon><ShoppingCart /></el-icon>
                购买课程
              </h2>
              <el-button type="primary" link>查看全部</el-button>
            </div>
          </el-col>
          <el-col v-for="course in courseList" :key="course.id" :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="course-card" shadow="hover">
              <div class="course-cover-wrapper">
                <el-image :src="course.cover" class="course-cover" fit="cover" />
                <el-tag
                  v-if="course.isMemberOnly"
                  type="warning"
                  effect="dark"
                  size="small"
                  class="member-only-tag"
                >
                  <el-icon><StarFilled /></el-icon>
                  会员
                </el-tag>
              </div>
              <div class="course-info">
                <h3 class="course-title" :title="course.title">{{ course.title }}</h3>
                <div class="course-meta">
                  <span class="course-chapter-count">
                    <el-icon><List /></el-icon>
                    {{ course.chapterCount }}章
                  </span>
                  <span class="course-student-count">
                    <el-icon><User /></el-icon>
                    {{ course.studentCount }}人学习
                  </span>
                </div>
                <div class="course-footer">
                  <div class="course-price">
                    <span v-if="course.price > 0" class="price-symbol">¥</span>
                    <span v-if="course.price > 0" class="price-value">{{ course.price }}</span>
                    <span v-else class="price-free">免费</span>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    :class="['buy-btn', { 'member-btn': course.isMemberOnly }]"
                    @click.stop="handleBuy(course)"
                  >
                    {{ course.isMemberOnly ? '会员免费' : '立即购买' }}
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  StarFilled,
  Clock,
  Star,
  ChatLineRound,
  Files,
  VideoPlay,
  ShoppingCart,
  List,
  User
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getCourseList, createOrder } from '@/api/course'
import { getContinueStudy } from '@/api/study'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const isMember = computed(() => userInfo.value?.isMember || false)
const memberExpireDate = computed(() => userInfo.value?.memberExpireDate || '--')

const continueLearning = ref(null)
const courseList = ref([])

const progressColor = computed(() => {
  const p = continueLearning.value?.progress || 0
  if (p >= 80) return '#67c23a'
  if (p >= 50) return '#409eff'
  return '#e6a23c'
})

const loadContinueLearning = async () => {
  try {
    const res = await getContinueStudy()
    const list = res.data || []
    continueLearning.value = Array.isArray(list) && list.length > 0 ? list[0] : null
  } catch (e) {
    console.error('获取继续学习数据失败', e)
  }
}

const loadCourseList = async () => {
  try {
    const res = await getCourseList({ page: 1, size: 8 })
    courseList.value = res.data?.list || []
  } catch (e) {
    console.error('获取课程列表失败', e)
  }
}

const goToCourseDetail = (courseId) => {
  router.push(`/course/${courseId}`)
}

const handleBuy = async (course) => {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: `/course/${course.id}` } })
    return
  }
  try {
    await createOrder({
      courseId: course.id,
      orderType: course.isMemberOnly ? 'MEMBER' : 'COURSE',
      amount: course.price,
      inviteCode: ''
    })
    ElMessage.success(course.isMemberOnly ? '已解锁会员课程' : '购买成功')
    goToCourseDetail(course.id)
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '操作失败'
    ElMessage.error(msg)
  }
}

onMounted(() => {
  loadContinueLearning()
  loadCourseList()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.el-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.user-card-row {
  margin-bottom: 24px;
}

.user-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.user-card :deep(.el-card__body) {
  padding: 28px 32px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-detail {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
}

.member-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.user-expire {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.section-row {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .el-icon {
  color: #409eff;
}

.continue-card {
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  overflow: hidden;
}

.continue-card:hover {
  transform: translateY(-2px);
}

.continue-content {
  display: flex;
  gap: 24px;
}

.continue-cover {
  width: 280px;
  height: 160px;
  border-radius: 8px;
  flex-shrink: 0;
}

.continue-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 0;
}

.continue-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
}

.continue-chapter {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.continue-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.continue-progress .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.continue-btn {
  align-self: flex-start;
}

.empty-continue-card {
  border-radius: 12px;
}

.course-card {
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.course-card:hover {
  transform: translateY(-4px);
}

.course-cover-wrapper {
  position: relative;
  margin: -20px -20px 16px;
}

.course-cover {
  width: 100%;
  height: 160px;
  display: block;
}

.member-only-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.course-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  line-height: 1.4;
  height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.course-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.course-price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
}

.price-value {
  font-size: 20px;
  color: #f56c6c;
  font-weight: 700;
}

.price-free {
  font-size: 18px;
  color: #67c23a;
  font-weight: 600;
}

.buy-btn {
  border-radius: 20px;
}

.member-btn {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
}
</style>
