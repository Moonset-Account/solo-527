<template>
  <div id="app-container">
    <router-view />
    <div v-if="userStore.isDemoAccount" class="demo-watermark">
      <span>演示模式 - DEMO</span>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style lang="scss" scoped>
#app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.demo-watermark {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  span {
    position: absolute;
    font-size: 60px;
    color: rgba(255, 0, 0, 0.08);
    font-weight: bold;
    transform: rotate(-30deg);
    white-space: nowrap;

    &:nth-child(1) { top: 10%; left: 5%; }
    &:nth-child(2) { top: 30%; left: 40%; }
    &:nth-child(3) { top: 50%; left: 10%; }
    &:nth-child(4) { top: 70%; left: 50%; }
    &:nth-child(5) { top: 20%; left: 70%; }
    &:nth-child(6) { top: 60%; left: 80%; }
    &:nth-child(7) { top: 85%; left: 20%; }
    &:nth-child(8) { top: 40%; left: 85%; }
  }

  &::before,
  &::after {
    content: '演示模式 - DEMO';
    position: absolute;
    font-size: 80px;
    color: rgba(255, 0, 0, 0.06);
    font-weight: bold;
    transform: rotate(-30deg);
    white-space: nowrap;
  }

  &::before {
    top: 15%;
    left: -10%;
  }

  &::after {
    bottom: 20%;
    right: -5%;
  }
}
</style>
