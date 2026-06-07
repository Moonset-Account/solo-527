<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Activity, Bell, Wheat, GitCompare, FileText, Pin, PinOff } from 'lucide-vue-next'

const route = useRoute()
const isHovered = ref(false)
const sidebarPinned = inject<Ref<boolean>>('sidebarPinned', ref(false))

const navItems = [
  { to: '/', name: 'dashboard', label: '仪表盘', icon: Activity },
  { to: '/alerts', name: 'alerts', label: '警报', icon: Bell },
  { to: '/feeding', name: 'feeding', label: '投喂', icon: Wheat },
  { to: '/comparison', name: 'comparison', label: '对比', icon: GitCompare },
  { to: '/reports', name: 'reports', label: '报告', icon: FileText },
]

const isExpanded = ref(false)

function onMouseEnter() {
  isHovered.value = true
  if (!sidebarPinned.value) {
    isExpanded.value = true
  }
}

function onMouseLeave() {
  isHovered.value = false
  if (!sidebarPinned.value) {
    isExpanded.value = false
  }
}

function togglePin() {
  sidebarPinned.value = !sidebarPinned.value
  isExpanded.value = sidebarPinned.value
}

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <aside
    class="relative flex flex-col bg-[#0A2E36] border-r border-[#0D3B47] transition-all duration-300 ease-in-out z-30 shrink-0"
    :class="isExpanded || sidebarPinned ? 'w-[200px]' : 'w-16'"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="flex items-center h-14 px-3 border-b border-[#0D3B47] shrink-0">
      <span class="text-2xl shrink-0">🌊</span>
      <transition name="fade">
        <span
          v-if="isExpanded || sidebarPinned"
          class="ml-2 text-sm font-bold text-[#00B4D8] whitespace-nowrap"
        >
          水质监控
        </span>
      </transition>
    </div>

    <nav class="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="group relative flex items-center h-10 rounded-lg transition-colors duration-150"
        :class="[
          isActive(item.name)
            ? 'bg-[#00B4D8]/10 border-l-[3px] border-[#00B4D8] text-[#00B4D8]'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-[3px] border-transparent',
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 mx-auto shrink-0" :class="isExpanded || sidebarPinned ? 'ml-2 mr-3' : ''" />

        <transition name="fade">
          <span
            v-if="isExpanded || sidebarPinned"
            class="text-sm whitespace-nowrap"
          >
            {{ item.label }}
          </span>
        </transition>

        <div
          v-if="!isExpanded && !sidebarPinned"
          class="absolute left-full ml-3 px-2 py-1 bg-[#0D3B47] text-gray-200 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          {{ item.label }}
        </div>
      </RouterLink>
    </nav>

    <div class="border-t border-[#0D3B47] p-2 shrink-0">
      <button
        class="w-full flex items-center justify-center h-8 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
        @click="togglePin"
      >
        <PinOff v-if="sidebarPinned" class="w-4 h-4" />
        <Pin v-else class="w-4 h-4" />
        <transition name="fade">
          <span v-if="isExpanded || sidebarPinned" class="ml-2 text-xs">
            {{ sidebarPinned ? '取消固定' : '固定侧栏' }}
          </span>
        </transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
