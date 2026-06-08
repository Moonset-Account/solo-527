using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using PuppetTheater.Data;

namespace PuppetTheater.Audio
{
    public class AudioManager : MonoBehaviour
    {
        private const int PoolSize = 8;
        private const double ScheduleBufferSec = 0.001;

        [Header("Judgment Sounds")]
        [SerializeField] private AudioClip _perfectSound;
        [SerializeField] private AudioClip _greatSound;
        [SerializeField] private AudioClip _goodSound;
        [SerializeField] private AudioClip _earlySound;
        [SerializeField] private AudioClip _lateSound;
        [SerializeField] private AudioClip _missSound;

        [Header("Metronome")]
        [SerializeField] private AudioClip _beatTickSound;
        [SerializeField] [Range(0.05f, 0.3f)] private float _beatTickVolume = 0.15f;

        [Header("Light Switch")]
        [SerializeField] private AudioClip _lightSwitchCorrectSound;
        [SerializeField] private AudioClip _lightSwitchWrongSound;

        [Header("Audience")]
        [SerializeField] private AudioClip _audienceEcstaticSound;
        [SerializeField] private AudioClip _audienceHappySound;
        [SerializeField] private AudioClip _audienceNeutralSound;
        [SerializeField] private AudioClip _audienceBoredSound;
        [SerializeField] private AudioClip _audienceAngrySound;

        [Header("Puppet")]
        [SerializeField] private AudioClip _puppetBowSound;
        [SerializeField] private AudioClip _puppetDanceSound;
        [SerializeField] private AudioClip _puppetSpinSound;
        [SerializeField] private AudioClip _puppetJumpSound;
        [SerializeField] private AudioClip _puppetWaveSound;
        [SerializeField] private AudioClip _puppetCollapseSound;

        [Header("Story")]
        [SerializeField] private AudioClip[] _storyEventSounds;
        [SerializeField] private string[] _storyEventIds;

        [Header("Calibration")]
        [SerializeField] private float _calibrationBeepFrequency = 880f;
        [SerializeField] private float _calibrationBeepDuration = 0.05f;

        [Header("Music")]
        [SerializeField] private AudioSource _musicSource;
        [SerializeField] private float _defaultMusicVolume = 0.6f;

        private readonly List<AudioSource> _pool = new List<AudioSource>(PoolSize);
        private int _poolIndex;
        private Dictionary<string, AudioClip> _storyEventMap;
        private AudioClip _calibrationBeepClip;
        private Coroutine _fadeCoroutine;
        private bool _preloaded;

        private static readonly Dictionary<JudgmentGrade, float> GradeVolumes = new Dictionary<JudgmentGrade, float>
        {
            { JudgmentGrade.Perfect, 1.0f },
            { JudgmentGrade.Great, 0.85f },
            { JudgmentGrade.Good, 0.7f },
            { JudgmentGrade.Early, 0.5f },
            { JudgmentGrade.Late, 0.5f },
            { JudgmentGrade.Miss, 0.6f }
        };

        private void Awake()
        {
            InitializePool();
        }

        private void InitializePool()
        {
            for (int i = 0; i < PoolSize; i++)
            {
                GameObject go = new GameObject($"AudioPool_{i}");
                go.transform.SetParent(transform);
                AudioSource src = go.AddComponent<AudioSource>();
                src.playOnAwake = false;
                src.spatialBlend = 0f;
                _pool.Add(src);
            }
        }

        public void PreloadSounds()
        {
            if (_preloaded) return;

            BuildStoryEventMap();
            GenerateCalibrationBeep();

            if (_musicSource != null)
                _musicSource.volume = _defaultMusicVolume;

            _preloaded = true;
        }

        private void BuildStoryEventMap()
        {
            _storyEventMap = new Dictionary<string, AudioClip>();

            if (_storyEventIds == null || _storyEventSounds == null) return;

            int count = Mathf.Min(_storyEventIds.Length, _storyEventSounds.Length);
            for (int i = 0; i < count; i++)
            {
                if (!string.IsNullOrEmpty(_storyEventIds[i]) && _storyEventSounds[i] != null)
                    _storyEventMap[_storyEventIds[i]] = _storyEventSounds[i];
            }
        }

        private void GenerateCalibrationBeep()
        {
            int sampleRate = 44100;
            int sampleCount = (int)(sampleRate * _calibrationBeepDuration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = 1f;

                if (i < sampleCount * 0.1f)
                    envelope = (float)i / (sampleCount * 0.1f);
                else if (i > sampleCount * 0.7f)
                    envelope = (float)(sampleCount - i) / (sampleCount * 0.3f);

                samples[i] = Mathf.Sin(2f * Mathf.PI * _calibrationBeepFrequency * t) * 0.5f * envelope;
            }

            _calibrationBeepClip = AudioClip.Create("CalibrationBeep_880Hz", sampleCount, 1, sampleRate, false);
            _calibrationBeepClip.SetData(samples, 0);
        }

        private AudioSource GetPooledSource()
        {
            for (int i = 0; i < _pool.Count; i++)
            {
                int idx = (_poolIndex + i) % _pool.Count;
                if (!_pool[idx].isPlaying)
                {
                    _poolIndex = (idx + 1) % _pool.Count;
                    return _pool[idx];
                }
            }

            AudioSource oldest = _pool[_poolIndex];
            oldest.Stop();
            _poolIndex = (_poolIndex + 1) % _pool.Count;
            return oldest;
        }

        private void PlayScheduled(AudioClip clip, float volume, double dspTime)
        {
            if (clip == null) return;

            AudioSource src = GetPooledSource();
            src.clip = clip;
            src.volume = volume;
            src.PlayScheduled(dspTime);
        }

        private void PlayImmediate(AudioClip clip, float volume)
        {
            if (clip == null) return;

            double scheduledTime = AudioSettings.dspTime + ScheduleBufferSec;
            PlayScheduled(clip, volume, scheduledTime);
        }

        public void PlayJudgmentSound(JudgmentGrade grade)
        {
            AudioClip clip = grade switch
            {
                JudgmentGrade.Perfect => _perfectSound,
                JudgmentGrade.Great => _greatSound,
                JudgmentGrade.Good => _goodSound,
                JudgmentGrade.Early => _earlySound,
                JudgmentGrade.Late => _lateSound,
                JudgmentGrade.Miss => _missSound,
                _ => null
            };

            float volume = GradeVolumes.TryGetValue(grade, out float v) ? v : 0.5f;
            PlayImmediate(clip, volume);
        }

        public void PlayBeatTick()
        {
            PlayImmediate(_beatTickSound, _beatTickVolume);
        }

        public void PlayLightSwitchSound(LightColor from, LightColor to, bool correct)
        {
            if (correct)
            {
                AudioSource src = GetPooledSource();
                src.clip = _lightSwitchCorrectSound;
                src.pitch = 1.2f;
                src.volume = 0.8f;
                double scheduledTime = AudioSettings.dspTime + ScheduleBufferSec;
                src.PlayScheduled(scheduledTime);
            }
            else
            {
                AudioSource src = GetPooledSource();
                src.clip = _lightSwitchWrongSound;
                src.pitch = 0.8f;
                src.volume = 0.8f;
                double scheduledTime = AudioSettings.dspTime + ScheduleBufferSec;
                src.PlayScheduled(scheduledTime);
            }
        }

        public void PlayAudienceReaction(AudienceEmotion emotion)
        {
            AudioClip clip = emotion switch
            {
                AudienceEmotion.Ecstatic => _audienceEcstaticSound,
                AudienceEmotion.Happy => _audienceHappySound,
                AudienceEmotion.Neutral => _audienceNeutralSound,
                AudienceEmotion.Bored => _audienceBoredSound,
                AudienceEmotion.Angry => _audienceAngrySound,
                _ => null
            };

            float volume = emotion switch
            {
                AudienceEmotion.Ecstatic => 0.9f,
                AudienceEmotion.Happy => 0.8f,
                AudienceEmotion.Neutral => 0.5f,
                AudienceEmotion.Bored => 0.4f,
                AudienceEmotion.Angry => 0.9f,
                _ => 0.5f
            };

            PlayImmediate(clip, volume);
        }

        public void PlayPuppetActionSound(PuppetActionType action)
        {
            AudioClip clip = action switch
            {
                PuppetActionType.Bow => _puppetBowSound,
                PuppetActionType.Dance => _puppetDanceSound,
                PuppetActionType.Spin => _puppetSpinSound,
                PuppetActionType.Jump => _puppetJumpSound,
                PuppetActionType.Wave => _puppetWaveSound,
                _ => null
            };

            if (clip != null)
                PlayImmediate(clip, 0.7f);
        }

        public void PlayPuppetCollapseSound()
        {
            PlayImmediate(_puppetCollapseSound, 1.0f);
        }

        public void PlayStoryEventSound(string eventId)
        {
            if (_storyEventMap == null) BuildStoryEventMap();

            if (_storyEventMap != null && _storyEventMap.TryGetValue(eventId, out AudioClip clip))
                PlayImmediate(clip, 0.8f);
        }

        public void PlayCalibrationBeep()
        {
            if (_calibrationBeepClip == null) GenerateCalibrationBeep();

            if (_calibrationBeepClip != null)
                PlayImmediate(_calibrationBeepClip, 0.5f);
        }

        public void SetMusicVolume(float vol)
        {
            if (_musicSource != null)
                _musicSource.volume = Mathf.Clamp01(vol);
        }

        public void FadeMusic(float targetVol, float duration)
        {
            if (_musicSource == null) return;

            if (_fadeCoroutine != null)
                StopCoroutine(_fadeCoroutine);

            _fadeCoroutine = StartCoroutine(FadeMusicCoroutine(targetVol, duration));
        }

        private IEnumerator FadeMusicCoroutine(float targetVol, float duration)
        {
            float startVol = _musicSource.volume;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                _musicSource.volume = Mathf.Lerp(startVol, targetVol, t);
                yield return null;
            }

            _musicSource.volume = targetVol;
            _fadeCoroutine = null;
        }

        public void PauseMusic()
        {
            if (_musicSource != null && _musicSource.isPlaying)
                _musicSource.Pause();
        }

        public void ResumeMusic()
        {
            if (_musicSource != null && !_musicSource.isPlaying)
                _musicSource.UnPause();
        }

        private void ResetPooledSourcePitch(AudioSource src)
        {
            if (src != null && src.pitch != 1f)
                src.pitch = 1f;
        }

        private void LateUpdate()
        {
            for (int i = 0; i < _pool.Count; i++)
            {
                if (!_pool[i].isPlaying && _pool[i].pitch != 1f)
                    _pool[i].pitch = 1f;
            }
        }
    }
}
