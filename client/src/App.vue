<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

onMounted(() => {
  userStore.restoreFromStorage();
});
</script>
