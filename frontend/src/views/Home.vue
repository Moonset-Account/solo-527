<template>
  <div>
    <section class="relative h-[500px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-800/90 to-primary-600/80">
        <img
          src="https://picsum.photos/seed/pottery/1920/800"
          alt="手作工坊"
          class="w-full h-full object-cover mix-blend-overlay opacity-60"
        />
      </div>
      <div class="absolute inset-0 flex items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div class="max-w-2xl">
            <h1 class="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              用双手
              <br />
              创造专属的温度
            </h1>
            <p class="text-xl text-white/90 mb-8 leading-relaxed">
              陶艺、银饰、皮具，专业老师手把手教学
              <br />
              零基础也能做出满意的作品
            </p>
            <div class="flex space-x-4">
              <router-link to="/courses" class="btn-primary text-lg px-8 py-4">
                浏览课程
              </router-link>
              <router-link to="/gallery" class="btn-secondary text-lg px-8 py-4 !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                作品欣赏
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="section-title text-center">探索手作的世界</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <router-link
            to="/courses?category=pottery"
            class="card card-hover group cursor-pointer"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img
                src="https://picsum.photos/seed/pottery-category/600/450"
                alt="陶艺"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center space-x-3 mb-3">
                <span class="text-3xl">🏺</span>
                <h3 class="font-display text-xl font-semibold text-inkBlack">陶艺课程</h3>
              </div>
              <p class="text-warmGray mb-4">
                从揉泥到拉坯，感受泥土在指尖的变化，创作独一无二的陶艺作品。
              </p>
              <span class="text-primary-600 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform">
                查看课程 →
              </span>
            </div>
          </router-link>

          <router-link
            to="/courses?category=silver"
            class="card card-hover group cursor-pointer"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img
                src="https://picsum.photos/seed/silver-category/600/450"
                alt="银饰"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center space-x-3 mb-3">
                <span class="text-3xl">💍</span>
                <h3 class="font-display text-xl font-semibold text-inkBlack">银饰课程</h3>
              </div>
              <p class="text-warmGray mb-4">
                学习银饰锻造技艺，亲手打造一枚专属于你的银饰，记录美好时光。
              </p>
              <span class="text-primary-600 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform">
                查看课程 →
              </span>
            </div>
          </router-link>

          <router-link
            to="/courses?category=leather"
            class="card card-hover group cursor-pointer"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img
                src="https://picsum.photos/seed/leather-category/600/450"
                alt="皮具"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center space-x-3 mb-3">
                <span class="text-3xl">👜</span>
                <h3 class="font-display text-xl font-semibold text-inkBlack">皮具课程</h3>
              </div>
              <p class="text-warmGray mb-4">
                选用优质头层牛皮，一针一线缝制出耐用又美观的皮具作品。
              </p>
              <span class="text-primary-600 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform">
                查看课程 →
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="section-title mb-2">热门课程</h2>
            <p class="text-warmGray">精选人气课程，体验手作的乐趣</p>
          </div>
          <router-link to="/courses" class="text-primary-600 font-medium hover:text-primary-700">
            查看全部 →
          </router-link>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="course in featuredCourses"
            :key="course.id"
            class="card card-hover"
          >
            <div class="aspect-video overflow-hidden relative">
              <img
                :src="course.cover_image || `https://picsum.photos/seed/course${course.id}/600/340`"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-4 left-4">
                <span class="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-primary-700">
                  {{ getCategoryName(course.category) }}
                </span>
              </div>
            </div>
            <div class="p-6">
              <h3 class="font-display text-lg font-semibold text-inkBlack mb-2 line-clamp-1">
                {{ course.title }}
              </h3>
              <div class="flex items-center space-x-2 text-sm text-warmGray mb-4">
                <span>⏱ {{ course.duration }}分钟</span>
                <span>·</span>
                <span>👥 最多{{ course.max_students }}人</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-primary-600">
                  ¥{{ course.price }}
                </span>
                <router-link
                  :to="`/courses/${course.id}`"
                  class="btn-primary text-sm py-2 px-4"
                >
                  立即报名
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="section-title mb-2">学员作品</h2>
            <p class="text-warmGray">来自学员的真实作品展示</p>
          </div>
          <router-link to="/gallery" class="text-primary-600 font-medium hover:text-primary-700">
            查看更多 →
          </router-link>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="work in featuredWorks"
            :key="work.id"
            class="group cursor-pointer"
          >
            <div class="aspect-square overflow-hidden rounded-card mb-3">
              <img
                :src="work.images?.[0] || `https://picsum.photos/seed/work${work.id}/400/400`"
                :alt="work.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h4 class="font-medium text-inkBlack text-sm line-clamp-1">{{ work.title }}</h4>
            <p class="text-warmGray text-xs">{{ work.student?.name || '匿名学员' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-gradient-to-br from-primary-50 to-cream">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="section-title mb-6">为什么选择我们？</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🎓</span>
            </div>
            <h3 class="font-display text-lg font-semibold text-inkBlack mb-3">专业师资</h3>
            <p class="text-warmGray">
              所有老师均有5年以上行业经验，教学耐心细致，确保每位学员都能学会。
            </p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🎨</span>
            </div>
            <h3 class="font-display text-lg font-semibold text-inkBlack mb-3">优质材料</h3>
            <p class="text-warmGray">
              严选优质材料包，陶艺用优质陶泥、银饰用925纯银、皮具用头层牛皮。
            </p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">💝</span>
            </div>
            <h3 class="font-display text-lg font-semibold text-inkBlack mb-3">小班教学</h3>
            <p class="text-warmGray">
              每班最多8人，确保老师能照顾到每位学员，学习效果更佳。
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Course, Work } from '@/types'
import { getCourses } from '@/api/courses'
import { getWorks } from '@/api/works'

const featuredCourses = ref<Course[]>([])
const featuredWorks = ref<Work[]>([])

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[category] || category
}

onMounted(async () => {
  try {
    const [coursesRes, worksRes] = await Promise.all([
      getCourses({ per_page: 3 }),
      getWorks({ public: 'true', per_page: 8 })
    ])
    featuredCourses.value = coursesRes.data
    featuredWorks.value = worksRes.data
  } catch (e) {
    featuredCourses.value = [
      { id: 1, title: '手工拉坯入门', category: 'pottery', duration: 180, price: 299, max_students: 8, cover_image: 'https://picsum.photos/seed/course1/600/340' } as Course,
      { id: 2, title: '银饰戒指制作', category: 'silver', duration: 240, price: 399, max_students: 6, cover_image: 'https://picsum.photos/seed/course2/600/340' } as Course,
      { id: 3, title: '短款钱包制作', category: 'leather', duration: 210, price: 349, max_students: 8, cover_image: 'https://picsum.photos/seed/course3/600/340' } as Course
    ]
    featuredWorks.value = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `作品${i + 1}`,
      images: [`https://picsum.photos/seed/work${i + 1}/400/400`],
      student: { name: `学员${i + 1}` }
    } as Work))
  }
})
</script>
