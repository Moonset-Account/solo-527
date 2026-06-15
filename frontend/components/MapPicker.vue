<template>
  <div>
    <div
      style="width: 100%; height: 200px; background: #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 12px; border: 2px dashed #cbd5e0"
      @click="showInput = !showInput"
    >
      <div style="font-size: 32px; margin-bottom: 8px">🗺️</div>
      <div style="color: #718096">地图定位（点击手动输入坐标）</div>
      <div v-if="location" style="color: #2d3748; font-weight: 500; margin-top: 4px">{{ location }}</div>
    </div>
    <div v-if="showInput" style="display: flex; gap: 12px">
      <NInputNumber v-model:value="lngModel" placeholder="经度" style="flex: 1" :precision="6" />
      <NInputNumber v-model:value="latModel" placeholder="纬度" style="flex: 1" :precision="6" />
      <NButton type="primary" size="small" @click="showInput = false">确定</NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInputNumber, NButton } from 'naive-ui'

const lngModel = defineModel<number>('lng')
const latModel = defineModel<number>('lat')
const location = defineModel<string>('location')

const showInput = ref(false)
</script>
