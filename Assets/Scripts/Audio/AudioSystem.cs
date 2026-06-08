using System;
using UnityEngine;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.BeatSystem;

namespace RainAlley.Audio
{
    public class AudioSystem : MonoBehaviour
    {
        public static AudioSystem Instance { get; private set; }

        [Header("音量")]
        [Range(0f, 1f)] public float RainVolume = 0.3f;
        [Range(0f, 1f)] public float BeatVolume = 0.5f;
        [Range(0f, 1f)] public float JudgeVolume = 0.6f;
        [Range(0f, 1f)] public float SfxVolume = 0.7f;

        private AudioSource _rainSource;
        private AudioSource _beatSource;
        private AudioSource _sfxSource;
        private AudioSource _musicSource;

        private AudioClip _rainClip;
        private AudioClip _beatTickClip;
        private AudioClip _beatAccentClip;
        private AudioClip _perfectClip;
        private AudioClip _goodClip;
        private AudioClip _missClip;
        private AudioClip _comboBreakClip;

        private GameManager _gm;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            GenerateAllClips();
            SetupSources();

            _gm = GameManager.Instance;
            if (_gm != null) AttachEvents();
        }

        private void Start()
        {
            if (_gm == null)
            {
                _gm = GameManager.Instance;
                if (_gm != null) AttachEvents();
            }
            PlayRain();
        }

        private void AttachEvents()
        {
            if (_gm.Clock != null) AttachToClock(_gm.Clock);
            _gm.OnStateChanged += HandleStateChanged;

            _gm.OnAnyJudge += HandleAnyJudge;
            _gm.OnComboBroken += HandleComboBroken;
        }

        private void HandleStateChanged(GameState oldS, GameState newS)
        {
            if ((newS == GameState.Countdown || newS == GameState.Calibration) && _gm != null && _gm.Clock != null)
            {
                AttachToClock(_gm.Clock);
            }
            if (newS == GameState.Menu || newS == GameState.Results)
            {
                StopBeat();
            }
        }

        private void AttachToClock(BeatClock clock)
        {
            clock.OnBeat -= OnClockBeat;
            clock.OnBeat += OnClockBeat;
        }

        private void GenerateAllClips()
        {
            _rainClip = GenerateRainClip(30f, 44100);
            _beatTickClip = GenerateToneClip(0.06f, 880f, ToneType.Sine, 0.9f);
            _beatAccentClip = GenerateToneClip(0.09f, 1320f, ToneType.Sine, 0.95f);
            _perfectClip = GenerateToneClip(0.12f, 1760f, ToneType.Triangle, 0.85f);
            _goodClip = GenerateToneClip(0.10f, 990f, ToneType.Triangle, 0.8f);
            _missClip = GenerateNoiseBurstClip(0.18f, 0.6f);
            _comboBreakClip = GenerateNoiseBurstClip(0.3f, 0.8f);
        }

        private void SetupSources()
        {
            _rainSource = CreateSource("RainSource", true, RainVolume);
            _beatSource = CreateSource("BeatSource", false, BeatVolume);
            _sfxSource = CreateSource("SfxSource", false, SfxVolume);
            _musicSource = CreateSource("MusicSource", true, 0.25f);
        }

        private AudioSource CreateSource(string name, bool loop, float vol)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            var s = go.AddComponent<AudioSource>();
            s.loop = loop;
            s.volume = vol;
            s.playOnAwake = false;
            s.spatialBlend = 0;
            return s;
        }

        public void PlayRain()
        {
            if (_rainSource == null || _rainClip == null) return;
            _rainSource.clip = _rainClip;
            _rainSource.volume = RainVolume;
            _rainSource.Play();
        }

        public void StopRain()
        {
            if (_rainSource != null) _rainSource.Stop();
        }

        private void StopBeat()
        {
            if (_beatSource != null) _beatSource.Stop();
        }

        private void OnClockBeat(int beatIdx)
        {
            if (_beatSource == null) return;
            bool isAccent = beatIdx % 4 == 0;
            var clip = isAccent ? _beatAccentClip : _beatTickClip;
            _beatSource.PlayOneShot(clip, BeatVolume * (isAccent ? 1.1f : 0.8f));
        }

        private void HandleAnyJudge(JudgeResult r, ObstacleData d)
        {
            if (_sfxSource == null) return;
            switch (r.Type)
            {
                case JudgeType.Perfect:
                    if (r.IsSuccessful) _sfxSource.PlayOneShot(_perfectClip, JudgeVolume);
                    else _sfxSource.PlayOneShot(_missClip, JudgeVolume * 0.6f);
                    break;
                case JudgeType.Early:
                case JudgeType.Late:
                    if (r.IsSuccessful) _sfxSource.PlayOneShot(_goodClip, JudgeVolume * 0.85f);
                    else _sfxSource.PlayOneShot(_missClip, JudgeVolume * 0.7f);
                    break;
                case JudgeType.Miss:
                    _sfxSource.PlayOneShot(_missClip, JudgeVolume);
                    break;
            }
        }

        private void HandleComboBroken(int size)
        {
            if (_sfxSource == null) return;
            _sfxSource.PlayOneShot(_comboBreakClip, SfxVolume);
        }

        private enum ToneType { Sine, Triangle, Square, Sawtooth }

        private static AudioClip GenerateToneClip(float durationSec, float freqHz, ToneType type, float decay = 1f)
        {
            int sr = 44100;
            int n = Mathf.CeilToInt(durationSec * sr);
            var data = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / sr;
                float phase = t * freqHz;
                float s;
                switch (type)
                {
                    case ToneType.Sine:
                        s = Mathf.Sin(phase * 2f * Mathf.PI);
                        break;
                    case ToneType.Triangle:
                        s = 2f * Mathf.Abs(2f * (phase - Mathf.Floor(phase + 0.5f))) - 1f;
                        break;
                    case ToneType.Square:
                        s = Mathf.Sin(phase * 2f * Mathf.PI) >= 0 ? 1f : -1f;
                        break;
                    default:
                        s = 2f * (phase - Mathf.Floor(phase + 0.5f));
                        break;
                }
                float env = Mathf.Exp(-t * decay * 8f);
                data[i] = s * env * 0.7f;
            }
            var clip = AudioClip.Create($"tone_{freqHz:F0}_{type}", n, 1, sr, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip GenerateRainClip(float durationSec, int sr)
        {
            int n = Mathf.CeilToInt(durationSec * sr);
            var data = new float[n];
            var rnd = new System.Random(42);

            float[] lp = new float[4];
            float[] hp = new float[2];

            for (int i = 0; i < n; i++)
            {
                float white = (float)(rnd.NextDouble() * 2.0 - 1.0);
                lp[3] = lp[3] + 0.0025f * (white - lp[3]);
                lp[2] = lp[2] + 0.008f * (lp[3] - lp[2]);
                lp[1] = lp[1] + 0.03f * (lp[2] - lp[1]);
                lp[0] = lp[0] + 0.08f * (lp[1] - lp[0]);

                hp[1] = 0.985f * hp[1] + 0.015f * lp[0];
                hp[0] = lp[0] - hp[1];

                float drop = 0f;
                if (rnd.NextDouble() < 0.0008)
                {
                    drop = (float)rnd.NextDouble() * 0.5f;
                }

                float t = (float)i / n;
                float fade = Mathf.Min(t * 5f, 1f) * Mathf.Min((1f - t) * 5f, 1f);
                data[i] = (hp[0] * 0.35f + lp[0] * 0.12f + drop) * fade * 0.6f;
            }

            float peak = 0.001f;
            for (int i = 0; i < n; i++) if (Mathf.Abs(data[i]) > peak) peak = Mathf.Abs(data[i]);
            float norm = 0.4f / peak;
            for (int i = 0; i < n; i++) data[i] *= norm;

            var clip = AudioClip.Create("rain_loop", n, 1, sr, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip GenerateNoiseBurstClip(float durationSec, float aggression)
        {
            int sr = 44100;
            int n = Mathf.CeilToInt(durationSec * sr);
            var data = new float[n];
            var rnd = new System.Random(7);
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / sr;
                float noise = (float)(rnd.NextDouble() * 2.0 - 1.0);
                float env = Mathf.Exp(-t * (4f + aggression * 6f));
                float pitchMod = Mathf.Lerp(300f, 120f, Mathf.Clamp01(t * 4f));
                float grain = Mathf.Sin(t * pitchMod * 2f * Mathf.PI) * 0.4f;
                data[i] = (noise * 0.7f + grain) * env * 0.6f;
            }
            var clip = AudioClip.Create($"noise_burst_{aggression:F0}", n, 1, sr, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
