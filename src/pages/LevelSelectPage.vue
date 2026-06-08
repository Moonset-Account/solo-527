<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useAnalytics } from '@/composables/useAnalytics'
import chaptersConfig from '@/config/chapters.json'
import cipaiConfig from '@/config/cipai.json'

const router = useRouter()
const progressStore = useProgressStore()
const { trackPageView } = useAnalytics()

trackPageView('level_select')

const expandedChapter = ref<string | null>(null)

function toggleChapter(chapterId: string) {
  expandedChapter.value = expandedChapter.value === chapterId ? null : chapterId
}

function getCiPaiName(ciPaiId: string): string {
  const cp = cipaiConfig.find((c) => c.id === ciPaiId)
  return cp?.name ?? ''
}

function selectLevel(chapterId: string, levelId: string) {
  router.push(`/game/${chapterId}/${levelId}`)
}

function goHome() {
  router.push('/')
}

function formatStars(stars: number, max: number = 3): string {
  return '★'.repeat(stars) + '☆'.repeat(max - stars)
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8]">
    <div class="absolute inset-0 pointer-events-none opacity-5">
      <svg viewBox="0 0 1440 400" class="w-full h-64" preserveAspectRatio="none">
        <path d="M0,300 Q200,100 500,250 T1000,200 T1440,280 L1440,400 L0,400 Z" fill="#2c6e8a"/>
        <path d="M0,350 Q300,200 600,300 T1200,250 T1440,320 L1440,400 L0,400 Z" fill="#f5f0e8" opacity="0.5"/>
      </svg>
    </div>

    <header class="relative z-10 flex items-center px-6 py-4 border-b border-[#f5f0e8]/10">
      <button
        @click="goHome"
        class="px-4 py-2 rounded-lg border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8]/70 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all duration-200 text-sm"
        style="font-family: 'KaiTi', 'STKaiti', serif;"
      >
        ← 返回
      </button>
      <h1 class="flex-1 text-center text-2xl tracking-[0.3em] font-serif"
          style="font-family: 'KaiTi', 'STKaiti', serif;">
        词境卷轴
      </h1>
      <div class="w-16"></div>
    </header>

    <div class="relative z-10 overflow-x-auto py-6 px-4">
      <div class="flex gap-6 min-w-max pb-4">
        <div
          v-for="chapter in chaptersConfig"
          :key="chapter.id"
          class="scroll-card flex-shrink-0 w-80 rounded-2xl border transition-all duration-500 cursor-pointer"
          :class="[
            progressStore.isChapterUnlocked(chapter.id)
              ? 'border-[#2c6e8a]/30 bg-gradient-to-b from-[#f5f0e8]/8 to-[#1a1a2e] hover:border-[#2c6e8a]/60 hover:shadow-lg hover:shadow-[#2c6e8a]/10'
              : 'border-[#f5f0e8]/5 bg-[#1a1a2e]/80 opacity-60 cursor-not-allowed',
            expandedChapter === chapter.id ? 'ring-1 ring-[#c0392b]/40' : ''
          ]"
          @click="progressStore.isChapterUnlocked(chapter.id) && toggleChapter(chapter.id)"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xl tracking-[0.15em] font-serif"
                  style="font-family: 'KaiTi', 'STKaiti', serif;"
                  :class="progressStore.isChapterUnlocked(chapter.id) ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/40'">
                {{ chapter.name }}
              </h2>
              <span v-if="!progressStore.isChapterUnlocked(chapter.id)" class="text-[#f5f0e8]/30 text-2xl">🔒</span>
              <span v-else class="text-[#c0392b] text-sm">
                {{ progressStore.getChapterStars(chapter.id) }}/{{ progressStore.getChapterMaxStars(chapter.id) }} ★
              </span>
            </div>

            <p class="text-sm text-[#f5f0e8]/50 leading-relaxed mb-4 font-serif"
               style="font-family: 'KaiTi', 'STKaiti', serif;">
              {{ chapter.description }}
            </p>

            <div class="flex items-center justify-between text-xs text-[#f5f0e8]/30">
              <span>{{ getCiPaiName(chapter.ciPaiId) }}</span>
              <span v-if="!progressStore.isChapterUnlocked(chapter.id)" class="text-[#c0392b]/50">未解锁</span>
              <span v-else class="text-[#2c6e8a]/60">{{ chapter.levels.length }}关</span>
            </div>
          </div>

          <div
            v-if="expandedChapter === chapter.id && progressStore.isChapterUnlocked(chapter.id)"
            class="border-t border-[#f5f0e8]/10 p-4 space-y-3"
          >
            <div
              v-for="(level, idx) in chapter.levels"
              :key="level.id"
              class="level-node flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
              :class="[
                progressStore.isLevelUnlocked(chapter.id, level.id)
                  ? 'bg-[#f5f0e8]/5 hover:bg-[#f5f0e8]/10 cursor-pointer'
                  : 'bg-[#f5f0e8]/2 cursor-not-allowed'
              ]"
              @click.stop="progressStore.isLevelUnlocked(chapter.id, level.id) && selectLevel(chapter.id, level.id)"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border"
                :class="[
                  progressStore.isLevelUnlocked(chapter.id, level.id)
                    ? 'border-[#2c6e8a]/50 text-[#2c6e8a] bg-[#2c6e8a]/10'
                    : 'border-[#f5f0e8]/10 text-[#f5f0e8]/20 bg-transparent'
                ]"
              >
                <template v-if="!progressStore.isLevelUnlocked(chapter.id, level.id)">🔒</template>
                <template v-else>{{ idx + 1 }}</template>
              </div>

              <div class="flex-1">
                <div class="text-sm font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;"
                     :class="progressStore.isLevelUnlocked(chapter.id, level.id) ? 'text-[#f5f0e8]/80' : 'text-[#f5f0e8]/30'">
                  第{{ idx + 1 }}关
                </div>
                <div class="text-xs text-[#f5f0e8]/30 mt-0.5">
                  难度 {{ '●'.repeat(level.difficulty) }}{{ '○'.repeat(5 - level.difficulty) }}
                </div>
              </div>

              <div class="text-sm"
                   :class="progressStore.isLevelUnlocked(chapter.id, level.id) ? 'text-[#c0392b]' : 'text-[#f5f0e8]/15'">
                {{ formatStars(progressStore.getLevelStars(chapter.id, level.id)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relative z-10 text-center py-4 text-[#f5f0e8]/20 text-xs tracking-widest font-serif"
         style="font-family: 'KaiTi', 'STKaiti', serif;">
      左右滑动浏览词境卷轴
    </div>
  </div>
</template>

<style scoped>
.scroll-card {
  backdrop-filter: blur(8px);
}
</style>
