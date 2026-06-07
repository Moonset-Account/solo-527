<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const dataStore = useDataStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  authStore.initFromStorage()
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  dataStore.init()
  dataStore.refreshAll()
})
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="flex flex-col flex-1 overflow-hidden">
      <Header />
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
