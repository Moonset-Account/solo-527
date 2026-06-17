<template>
  <div class="page-header">
    <div class="header-left">
      <el-icon v-if="showBack" class="back-btn" @click="handleBack">
        <ArrowLeft />
      </el-icon>
      <h2 class="title">{{ title }}</h2>
      <span v-if="showDemo && isDemoMode" class="demo-tag">演示数据</span>
    </div>
    <div class="header-right">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  title: string
  showBack?: boolean
  showDemo?: boolean
}>()

const router = useRouter()
const appStore = useAppStore()

const isDemoMode = computed(() => appStore.isDemoMode)

function handleBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;

    .back-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 12px;
      color: #606266;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }
}
</style>
