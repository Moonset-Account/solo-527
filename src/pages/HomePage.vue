<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useSaveData } from '@/composables/useSaveData'

const router = useRouter()
const progressStore = useProgressStore()
const { load } = useSaveData()

function startGame() {
  router.push('/levels')
}

function continueGame() {
  load()
  if (progressStore.hasSaveData()) {
    router.push('/levels')
  }
}

function openCards() {
  router.push('/cards')
}

function openSettings() {
  router.push('/settings')
}
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
    <div class="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#2a2a4e] to-[#1a1a2e]"></div>
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M30 0v60M0 30h60&quot; stroke=&quot;%23f5f0e8&quot; stroke-width=&quot;0.5&quot; fill=&quot;none&quot;/%3E%3C/svg%3E');"></div>

    <div class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      <div v-for="i in 12" :key="i"
        class="ink-petal absolute rounded-full"
        :style="{
          width: (4 + i * 2) + 'px',
          height: (4 + i * 2) + 'px',
          left: (i * 8.3) + '%',
          top: (10 + (i % 3) * 30) + '%',
          animationDelay: (i * 0.7) + 's',
          animationDuration: (6 + i * 0.5) + 's',
          background: i % 3 === 0 ? 'rgba(192,57,43,0.12)' : i % 3 === 1 ? 'rgba(44,110,138,0.10)' : 'rgba(245,240,232,0.08)',
        }"
      ></div>
    </div>

    <div class="absolute bottom-0 left-0 w-full h-48 pointer-events-none opacity-10">
      <svg viewBox="0 0 1440 200" class="w-full h-full" preserveAspectRatio="none">
        <path d="M0,200 Q200,80 400,140 T800,100 T1200,130 T1440,120 L1440,200 Z" fill="#f5f0e8"/>
        <path d="M0,200 Q300,120 600,160 T1000,140 T1440,160 L1440,200 Z" fill="#2c6e8a" opacity="0.3"/>
      </svg>
    </div>

    <div class="relative z-10 flex flex-col items-center gap-12 px-6">
      <div class="title-container text-center">
        <h1 class="title-ink text-7xl md:text-8xl font-serif text-[#f5f0e8] tracking-[0.3em] mb-4"
            style="font-family: 'KaiTi', 'STKaiti', 'SimSun', serif; text-shadow: 0 0 40px rgba(245,240,232,0.15), 0 4px 8px rgba(0,0,0,0.5);">
          词牌拼接
        </h1>
        <div class="ink-drip-line w-48 h-px mx-auto bg-gradient-to-r from-transparent via-[#c0392b] to-transparent"></div>
        <p class="mt-4 text-[#f5f0e8]/50 text-sm tracking-[0.5em] font-serif"
           style="font-family: 'KaiTi', 'STKaiti', serif;">
          以墨为韵·以词为戏
        </p>
      </div>

      <div class="flex flex-col gap-4 w-72">
        <button
          @click="startGame"
          class="menu-btn group relative px-8 py-4 rounded-xl border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8] text-lg tracking-[0.2em] font-serif overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[#c0392b]/60 hover:bg-[#c0392b]/10 hover:shadow-lg hover:shadow-[#c0392b]/20"
          style="font-family: 'KaiTi', 'STKaiti', serif;"
        >
          <span class="relative z-10">开始游戏</span>
          <div class="absolute inset-0 bg-gradient-to-r from-[#c0392b]/0 via-[#c0392b]/5 to-[#c0392b]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>

        <button
          @click="continueGame"
          class="menu-btn group relative px-8 py-4 rounded-xl border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8] text-lg tracking-[0.2em] font-serif overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[#2c6e8a]/60 hover:bg-[#2c6e8a]/10 hover:shadow-lg hover:shadow-[#2c6e8a]/20"
          style="font-family: 'KaiTi', 'STKaiti', serif;"
        >
          <span class="relative z-10">继续游戏</span>
          <div class="absolute inset-0 bg-gradient-to-r from-[#2c6e8a]/0 via-[#2c6e8a]/5 to-[#2c6e8a]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>

        <button
          @click="openCards"
          class="menu-btn group relative px-8 py-4 rounded-xl border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8] text-lg tracking-[0.2em] font-serif overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[#f5f0e8]/50 hover:bg-[#f5f0e8]/10 hover:shadow-lg hover:shadow-[#f5f0e8]/10"
          style="font-family: 'KaiTi', 'STKaiti', serif;"
        >
          <span class="relative z-10">学习卡集</span>
          <div class="absolute inset-0 bg-gradient-to-r from-[#f5f0e8]/0 via-[#f5f0e8]/5 to-[#f5f0e8]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>

        <button
          @click="openSettings"
          class="menu-btn group relative px-8 py-4 rounded-xl border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8] text-lg tracking-[0.2em] font-serif overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[#f5f0e8]/50 hover:bg-[#f5f0e8]/10 hover:shadow-lg hover:shadow-[#f5f0e8]/10"
          style="font-family: 'KaiTi', 'STKaiti', serif;"
        >
          <span class="relative z-10">设置</span>
          <div class="absolute inset-0 bg-gradient-to-r from-[#f5f0e8]/0 via-[#f5f0e8]/5 to-[#f5f0e8]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes inkDrip {
  0% {
    transform: scaleX(0);
    opacity: 0;
  }
  30% {
    transform: scaleX(0.3);
    opacity: 0.8;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes floatPetal {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-120px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes titleAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(8px);
  }
  60% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.title-ink {
  animation: titleAppear 1.5s ease-out forwards;
}

.ink-drip-line {
  animation: inkDrip 2s ease-out 0.8s forwards;
  transform: scaleX(0);
  transform-origin: center;
}

.ink-petal {
  animation: floatPetal 8s ease-in-out infinite;
}
</style>
