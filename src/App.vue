<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const route = useRoute()
const auth = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <LoginPage v-if="isLoginPage" />
  <AppLayout v-else />
</template>
