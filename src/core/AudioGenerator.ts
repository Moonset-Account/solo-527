const SR = 44100;

async function render(duration: number, build: (ctx: OfflineAudioContext) => void): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, Math.ceil(SR * duration), SR);
  build(ctx);
  return ctx.startRendering();
}

function makeOsc(ctx: OfflineAudioContext, type: OscillatorType, freq: number, gain: GainNode): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  return osc;
}

async function genClick(): Promise<AudioBuffer> {
  return render(0.01, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.01);
    gain.connect(ctx.destination);
    const osc = makeOsc(ctx, 'sine', 800, gain);
    osc.start(0);
    osc.stop(0.01);
  });
}

async function genSwitch(): Promise<AudioBuffer> {
  return render(0.05, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.05);
    gain.connect(ctx.destination);
    const o1 = makeOsc(ctx, 'sine', 400, gain);
    const o2 = makeOsc(ctx, 'sine', 600, gain);
    o1.start(0);
    o2.start(0);
    o1.stop(0.05);
    o2.stop(0.05);
  });
}

async function genSignal(): Promise<AudioBuffer> {
  return render(0.2, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.2);
    gain.connect(ctx.destination);
    const osc = makeOsc(ctx, 'sine', 1200, gain);
    osc.start(0);
    osc.stop(0.2);
  });
}

async function genAlert(): Promise<AudioBuffer> {
  return render(0.3, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, 0);
    gain.gain.setValueAtTime(0, 0.05);
    gain.gain.setValueAtTime(1, 0.1);
    gain.gain.setValueAtTime(0, 0.15);
    gain.gain.setValueAtTime(1, 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.3);
    gain.connect(ctx.destination);
    const osc = makeOsc(ctx, 'square', 600, gain);
    osc.start(0);
    osc.stop(0.3);
  });
}

async function genSuccess(): Promise<AudioBuffer> {
  return render(0.5, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, 0);
    gain.gain.setValueAtTime(0.4, 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.5);
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99].forEach((f) => {
      const o = makeOsc(ctx, 'sine', f, gain);
      o.start(0);
      o.stop(0.5);
    });
  });
}

async function genFail(): Promise<AudioBuffer> {
  return render(0.4, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.4);
    gain.connect(ctx.destination);
    const osc = makeOsc(ctx, 'sawtooth', 300, gain);
    osc.frequency.setValueAtTime(300, 0);
    osc.frequency.exponentialRampToValueAtTime(100, 0.4);
    osc.start(0);
    osc.stop(0.4);
  });
}

async function genTrainHorn(): Promise<AudioBuffer> {
  return render(0.6, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.setValueAtTime(0.5, 0.42);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.6);
    gain.connect(ctx.destination);
    [300, 400, 500].forEach((f) => {
      const o = makeOsc(ctx, 'sine', f, gain);
      o.start(0);
      o.stop(0.6);
    });
  });
}

async function genTrainArrive(): Promise<AudioBuffer> {
  return render(0.3, (ctx) => {
    const len = Math.ceil(SR * 0.3);
    const buf = ctx.createBuffer(1, len, SR);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, 0);
    filter.frequency.exponentialRampToValueAtTime(200, 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.3);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
    src.stop(0.3);
  });
}

async function genMusicMenu(): Promise<AudioBuffer> {
  return render(2, (ctx) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.15, 0.2);
    gain.gain.setValueAtTime(0.15, 1.7);
    gain.gain.linearRampToValueAtTime(0, 2);
    gain.connect(ctx.destination);
    [349.23, 440, 523.25].forEach((f) => {
      const o = makeOsc(ctx, 'sine', f, gain);
      o.start(0);
      o.stop(2);
    });
  });
}

export async function generateAllAudio(): Promise<Record<string, AudioBuffer>> {
  const [click, sw, signal, alert, success, fail, train_horn, train_arrive, music_menu] = await Promise.all([
    genClick(),
    genSwitch(),
    genSignal(),
    genAlert(),
    genSuccess(),
    genFail(),
    genTrainHorn(),
    genTrainArrive(),
    genMusicMenu(),
  ]);
  return { click, switch: sw, signal, alert, success, fail, train_horn, train_arrive, music_menu };
}
