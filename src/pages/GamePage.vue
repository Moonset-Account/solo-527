<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useProgressStore } from '@/stores/progressStore'
import { useGameLoop } from '@/composables/useGameLoop'
import { useAudio } from '@/composables/useAudio'
import { PuzzleEngine } from '@/game/PuzzleEngine'
import chaptersConfig from '@/config/chapters.json'
import poemsConfig from '@/config/poems.json'
import type { ErrorFeedback, Poem, ToneType, HintResult } from '@/types'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const progressStore = useProgressStore()
const audio = useAudio()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameLoop = useGameLoop(canvasRef)

const chapterId = route.params.chapterId as string
const levelId = route.params.levelId as string

const showTutorial = ref(!progressStore.tutorialCompleted)
const showError = ref(false)
const currentError = ref<ErrorFeedback | null>(null)

const chapter = chaptersConfig.find((c) => c.id === chapterId)
const level = chapter?.levels.find((l) => l.id === levelId)

const poemTitle = ref('')
const poemAuthor = ref('')
const poemDynasty = ref('')
const poemImagery = ref<string[]>([])

const formattedTime = ref('00:00')
const currentLineIndex = ref(0)
const totalLines = ref(0)
const poemRef = ref<Poem | null>(null)

function castPoem(raw: any): Poem {
  return {
    ...raw,
    imagery: raw.imagery ?? [],
    lines: raw.lines.map((line: any) => ({
      ...line,
      characters: line.characters.map((cu: any) => ({
        ...cu,
        tone: cu.tone as ToneType,
      })),
      tonePattern: line.tonePattern.map((tp: any) => ({
        ...tp,
        tone: tp.tone as ToneType,
      })),
    })),
  }
}

function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

watch(() => gameStore.elapsedTime, (v) => {
  formattedTime.value = formatElapsedTime(v)
})

onMounted(() => {
  if (!chapter || !level) {
    router.push('/levels')
    return
  }

  const rawPoem = poemsConfig.find((p) => p.id === level.poemId)
  if (!rawPoem) {
    router.push('/levels')
    return
  }

  const poem = castPoem(rawPoem)
  poemRef.value = poem
  poemTitle.value = poem.title
  poemAuthor.value = poem.author
  poemDynasty.value = poem.dynasty
  poemImagery.value = poem.imagery
  totalLines.value = poem.lines.length
  currentLineIndex.value = 0

  gameStore.initGame(chapterId, levelId)

  const firstLine = poem.lines[0]
  if (firstLine) {
    const engine = new PuzzleEngine(firstLine, poem.imagery, level.hintPoints)
    gameStore.setPuzzleEngine(engine)
  }

  gameLoop.start()
})

watch(() => gameStore.isComplete, (complete) => {
  if (!complete) return
  audio.playComplete()

  const poem = poemRef.value
  if (poem && currentLineIndex.value < poem.lines.length - 1) {
    currentLineIndex.value++
    const nextLine = poem.lines[currentLineIndex.value]
    if (nextLine) {
      const engine = new PuzzleEngine(nextLine, poemImagery.value, level?.hintPoints ?? 5)
      gameStore.setPuzzleEngine(engine)
      gameStore.isComplete = false
    }
  } else {
    const score = gameStore.calculateScore()
    progressStore.completeLevel(chapterId, levelId, score.stars, gameStore.elapsedTime)
    gameStore.recordSession('success')
    setTimeout(() => {
      router.push(`/result/${chapterId}/${levelId}`)
    }, 800)
  }
})

watch(() => gameStore.errorFeedback, (err) => {
  if (err) {
    currentError.value = err
    showError.value = true
    audio.playError()
    setTimeout(() => {
      showError.value = false
      gameStore.clearErrorFeedback()
    }, 2500)
  }
})

function handleHint(type: 'tone' | 'imagery' | 'position') {
  const result = gameStore.useHint(type)
  if (result && result.cost > 0) {
    audio.playHint()
  }
}

function handleUndo() {
  gameStore.undo()
  audio.playClick()
}

function handleReset() {
  gameStore.resetPuzzle()
  currentLineIndex.value = 0
  const poem = poemRef.value
  if (poem && poem.lines.length > 0) {
    const engine = new PuzzleEngine(poem.lines[0], poemImagery.value, level?.hintPoints ?? 5)
    gameStore.setPuzzleEngine(engine)
  }
  audio.playClick()
}

function dismissTutorial() {
  showTutorial.value = false
  progressStore.tutorialCompleted = true
}

function goBack() {
  gameStore.recordSession('quit')
  gameLoop.stop()
  router.push('/levels')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8] flex flex-col">
    <header class="flex items-center justify-between px-4 py-2 border-b border-[#f5f0e8]/10 bg-[#1a1a2e]/90 backdrop-blur-sm">
      <button @click="goBack" class="px-3 py-1.5 rounded-lg border border-[#f5f0e8]/15 text-[#f5f0e8]/60 text-sm hover:bg-[#f5f0e8]/5 transition-all"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        ← 返回
      </button>
      <div class="text-center">
        <div class="text-xs text-[#f5f0e8]/40" style="font-family: 'KaiTi', 'STKaiti', serif;">{{ chapter?.name }}</div>
        <div class="text-sm font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">{{ poemTitle }}</div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-[#f5f0e8]/40" style="font-family: 'KaiTi', 'STKaiti', serif;">
          第{{ currentLineIndex + 1 }}/{{ totalLines }}句
        </span>
        <span class="text-sm text-[#f5f0e8]/60 font-mono">{{ formattedTime }}</span>
      </div>
    </header>

    <div class="flex-1 flex flex-col lg:flex-row min-h-0">
      <div class="flex-1 relative min-h-[300px] lg:min-h-0">
        <canvas ref="canvasRef" class="absolute inset-0 w-full h-full cursor-pointer"></canvas>

        <div v-if="showError" class="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-shake">
          <div class="bg-[#c0392b]/90 text-[#f5f0e8] px-6 py-3 rounded-xl text-sm font-serif shadow-lg shadow-[#c0392b]/30 backdrop-blur-sm"
               style="font-family: 'KaiTi', 'STKaiti', serif;">
            <div class="font-bold mb-1">✘ {{ currentError?.message }}</div>
            <div class="text-xs text-[#f5f0e8]/70">{{ currentError?.detail }}</div>
            <div v-if="currentError?.type === 'tone_mismatch'" class="text-xs text-[#f5f0e8]/50 mt-1">
              提示：蓝色圆点=平声，红色圆点=仄声
            </div>
            <div v-else-if="currentError?.type === 'imagery_clash'" class="text-xs text-[#f5f0e8]/50 mt-1">
              提示：可使用意象提示了解此句意象
            </div>
          </div>
        </div>
      </div>

      <aside class="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-[#f5f0e8]/10 bg-[#1a1a2e]/95 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
        <div class="bg-[#f5f0e8]/5 rounded-xl p-4 border border-[#f5f0e8]/10">
          <h3 class="text-sm font-serif text-[#f5f0e8]/70 mb-2" style="font-family: 'KaiTi', 'STKaiti', serif;">诗词信息</h3>
          <div class="text-lg font-serif mb-1" style="font-family: 'KaiTi', 'STKaiti', serif;">{{ poemTitle }}</div>
          <div class="text-xs text-[#f5f0e8]/40">{{ poemDynasty }}·{{ poemAuthor }}</div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-serif text-[#f5f0e8]/70" style="font-family: 'KaiTi', 'STKaiti', serif;">提示</h3>
          <button @click="handleHint('tone')"
                  :disabled="gameStore.hintPoints < 1"
                  class="hint-btn px-4 py-2 rounded-lg border border-[#2c6e8a]/30 bg-[#2c6e8a]/10 text-[#2c6e8a] text-sm hover:bg-[#2c6e8a]/20 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            声调提示 <span class="text-[#2c6e8a]/50 text-xs ml-2">-1点</span>
          </button>
          <button @click="handleHint('imagery')"
                  :disabled="gameStore.hintPoints < 2"
                  class="hint-btn px-4 py-2 rounded-lg border border-[#2c6e8a]/30 bg-[#2c6e8a]/10 text-[#2c6e8a] text-sm hover:bg-[#2c6e8a]/20 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            意象提示 <span class="text-[#2c6e8a]/50 text-xs ml-2">-2点</span>
          </button>
          <button @click="handleHint('position')"
                  :disabled="gameStore.hintPoints < 3"
                  class="hint-btn px-4 py-2 rounded-lg border border-[#2c6e8a]/30 bg-[#2c6e8a]/10 text-[#2c6e8a] text-sm hover:bg-[#2c6e8a]/20 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            位置提示 <span class="text-[#2c6e8a]/50 text-xs ml-2">-3点</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 text-center text-sm">
          <div class="bg-[#f5f0e8]/5 rounded-lg p-2 border border-[#f5f0e8]/10">
            <div class="text-[#f5f0e8]/40 text-xs">提示点数</div>
            <div class="text-[#2c6e8a] font-bold text-lg">{{ gameStore.hintPoints }}</div>
          </div>
          <div class="bg-[#f5f0e8]/5 rounded-lg p-2 border border-[#f5f0e8]/10">
            <div class="text-[#f5f0e8]/40 text-xs">错误次数</div>
            <div class="text-[#c0392b] font-bold text-lg">{{ gameStore.errorsCount }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-center text-sm">
          <div class="bg-[#f5f0e8]/5 rounded-lg p-2 border border-[#f5f0e8]/10">
            <div class="text-[#f5f0e8]/40 text-xs">操作次数</div>
            <div class="text-[#f5f0e8]/80 font-bold text-lg">{{ gameStore.keyChoices.length }}</div>
          </div>
          <div class="bg-[#f5f0e8]/5 rounded-lg p-2 border border-[#f5f0e8]/10">
            <div class="text-[#f5f0e8]/40 text-xs">可撤销</div>
            <div class="text-[#f5f0e8]/80 font-bold text-lg">{{ gameStore.undoStack.length }}</div>
          </div>
        </div>

        <div v-if="gameStore.lastHint" class="bg-[#2c6e8a]/10 rounded-lg p-3 border border-[#2c6e8a]/20 text-sm text-[#2c6e8a] font-serif"
             style="font-family: 'KaiTi', 'STKaiti', serif;">
          <div class="font-bold mb-1">{{ gameStore.lastHint.type === 'tone' ? '声调提示' : gameStore.lastHint.type === 'imagery' ? '意象提示' : '位置提示' }}</div>
          {{ gameStore.lastHint.message }}
        </div>
      </aside>
    </div>

    <footer class="flex items-center justify-center gap-4 px-4 py-3 border-t border-[#f5f0e8]/10 bg-[#1a1a2e]/90 backdrop-blur-sm">
      <button @click="handleUndo"
              :disabled="gameStore.undoStack.length === 0"
              class="px-6 py-2 rounded-xl border border-[#f5f0e8]/15 bg-[#f5f0e8]/5 text-[#f5f0e8]/70 text-sm hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        撤销
      </button>
      <button @click="handleReset"
              class="px-6 py-2 rounded-xl border border-[#c0392b]/30 bg-[#c0392b]/10 text-[#c0392b] text-sm hover:bg-[#c0392b]/20 transition-all"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        重置
      </button>
    </footer>

    <div v-if="showTutorial" class="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/80 backdrop-blur-sm">
      <div class="bg-[#1a1a2e] border border-[#f5f0e8]/20 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <h2 class="text-2xl font-serif text-center mb-6 text-[#f5f0e8]"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          游戏指引
        </h2>
        <div class="space-y-4 text-sm text-[#f5f0e8]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
          <div class="flex items-start gap-3">
            <span class="text-[#2c6e8a] font-bold shrink-0">一</span>
            <p>将散乱的字<span class="text-[#c0392b]">拖入</span>正确的空位，还原词句原貌</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-[#2c6e8a] font-bold shrink-0">二</span>
            <p>注意声调提示：<span class="text-[#2c6e8a]">蓝色圆点</span>为平声，<span class="text-[#c0392b]">红色圆点</span>为仄声</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-[#2c6e8a] font-bold shrink-0">三</span>
            <p>将已放入槽位的字拖到空白处可取回，拖到另一个已填槽位可交换</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-[#2c6e8a] font-bold shrink-0">四</span>
            <p>可使用提示辅助判断，但会消耗提示点数；少犯错误、快速完成可获得更高星级</p>
          </div>
        </div>
        <button @click="dismissTutorial"
                class="mt-8 w-full px-6 py-3 rounded-xl border border-[#c0392b]/40 bg-[#c0392b]/15 text-[#c0392b] hover:bg-[#c0392b]/25 transition-all font-serif"
                style="font-family: 'KaiTi', 'STKaiti', serif;">
          开始拼词
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(-50%); }
  25% { transform: translateX(calc(-50% + 8px)); }
  50% { transform: translateX(calc(-50% - 6px)); }
  75% { transform: translateX(calc(-50% + 4px)); }
}

.animate-shake {
  animation: shake 0.4s ease-out;
}
</style>
