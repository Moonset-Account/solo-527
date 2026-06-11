<script setup lang="ts">
const navItems = [
  { label: '首页', path: '/', icon: 'home' },
  { label: '订单', path: '/order', icon: 'order' },
]

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-cream">
    <header class="bg-pine text-cream shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-amber flex items-center justify-center">
              <span class="text-pine font-serif font-bold text-lg">北</span>
            </div>
            <span class="font-serif text-xl font-semibold tracking-wide">北桥房态行程台</span>
          </NuxtLink>

          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-lg text-sm font-medium hover:bg-pine-light transition-colors"
              active-class="bg-pine-light"
            >
              {{ item.label }}
            </NuxtLink>
            <NuxtLink
              to="/admin"
              class="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-amber text-pine-dark hover:bg-amber-light transition-colors"
            >
              管理后台
            </NuxtLink>
          </nav>

          <button
            class="md:hidden p-2 rounded-lg hover:bg-pine-light transition-colors"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div v-if="mobileMenuOpen" class="md:hidden pb-4 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-pine-light transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink
            to="/admin"
            class="block px-4 py-2.5 rounded-lg text-sm font-medium bg-amber text-pine-dark hover:bg-amber-light transition-colors"
            @click="mobileMenuOpen = false"
          >
            管理后台
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>

    <footer class="bg-pine-dark text-cream/60 py-8 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p class="font-serif text-cream/80 text-base mb-2">北桥房态行程台</p>
        <p>精品民宿 · 房态库存管理平台</p>
      </div>
    </footer>
  </div>
</template>
