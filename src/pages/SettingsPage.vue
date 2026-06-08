<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSaveData } from '@/composables/useSaveData'

const router = useRouter()
const settingsStore = useSettingsStore()
const { exportSave, importSave, resetAll } = useSaveData()

const remappingKey = ref<string | null>(null)
const showResetConfirm = ref(false)
const importError = ref('')
const importSuccess = ref(false)

function handleKeyDown(e: KeyboardEvent) {
  if (!remappingKey.value) return
  e.preventDefault()
  settingsStore.remapKey(remappingKey.value, e.key)
  remappingKey.value = null
}

function startRemap(key: string) {
  remappingKey.value = key
}

function handleExport() {
  const data = exportSave()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cipai_save_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  importError.value = ''
  importSuccess.value = false
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const ok = importSave(text)
    if (ok) {
      importSuccess.value = true
    } else {
      importError.value = '存档格式无效'
    }
  }
  reader.readAsText(file)
}

function handleReset() {
  resetAll()
  showResetConfirm.value = false
}

function goBack() {
  router.push('/')
}

const keyLabels: Record<string, string> = {
  h: '提示',
  z: '撤销',
  ' ': '暂停',
  Escape: '菜单',
  Enter: '确认',
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#1a1a2e] text-[#f5f0e8]" @keydown="handleKeyDown" tabindex="0">
    <header class="flex items-center px-6 py-4 border-b border-[#f5f0e8]/10">
      <button @click="goBack"
              class="px-4 py-2 rounded-lg border border-[#f5f0e8]/20 bg-[#f5f0e8]/5 text-[#f5f0e8]/70 hover:bg-[#f5f0e8]/10 hover:text-[#f5f0e8] transition-all duration-200 text-sm"
              style="font-family: 'KaiTi', 'STKaiti', serif;">
        ← 返回
      </button>
      <h1 class="flex-1 text-center text-2xl tracking-[0.3em] font-serif"
          style="font-family: 'KaiTi', 'STKaiti', serif;">
        设置
      </h1>
      <div class="w-16"></div>
    </header>

    <div class="max-w-lg mx-auto px-6 py-8 space-y-8">
      <section>
        <h2 class="text-lg font-serif tracking-[0.2em] text-[#c0392b]/70 mb-4"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          ◈ 音效设置
        </h2>
        <div class="space-y-4 bg-[#f5f0e8]/5 rounded-xl p-5 border border-[#f5f0e8]/10">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm text-[#f5f0e8]/60 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">音乐音量</label>
              <span class="text-xs text-[#f5f0e8]/30">{{ Math.round(settingsStore.musicVolume * 100) }}%</span>
            </div>
            <input type="range" min="0" max="100" :value="Math.round(settingsStore.musicVolume * 100)"
                   @input="(e) => settingsStore.setMusicVolume(Number((e.target as HTMLInputElement).value) / 100)"
                   class="ink-slider w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#f5f0e8]/10">
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm text-[#f5f0e8]/60 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">音效音量</label>
              <span class="text-xs text-[#f5f0e8]/30">{{ Math.round(settingsStore.sfxVolume * 100) }}%</span>
            </div>
            <input type="range" min="0" max="100" :value="Math.round(settingsStore.sfxVolume * 100)"
                   @input="(e) => settingsStore.setSfxVolume(Number((e.target as HTMLInputElement).value) / 100)"
                   class="ink-slider w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#f5f0e8]/10">
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-serif tracking-[0.2em] text-[#2c6e8a]/70 mb-4"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          ◈ 性能设置
        </h2>
        <div class="space-y-4 bg-[#f5f0e8]/5 rounded-xl p-5 border border-[#f5f0e8]/10">
          <div class="flex items-center justify-between">
            <label class="text-sm text-[#f5f0e8]/60 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">显示 FPS</label>
            <button @click="settingsStore.setShowFps(!settingsStore.showFps)"
                    class="relative w-12 h-6 rounded-full transition-colors duration-200"
                    :class="settingsStore.showFps ? 'bg-[#2c6e8a]/50' : 'bg-[#f5f0e8]/15'">
              <div class="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                   :class="settingsStore.showFps ? 'translate-x-6 bg-[#2c6e8a]' : 'translate-x-0.5 bg-[#f5f0e8]/40'">
              </div>
            </button>
          </div>
          <div>
            <label class="text-sm text-[#f5f0e8]/60 font-serif block mb-2" style="font-family: 'KaiTi', 'STKaiti', serif;">帧率模式</label>
            <div class="flex gap-2">
              <button v-for="mode in (['auto', '30', '60'] as const)" :key="mode"
                      @click="settingsStore.setFrameRateMode(mode)"
                      class="flex-1 py-2 rounded-lg text-sm border transition-all duration-200"
                      :class="settingsStore.frameRateMode === mode
                        ? 'border-[#2c6e8a]/50 bg-[#2c6e8a]/15 text-[#2c6e8a]'
                        : 'border-[#f5f0e8]/10 bg-[#f5f0e8]/3 text-[#f5f0e8]/40 hover:bg-[#f5f0e8]/5'"
                      style="font-family: 'KaiTi', 'STKaiti', serif;">
                {{ mode === 'auto' ? '自动' : mode + ' FPS' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-serif tracking-[0.2em] text-[#c0392b]/70 mb-4"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          ◈ 输入设置
        </h2>
        <div class="bg-[#f5f0e8]/5 rounded-xl p-5 border border-[#f5f0e8]/10 space-y-3">
          <div v-for="(action, key) in settingsStore.inputMapping" :key="key"
               class="flex items-center justify-between py-2 border-b border-[#f5f0e8]/5 last:border-0">
            <div class="text-sm text-[#f5f0e8]/60 font-serif" style="font-family: 'KaiTi', 'STKaiti', serif;">
              {{ keyLabels[key] ?? action }}
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-[#f5f0e8]/30 px-2 py-0.5 rounded bg-[#f5f0e8]/5 border border-[#f5f0e8]/10 font-mono">
                {{ key === ' ' ? 'Space' : key }}
              </span>
              <button @click="startRemap(key as string)"
                      class="text-xs px-3 py-1 rounded border transition-all"
                      :class="remappingKey === key
                        ? 'border-[#c0392b]/50 bg-[#c0392b]/15 text-[#c0392b] animate-pulse'
                        : 'border-[#f5f0e8]/10 bg-[#f5f0e8]/3 text-[#f5f0e8]/40 hover:bg-[#f5f0e8]/5'">
                {{ remappingKey === key ? '请按键...' : '重映射' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-serif tracking-[0.2em] text-[#2c6e8a]/70 mb-4"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          ◈ 存档管理
        </h2>
        <div class="bg-[#f5f0e8]/5 rounded-xl p-5 border border-[#f5f0e8]/10 space-y-3">
          <div class="flex gap-3">
            <button @click="handleExport"
                    class="flex-1 py-2.5 rounded-lg border border-[#2c6e8a]/30 bg-[#2c6e8a]/10 text-[#2c6e8a] text-sm hover:bg-[#2c6e8a]/20 transition-all"
                    style="font-family: 'KaiTi', 'STKaiti', serif;">
              导出存档
            </button>
            <label class="flex-1 py-2.5 rounded-lg border border-[#2c6e8a]/30 bg-[#2c6e8a]/10 text-[#2c6e8a] text-sm hover:bg-[#2c6e8a]/20 transition-all cursor-pointer text-center"
                   style="font-family: 'KaiTi', 'STKaiti', serif;">
              导入存档
              <input type="file" accept=".json" @change="handleImport" class="hidden">
            </label>
          </div>
          <div v-if="importSuccess" class="text-xs text-[#2c6e8a] text-center">导入成功</div>
          <div v-if="importError" class="text-xs text-[#c0392b] text-center">{{ importError }}</div>
          <button @click="showResetConfirm = true"
                  class="w-full py-2.5 rounded-lg border border-[#c0392b]/30 bg-[#c0392b]/10 text-[#c0392b] text-sm hover:bg-[#c0392b]/20 transition-all"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            重置进度
          </button>
        </div>
      </section>
    </div>

    <div v-if="showResetConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/80 backdrop-blur-sm">
      <div class="bg-[#1a1a2e] border border-[#c0392b]/30 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
        <h3 class="text-lg font-serif text-center mb-4 text-[#c0392b]"
            style="font-family: 'KaiTi', 'STKaiti', serif;">
          确认重置
        </h3>
        <p class="text-sm text-[#f5f0e8]/50 text-center mb-6 font-serif"
           style="font-family: 'KaiTi', 'STKaiti', serif;">
          此操作将清除所有游戏进度，且不可恢复。确定要继续吗？
        </p>
        <div class="flex gap-3">
          <button @click="showResetConfirm = false"
                  class="flex-1 py-2.5 rounded-lg border border-[#f5f0e8]/15 bg-[#f5f0e8]/5 text-[#f5f0e8]/60 hover:bg-[#f5f0e8]/10 transition-all text-sm"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            取消
          </button>
          <button @click="handleReset"
                  class="flex-1 py-2.5 rounded-lg border border-[#c0392b]/40 bg-[#c0392b]/15 text-[#c0392b] hover:bg-[#c0392b]/25 transition-all text-sm"
                  style="font-family: 'KaiTi', 'STKaiti', serif;">
            确认重置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ink-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2c6e8a;
  border: 2px solid #1a1a2e;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(44, 110, 138, 0.4);
}

.ink-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2c6e8a;
  border: 2px solid #1a1a2e;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(44, 110, 138, 0.4);
}
</style>
