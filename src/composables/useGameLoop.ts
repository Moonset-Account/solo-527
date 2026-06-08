import { ref, onMounted, onUnmounted } from 'vue'
import { Renderer } from '@/engine/renderer'
import { AnimationSystem } from '@/engine/animation'
import { InputManager } from '@/engine/input'
import { GameTimer } from '@/engine/timer'
import { PerfStats } from '@/engine/perf'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { GameCanvasState } from '@/types'

export function useGameLoop(canvasRef: ReturnType<typeof ref<HTMLCanvasElement | null>>) {
  const renderer = ref<Renderer | null>(null)
  const animationSystem = new AnimationSystem()
  const inputManager = ref<InputManager | null>(null)
  const timer = new GameTimer()
  const perfStats = new PerfStats()
  const fps = ref(60)

  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()

  function start() {
    if (!canvasRef.value) return
    renderer.value = new Renderer(canvasRef.value)
    renderer.value.resizeToContainer()
    inputManager.value = new InputManager(canvasRef.value, settingsStore.inputMapping)
    inputManager.value.activate()
    timer.setMode(settingsStore.frameRateMode)
    timer.start((dt) => {
      gameStore.tick(dt)
      animationSystem.update(dt)
      const state = gameStore.puzzleEngine?.getState() ?? {
        slots: [],
        chars: [],
        dragging: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        mouseX: 0,
        mouseY: 0,
        animations: animationSystem.getAnimations(),
      }
      state.animations = animationSystem.getAnimations()
      renderer.value?.render(state)
      perfStats.update(dt * 1000)
      fps.value = perfStats.getReport().fps
    })
  }

  function stop() {
    timer.stop()
    inputManager.value?.deactivate()
  }

  function resize() {
    renderer.value?.resizeToContainer()
  }

  function addAnimation(type: GameCanvasState['animations'][0]) {
    animationSystem.addAnimation(type)
  }

  onMounted(() => {
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    stop()
    window.removeEventListener('resize', resize)
  })

  return {
    renderer,
    inputManager,
    fps,
    start,
    stop,
    resize,
    addAnimation,
  }
}
