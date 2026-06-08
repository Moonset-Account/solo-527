<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useAnalytics } from '@/composables/useAnalytics'
import cardsConfig from '@/config/cards.json'

const router = useRouter()
const progressStore = useProgressStore()
const { trackPageView } = useAnalytics()

trackPageView('card_collection')

function goBack() {
  router.push('/')
}

function openCard(cardId: string) {
  if (progressStore.isCardUnlocked(cardId)) {
    router.push(`/cards/${cardId}`)
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8]">
    <div class="absolute inset-0 pointer-events-none opacity-[0.03]"
         style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;120&quot; height=&quot;120&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M0,30 Q30,0 60,30 T120,30&quot; stroke=&quot;%23f5f0e8&quot; stroke-width=&quot;0.5&quot; fill=&quot;none&quot;/%3E%3Cpath d=&quot;M0,60 Q30,30 60,60 T120,60&quot; stroke=&quot;%23f5f0e8&quot; stroke-width=&quot;0.5&quot; fill=&quot;none&quot;/%3E%3Cpath d=&quot;M0,90 Q30,60 60,90 T120,90&quot; stroke=&quot;%23f5f0e8&quot; stroke-width=&quot;0.5&quot; fill=&quot;none&quot;/%3E%3C/svg%3E');">
    </div>

    <header class="relative z-10 flex items-center px-6 py-4 border-b border-[#f5f0e8]/10">
      <button @click="goBack"
              class="px-4 py-2 rounded-lg border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8]/70 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all duration-200 text-sm"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        ← 返回
      </button>
      <h1 class="flex-1 text-center text-2xl tracking-[0.3em] font-serif"
          style="font-family: 'KaiTi', 'STKaiti', serif;">
        学习卡集
      </h1>
      <div class="w-16"></div>
    </header>

    <div class="relative z-10 max-w-4xl mx-auto px-4 py-8">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="card in cardsConfig"
          :key="card.id"
          class="card-item rounded-2xl border p-5 transition-all duration-300"
          :class="[
            progressStore.isCardUnlocked(card.id)
              ? 'border-[#2c6e8a]/30 bg-gradient-to-b from-[#f5f0e8]/8 to-[#1a1a2e] cursor-pointer hover:border-[#2c6e8a]/60 hover:shadow-lg hover:shadow-[#2c6e8a]/10 hover:scale-[1.02]'
              : 'border-[#f5f0e8]/5 bg-[#1a1a2e]/60 cursor-not-allowed opacity-50'
          ]"
          @click="openCard(card.id)"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="text-2xl opacity-30">
              <template v-if="progressStore.isCardUnlocked(card.id)">📜</template>
              <template v-else>🔒</template>
            </div>
          </div>

          <h3 class="text-lg font-serif mb-2"
              style="font-family: 'KaiTi', 'STKaiti', serif;"
              :class="progressStore.isCardUnlocked(card.id) ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/30'">
            {{ card.title }}
          </h3>

          <p v-if="progressStore.isCardUnlocked(card.id)"
             class="text-xs text-[#f5f0e8]/40 line-clamp-2 font-serif"
             style="font-family: 'KaiTi', 'STKaiti', serif;">
            {{ card.content.substring(0, 40) }}...
          </p>
          <p v-else class="text-xs text-[#f5f0e8]/20">未解锁</p>

          <div class="mt-3 flex items-center justify-end">
            <span v-if="progressStore.isCardUnlocked(card.id)"
                  class="text-xs text-[#2c6e8a]/50">查看 →</span>
            <span v-else class="text-xs text-[#f5f0e8]/15">🔒 未解锁</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
