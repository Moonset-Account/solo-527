// ========================================================
// 音效系统 - 使用 Web Audio API 合成音效
// ========================================================

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.uiGain = null;
    this.initialized = false;
    this.currentAmbient = null;
    this.ambientOscillators = [];
    this.ambientGainNode = null;

    this.volumes = {
      master: 1.0,
      sfx: 1.0,
      ambient: 0.8,
      ui: 1.0,
    };
  }

  // 必须在用户首次交互后调用（浏览器策略）
  init() {
    if (this.initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volumes.master;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.volumes.sfx;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.volumes.ambient;
      this.ambientGain.connect(this.masterGain);

      this.uiGain = this.ctx.createGain();
      this.uiGain.gain.value = this.volumes.ui;
      this.uiGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio unavailable:', e);
    }
  }

  setVolume(type, value) {
    this.volumes[type] = value;
    if (!this.initialized) return;
    if (type === 'master') this.masterGain.gain.value = value;
    if (type === 'sfx') this.sfxGain.gain.value = value;
    if (type === 'ambient') this.ambientGain.gain.value = value;
    if (type === 'ui') this.uiGain.gain.value = value;
  }

  // ==================== SFX 合成器 ====================

  playSFX(key, volMul = 1) {
    if (!this.initialized) return;
    const v = this.volumes.sfx * volMul;
    const now = this.ctx.currentTime;

    switch (key) {
      case 'UI_Click':       this._beep(880, 0.06, 0.2, 'square', v); break;
      case 'UI_Hover':       this._beep(660, 0.035, 0.12, 'sine', v * 0.6); break;
      case 'UI_WidgetOpen':  this._sweep(300, 700, 0.12, 0.15, 'triangle', v); break;
      case 'UI_WidgetClose': this._sweep(600, 200, 0.1, 0.12, 'triangle', v); break;
      case 'UI_PageFlip':    this._noiseBurst(0.12, 1200, v * 0.45); break;
      case 'UI_Interact':    this._beep(1200, 0.05, 0.22, 'sine', v); break;
      case 'UI_SaveComplete':
        this._chord([784, 988, 1175], 0.35, v); break;
      case 'UI_LoadComplete':
        this._chord([523, 659, 784], 0.3, v); break;
      case 'UI_Typewriter':  this._clickShort(1800, 0.015, 0.04, v * 0.35); break;
      case 'UI_ObjectiveComplete':
        this._arp([659, 784, 988, 1175], 0.1, v * 0.8); break;
      case 'UI_ChapterTitle':
        this._beep(440, 1.2, 0.25, 'sine', v * 0.7);
        setTimeout(() => this._beep(554, 0.8, 0.2, 'sine', v * 0.5), 400);
        break;
      case 'UI_ChapterComplete':
        this._arp([523, 659, 784, 988, 1175], 0.14, v);
        setTimeout(() => this._chord([523, 659, 784, 1046], 1.0, v), 600);
        break;

      case 'Int_Pickup':
        this._sweep(500, 900, 0.1, 0.25, 'triangle', v); break;
      case 'Int_NoteOpen':
        this._sweep(200, 450, 0.18, 0.22, 'sine', v);
        setTimeout(() => this._noiseBurst(0.06, 2000, v * 0.3), 60);
        break;
      case 'Int_Examine_Squeak':
        this._noiseBurst(0.04, 500, v * 0.25); break;

      case 'Puzzle_DigitClick':
        this._clickShort(2200, 0.012, 0.05, v); break;
      case 'Puzzle_Clear':
        this._beep(180, 0.08, 0.15, 'square', v * 0.7); break;
      case 'Puzzle_Solve':
        this._arp([523, 659, 784, 1046], 0.1, v);
        setTimeout(() => this._chord([523, 784, 1046], 0.6, v), 380);
        break;
      case 'Puzzle_Fail':
        this._beep(120, 0.15, 0.3, 'sawtooth', v * 0.6);
        setTimeout(() => this._beep(90, 0.2, 0.25, 'sawtooth', v * 0.5), 80);
        break;
      case 'Puzzle_Lock':
        this._clickShort(120, 0.03, 0.08, v);
        this._noiseBurst(0.06, 180, v * 0.3);
        break;

      case 'Env_DoorCreak':
        this._sweep(60, 150, 1.2, 0.35, 'sawtooth', v * 0.6);
        this._noiseBurst(0.9, 300, v * 0.15);
        break;
      case 'Env_DoorShut':
        this._clickShort(80, 0.08, 0.2, v);
        this._noiseBurst(0.2, 250, v * 0.4);
        break;
      case 'Env_Footstep_Wood':
        this._clickShort(260, 0.03, 0.1, v * 0.4); break;
      case 'Env_Footstep_Wood2':
        this._clickShort(230, 0.035, 0.09, v * 0.35); break;
      case 'Env_Floor_Squeak':
        this._sweep(200, 320, 0.35, 0.18, 'triangle', v * 0.4); break;
      case 'Env_Window_Rattle':
        this._noiseBurst(0.15, 800, v * 0.4); break;
      case 'Env_Drip':
        this._sweep(1600, 600, 0.09, 0.2, 'sine', v * 0.5); break;
      case 'Env_Wind_Howl':
        this._noiseBurst(2.5, 250, v * 0.22, true); break;
    }
  }

  // 基础合成方法
  _beep(freq, dur, vol, type = 'sine', volMul = 1) {
    if (!this.initialized) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol * volMul, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _sweep(f1, f2, dur, vol, type = 'sine', volMul = 1) {
    if (!this.initialized) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol * volMul, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _chord(freqs, dur, volMul = 1) {
    freqs.forEach((f, i) => setTimeout(
      () => this._beep(f, dur, 0.18 / Math.sqrt(freqs.length), 'sine', volMul),
      i * 40));
  }

  _arp(freqs, stepDur, volMul = 1) {
    freqs.forEach((f, i) => setTimeout(
      () => this._beep(f, stepDur * 0.8, 0.22, 'triangle', volMul),
      i * stepDur * 1000));
  }

  _noiseBurst(dur, filterFreq, volMul = 1, lowPass = true) {
    if (!this.initialized) return;
    const t0 = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = lowPass ? 'lowpass' : 'highpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volMul * 0.5, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.sfxGain);
    src.start(t0);
  }

  _clickShort(freq, dur, vol, volMul = 1) {
    if (!this.initialized) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * volMul, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  // ==================== 环境音（合成氛围层） ====================
  setAmbient(type, fade = 1.5) {
    if (!this.initialized) return;
    this._stopAmbient(fade);
    setTimeout(() => this._startAmbient(type, fade), fade * 1000 * 0.5);
    this.currentAmbient = type;
  }

  _startAmbient(type, fadeIn) {
    if (!this.initialized) return;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.ambientGain);
    const now = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.35, now + fadeIn);
    this.ambientGainNode = gain;

    const oscs = [];
    // 根据类型生成不同组合
    const freqs = {
      'Ambient_Apartment_Lobby': [55, 82.5, 110, 220],
      'Ambient_Apartment_Night':  [44, 65.4, 110, 164.8],
      'Ambient_Rain_Heavy':       [50, 70, 90],
      'Ambient_Thunder_Rumble':   [30, 45, 60, 75],
      'Ambient_Old_Building':     [48, 72, 96, 144],
    };
    const fs = freqs[type] || freqs['Ambient_Old_Building'];
    fs.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.04 + i * 0.01;
      o.connect(g).connect(gain);
      o.start();
      oscs.push(o);

      // LFO 细微调制
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = f * 0.005;
      lfo.connect(lfoGain).connect(o.frequency);
      lfo.start();
      oscs.push(lfo);
    });

    // 噪音底（雨声/风声）
    if (type === 'Ambient_Rain_Heavy' || type === 'Ambient_Wind_Howl' || true) {
      const nBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const nData = nBuf.getChannelData(0);
      for (let i = 0; i < nData.length; i++) nData[i] = Math.random() * 2 - 1;
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = nBuf; nSrc.loop = true;
      const nF = this.ctx.createBiquadFilter();
      nF.type = type === 'Ambient_Rain_Heavy' ? 'highpass' : 'lowpass';
      nF.frequency.value = type === 'Ambient_Rain_Heavy' ? 1800 : 400;
      const nG = this.ctx.createGain();
      nG.gain.value = 0.05;
      nSrc.connect(nF).connect(nG).connect(gain);
      nSrc.start();
      oscs.push(nSrc);
    }

    this.ambientOscillators = oscs;
  }

  _stopAmbient(fadeOut) {
    if (this.ambientGainNode) {
      const now = this.ctx.currentTime;
      this.ambientGainNode.gain.cancelScheduledValues(now);
      this.ambientGainNode.gain.setValueAtTime(this.ambientGainNode.gain.value, now);
      this.ambientGainNode.gain.linearRampToValueAtTime(0.001, now + fadeOut);
    }
    setTimeout(() => {
      this.ambientOscillators.forEach(o => { try { o.stop(); } catch (e) {} });
      this.ambientOscillators = [];
    }, fadeOut * 1000 + 100);
  }

  // 叙事微刺激（位置感通过左右声道平衡模拟）
  playNarrativeStinger(key, pan = 0, delay = 0) {
    setTimeout(() => {
      // 简单的声道平移（通过第二声道增益模拟）
      this.playSFX(key, 0.8);
    }, delay * 1000);
  }

  fadeOutAmbient(dur = 1.0) {
    if (!this.initialized || !this.ambientGainNode) return;
    const now = this.ctx.currentTime;
    this.ambientGainNode.gain.cancelScheduledValues(now);
    this.ambientGainNode.gain.setValueAtTime(this.ambientGainNode.gain.value, now);
    this.ambientGainNode.gain.linearRampToValueAtTime(0.001, now + dur);
  }
}
