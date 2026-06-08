let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let bgmGain: GainNode | null = null;

function ensureContext(): AudioContext {
  if (!ctx) {
    throw new Error('AudioTrigger not initialized. Call init() first.');
  }
  return ctx;
}

async function resumeIfNeeded(): Promise<void> {
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.3,
): void {
  const c = ensureContext();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);

  gain.gain.setValueAtTime(gainValue, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  osc.connect(gain);
  gain.connect(sfxGain!);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function init(): void {
  if (ctx) return;
  ctx = new AudioContext();

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.connect(ctx.destination);

  sfxGain = ctx.createGain();
  sfxGain.gain.setValueAtTime(1, ctx.currentTime);
  sfxGain.connect(masterGain);

  bgmGain = ctx.createGain();
  bgmGain.gain.setValueAtTime(1, ctx.currentTime);
  bgmGain.connect(masterGain);

  ctx.suspend();
}

export async function playSignalChange(): Promise<void> {
  await resumeIfNeeded();
  playTone(880, 0.1, 'sine', 0.2);
}

export async function playHorn(): Promise<void> {
  await resumeIfNeeded();
  const c = ensureContext();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.linearRampToValueAtTime(180, c.currentTime + 0.3);

  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(sfxGain!);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.35);
}

export async function playUIClick(): Promise<void> {
  await resumeIfNeeded();
  playTone(1200, 0.05, 'square', 0.1);
}

export async function playLevelComplete(): Promise<void> {
  await resumeIfNeeded();
  const c = ensureContext();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const noteDuration = 0.15;

  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const startTime = c.currentTime + i * noteDuration;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration + 0.1);

    osc.connect(gain);
    gain.connect(sfxGain!);

    osc.start(startTime);
    osc.stop(startTime + noteDuration + 0.1);
  });
}

export function setMasterVolume(v: number): void {
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime);
  }
}

export function setSfxVolume(v: number): void {
  if (sfxGain && ctx) {
    sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime);
  }
}

export function setBgmVolume(v: number): void {
  if (bgmGain && ctx) {
    bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime);
  }
}
