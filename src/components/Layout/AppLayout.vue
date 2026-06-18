<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isLogin = computed(() => route.path === '/login')
</script>

<template>
  <div v-if="isLogin">
    <router-view />
  </div>
  <div v-else class="flex min-h-screen bg-slate-50">
    <Sidebar />
    <div class="flex-1 ml-56 transition-all duration-300" id="main-wrapper">
      <Header />
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
