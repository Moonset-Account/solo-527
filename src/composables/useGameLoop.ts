import { ref, onMounted, onUnmounted } from 'vue'
import { Renderer } from '@/engine/renderer'
import { AnimationSystem } from '@/engine/animation'
import { InputManager } from '@/engine/input'
import { GameTimer } from '@/engine/timer'
import { PerfStats } from '@/engine/perf'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { GameCanvasState, AnimationState } from '@/types'

type InputEvent = {
  type: string
  x: number
  y: number
  key?: string
}

export function useGameLoop(canvasRef: ReturnType<typeof ref<HTMLCanvasElement | null>>) {
  let rendererInstance: Renderer | null = null
  const animationSystem = new AnimationSystem()
  const inputManager = ref<InputManager | null>(null)
  const timer = new GameTimer()
  const perfStats = new PerfStats()
  const fps = ref(60)

  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()

  const draggingCharId = ref<string | null>(null)
  const dragOffsetX = ref(0)
  const dragOffsetY = ref(0)
  const mouseX = ref(0)
  const mouseY = ref(0)
  const selectedCharId = ref<string | null>(null)

  const onInputEvent = (e: InputEvent) => {
    if (!rendererInstance || !gameStore.puzzleEngine) return

    if (e.type === 'select') {
      handleSelect(e.x, e.y)
    } else if (e.type === 'drag') {
      handleDrag(e.x, e.y)
    } else if (e.type === 'drop') {
      handleDrop(e.x, e.y)
    } else if (e.type === 'hint') {
      gameStore.useHint('tone')
    } else if (e.type === 'undo') {
      gameStore.undo()
    }
  }

  function handleSelect(x: number, y: number) {
    const r = rendererInstance
    const engine = gameStore.puzzleEngine
    if (!r || !engine) return

    const state = engine.getState()
    const placedResult = r.getPlacedCharAt(x, y, state.chars, state.slots)
    if (placedResult) {
      draggingCharId.value = placedResult.charId
      const ch = state.chars.find((c) => c.id === placedResult.charId)
      if (ch) {
        const pos = r.getCharPosition(ch, state.slots)
        dragOffsetX.value = x - pos.x
        dragOffsetY.value = y - pos.y
      }
      mouseX.value = x
      mouseY.value = y
      selectedCharId.value = placedResult.charId
      return
    }

    const unplacedId = r.getUnplacedCharAt(x, y, state.chars, state.slots)
    if (unplacedId) {
      draggingCharId.value = unplacedId
      const ch = state.chars.find((c) => c.id === unplacedId)
      if (ch) {
        const pos = r.getCharPosition(ch, state.slots)
        dragOffsetX.value = x - pos.x
        dragOffsetY.value = y - pos.y
      }
      mouseX.value = x
      mouseY.value = y
      selectedCharId.value = unplacedId
      return
    }

    selectedCharId.value = null
  }

  function handleDrag(x: number, y: number) {
    if (draggingCharId.value) {
      mouseX.value = x
      mouseY.value = y
    }
  }

  function handleDrop(x: number, y: number) {
    const r = rendererInstance
    const engine = gameStore.puzzleEngine
    if (!r || !engine) return

    const charId = draggingCharId.value
    if (!charId) return

    const state = engine.getState()
    const ch = state.chars.find((c) => c.id === charId)
    if (!ch) {
      draggingCharId.value = null
      return
    }

    const targetSlot = r.getSlotAt(x, y, state.slots)

    if (ch.slotIndex !== null && targetSlot === null) {
      const prevSlot = ch.slotIndex
      gameStore.removeChar(prevSlot)
      gameStore.recordChoice({
        timestamp: Date.now(),
        type: 'remove',
        detail: `从第${prevSlot + 1}位移除"${ch.char}"`,
        correct: false,
      })
      draggingCharId.value = null
      return
    }

    if (targetSlot !== null) {
      const slot = state.slots[targetSlot]
      if (slot.placedChar !== null && ch.slotIndex !== null && ch.slotIndex !== targetSlot) {
        gameStore.swapChars(ch.slotIndex, targetSlot)
        const swappedCh = state.chars.find((c) => c.slotIndex === targetSlot && c.id !== charId)
        gameStore.recordChoice({
          timestamp: Date.now(),
          type: 'swap',
          detail: `交换"${ch.char}"与"${swappedCh?.char ?? ''}"`,
          correct: ch.char === slot.expectedChar,
        })
      } else if (slot.placedChar === null) {
        if (ch.slotIndex !== null) {
          gameStore.removeChar(ch.slotIndex)
        }
        const error = gameStore.placeChar(charId, targetSlot)
        gameStore.recordChoice({
          timestamp: Date.now(),
          type: 'place',
          detail: `将"${ch.char}"放入第${targetSlot + 1}位`,
          correct: error === null,
        })
        if (error) {
          animationSystem.addAnimation({
            type: 'shake',
            x,
            y,
            progress: 0,
            duration: 0.4,
          })
          animationSystem.addAnimation({
            type: 'ink_spread',
            x,
            y,
            progress: 0,
            duration: 0.6,
            color: '#c0392b',
          })
        } else {
          animationSystem.addAnimation({
            type: 'bloom',
            x,
            y,
            progress: 0,
            duration: 0.5,
            color: '#2c6e8a',
          })
        }
      }
    }

    draggingCharId.value = null
  }

  function start() {
    if (!canvasRef.value) return
    rendererInstance = new Renderer(canvasRef.value)
    rendererInstance.resizeToContainer()
    inputManager.value = new InputManager(canvasRef.value, settingsStore.inputMapping)
    inputManager.value.on(onInputEvent)
    inputManager.value.activate()
    timer.setMode(settingsStore.frameRateMode)
    timer.start((dt) => {
      gameStore.tick(dt)
      animationSystem.update(dt)
      const baseState = gameStore.puzzleEngine?.getState() ?? {
        slots: [],
        chars: [],
        dragging: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        mouseX: 0,
        mouseY: 0,
        animations: [],
      }
      const state: GameCanvasState = {
        ...baseState,
        dragging: draggingCharId.value,
        dragOffsetX: dragOffsetX.value,
        dragOffsetY: dragOffsetY.value,
        mouseX: mouseX.value,
        mouseY: mouseY.value,
        animations: animationSystem.getAnimations(),
      }
      rendererInstance?.render(state)
      perfStats.update(dt * 1000)
      fps.value = perfStats.getReport().fps
    })
  }

  function stop() {
    timer.stop()
    if (inputManager.value) {
      inputManager.value.off(onInputEvent)
      inputManager.value.deactivate()
    }
  }

  function resize() {
    rendererInstance?.resizeToContainer()
  }

  function addAnimation(type: AnimationState) {
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
    inputManager,
    fps,
    start,
    stop,
    resize,
    addAnimation,
    animationSystem,
  }
}
