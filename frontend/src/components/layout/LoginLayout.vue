<template>
  <div class="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-deep-blue-900 via-deep-blue-800 to-deep-blue-700 flex items-center justify-center">
    <div class="absolute inset-0 opacity-30 pointer-events-none" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;);"></div>
    <div class="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-amber-gold-500/10 blur-3xl"></div>
    <div class="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-deep-blue-400/20 blur-3xl"></div>
    <div class="relative z-10 w-full max-w-md px-6">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
