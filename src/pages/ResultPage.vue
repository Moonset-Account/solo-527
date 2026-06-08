<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useProgressStore } from '@/stores/progressStore'
import { ScoreCalculator } from '@/game/ScoreCalculator'
import chaptersConfig from '@/config/chapters.json'
import cipaiConfig from '@/config/cipai.json'
import cardsConfig from '@/config/cards.json'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const progressStore = useProgressStore()

const chapterId = route.params.chapterId as string
const levelId = route.params.levelId as string

const chapter = chaptersConfig.find((c) => c.id === chapterId)
const level = chapter?.levels.find((l) => l.id === levelId)
const ciPai = cipaiConfig.find((c) => c.id === chapter?.ciPaiId)
const cardData = cardsConfig.find((c) => c.ciPaiId === chapter?.ciPaiId)

const scoreResult = computed(() => {
  if (gameStore.scoreResult) return gameStore.scoreResult
  if (!chapter || !level) return null
  const calculator = new ScoreCalculator()
  return calculator.calculate({
    baseScore: 1000,
    timeUsed: gameStore.elapsedTime,
    timeLimit: level.timeLimit,
    hintsUsed: gameStore.hintsUsed,
    errorsCount: gameStore.errorsCount,
    difficulty: level.difficulty,
    multiplier: chapter.rules.scoreMultiplier,
  })
})

const starsRevealed = ref(0)
const isNewCard = computed(() => {
  if (!cardData) return false
  return progressStore.isCardUnlocked(cardData.id)
})

onMounted(() => {
  for (let i = 0; i < (scoreResult.value?.stars ?? 0); i++) {
    setTimeout(() => {
      starsRevealed.value++
    }, 400 * (i + 1))
  }
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getNextLevel() {
  if (!chapter) return null
  const idx = chapter.levels.findIndex((l) => l.id === levelId)
  if (idx < chapter.levels.length - 1) return chapter.levels[idx + 1]
  return null
}

function replay() {
  router.push(`/game/${chapterId}/${levelId}`)
}

function nextLevel() {
  const next = getNextLevel()
  if (next) {
    router.push(`/game/${chapterId}/${next.id}`)
  } else {
    router.push('/levels')
  }
}

function backToLevels() {
  router.push('/levels')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8] flex flex-col items-center relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div v-for="i in 6" :key="i"
           class="ink-bloom absolute rounded-full"
           :style="{
             width: (80 + i * 40) + 'px',
             height: (80 + i * 40) + 'px',
             left: (10 + i * 14) + '%',
             top: (5 + i * 12) + '%',
             animationDelay: (i * 0.3) + 's',
             background: i % 2 === 0
               ? 'radial-gradient(circle, rgba(44,110,138,0.08) 0%, transparent 70%)'
               : 'radial-gradient(circle, rgba(192,57,43,0.06) 0%, transparent 70%)',
           }"
      ></div>
    </div>

    <div class="relative z-10 w-full max-w-lg px-6 py-8 flex flex-col items-center gap-8">
      <h1 class="text-3xl font-serif tracking-[0.3em]"
          style="font-family: 'KaiTi', 'STKaiti', serif;">
        关卡完成
      </h1>

      <div class="flex gap-4 text-4xl">
        <span v-for="i in 3" :key="i"
              class="star-icon transition-all duration-500"
              :class="i <= starsRevealed ? 'text-[#c0392b] scale-100 opacity-100' : 'text-[#f5f0e8]/10 scale-50 opacity-30'"
              :style="{ transitionDelay: (i * 0.2) + 's' }">
          ★
        </span>
      </div>

      <div v-if="scoreResult" class="w-full bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-[#f5f0e8]/50 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">基础得分</span>
          <span class="text-[#f5f0e8]/80">{{ scoreResult.baseScore }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[#f5f0e8]/50 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">时间加成</span>
          <span class="text-[#2c6e8a]">+{{ scoreResult.timeBonus }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[#f5f0e8]/50 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">提示扣分</span>
          <span class="text-[#c0392b]">-{{ scoreResult.hintPenalty }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[#f5f0e8]/50 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">错误扣分</span>
          <span class="text-[#c0392b]">-{{ scoreResult.errorPenalty }}</span>
        </div>
        <div class="border-t border-[#f5f0e8]/10 pt-3 flex justify-between">
          <span class="font-serif text-[#f5f0e8]/70" style="font-family: 'KaiTi', 'STKaiti', serif;">总分</span>
          <span class="text-2xl font-bold text-[#c0392b]">{{ scoreResult.totalScore }}</span>
        </div>
      </div>

      <div class="w-full grid grid-cols-3 gap-4 text-center">
        <div class="bg-[#f5f0e8]/5 rounded-xl p-3 border border-[#f5f0e8]/10">
          <div class="text-xs text-[#f5f0e8]/40 mb-1">用时</div>
          <div class="text-lg text-[#2c6e8a]">{{ formatTime(gameStore.elapsedTime) }}</div>
        </div>
        <div class="bg-[#f5f0e8]/5 rounded-xl p-3 border border-[#f5f0e8]/10">
          <div class="text-xs text-[#f5f0e8]/40 mb-1">失误</div>
          <div class="text-lg text-[#c0392b]">{{ gameStore.errorsCount }}</div>
        </div>
        <div class="bg-[#f5f0e8]/5 rounded-xl p-3 border border-[#f5f0e8]/10">
          <div class="text-xs text-[#f5f0e8]/40 mb-1">提示</div>
          <div class="text-lg text-[#2c6e8a]">{{ gameStore.hintsUsed }}</div>
        </div>
      </div>

      <div v-if="isNewCard && cardData" class="w-full bg-[#c0392b]/10 rounded-2xl p-5 border border-[#c0392b]/20">
        <div class="text-xs text-[#c0392b]/60 mb-2">🔓 解锁学习卡</div>
        <div class="text-lg font-serif text-[#c0392b]"
             style="font-family: 'KaiTi', 'STKaiti', serif;">
          {{ cardData.title }}
        </div>
        <button @click="router.push(`/cards/${cardData.id}`)"
                class="mt-2 text-xs text-[#c0392b]/70 underline hover:text-[#c0392b] transition-all">
          查看卡片 →
        </button>
      </div>

      <div v-if="ciPai" class="w-full bg-[#2c6e8a]/8 rounded-2xl p-5 border border-[#2c6e8a]/20">
        <h3 class="text-sm text-[#2c6e8a]/60 mb-2 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">词牌故事</h3>
        <p class="text-sm text-[#f5f0e8]/60 leading-relaxed font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
          {{ ciPai.origin }}
        </p>
      </div>

      <div class="w-full flex flex-col gap-3">
        <button @click="nextLevel"
                class="w-full py-3 rounded-xl border border-[#c0392b]/40 bg-[#c0392b]/15 text-[#c0392b] hover:bg-[#c0392b]/25 transition-all font-serif tracking-widest"
                style="font-family: 'KaiTi', 'STKaiti', serif;">
          下一关
        </button>
        <div class="flex gap-3">
          <button @click="replay"
                  class="flex-1 py-3 rounded-xl border border-[#f5f0e8]/15 bg-[#f5f0e8]/5 text-[#f5f0e8]/60 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all font-serif text-sm"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            重玩
          </button>
          <button @click="backToLevels"
                  class="flex-1 py-3 rounded-xl border border-[#f5f0e8]/15 bg-[#f5f0e8]/5 text-[#f5f0e8]/60 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all font-serif text-sm"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            返回关卡
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes inkBloomAnim {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}

.ink-bloom {
  animation: inkBloomAnim 2s ease-out forwards;
  transform: scale(0);
}
</style>
