<template>
  <canvas
    ref="canvasRef"
    :width="canvasWidth"
    :height="canvasHeight"
    class="game-canvas"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  designWidth: {
    type: Number,
    default: 1280
  },
  designHeight: {
    type: Number,
    default: 720
  }
})

const canvasRef = ref(null)
const canvasWidth = ref(props.designWidth)
const canvasHeight = ref(props.designHeight)

const getCanvas = () => canvasRef.value

const resizeCanvas = () => {
  const container = canvasRef.value?.parentElement
  if (!container) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const designRatio = props.designWidth / props.designHeight
  const containerRatio = containerWidth / containerHeight

  let width, height
  if (containerRatio > designRatio) {
    height = Math.min(containerHeight, props.designHeight)
    width = height * designRatio
  } else {
    width = Math.min(containerWidth, props.designWidth)
    height = width / designRatio
  }

  canvasWidth.value = props.designWidth
  canvasHeight.value = props.designHeight

  if (canvasRef.value) {
    canvasRef.value.style.width = `${width}px`
    canvasRef.value.style.height = `${height}px`
  }
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

defineExpose({
  getCanvas
})
</script>

<style scoped>
.game-canvas {
  display: block;
  margin: auto;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  image-rendering: auto;
  background: #0a0a14;
}
</style>
