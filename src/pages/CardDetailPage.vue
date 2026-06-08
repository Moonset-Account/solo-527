<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import cardsConfig from '@/config/cards.json'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const cardId = route.params.cardId as string
const card = computed(() => cardsConfig.find((c) => c.id === cardId))

function goBack() {
  router.push('/cards')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8]">
    <header class="relative z-10 flex items-center px-6 py-4 border-b border-[#f5f0e8]/10">
      <button @click="goBack"
              class="px-4 py-2 rounded-lg border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8]/70 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all duration-200 text-sm"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        ← 返回卡集
      </button>
      <h1 class="flex-1 text-center text-2xl tracking-[0.3em] font-serif"
          style="font-family: 'KaiTi', 'STKaiti', serif;">
        {{ card?.title ?? '学习卡' }}
      </h1>
      <div class="w-20"></div>
    </header>

    <div v-if="card" class="relative z-10 max-w-2xl mx-auto px-6 py-8">
      <div class="mb-8 text-center">
        <div class="inline-block px-8 py-2 rounded-full border border-[#c0392b]/20 bg-[#c0392b]/5 text-[#c0392b]/60 text-xs tracking-[0.5em] mb-4"
             style="font-family: 'KaiTi', 'STKaiti', serif;">
          词牌名
        </div>
        <h2 class="text-5xl font-serif tracking-[0.4em] text-[#f5f0e8] mb-4"
            style="font-family: 'KaiTi', 'STKaiti', serif; text-shadow: 0 0 30px rgba(245,240,232,0.1);">
          {{ card.title }}
        </h2>
        <div class="w-32 h-px mx-auto bg-gradient-to-r from-transparent via-[#2c6e8a]/40 to-transparent"></div>
      </div>

      <div class="space-y-6">
        <section class="bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[#c0392b]/60 text-xs">◈</span>
            <h3 class="text-sm tracking-[0.2em] text-[#c0392b]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">概述</h3>
          </div>
          <p class="text-sm text-[#f5f0e8]/70 leading-[1.8] font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.content }}
          </p>
        </section>

        <section class="bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[#2c6e8a]/60 text-xs">◈</span>
            <h3 class="text-sm tracking-[0.2em] text-[#2c6e8a]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">来源</h3>
          </div>
          <p class="text-sm text-[#f5f0e8]/70 leading-[1.8] font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.origin }}
          </p>
        </section>

        <section class="bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[#c0392b]/60 text-xs">◈</span>
            <h3 class="text-sm tracking-[0.2em] text-[#c0392b]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">格律</h3>
          </div>
          <p class="text-sm text-[#f5f0e8]/70 leading-[1.8] font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.metrical }}
          </p>
        </section>

        <section class="bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[#2c6e8a]/60 text-xs">◈</span>
            <h3 class="text-sm tracking-[0.2em] text-[#2c6e8a]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">意象</h3>
          </div>
          <p class="text-sm text-[#f5f0e8]/70 leading-[1.8] font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.imagery }}
          </p>
        </section>

        <section class="bg-[#f5f0e8]/5 rounded-2xl p-6 border border-[#f5f0e8]/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[#c0392b]/60 text-xs">◈</span>
            <h3 class="text-sm tracking-[0.2em] text-[#c0392b]/70 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">赏析</h3>
          </div>
          <p class="text-sm text-[#f5f0e8]/70 leading-[1.8] font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.appreciation }}
          </p>
        </section>
      </div>

      <div class="h-12"></div>
    </div>

    <div v-else class="relative z-10 flex items-center justify-center h-[60vh]">
      <div class="text-center">
        <p class="text-[#f5f0e8]/30 text-lg font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">卡片未找到</p>
        <button @click="goBack" class="mt-4 text-[#2c6e8a] text-sm underline hover:text-[#2c6e8a]/80 transition-all">
          返回卡集
        </button>
      </div>
    </div>
  </div>
</template>
