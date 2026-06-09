export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.enabled = true;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.currentMusic = null;
        this.buffers = new Map();
        this.activeNodes = new Set();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this._updateVolumes();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported', e);
        }
    }

    async ensureInit() {
        if (!this.initialized) await this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            try { await this.ctx.resume(); } catch (e) {}
        }
    }

    _updateVolumes() {
        if (this.masterGain) this.masterGain.gain.value = this.enabled ? 1 : 0;
        if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
        if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
    }

    setEnabled(v) {
        this.enabled = v;
        this._updateVolumes();
    }

    setMusicVolume(v) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        this._updateVolumes();
    }

    setSfxVolume(v) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        this._updateVolumes();
    }

    playTone(freq, duration = 0.1, type = 'sine', volume = 1) {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    playSfx(type) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        switch (type) {
            case 'click':
                this.playTone(800, 0.05, 'square', 0.4);
                break;
            case 'success':
                this.playTone(523, 0.08, 'sine', 0.5);
                setTimeout(() => this.playTone(659, 0.08, 'sine', 0.5), 80);
                setTimeout(() => this.playTone(784, 0.12, 'sine', 0.5), 160);
                break;
            case 'error':
                this.playTone(200, 0.15, 'sawtooth', 0.4);
                break;
            case 'warning':
                this.playTone(440, 0.1, 'square', 0.3);
                setTimeout(() => this.playTone(440, 0.1, 'square', 0.3), 150);
                break;
            case 'event_start':
                this.playTone(300, 0.12, 'triangle', 0.5);
                setTimeout(() => this.playTone(250, 0.15, 'triangle', 0.5), 100);
                break;
            case 'event_done':
                this.playTone(600, 0.08, 'sine', 0.5);
                setTimeout(() => this.playTone(800, 0.1, 'sine', 0.5), 70);
                break;
            case 'level_complete':
                const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
                notes.forEach((n, i) => setTimeout(() => this.playTone(n, 0.15, 'sine', 0.4), i * 80));
                break;
            case 'level_fail':
                this.playTone(400, 0.2, 'sawtooth', 0.4);
                setTimeout(() => this.playTone(350, 0.2, 'sawtooth', 0.4), 200);
                setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.4), 400);
                break;
            case 'achievement':
                this.playTone(880, 0.1, 'sine', 0.4);
                setTimeout(() => this.playTone(1175, 0.1, 'sine', 0.4), 100);
                setTimeout(() => this.playTone(1568, 0.2, 'sine', 0.4), 200);
                break;
        }
    }

    startAmbient(type = 'city') {
        if (!this.initialized || this.currentMusic) return;
        const ctx = this.ctx;
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.02;
        }
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'rain' ? 1500 : 800;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        source.connect(filter).connect(gain).connect(this.musicGain);
        source.start();
        this.currentMusic = { source, gain, filter };
    }

    stopAmbient() {
        if (this.currentMusic) {
            try {
                this.currentMusic.source.stop();
            } catch (e) {}
            this.currentMusic = null;
        }
    }

    setAmbientType(type) {
        if (this.currentMusic && this.currentMusic.filter) {
            this.currentMusic.filter.frequency.setTargetAtTime(
                type === 'rain' ? 1500 : type === 'storm' ? 2500 : 800,
                this.ctx.currentTime,
                0.5
            );
        }
    }
}
