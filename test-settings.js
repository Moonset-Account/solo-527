// 端到端验证：设置页滑条保存/恢复/音量生效
// ==========================================
import { SaveSystem } from './src/core/SaveSystem.js'
import { AudioManager } from './src/core/AudioManager.js'

// 用内存版 mock localStorage
const store = new Map()
const mockStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear()
}
global.localStorage = mockStorage
global.window = {
  localStorage: mockStorage,
  AudioContext: function () {
    // mock Web Audio 节点
    this.createGain = () => ({ gain: { value: 0 }, connect() {} })
    this.createOscillator = () => ({ type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} })
    this.createBuffer = () => ({ getChannelData: () => new Float32Array(256) })
    this.createBufferSource = () => ({ buffer: null, connect() {}, start() {} })
    this.destination = null
    this.currentTime = 0
    this.state = 'running'
    this.resume = () => {}
    this.sampleRate = 44100
  }
}
global.window.webkitAudioContext = global.window.AudioContext

console.log('\n========== 设置页滑条端到端验证 ==========\n')

// 第一阶段：初始化默认值
console.log('【阶段1】初始化 SaveSystem + AudioManager')
const save1 = new SaveSystem()
const audio1 = new AudioManager()
audio1._initAudioContext()
audio1.applySettings(save1.getSettings())
const defaultSettings = save1.getSettings()
console.log('  默认设置:', JSON.stringify(defaultSettings))
console.log('  AudioManager.sfxVolume =', audio1.sfxVolume, ' (期望 0.8)')
console.log('  AudioManager.bgmVolume =', audio1.bgmVolume, ' (期望 0.3)')
console.log('  sfxGainNode.gain.value =', audio1.sfxGainNode.gain.value, ' (期望 0.8)')
console.log('  bgmGainNode.gain.value =', audio1.bgmGainNode.gain.value, ' (期望 0.3)')
const ok1 = Math.abs(audio1.sfxVolume - 0.8) < 0.01 && Math.abs(audio1.bgmVolume - 0.3) < 0.01
        && Math.abs(audio1.sfxGainNode.gain.value - 0.8) < 0.01
        && Math.abs(audio1.bgmGainNode.gain.value - 0.3) < 0.01
console.log('  ✅', ok1 ? '通过' : '失败\n')

// 第二阶段：模拟拖动滑条（保存前）
console.log('\n【阶段2】模拟拖动滑条（sfxVolume 0.8 → 0.25，bgmVolume 0.3 → 0.65）')
const tempSettings = { ...save1.getSettings() }
tempSettings.sfxVolume = 0.25
tempSettings.bgmVolume = 0.65
audio1.applySettings(tempSettings)  // 拖动时实时 applySettings
console.log('  拖动中 - AudioManager.sfxVolume =', audio1.sfxVolume, ' (期望 0.25)')
console.log('  拖动中 - AudioManager.bgmVolume =', audio1.bgmVolume, ' (期望 0.65)')
console.log('  拖动中 - sfxGainNode.gain =', audio1.sfxGainNode.gain.value, ' (期望 0.25，实时生效)')
console.log('  拖动中 - bgmGainNode.gain =', audio1.bgmGainNode.gain.value, ' (期望 0.65，实时生效)')
const ok2 = Math.abs(audio1.sfxGainNode.gain.value - 0.25) < 0.01
        && Math.abs(audio1.bgmGainNode.gain.value - 0.65) < 0.01
console.log('  ✅', ok2 ? '通过' : '失败')

// 第三阶段：保存 + 返回菜单
console.log('\n【阶段3】保存设置并模拟返回菜单')
save1.updateSettings(tempSettings) // 点击保存按钮
// 场景切换，Settings 实例销毁，菜单重新 applySettings （模拟 _onBack）
audio1.applySettings(tempSettings)
// 进入新的 AudioManager（模拟刷新或其他场景）
const audio2 = new AudioManager()
audio2._initAudioContext()
audio2.applySettings(save1.getSettings())
console.log('  localStorage 写入 - key = poetry_puzzle_save_v1')
const persisted = JSON.parse(store.get('poetry_puzzle_save_v1'))
console.log('  存档 settings.sfxVolume =', persisted.settings.sfxVolume, ' (期望 0.25)')
console.log('  存档 settings.bgmVolume =', persisted.settings.bgmVolume, ' (期望 0.65)')
console.log('  新 AudioManager 载入后 - sfxGain =', audio2.sfxGainNode.gain.value, ' (期望 0.25)')
console.log('  新 AudioManager 载入后 - bgmGain =', audio2.bgmGainNode.gain.value, ' (期望 0.65)')
const ok3 = Math.abs(persisted.settings.sfxVolume - 0.25) < 0.01
        && Math.abs(persisted.settings.bgmVolume - 0.65) < 0.01
        && Math.abs(audio2.sfxGainNode.gain.value - 0.25) < 0.01
        && Math.abs(audio2.bgmGainNode.gain.value - 0.65) < 0.01
console.log('  ✅', ok3 ? '通过' : '失败')

// 第四阶段：再次进入设置页（读取滑条百分比显示）
console.log('\n【阶段4】再次进入设置页 - 滑条显示百分比')
const save2 = new SaveSystem() // 模拟新的场景实例读取
const reloaded = save2.getSettings()
console.log('  重新读取 settings.sfxVolume =', reloaded.sfxVolume, '→ 显示', Math.round(reloaded.sfxVolume * 100) + '%')
console.log('  重新读取 settings.bgmVolume =', reloaded.bgmVolume, '→ 显示', Math.round(reloaded.bgmVolume * 100) + '%')
// 模拟 SettingsScene.onEnter：_drawVolumeSlider 读取 tempSettings[key]
const sfxPercent = Math.round(reloaded.sfxVolume * 100)
const bgmPercent = Math.round(reloaded.bgmVolume * 100)
console.log('  滑条渲染 - 音效: ' + sfxPercent + '%, BGM: ' + bgmPercent + '%')
const ok4 = sfxPercent === 25 && bgmPercent === 65
console.log('  ✅', ok4 ? '通过' : '失败')

// 第五阶段：再次修改 + 静音
console.log('\n【阶段5】静音切换 + 难度 + 提示开关')
tempSettings.sfxMuted = true
tempSettings.bgmMuted = true
tempSettings.difficulty = 'hard'
tempSettings.showHints = false
save1.updateSettings(tempSettings)
const audio3 = new AudioManager()
audio3.applySettings(save1.getSettings())
console.log('  静音 - sfxMuted =', audio3.sfxMuted, ' bgmMuted =', audio3.bgmMuted)
console.log('  难度 =', save1.getSettings().difficulty, ' (期望 hard)')
console.log('  提示开关 =', save1.getSettings().showHints, ' (期望 false)')
const ok5 = audio3.sfxMuted === true && audio3.bgmMuted === true
        && save1.getSettings().difficulty === 'hard'
        && save1.getSettings().showHints === false
console.log('  ✅', ok5 ? '通过' : '失败')

// 汇总
console.log('\n========== 总 结 ==========')
const results = [ok1, ok2, ok3, ok4, ok5]
const passed = results.filter(Boolean).length
console.log(`  阶段1(默认值).........${ok1 ? '✅PASS' : '❌FAIL'}`)
console.log(`  阶段2(拖动实时生效)...${ok2 ? '✅PASS' : '❌FAIL'}`)
console.log(`  阶段3(保存+跨实例)...${ok3 ? '✅PASS' : '❌FAIL'}`)
console.log(`  阶段4(重入显示%)......${ok4 ? '✅PASS' : '❌FAIL'}`)
console.log(`  阶段5(静音/难度/提示)${ok5 ? '✅PASS' : '❌FAIL'}`)
console.log(`\n  共 5 个阶段，${passed} 通过，${results.length - passed} 失败\n`)
process.exit(passed === results.length ? 0 : 1)
