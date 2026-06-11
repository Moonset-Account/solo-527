<script setup lang="ts">
import { useRooms } from '~/composables/useRooms'
import { useReviews } from '~/composables/useReviews'

definePageMeta({ layout: 'default' })

const route = useRoute()
const roomId = Number(route.params.id)

const { fetchRoom, loading: roomLoading } = useRooms()
const { reviews, averageRating, ratingDistribution, fetchReviews, loading: reviewsLoading } = useReviews()

const room = ref<Awaited<ReturnType<typeof fetchRoom>> | null>(null)

const statusLabel: Record<string, string> = {
  AVAILABLE: '可预订',
  BOOKED: '已预订',
  OCCUPIED: '已入住',
  MAINTENANCE: '维护中',
  CLEANING: '清洁中',
}

const statusClass: Record<string, string> = {
  AVAILABLE: 'status-available',
  BOOKED: 'status-booked',
  OCCUPIED: 'status-occupied',
  MAINTENANCE: 'status-maintenance',
  CLEANING: 'status-cleaning',
}

const priceCalendar = computed(() => {
  if (!room.value?.inventories) return []
  return room.value.inventories.slice(0, 7).map((inv) => ({
    date: new Date(inv.date).getDate(),
    month: new Date(inv.date).getMonth() + 1,
    weekday: ['日', '一', '二', '三', '四', '五', '六'][new Date(inv.date).getDay()],
    price: Number(inv.price),
    available: inv.availableCount,
  }))
})

const amenitiesList = computed(() => {
  if (!room.value?.amenities) return []
  return Array.isArray(room.value.amenities) ? room.value.amenities : []
})

onMounted(async () => {
  const data = await fetchRoom(roomId)
  if (data) room.value = data
  await fetchReviews({ roomId })
})
</script>

<template>
  <div>
    <div v-if="roomLoading && !room" class="text-center py-20 text-slate">
      <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
      <p>加载中...</p>
    </div>

    <template v-else-if="room">
      <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
        <div class="absolute inset-0 bg-gradient-to-br from-pine via-pine-light/70 to-amber/40" />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-cream/30 font-serif text-5xl">{{ room.name }}</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pine-dark/80 to-transparent p-6">
          <span
            class="px-3 py-1 rounded-full text-sm font-semibold"
            :class="statusClass[room.status]"
          >
            {{ statusLabel[room.status] }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <h2 class="font-serif text-2xl font-bold text-pine mb-4">{{ room.name }}</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div class="text-center p-3 rounded-lg bg-cream">
                <p class="text-slate text-xs mb-1">房型</p>
                <p class="font-semibold text-pine">{{ room.type }}</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-cream">
                <p class="text-slate text-xs mb-1">楼层</p>
                <p class="font-semibold text-pine">{{ room.floor }}F</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-cream">
                <p class="text-slate text-xs mb-1">最大入住</p>
                <p class="font-semibold text-pine">{{ room.maxGuests }}人</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-cream">
                <p class="text-slate text-xs mb-1">基础价</p>
                <p class="font-semibold text-amber">¥{{ Number(room.basePrice) }}/晚</p>
              </div>
            </div>

            <div v-if="amenitiesList.length > 0">
              <h3 class="text-sm font-medium text-pine/70 mb-2">设施服务</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(amenity, i) in amenitiesList"
                  :key="i"
                  class="px-3 py-1 rounded-full bg-cream text-pine text-xs font-medium border border-cream-dark"
                >
                  {{ amenity }}
                </span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="font-serif text-lg font-semibold text-pine mb-4">7日价格日历</h3>
            <div v-if="priceCalendar.length > 0" class="grid grid-cols-7 gap-2">
              <div
                v-for="(day, i) in priceCalendar"
                :key="i"
                class="text-center p-3 rounded-lg transition-colors"
                :class="day.available > 0 ? 'bg-pine/5 hover:bg-pine/10' : 'bg-slate/5'"
              >
                <p class="text-xs text-slate mb-0.5">{{ day.month }}/{{ day.date }}</p>
                <p class="text-xs text-slate/60 mb-1.5">周{{ day.weekday }}</p>
                <p
                  class="font-bold text-sm"
                  :class="day.available > 0 ? 'text-amber' : 'text-slate/40'"
                >
                  ¥{{ day.price }}
                </p>
                <p
                  class="text-[10px] mt-1"
                  :class="day.available > 0 ? 'text-pine' : 'text-brick'"
                >
                  {{ day.available > 0 ? `余${day.available}` : '已满' }}
                </p>
              </div>
            </div>
            <p v-else class="text-slate text-sm">暂无价格数据</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <h3 class="font-serif text-lg font-semibold text-pine mb-4">评价概览</h3>
            <div v-if="reviews.length > 0">
              <div class="text-center mb-4">
                <span class="text-4xl font-bold text-amber">{{ averageRating }}</span>
                <span class="text-slate text-sm ml-1">/ 5</span>
                <p class="text-slate text-xs mt-1">{{ reviews.length }} 条评价</p>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="star in [5, 4, 3, 2, 1]"
                  :key="star"
                  class="flex items-center gap-2 text-xs"
                >
                  <span class="text-slate w-3">{{ star }}</span>
                  <div class="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber rounded-full transition-all duration-300"
                      :style="{ width: `${reviews.length ? (ratingDistribution[star] / reviews.length) * 100 : 0}%` }"
                    />
                  </div>
                  <span class="text-slate w-6 text-right">{{ ratingDistribution[star] }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-slate text-sm">暂无评价</p>
          </div>

          <div class="card">
            <h3 class="font-serif text-lg font-semibold text-pine mb-4">最新评价</h3>
            <div v-if="reviews.length > 0" class="space-y-4">
              <div
                v-for="review in reviews.slice(0, 5)"
                :key="review.id"
                class="border-b border-cream-dark/50 last:border-0 pb-4 last:pb-0"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-pine">{{ review.user?.name || '匿名用户' }}</span>
                  <div class="flex gap-0.5">
                    <span
                      v-for="s in 5"
                      :key="s"
                      class="text-xs"
                      :class="s <= review.rating ? 'text-amber' : 'text-slate/30'"
                    >★</span>
                  </div>
                </div>
                <p class="text-sm text-pine/70 leading-relaxed">{{ review.content }}</p>
                <p v-if="review.reply" class="mt-1.5 text-xs text-pine/50 bg-cream rounded p-2">
                  店家回复：{{ review.reply }}
                </p>
              </div>
            </div>
            <p v-else class="text-slate text-sm">暂无评价</p>
          </div>

          <NuxtLink
            to="/order"
            class="btn-primary block w-full text-center py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            立即预订
          </NuxtLink>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="text-slate text-lg">房间不存在</p>
      <NuxtLink to="/" class="btn-secondary mt-4 inline-block">返回首页</NuxtLink>
    </div>
  </div>
</template>
