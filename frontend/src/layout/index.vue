<template>
  <el-container class="layout-container">
    <Sidebar :collapse="isCollapse" />
    <el-container>
      <Navbar :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      <AppMain />
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'

const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}
</style>
