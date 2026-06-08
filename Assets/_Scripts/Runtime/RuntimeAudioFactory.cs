using UnityEngine;
using AM = LightShadowPlatformer.Core.AudioManager;

namespace LightShadowPlatformer.Runtime
{
    public static class RuntimeAudioFactory
    {
        private static bool _initialized;

        public static void EnsureAllAudio()
        {
            if (_initialized) return;
            _initialized = true;
            var audioMgr = AM.Instance;
            if (audioMgr == null) return;
            audioMgr.ResetRuntimeClips();

            audioMgr.SetSfxClip(AM.SfxType.Jump, GenTone(440, 0.12f, ToneType.Square, 1.2f, 720, 0.08f));
            audioMgr.SetSfxClip(AM.SfxType.Land, GenTone(160, 0.1f, ToneType.Sine, 0.8f, 80, 0.04f));
            audioMgr.SetSfxClip(AM.SfxType.DoubleJump, GenTone(520, 0.1f, ToneType.Sine, 1.0f, 880, 0.04f));
            audioMgr.SetSfxClip(AM.SfxType.Walk, GenNoise(0.04f, 0.2f, 800, 2000));
            audioMgr.SetSfxClip(AM.SfxType.LightSwitch, GenSweep(200, 1600, 0.25f, ToneType.Sawtooth, 0.9f));
            audioMgr.SetSfxClip(AM.SfxType.PlatformAppear, GenSweep(300, 800, 0.18f, ToneType.Sine, 1.0f));
            audioMgr.SetSfxClip(AM.SfxType.PlatformDisappear, GenSweep(800, 250, 0.22f, ToneType.Sine, 0.85f));
            audioMgr.SetSfxClip(AM.SfxType.FallDamage, GenTone(520, 0.06f, ToneType.Square, 0.4f, 600, 0.02f));
            audioMgr.SetSfxClip(AM.SfxType.Switch, GenTone(660, 0.08f, ToneType.Sine, 1.1f, 990, 0.06f));
            audioMgr.SetSfxClip(AM.SfxType.DoorOpen, GenSweep(200, 500, 0.45f, ToneType.Sine, 0.85f));
            audioMgr.SetSfxClip(AM.SfxType.DoorClose, GenSweep(500, 180, 0.45f, ToneType.Sine, 0.75f));
            audioMgr.SetSfxClip(AM.SfxType.PlateDown, GenTone(220, 0.1f, ToneType.Sine, 1.0f, 320, 0.06f));
            audioMgr.SetSfxClip(AM.SfxType.PlateUp, GenTone(320, 0.08f, ToneType.Sine, 0.8f, 220, 0.05f));
            audioMgr.SetSfxClip(AM.SfxType.Collect, GenSweep(660, 1320, 0.28f, ToneType.Sine, 1.2f, true));
            audioMgr.SetSfxClip(AM.SfxType.KeyCollect, GenSweep(780, 1560, 0.22f, ToneType.Sine, 1.1f, true));
            audioMgr.SetSfxClip(AM.SfxType.Checkpoint, GenChord(new float[] { 523, 659, 784 }, 0.5f, ToneType.Sine, 0.8f));
            audioMgr.SetSfxClip(AM.SfxType.HazardDeath, GenNoise(0.12f, 1.1f, 50, 300));
            audioMgr.SetSfxClip(AM.SfxType.PlayerDeath, GenSweep(320, 60, 0.9f, ToneType.Sawtooth, 1.0f));
            audioMgr.SetSfxClip(AM.SfxType.Unpause, GenSweep(220, 660, 0.35f, ToneType.Sine, 0.9f));
            audioMgr.SetSfxClip(AM.SfxType.LevelComplete, GenChord(new float[] { 523, 659, 784, 1046 }, 0.9f, ToneType.Sine, 1.0f));
            audioMgr.SetSfxClip(AM.SfxType.MenuHover, GenTone(780, 0.04f, ToneType.Sine, 0.5f));
            audioMgr.SetSfxClip(AM.SfxType.MenuClick, GenTone(880, 0.05f, ToneType.Sine, 0.9f, 1200, 0.03f));
            audioMgr.SetSfxClip(AM.SfxType.Pause, GenSweep(500, 300, 0.15f, ToneType.Sine, 0.8f));
            audioMgr.SetSfxClip(AM.SfxType.Tutorial, GenTone(520, 0.08f, ToneType.Sine, 0.6f, 780, 0.03f));
            audioMgr.SetSfxClip(AM.SfxType.UIConfirm, GenTone(780, 0.07f, ToneType.Sine, 0.9f, 1040, 0.02f));
            audioMgr.SetSfxClip(AM.SfxType.UICancel, GenTone(520, 0.07f, ToneType.Sine, 0.7f, 360, 0.03f));
            audioMgr.SetSfxClip(AM.SfxType.GameComplete, GenChord(new float[] { 523, 659, 784, 1046, 1318 }, 1.2f, ToneType.Sine, 0.9f));

            audioMgr.SetMusicClip(AM.MusicType.MainMenu, GenLoopMusic(true));
            audioMgr.SetMusicClip(AM.MusicType.Level01, GenLoopMusic(false, 1));
            audioMgr.SetMusicClip(AM.MusicType.Level02, GenLoopMusic(false, 2));
            audioMgr.SetMusicClip(AM.MusicType.Level03, GenLoopMusic(false, 3));
            audioMgr.SetMusicClip(AM.MusicType.Victory, GenLoopMusic(false, 99));
            audioMgr.SetMusicClip(AM.MusicType.GameOver, GenLoopMusic(false, -1));
        }

        private enum ToneType { Sine, Square, Sawtooth, Triangle }

        private static AudioClip GenTone(float freq, float duration, ToneType type, float ampStart = 1f,
            float freqEnd = -1, float decay = 0f)
        {
            int sampleRate = 44100;
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * duration));
            float[] data = new float[samples];
            float f0 = freq; float f1 = freqEnd < 0 ? freq : freqEnd;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / sampleRate;
                float prog = (float)i / samples;
                float f = Mathf.Lerp(f0, f1, prog);
                float amp = Mathf.Max(0, ampStart - decay * t);
                float sample = amp * Wave(type, t, f);
                float env = Envelope(prog);
                data[i] = Mathf.Clamp(sample * env, -0.98f, 0.98f);
            }
            AudioClip clip = AudioClip.Create("sfx_" + type + "_" + (int)freq, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip GenSweep(float f0, float f1, float duration, ToneType type, float amp, bool shimmer = false)
        {
            int sampleRate = 44100;
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * duration));
            float[] data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / sampleRate;
                float prog = (float)i / samples;
                float f = Mathf.Pow(f1 / f0, prog) * f0;
                float env = Envelope(prog);
                float s = Wave(type, t, f) * env * amp;
                if (shimmer) s += Wave(ToneType.Sine, t, f * 1.5f) * env * amp * 0.3f;
                data[i] = Mathf.Clamp(s, -0.98f, 0.98f);
            }
            AudioClip clip = AudioClip.Create("sweep_" + (int)f0 + "_" + (int)f1, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip GenNoise(float duration, float amp, float loFreq, float hiFreq)
        {
            int sampleRate = 44100;
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * duration));
            float[] data = new float[samples];
            float b0 = 0, b1 = 0, b2 = 0;
            for (int i = 0; i < samples; i++)
            {
                float prog = (float)i / samples;
                float white = Random.Range(-1f, 1f);
                float cutoff = Mathf.Lerp(loFreq, hiFreq, 1 - prog) / sampleRate;
                b0 = b0 + cutoff * (white - b0);
                b1 = b1 + cutoff * (b0 - b1);
                b2 = b2 + cutoff * (b1 - b2);
                float env = Envelope(prog);
                data[i] = Mathf.Clamp(b2 * amp * env, -0.98f, 0.98f);
            }
            AudioClip clip = AudioClip.Create("noise_" + (int)loFreq, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip GenChord(float[] freqs, float duration, ToneType type, float amp)
        {
            int sampleRate = 44100;
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * duration));
            float[] data = new float[samples];
            float inv = 1f / freqs.Length;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / sampleRate;
                float prog = (float)i / samples;
                float s = 0;
                for (int j = 0; j < freqs.Length; j++)
                    s += Wave(type, t, freqs[j]) * inv;
                float env = Envelope(prog, 0.05f, 0.2f, 0.5f, 0.15f);
                data[i] = Mathf.Clamp(s * amp * env, -0.98f, 0.98f);
            }
            AudioClip clip = AudioClip.Create("chord_" + freqs.Length, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static float Wave(ToneType type, float t, float f)
        {
            float p = f * t; float frac = p - Mathf.Floor(p);
            switch (type)
            {
                case ToneType.Sine: return Mathf.Sin(2 * Mathf.PI * f * t);
                case ToneType.Square: return frac < 0.5f ? 1f : -1f;
                case ToneType.Sawtooth: return 2f * frac - 1f;
                case ToneType.Triangle: return 1f - 4f * Mathf.Abs(frac - 0.5f);
            }
            return 0;
        }

        private static float Envelope(float t, float attack = 0.02f, float decay = 0.08f,
            float sustain = 0.6f, float release = 0.2f)
        {
            if (t < attack) return Mathf.SmoothStep(0, 1, t / Mathf.Max(0.001f, attack));
            float d = (t - attack) / Mathf.Max(0.001f, decay);
            if (d < 1f) return Mathf.Lerp(1f, sustain, d);
            float rel = (t - (attack + decay)) / Mathf.Max(0.001f, release);
            return Mathf.Max(0, sustain * (1f - Mathf.Clamp01(rel)));
        }

        private static AudioClip GenLoopMusic(bool menu, int levelIdx = 0)
        {
            int sampleRate = 44100;
            float bpm = 108;
            float beat = 60f / bpm;
            int bars = menu ? 16 : 8;
            float total = beat * 4 * bars;
            int samples = Mathf.Max(1, Mathf.RoundToInt(sampleRate * total));
            float[] data = new float[samples];

            float[] scale = menu
                ? new float[] { 261.63f, 293.66f, 329.63f, 392f, 440f }
                : levelIdx == 1 ? new float[] { 261.63f, 293.66f, 329.63f, 392f, 440f, 523.25f }
                : levelIdx == 2 ? new float[] { 293.66f, 329.63f, 369.99f, 440f, 523.25f }
                : levelIdx == 3 ? new float[] { 246.94f, 293.66f, 349.23f, 415.3f, 523.25f }
                : levelIdx == 99 ? new float[] { 329.63f, 392f, 493.88f, 587.33f, 659.25f }
                : new float[] { 196f, 220f, 261.63f };

            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / sampleRate;
                float p = (t / total) * bars * 4;
                int beatIdx = Mathf.FloorToInt(p);
                float bt = p - beatIdx;

                float env = bt < 0.1f ? Mathf.SmoothStep(0, 1, bt / 0.1f) : Mathf.Pow(1 - bt, 2f);
                int note = scale[beatIdx % scale.Length];
                float bass = scale[(beatIdx / 4) % scale.Length] * 0.25f;

                float mel = Wave(ToneType.Triangle, t, note) * env * 0.18f;
                float bas = Wave(ToneType.Sine, t, bass) * 0.12f;
                float pad = Wave(ToneType.Sine, t, note * 0.5f) * 0.04f +
                            Wave(ToneType.Sine, t, note * 1.5f) * 0.03f;

                float perc = 0;
                if (bt < 0.05f && beatIdx % 2 == 0)
                {
                    float perEnv = 1 - (bt / 0.05f);
                    perc += Wave(ToneType.Sine, t, 80) * perEnv * 0.2f;
                }
                if (bt < 0.08f && beatIdx % 4 == 2)
                {
                    float perEnv = 1 - (bt / 0.08f);
                    float n = Random.Range(-1f, 1f);
                    perc += n * perEnv * 0.07f;
                }

                float prog = (float)i / samples;
                float fadeIn = Mathf.Clamp01(prog * 4);
                float fadeOut = Mathf.Clamp01((1 - prog) * 4);
                float master = Mathf.Min(fadeIn, fadeOut);

                data[i] = Mathf.Clamp((mel + bas + pad + perc) * master, -0.95f, 0.95f);
            }
            AudioClip clip = AudioClip.Create(menu ? "music_menu" : "music_lvl" + levelIdx,
                samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
