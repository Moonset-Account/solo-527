<template>
  <div class="course-detail-container">
    <el-container>
      <el-main>
        <el-row :gutter="24">
          <el-col :xs="24" :md="10">
            <el-card class="course-main-card" shadow="hover">
              <el-image :src="courseDetail?.cover" class="course-cover-large" fit="cover" />
              <div class="course-main-info">
                <h1 class="course-main-title">{{ courseDetail?.title }}</h1>
                <div class="course-main-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    讲师：{{ courseDetail?.teacher || '--' }}
                  </span>
                  <span class="meta-item">
                    <el-icon><IconList /></el-icon>
                    {{ courseDetail?.chapterCount || 0 }}章
                  </span>
                  <span class="meta-item">
                    <el-icon><View /></el-icon>
                    {{ courseDetail?.studentCount || 0 }}人学习
                  </span>
                </div>
                <div class="course-price-row">
                  <div class="course-main-price">
                    <span v-if="courseDetail?.price > 0" class="main-price-symbol">¥</span>
                    <span v-if="courseDetail?.price > 0" class="main-price-value">{{ courseDetail?.price }}</span>
                    <span v-else class="main-price-free">免费</span>
                    <el-tag
                      v-if="courseDetail?.isMemberOnly"
                      type="warning"
                      effect="dark"
                      size="default"
                      class="main-member-tag"
                    >
                      <el-icon><StarFilled /></el-icon>
                      会员专属
                    </el-tag>
                  </div>
                </div>
                <div class="course-action-buttons">
                  <el-button
                    v-if="!isPurchased"
                    type="primary"
                    size="large"
                    class="action-btn buy"
                    @click="handlePurchase"
                  >
                    <el-icon><ShoppingCart /></el-icon>
                    立即购买
                  </el-button>
                  <el-button
                    v-else
                    type="success"
                    size="large"
                    class="action-btn continue"
                    @click="continueStudy"
                  >
                    <el-icon><VideoPlay /></el-icon>
                    继续学习
                  </el-button>
                  <el-button size="large" class="action-btn trial" @click="handleTrial">
                    <el-icon><Present /></el-icon>
                    试看课程
                  </el-button>
                </div>
                <div class="course-progress-section" v-if="isPurchased">
                  <div class="progress-label-row">
                    <span class="progress-label">学习进度</span>
                    <span class="progress-percent">{{ studyProgress }}%</span>
                  </div>
                  <el-progress :percentage="studyProgress" :stroke-width="14" :color="progressColor" />
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :md="14">
            <el-card class="tabs-card" shadow="hover">
              <el-tabs v-model="activeTab" class="main-tabs">
                <el-tab-pane label="会员权益" name="benefits">
                  <el-row :gutter="16">
                    <el-col v-for="(benefit, idx) in memberBenefits" :key="idx" :xs="12" :sm="8">
                      <div class="benefit-card">
                        <div class="benefit-icon" :style="{ background: benefit.bgColor }">
                          <el-icon :size="28"><component :is="benefit.icon" /></el-icon>
                        </div>
                        <h4 class="benefit-name">{{ benefit.name }}</h4>
                        <p class="benefit-desc">{{ benefit.description }}</p>
                      </div>
                    </el-col>
                  </el-row>
                </el-tab-pane>

                <el-tab-pane label="打卡记录" name="checkin">
                  <div class="checkin-calendar-section">
                    <div class="calendar-header">
                      <span class="calendar-title">近30天打卡</span>
                      <span class="checkin-count">
                        已打卡 <strong class="checkin-days">{{ checkinDays }}</strong> 天
                      </span>
                    </div>
                    <div class="calendar-grid">
                      <div
                        v-for="day in calendarDays"
                        :key="day.date"
                        :class="['calendar-day', { checked: day.checked, today: day.isToday }]"
                      >
                        <div class="day-num">{{ day.day }}</div>
                        <el-icon v-if="day.checked" class="check-icon"><CircleCheck /></el-icon>
                      </div>
                    </div>
                  </div>
                  <div class="checkin-list-section">
                    <h4 class="list-subtitle">打卡明细</h4>
                    <el-table :data="checkinList" size="default" class="checkin-table">
                      <el-table-column prop="date" label="日期" width="140">
                        <template #default="{ row }">
                          <span class="date-text">{{ row.date }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="duration" label="学习时长" width="120">
                        <template #default="{ row }">
                          <el-tag type="success" effect="plain">{{ row.duration }}分钟</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="chapterTitle" label="学习章节">
                        <template #default="{ row }">
                          <span class="chapter-link">{{ row.chapterTitle }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="试看片段" name="trial">
                  <div class="trial-list">
                    <div
                      v-for="(chapter, idx) in trialChapters"
                      :key="chapter.id"
                      class="trial-item"
                    >
                      <div class="trial-info">
                        <div class="trial-header">
                          <span class="trial-index">{{ idx + 1 }}</span>
                          <h4 class="trial-title">{{ chapter.title }}</h4>
                          <el-tag type="warning" size="small" effect="light">
                            试看{{ chapter.trialDuration }}分钟
                          </el-tag>
                        </div>
                        <div class="trial-progress-bar">
                          <el-progress
                            :percentage="chapter.watchProgress || 0"
                            :stroke-width="6"
                            :show-text="false"
                          />
                        </div>
                      </div>
                      <el-button type="primary" circle class="play-btn">
                        <el-icon :size="18"><VideoPlay /></el-icon>
                      </el-button>
                    </div>
                    <el-empty v-if="trialChapters.length === 0" description="暂无试看片段" />
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </el-col>
        </el-row>

        <el-row class="chapter-section-row">
          <el-col :span="24">
            <el-card class="chapters-card" shadow="hover">
              <template #header>
                <div class="chapters-header">
                  <h3 class="chapters-title">
                    <el-icon><List /></el-icon>
                    全部章节
                    <span class="chapters-count">（共{{ chapters.length }}章）</span>
                  </h3>
                  <span class="chapters-progress-text">
                    已完成 {{ completedCount }} / {{ chapters.length }}
                  </span>
                </div>
              </template>
              <div class="chapters-list">
                <div
                  v-for="(chapter, idx) in chapters"
                  :key="chapter.id"
                  :class="['chapter-item', { completed: chapter.completed }]"
                >
                  <div class="chapter-left">
                    <div :class="['chapter-index', { done: chapter.completed }]">
                      <el-icon v-if="chapter.completed" :size="16"><CircleCheck /></el-icon>
                      <span v-else>{{ idx + 1 }}</span>
                    </div>
                    <div class="chapter-content">
                      <h4 class="chapter-title">{{ chapter.title }}</h4>
                      <div class="chapter-meta">
                        <span class="chapter-duration">
                          <el-icon><Clock /></el-icon>
                          {{ chapter.duration }}分钟
                        </span>
                        <el-tag v-if="chapter.isTrial" type="warning" size="small">试看</el-tag>
                        <el-tag v-if="chapter.completed" type="success" size="small">已学完</el-tag>
                      </div>
                    </div>
                  </div>
                  <div class="chapter-right">
                    <el-progress
                      :percentage="chapter.progress || 0"
                      :stroke-width="8"
                      style="width: 140px"
                    />
                    <el-button
                      type="primary"
                      size="small"
                      :text="!chapter.completed"
                      @click="playChapter(chapter)"
                    >
                      {{ chapter.completed ? '复习' : '学习' }}
                    </el-button>
                  </div>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  List as IconList,
  View,
  StarFilled,
  ShoppingCart,
  VideoPlay,
  Present,
  CircleCheck,
  Menu,
  Clock,
  Star,
  Ticket,
  Service,
  DataAnalysis,
  ChatLineRound,
  Monitor,
  School,
  Coin
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getCourseDetail,
  getChapterList,
  getBenefitList,
  createOrder
} from '@/api/course'
import { getCompletionRate, checkIn, getCheckInList } from '@/api/study'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const courseId = computed(() => route.params.id)
const activeTab = ref('benefits')

const courseDetail = ref(null)
const chapters = ref([])
const trialChapters = ref([])
const memberBenefits = ref([])
const studyProgress = ref(0)
const checkinDays = ref(0)
const calendarDays = ref([])
const checkinList = ref([])
const isPurchased = ref(false)

const progressColor = computed(() => {
  const p = studyProgress.value
  if (p >= 80) return '#67c23a'
  if (p >= 50) return '#409eff'
  return '#e6a23c'
})

const completedCount = computed(() => chapters.value.filter(c => c.completed).length)

const defaultBenefits = [
  { name: '高清视频', description: '1080P超清画质', icon: Monitor, bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '无限回放', description: '随时回顾复习', icon: VideoPlay, bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '配套资料', description: '课件源码下载', icon: Ticket, bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '专属答疑', description: '讲师1对1解答', icon: Service, bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: '学习报告', description: '定期进度分析', icon: DataAnalysis, bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: '就业指导', description: '简历面试辅导', icon: ChatLineRound, bgColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { name: '社群交流', description: '学员互助成长', icon: School, bgColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: '结业证书', description: '官方认证凭证', icon: Star, bgColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: '优先更新', description: '新课抢先体验', icon: Coin, bgColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
]

const generateCalendarDays = () => {
  const days = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push({
      date: d.toISOString().slice(0, 10),
      day: d.getDate(),
      isToday: i === 0,
      checked: Math.random() > 0.4
    })
  }
  return days
}

const loadCourseDetail = async () => {
  try {
    const res = await getCourseDetail(courseId.value)
    courseDetail.value = res.data
    isPurchased.value = res.data?.isPurchased || false
  } catch (e) {
    console.error('获取课程详情失败', e)
  }
}

const loadChapters = async () => {
  try {
    const res = await getChapterList(courseId.value)
    const all = res.data || []
    chapters.value = all
    trialChapters.value = all.filter(c => c.isPreview === 1 || c.isPreview === true)
  } catch (e) {
    console.error('获取章节列表失败', e)
  }
}

const loadMemberBenefits = async () => {
  try {
    const res = await getBenefitList()
    memberBenefits.value = res.data?.length ? res.data : defaultBenefits
  } catch (e) {
    memberBenefits.value = defaultBenefits
  }
}

const loadStudyProgress = async () => {
  try {
    const res = await getCompletionRate({ dimension: 'user', courseId: courseId.value })
    studyProgress.value = res.data?.courseStats?.find?.(s => s.courseId == courseId.value)?.progress || 0
  } catch (e) {
    studyProgress.value = 0
  }
}

const loadCheckinData = async () => {
  try {
    const listRes = await getCheckInList({})
    const checkIns = listRes.data || []
    const checkedDates = new Set(checkIns.map(c => String(c.checkDate || c.createdAt).slice(0, 10)))
    const days = generateCalendarDays()
    days.forEach(d => { d.checked = checkedDates.has(d.date) })
    calendarDays.value = days
    checkinDays.value = days.filter(d => d.checked).length
    checkinList.value = checkIns
  } catch (e) {
    calendarDays.value = generateCalendarDays()
    checkinDays.value = calendarDays.value.filter(d => d.checked).length
    checkinList.value = []
  }
}

const handlePurchase = async () => {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await createOrder({
      courseId: Number(courseId.value),
      orderType: courseDetail.value?.memberFree || courseDetail.value?.isMemberOnly ? 'MEMBER' : 'COURSE',
      amount: courseDetail.value?.price || 0,
      inviteCode: ''
    })
    ElMessage.success('购买成功')
    isPurchased.value = true
    await loadCourseDetail()
    await loadStudyProgress()
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '购买失败'
    ElMessage.error(msg)
  }
}

const handleCheckIn = async () => {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await checkIn({
      courseId: Number(courseId.value),
      studyDuration: 0,
      remark: `打卡：${courseDetail.value?.title || ''}`
    })
    ElMessage.success('打卡成功')
    await loadCheckinData()
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '打卡失败'
    ElMessage.error(msg)
  }
}

const continueStudy = () => {
  ElMessage.success('进入学习页面')
}

const handleTrial = () => {
  activeTab.value = 'trial'
}

const playChapter = (chapter) => {
  ElMessage.info(`播放章节：${chapter.title}`)
}

onMounted(() => {
  loadCourseDetail()
  loadChapters()
  loadMemberBenefits()
  if (userStore.isLoggedIn) {
    loadStudyProgress()
    loadCheckinData()
  }
})
</script>

<style scoped>
.course-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.el-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.course-main-card {
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.course-cover-large {
  width: calc(100% + 40px);
  height: 260px;
  margin: -20px -20px 20px;
  display: block;
}

.course-main-info {
  padding: 0 4px;
}

.course-main-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 14px 0;
  color: #303133;
  line-height: 1.4;
}

.course-main-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.course-price-row {
  margin-bottom: 20px;
}

.course-main-price {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-price-symbol {
  font-size: 18px;
  color: #f56c6c;
  font-weight: 600;
}

.main-price-value {
  font-size: 32px;
  color: #f56c6c;
  font-weight: 700;
}

.main-price-free {
  font-size: 28px;
  color: #67c23a;
  font-weight: 700;
}

.main-member-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.course-action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}

.action-btn {
  flex: 1;
  border-radius: 8px;
  font-weight: 600;
}

.action-btn.buy {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.action-btn.continue {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border: none;
}

.course-progress-section {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.tabs-card {
  border-radius: 12px;
  margin-bottom: 24px;
}

.main-tabs :deep(.el-tabs__header) {
  margin: -1px -1px 0;
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.benefit-card {
  text-align: center;
  padding: 18px 12px;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.benefit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.benefit-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 10px;
}

.benefit-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #303133;
}

.benefit-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

.checkin-calendar-section {
  padding: 4px 0 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.checkin-count {
  font-size: 13px;
  color: #909399;
}

.checkin-days {
  color: #67c23a;
  font-size: 18px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;
  position: relative;
  transition: all 0.2s;
}

.calendar-day.today {
  border: 2px solid #409eff;
}

.calendar-day.checked {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #fff;
  font-weight: 600;
}

.day-num {
  margin-bottom: 2px;
}

.check-icon {
  font-size: 12px;
}

.list-subtitle {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
}

.checkin-table :deep(.el-table__row) {
  cursor: pointer;
}

.date-text {
  color: #606266;
  font-size: 13px;
}

.chapter-link {
  color: #409eff;
  font-size: 13px;
}

.trial-list {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.trial-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 10px;
  background: #fafbfc;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.trial-item:hover {
  background: #f0f2f5;
}

.trial-info {
  flex: 1;
  min-width: 0;
}

.trial-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.trial-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.trial-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trial-progress-bar {
  padding: 0 2px;
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  flex-shrink: 0;
}

.chapter-section-row {
  margin-top: 8px;
}

.chapters-card {
  border-radius: 12px;
}

.chapters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapters-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapters-title .el-icon {
  color: #409eff;
}

.chapters-count {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.chapters-progress-text {
  font-size: 13px;
  color: #606266;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.2s;
  gap: 16px;
}

.chapter-item:hover {
  background: #f0f2f5;
}

.chapter-item.completed {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.08) 0%, transparent 100%);
}

.chapter-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.chapter-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  color: #606266;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.chapter-index.done {
  background: #67c23a;
  color: #fff;
}

.chapter-content {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chapter-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.chapter-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
</style>
