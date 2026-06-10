<template>
  <div class="course-list-container" v-loading="loading">
    <div class="filter-bar">
      <div class="category-tabs">
        <el-tag :type="category === '' ? 'primary' : 'info'" effect="dark" class="tag-btn" @click="category = ''">全部</el-tag>
        <el-tag v-for="cat in categories" :key="cat"
          :type="category === cat ? 'primary' : 'info'" effect="dark" class="tag-btn"
          @click="category = cat">{{ cat }}</el-tag>
      </div>
      <el-input v-model="keyword" placeholder="搜索课程名称" style="width: 280px" :prefix-icon="Search" clearable />
    </div>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="course in filteredList" :key="course.id">
        <el-card class="course-card" shadow="hover" @click="goDetail(course)">
          <div class="course-cover">
            <img :src="course.cover" :alt="course.title" />
            <div class="badges" v-if="course.memberFree">
              <el-tag type="warning" size="small" effect="dark">会员免费</el-tag>
            </div>
          </div>
          <div class="course-body">
            <h4 class="course-title">{{ course.title }}</h4>
            <p class="course-desc">{{ course.description }}</p>
            <div class="course-meta">
              <span>📚 {{ course.totalChapters }}章</span>
              <span>⏱ {{ course.totalDuration }}分钟</span>
            </div>
            <div class="course-footer">
              <div class="price">
                <span class="current">¥{{ course.price }}</span>
                <span class="origin" v-if="course.originalPrice">¥{{ course.originalPrice }}</span>
              </div>
              <el-button type="primary" size="small" @click.stop="buyCourse(course)">购买</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="filteredList.length === 0" description="暂无课程" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getCourseList } from '@/api/course'

const router = useRouter()
const loading = ref(false)
const category = ref('')
const keyword = ref('')
const categories = ref(['职场软技能', '办公技能', '专业认证', '管理能力'])
const courseList = ref([])

const filteredList = computed(() => {
  return courseList.value.filter(c => {
    const matchCat = !category.value || c.category === category.value
    const matchKw = !keyword.value || c.title.includes(keyword.value)
    return matchCat && matchKw
  })
})

const loadList = async () => {
  loading.value = true
  try {
    const res = await getCourseList({ page: 1, size: 20 })
    courseList.value = res?.data?.list || res?.list || []
  } catch (e) {
    courseList.value = [
      { id: 1, title: '职场沟通必修课', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20communication%20course%20cover&image_size=square', description: '从职场小白到沟通高手，系统提升职场沟通能力', category: '职场软技能', price: 299, originalPrice: 599, memberFree: 1, totalChapters: 12, totalDuration: 480 },
      { id: 2, title: '高效时间管理实战', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=time%20management%20productivity&image_size=square', description: '告别拖延，掌握高效工作方法论', category: '职场软技能', price: 199, originalPrice: 399, memberFree: 1, totalChapters: 8, totalDuration: 320 },
      { id: 3, title: 'Excel数据处理精通', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=excel%20data%20analysis%20professional&image_size=square', description: '从入门到精通，成为Excel高手', category: '办公技能', price: 399, originalPrice: 799, memberFree: 0, totalChapters: 16, totalDuration: 640 },
      { id: 4, title: '项目管理PMP备考', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=project%20management%20pmp&image_size=square', description: '系统学习项目管理知识体系', category: '专业认证', price: 899, originalPrice: 1599, memberFree: 0, totalChapters: 24, totalDuration: 960 },
      { id: 5, title: '团队管理实战指南', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=team%20leadership%20management&image_size=square', description: '从技术骨干到团队管理者的必修课', category: '管理能力', price: 599, originalPrice: 999, memberFree: 1, totalChapters: 10, totalDuration: 420 },
      { id: 6, title: 'PPT设计高手速成', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ppt%20presentation%20design&image_size=square', description: '打造让人眼前一亮的职场PPT', category: '办公技能', price: 249, originalPrice: 499, memberFree: 0, totalChapters: 14, totalDuration: 560 },
      { id: 7, title: '职场英语沟通', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20english%20communication&image_size=square', description: '职场场景英语，外企必备', category: '职场软技能', price: 399, originalPrice: 699, memberFree: 0, totalChapters: 20, totalDuration: 800 },
      { id: 8, title: '数据分析师养成', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=data%20analyst%20business%20intelligence&image_size=square', description: '用数据驱动业务决策', category: '专业认证', price: 1299, originalPrice: 1999, memberFree: 0, totalChapters: 30, totalDuration: 1200 }
    ]
  } finally {
    loading.value = false
  }
}

const goDetail = (c) => router.push(`/course/${c.id}`)
const buyCourse = (c) => {
  ElMessage.info(`即将购买：${c.title}`)
  router.push(`/course/${c.id}`)
}

onMounted(loadList)
</script>

<style scoped>
.course-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.category-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.tag-btn {
  cursor: pointer;
  padding: 6px 14px;
}
.course-card {
  margin-bottom: 20px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}
.course-card:hover {
  transform: translateY(-4px);
}
.course-cover {
  position: relative;
  height: 160px;
  margin: -20px -20px 12px;
  overflow: hidden;
}
.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.badges {
  position: absolute;
  top: 10px;
  left: 10px;
}
.course-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.course-desc {
  color: #909399;
  font-size: 13px;
  margin: 0 0 12px;
  height: 38px;
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
  margin-bottom: 12px;
}
.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price .current {
  font-size: 20px;
  color: #f56c6c;
  font-weight: 700;
}
.price .origin {
  font-size: 12px;
  color: #c0c4cc;
  text-decoration: line-through;
  margin-left: 6px;
}
</style>
