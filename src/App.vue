<template>
  <div class="app-container">
    <GameCanvas ref="gameCanvas" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import { SceneManager } from './core/SceneManager.js'
import { InputMapper } from './core/InputMapper.js'
import { ResourceLoader } from './core/ResourceLoader.js'
import { AudioManager } from './core/AudioManager.js'
import { SaveSystem } from './core/SaveSystem.js'
import { GameLoop } from './core/GameLoop.js'
import { UIState } from './core/UIState.js'
import { MenuScene } from './scenes/MenuScene.js'
import { LevelSelectScene } from './scenes/LevelSelectScene.js'
import { GameScene } from './scenes/GameScene.js'
import { LearningScene } from './scenes/LearningScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'

const gameCanvas = ref(null)
const servicesRef = ref({})

onMounted(async () => {
  const canvas = gameCanvas.value.getCanvas()
  const ctx = canvas.getContext('2d')

  const resourceLoader = new ResourceLoader()
  await resourceLoader.loadAll()

  const audioManager = new AudioManager()
  const saveSystem = new SaveSystem()
  const uiState = new UIState(saveSystem)
  const inputMapper = new InputMapper(canvas)
  const sceneManager = new SceneManager(ctx, canvas, {
    resourceLoader,
    audioManager,
    saveSystem,
    uiState,
    inputMapper
  })

  sceneManager.registerScene('menu', MenuScene)
  sceneManager.registerScene('levelSelect', LevelSelectScene)
  sceneManager.registerScene('game', GameScene)
  sceneManager.registerScene('learning', LearningScene)
  sceneManager.registerScene('settings', SettingsScene)

  servicesRef.sceneManager = sceneManager
  servicesRef.audioManager = audioManager
  servicesRef.saveSystem = saveSystem

  sceneManager.changeScene('menu')

  const gameLoop = new GameLoop((deltaTime) => {
    sceneManager.update(deltaTime)
    sceneManager.render()
  })

  gameLoop.start()

  inputMapper.on('click', (pos) => {
    sceneManager.handleClick(pos)
  })

  inputMapper.on('mousemove', (pos) => {
    sceneManager.handleMouseMove(pos)
  })

  inputMapper.on('keydown', (key) => {
    sceneManager.handleKeyDown(key)
  })
})
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #16213e 0%, #0a0a14 100%);
}
</style>
